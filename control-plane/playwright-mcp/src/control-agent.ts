import { Agent } from "agents";
import { generateText, stepCountIs } from "ai";
import { createWorkersAI } from "workers-ai-provider";
import { specialistSnapshot } from "./agent-registry";
import { autonomousFunctionSnapshot } from "./autonomous-functions";
import { pairingSnapshot, runAgentPair } from "./agent-pairing";

type ControlEnv = Env & {
  AI: Ai;
  MCP_OBJECT: DurableObjectNamespace<any>;
  NVIDIA_API_KEY?: string;
  NVIDIA_BASE_URL?: string;
  NVIDIA_MODEL?: string;
  TYPESAFE_API_KEY?: string;
  LAYA_HTTP_URL?: string;
  control_tower?: string;
};

type NvResult = {
  model: string;
  text: string;
};

export type ControlAgentState = {
  status: "ready" | "degraded";
  version: 5;
  capabilities: string[];
  browser_mcp: "connected" | "disconnected";
  ai: "ready" | "error" | "unverified";
  last_orchestration?: {
    at: string;
    provider: string;
    model?: string;
    verified: boolean;
  };
};

const READ_ONLY_BROWSER_TOOLS = new Set([
  "browser_navigate",
  "browser_snapshot",
  "browser_take_screenshot",
  "browser_console_messages",
  "browser_network_requests",
]);

const ALLOWED_NAVIGATION_HOSTS = new Set([
  "clinicasaopauloparnamirim.com.br",
  "www.clinicasaopauloparnamirim.com.br",
]);

async function nvidiaChat(env: ControlEnv, system: string, prompt: string): Promise<NvResult | null> {
  const apiKey = env.NVIDIA_API_KEY;
  if (!apiKey) return null;
  const configuredBaseUrl = env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1";
  const baseUrl = configuredBaseUrl.endsWith("/") ? configuredBaseUrl.slice(0, -1) : configuredBaseUrl;
  const model = env.NVIDIA_MODEL || "nvidia/nemotron-3.5-lightning-30b-a3b";
  const response = await fetch(baseUrl + "/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer " + apiKey,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 2200,
    }),
  });
  const raw = await response.text();
  if (!response.ok) {
    throw new Error("NVIDIA NIM request failed (" + response.status + "): " + raw.slice(0, 500));
  }
  const data = JSON.parse(raw) as { choices?: Array<{ message?: { content?: string } }> };
  return {
    model,
    text: data.choices?.[0]?.message?.content || "",
  };
}

function tryJson(text: string): Record<string, any> | null {
  try {
    return JSON.parse(text) as Record<string, any>;
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1)) as Record<string, any>;
      } catch {
        return null;
      }
    }
    return null;
  }
}

function getReadOnlyTools(tools: Record<string, any>) {
  return Object.fromEntries(
    Object.entries(tools)
      .filter(([name]) =>
        [...READ_ONLY_BROWSER_TOOLS].some(
          (toolName) => name === toolName || name.endsWith("_" + toolName),
        ),
      )
      .map(([name, tool]) => {
        if (!name.endsWith("_browser_navigate") && name !== "browser_navigate") {
          return [name, tool];
        }

        return [
          name,
          {
            ...tool,
            execute: async (args: any, ...rest: any[]) => {
              const target = typeof args?.url === "string" ? args.url : "";
              let hostname = "";

              try {
                hostname = new URL(target).hostname.toLowerCase();
              } catch {
                return {
                  error: "navigation_blocked",
                  reason: "invalid_url",
                  allowed_hosts: [...ALLOWED_NAVIGATION_HOSTS],
                };
              }

              if (!ALLOWED_NAVIGATION_HOSTS.has(hostname)) {
                return {
                  error: "navigation_blocked",
                  reason: "hostname_not_allowed",
                  hostname,
                  allowed_hosts: [...ALLOWED_NAVIGATION_HOSTS],
                };
              }

              return tool.execute(args, ...rest);
            },
          },
        ];
      }),
  );
}

export class ControlAgent extends Agent<ControlEnv, ControlAgentState> {
  initialState: ControlAgentState = {
    status: "ready",
    version: 5,
    capabilities: [
      "mcp",
      "browser-readonly",
      "browser-domain-allowlist",
      "workers-ai",
      "nvidia-nim",
      "nvidia-fallback",
      "9-brains",
      "marketing-growth-draft-generation",
      "21-capabilities",
      "20-autonomous-functions",
      "gauntlet-loop",
      "self-verification",
      "persistent-state",
      "jev-nemotron-pair",
      "laya-llm-pair",
      "nvidia-pair-analysis",
    ],
    browser_mcp: "disconnected",
    ai: "unverified",
  };

  async onStart() {
    try {
      await this.addMcpServer(
        "Playwright Browser",
        this.env.MCP_OBJECT as unknown as DurableObjectNamespace<any>,
      );

      this.setState({
        ...this.state,
        status: "ready",
        browser_mcp: "connected",
      });
    } catch (error) {
      console.error("[ControlAgent] Playwright MCP connection failed:", error);
      this.setState({
        ...this.state,
        status: "degraded",
        browser_mcp: "disconnected",
      });
    }
  }

  async onRequest(request: Request) {
    const url = new URL(request.url);

    if (url.pathname.endsWith("/orchestrate") && request.method === "POST") {
      let body: { prompt?: string; mode?: "read" | "write" } = {};
      try { body = await request.json(); } catch {
        return Response.json({ ok: false, error: "invalid_json" }, { status: 400 });
      }
      const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
      if (!prompt || prompt.length > 4000) {
        return Response.json({ ok: false, error: "prompt_required_or_too_long" }, { status: 400 });
      }

      const mode = body.mode === "write" ? "write" : "read";
      const snapshot = specialistSnapshot();
      const orchestrationSystem =
        "Você é o COMMANDER do Control Tower da Clínica São Paulo. " +
        "Use o registro de 9 papéis cerebrais, 21 capacidades e 20 funções definidas abaixo. " +
        "Decomponha a solicitação, escolha os cérebros/especialistas necessários, " +
        "declare dependências e blockers e produza um plano que outro executor possa seguir. " +
        "Este endpoint planeja e verifica respostas; ele não executa diretamente ferramentas externas do Composio. " +
        "Não alegue que uma ferramenta externa foi executada sem um resultado recebido e verificável. " +
        "Para uma ação externa, indique o tool slug necessário, o executor autorizado e o bloqueio se não houver ponte disponível. " +
        "Nunca permita ações financeiras, exposição de secrets ou ações destrutivas sem confirmação explícita. " +
        "Se uma integração não estiver conectada, marque-a como blocker; não invente acesso. " +
        "A resposta deve ser JSON válido com: brains (array), specialists (array), mode, blockers (array), " +
        "plan (array), verification_checks (array).\n" +
        JSON.stringify({ ...snapshot, autonomousFunctions: autonomousFunctionSnapshot() });

      try {
        const nvidia = await nvidiaChat(
          this.env,
          orchestrationSystem,
          "Solicitação: " + prompt + "\nModo solicitado: " + mode,
        );

        if (nvidia) {
          const initial = tryJson(nvidia.text);
          let verified = false;
          let verification: Record<string, any> | null = null;

          if (initial) {
            const verifierSystem =
              "Você é o JUDGE/RED TEAM do Control Tower. " +
              "Audite o plano JSON recebido contra a arquitetura e política fornecidas. " +
              "Tente encontrar uma falha, integração inventada, dependência ausente, ação perigosa ou conclusão sem evidência. " +
              "Responda somente JSON com: pass (boolean), findings (array), required_changes (array).\n" +
              JSON.stringify(snapshot);

            const verifier = await nvidiaChat(
              this.env,
              verifierSystem,
              "PLANO PARA VERIFICAÇÃO:\n" + JSON.stringify(initial),
            );
            verification = verifier ? tryJson(verifier.text) : null;
            verified = verification?.pass === true;
          }

          this.setState({
            ...this.state,
            ai: "ready",
            last_orchestration: {
              at: new Date().toISOString(),
              provider: "nvidia-nim",
              model: nvidia.model,
              verified,
            },
          });

          return Response.json({
            ok: true,
            agent: "ControlAgent",
            provider: "nvidia-nim",
            model: nvidia.model,
            verified,
            orchestration: initial ?? { raw: nvidia.text },
            autonomous_functions: autonomousFunctionSnapshot(),
            verification,
          });
        }
      } catch (error) {
        console.error("[ControlAgent] NVIDIA NIM failed; falling back to Workers AI:", error);
      }

      const workersai = createWorkersAI({ binding: this.env.AI });
      const result = await generateText({
        model: workersai("@cf/zai-org/glm-4.7-flash"),
        system: orchestrationSystem,
        prompt: "Solicitação: " + prompt + "\nModo solicitado: " + mode,
        stopWhen: stepCountIs(3),
      });
      const fallbackJson = tryJson(result.text);

      this.setState({
        ...this.state,
        ai: "ready",
        last_orchestration: {
          at: new Date().toISOString(),
          provider: "cloudflare-workers-ai",
          model: "@cf/zai-org/glm-4.7-flash",
          verified: false,
        },
      });

      return Response.json({
        ok: true,
        agent: "ControlAgent",
        provider: "cloudflare-workers-ai",
        model: "@cf/zai-org/glm-4.7-flash",
        verified: false,
        orchestration: fallbackJson ?? { raw: result.text },
        autonomous_functions: autonomousFunctionSnapshot(),
        verification: null,
      });
    }

    if (url.pathname.endsWith("/marketing/brief") && request.method === "POST") {
      type MarketingBriefRequest = {
        treatment?: string;
        objective?: string;
        audience?: string;
        channels?: string[];
        approvedOffer?: string;
      };
      let body: MarketingBriefRequest = {};
      try {
        body = await request.json();
      } catch {
        return Response.json({ ok: false, error: "invalid_json" }, { status: 400 });
      }

      const treatment = typeof body.treatment === "string" ? body.treatment.trim() : "";
      const objective = typeof body.objective === "string" ? body.objective.trim() : "gerar agendamentos qualificados";
      const audience = typeof body.audience === "string" ? body.audience.trim() : "pessoas adultas em Parnamirim/RN interessadas em odontologia";
      const approvedOffer = typeof body.approvedOffer === "string" ? body.approvedOffer.trim() : "";
      const allowedChannels = new Set(["instagram_stories", "instagram_reels", "instagram_feed", "google_search", "whatsapp", "landing_page"]);
      const channels = Array.isArray(body.channels)
        ? body.channels.filter((value): value is string => typeof value === "string" && allowedChannels.has(value)).slice(0, 5)
        : ["instagram_stories", "whatsapp", "landing_page"];

      if (!treatment || treatment.length > 160 || objective.length > 300 || audience.length > 300 || approvedOffer.length > 300) {
        return Response.json({ ok: false, error: "required_or_invalid_marketing_fields" }, { status: 400 });
      }

      const marketingSystem =
        "Você é o cérebro MARKETING/GROWTH da Clínica São Paulo, clínica odontológica local em Parnamirim/RN. " +
        "Crie um briefing e copy utilizável que percorra o funil inteiro: atenção, desejo com confiança, consumo, intenção/impulso ético, conversa, qualificação, agendamento, retenção e mensuração. " +
        "Use português brasileiro natural. Não invente preço, desconto, escassez, depoimento, número de pacientes, prova social, disponibilidade, resultado clínico ou alegações de superioridade. " +
        "Se não foi fornecida oferta aprovada, não invente uma oferta; proponha CTA para avaliação e liste dados faltantes. Nunca prometa resultado odontológico. " +
        "Não peça dados de saúde, nome, telefone ou detalhes identificáveis de pacientes. Separe métricas de atenção de métricas de negócio. " +
        "Não publique nem alegue que publicou: este endpoint apenas gera texto e plano. Não gera imagem/vídeo nem chama Meta Ads/Instagram/WhatsApp. " +
        "Responda SOMENTE JSON válido nesta estrutura: {strategy:{audience,insight,positioning,offer_frame},funnel:{attention:{hook,kpi},desire_trust:{message,proof_needed},consume:{content_sequence,kpi},intent_impulse:{cta,friction_reducer},conversion:{whatsapp_opening,qualification_questions,success_event},retention:{follow_up_ideas,consent_required},measurement:{events,primary_business_kpi,guardrail_kpis}},creative_variants:[{angle,hook,format,script,cta,test_metric},{angle,hook,format,script,cta,test_metric}],missing_inputs:[],status:'draft_only_not_published'}. " +
        "Cada campo textual deve ser breve e concreto; creative_variants deve ter ao menos duas variantes distintas.\n" +
        "Canais permitidos: " + channels.join(", ") + ".";
      const prompt =
        "Tratamento/tema: " + treatment + "\n" +
        "Objetivo de negócio: " + objective + "\n" +
        "Público: " + audience + "\n" +
        "Oferta aprovada fornecida pelo responsável: " + (approvedOffer || "nenhuma; não inventar") + "\n" +
        "Entrega só um rascunho JSON para revisão humana.";
      
      const isValidBrief = (value: Record<string, any> | null) =>
        Boolean(value &&
          value.strategy && typeof value.strategy === "object" &&
          value.funnel && typeof value.funnel === "object" &&
          Array.isArray(value.creative_variants) && value.creative_variants.length >= 2 &&
          value.creative_variants.every((item: any) =>
            item && typeof item.hook === "string" &&
            typeof item.script === "string" && typeof item.cta === "string") &&
          value.funnel.attention && value.funnel.desire_trust &&
          value.funnel.consume && value.funnel.intent_impulse &&
          value.funnel.conversion && value.funnel.retention && value.funnel.measurement
        );

      try {
        const nvidia = await nvidiaChat(this.env, marketingSystem, prompt);
        const brief = nvidia ? tryJson(nvidia.text) : null;
        if (nvidia && isValidBrief(brief)) {
          return Response.json({
            ok: true,
            agent: "MarketingGrowth",
            provider: "nvidia-nim",
            model: nvidia.model,
            verified: true,
            published: false,
            media_assets_generated: false,
            brief,
          }, { headers: { "cache-control": "no-store" } });
        }
      } catch (error) {
        console.error("[MarketingGrowth] NIM failed; using Workers AI:", error);
      }

      try {
        const workersai = createWorkersAI({ binding: this.env.AI });
        const generated = await generateText({
          model: workersai("@cf/zai-org/glm-4.7-flash"),
          system: marketingSystem,
          prompt,
          stopWhen: stepCountIs(3),
        });
        const brief = tryJson(generated.text);
        if (!isValidBrief(brief)) {
          return Response.json({
            ok: false,
            error: "marketing_brief_schema_validation_failed",
            retryable: false,
          }, { status: 502, headers: { "cache-control": "no-store" } });
        }
        return Response.json({
          ok: true,
          agent: "MarketingGrowth",
          provider: "cloudflare-workers-ai",
          model: "@cf/zai-org/glm-4.7-flash",
          verified: true,
          published: false,
          media_assets_generated: false,
          brief,
        }, { headers: { "cache-control": "no-store" } });
      } catch (error) {
        console.error("[MarketingGrowth] text generation failed:", error);
        return Response.json({
          ok: false,
          error: "marketing_brief_generation_failed",
          retryable: false,
        }, { status: 502, headers: { "cache-control": "no-store" } });
      }
    }

    if (url.pathname.endsWith("/pairs/test") && request.method === "POST") {
      let body: { pair?: "jev-nemotron" | "laya-llm"; state?: string } = {};
      try { body = await request.json(); } catch {
        return Response.json({ ok: false, error: "invalid_json" }, { status: 400 });
      }
      const pair = body.pair === "laya-llm" ? "laya-llm" : "jev-nemotron";
      const state = typeof body.state === "string" ? body.state.trim() : "";
      if (!state || state.length > 4000) {
        return Response.json({ ok: false, error: "state_required_or_too_long", pairing: pairingSnapshot(this.env) }, { status: 400 });
      }
      const result = await runAgentPair(this.env, pair, state);
      return Response.json({ ok: result.ok, ...result, pairing: pairingSnapshot(this.env) }, {
        status: result.ok ? 200 : 503,
        headers: { "cache-control": "no-store" },
      });
    }

    if (url.pathname.endsWith("/inspect") && request.method === "POST") {
      if (this.state.browser_mcp !== "connected") {
        return Response.json(
          { ok: false, error: "browser_mcp_disconnected" },
          { status: 503 },
        );
      }

      let body: { prompt?: string } = {};
      try {
        body = await request.json();
      } catch {
        return Response.json(
          { ok: false, error: "invalid_json" },
          { status: 400 },
        );
      }

      const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
      if (!prompt || prompt.length > 2000) {
        return Response.json(
          { ok: false, error: "prompt_required_or_too_long" },
          { status: 400 },
        );
      }

      try {
        const workersai = createWorkersAI({ binding: this.env.AI });
        const allTools = this.mcp.getAITools();
        const readOnlyTools = getReadOnlyTools(allTools);

        const result = await generateText({
          model: workersai("@cf/zai-org/glm-4.7-flash"),
          system:
            "Você é o ControlAgent da Clínica São Paulo. " +
            "Faça somente inspeção e leitura de páginas. " +
            "Você não pode clicar, digitar, enviar formulários, comprar, excluir, publicar, " +
            "alterar configurações ou executar ações com efeitos externos. " +
            "Navegue somente em clinicasaopauloparnamirim.com.br ou www.clinicasaopauloparnamirim.com.br. " +
            "Não solicite senhas, tokens ou dados pessoais. " +
            "Responda em português do Brasil. " +
            "Use as ferramentas disponíveis somente quando forem necessárias.",
          prompt,
          tools: readOnlyTools,
          stopWhen: stepCountIs(6),
        });

        return Response.json({
          ok: true,
          agent: "ControlAgent",
          model: "@cf/zai-org/glm-4.7-flash",
          tools_available: Object.keys(readOnlyTools),
          text: result.text.slice(0, 12000),
        });
      } catch (error) {
        console.error("[ControlAgent] AI inspection failed:", error);
        this.setState({ ...this.state, ai: "error" });
        return Response.json(
          { ok: false, error: "ai_inspection_failed" },
          { status: 500 },
        );
      }
    }

    return Response.json({
      ok: this.state.status === "ready" && this.state.browser_mcp === "connected",
      agent: "ControlAgent",
      state: this.state,
      architecture: specialistSnapshot(),
      pairings: pairingSnapshot(this.env),
      mcp: {
        servers: this.getMcpServers().servers,
        tool_count: this.getMcpServers().tools.length,
        tools: this.getMcpServers().tools.map((tool) => tool.name),
      },
      readonly_tools: [...READ_ONLY_BROWSER_TOOLS],
    });
  }
}

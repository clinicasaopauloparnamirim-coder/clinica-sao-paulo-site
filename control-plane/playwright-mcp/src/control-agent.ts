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
  ai: "ready" | "error";
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
    ai: "ready",
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

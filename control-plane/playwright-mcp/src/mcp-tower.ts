/**
 * Control Tower MCP — Streamable-style JSON-RPC over HTTP POST.
 * Tools: health, ads auth/audit/search/mutate, GA4/GSC audit, NVIDIA test, and MarketingGrowth brief.
 * Auth: same Bearer MCP_AUTH_TOKEN (checked by index before this handler).
 */

import {
  googleAdsAuthCheck,
  googleAdsAudit,
  googleAdsOAuthStart,
  googleAdsSearch,
  googleAdsMutate,
  googleAdsBatchMutate,
  containsCampaignId,
} from "./google-ads";
import { googleGa4Audit, googleOAuthStart } from "./google-ga4";
import { googleGscAudit } from "./google-gsc";
import { runAdsMutateJudgment } from "./judgment-gate";

type TowerEnv = {
  GOOGLE_ADS_REFRESH_TOKEN?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_ADS_CUSTOMER_ID?: string;
  GOOGLE_ADS_LOGIN_CUSTOMER_ID?: string;
  GOOGLE_OAUTH_STORE: DurableObjectNamespace;
  CONTROL_AGENT: DurableObjectNamespace;
  MCP_AUTH_TOKEN?: string;
  TYPESAFE_API_KEY?: string;
  LAYA_HTTP_URL?: string;
  LAYA_API_KEY?: string;
  CONTROL_TOWER?: string;
  control_tower?: string;
  JUDGMENT_REQUIRED?: string;
  NVIDIA_API_KEY?: string;
  NVIDIA_BASE_URL?: string;
  NVIDIA_MODEL?: string;
};

const SERVER_INFO = {
  name: "clinica-sao-paulo-control-tower",
  version: "1.0.0",
};

const TOOLS = [
  {
    name: "health",
    description: "Status do Control Tower Worker (ok, auth, oauth).",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "ads_auth_check",
    description: "Valida OAuth Google Ads e retorna customer id.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "ads_oauth_start",
    description: "Gera link de consentimento Google Ads para reautorizar a conexão quebrada. Requer consentimento humano; não lê nem altera campanhas.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "ads_audit",
    description:
      "Auditoria Google Ads: campanhas, keywords e conversões (ultimos 30 dias).",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "ads_search",
    description:
      "Executa query GAQL de leitura no Google Ads.",
    inputSchema: {
      type: "object",
      required: ["query"],
      properties: {
        query: { type: "string", description: "Query GAQL" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "ads_mutate",
    description:
      "Mutate Google Ads por resource. EXIGE confirm=true para live. Judgment gate Laya/Jev/local.",
    inputSchema: {
      type: "object",
      required: ["resource", "operations", "confirm"],
      properties: {
        resource: {
          type: "string",
          enum: [
            "campaignBudgets",
            "campaigns",
            "adGroups",
            "adGroupCriteria",
            "adGroupAds",
            "campaignCriteria",
            "userLists",
            "remarketingActions",
          ],
        },
        operations: { type: "array", items: { type: "object" } },
        validateOnly: { type: "boolean", default: false },
        confirm: {
          type: "boolean",
          description: "Obrigatorio true para mutacao real",
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: "ads_batch_mutate",
    description:
      "Batch mutate (mutateOperations). EXIGE confirm=true para live. Judgment gate Laya/Jev/local.",
    inputSchema: {
      type: "object",
      required: ["operations", "confirm"],
      properties: {
        operations: { type: "array", items: { type: "object" } },
        validateOnly: { type: "boolean", default: false },
        confirm: { type: "boolean" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "google_oauth_start",
    description: "Gera link OAuth para autorizar GA4, Search Console e Business Profile no Control Tower. Exige consentimento humano; não muda dados.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "ga4_audit",
    description: "Lista key events da property GA4 da clinica.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "gsc_audit",
    description: "Performance Search Console (queries, paginas, dispositivos).",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "marketing_brief",
    description: "Generate a draft full-funnel marketing brief and at least two copy variants. Text only; never publishes or changes accounts.",
    inputSchema: {
      type: "object",
      required: ["treatment"],
      properties: {
        treatment: { type: "string", minLength: 1, maxLength: 160, description: "Treatment or content theme; no patient-identifiable information." },
        objective: { type: "string", maxLength: 300, description: "Business goal, e.g. qualified evaluations." },
        audience: { type: "string", maxLength: 300, description: "Audience or local segment." },
        channels: {
          type: "array",
          maxItems: 5,
          items: { type: "string", enum: ["instagram_stories", "instagram_reels", "instagram_feed", "google_search", "whatsapp", "landing_page"] },
        },
        approvedOffer: { type: "string", maxLength: 300, description: "Only a price/promotion actually approved by the clinic; omit if none." },
      },
      additionalProperties: false,
    },
  },
  {
    name: "agent_pair_test",
    description: "Testa um par decisor real (Jev+Nemotron ou Laya+Nemotron). Use apenas estado sintético, sem PII. Não executa ações de produção.",
    inputSchema: {
      type: "object",
      required: ["pair", "state"],
      properties: {
        pair: { type: "string", enum: ["jev-nemotron", "laya-llm"] },
        state: { type: "string", minLength: 1, maxLength: 4000, description: "Somente estado de teste não sensível." },
      },
      additionalProperties: false,
    },
  },
  {
    name: "nvidia_test",
    description: "Teste ponta a ponta de inferencia NVIDIA NIM usando a chave privada do Worker. Nao retorna secrets.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
];

function jsonRpcResult(id: unknown, result: unknown) {
  return Response.json(
    { jsonrpc: "2.0", id: id ?? null, result },
    { headers: { "cache-control": "no-store" } },
  );
}

function jsonRpcError(id: unknown, code: number, message: string) {
  return Response.json(
    { jsonrpc: "2.0", id: id ?? null, error: { code, message } },
    { status: code === -32600 ? 400 : 200, headers: { "cache-control": "no-store" } },
  );
}

async function responseToJson(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : { status: res.status };
  } catch {
    return { status: res.status, body: text.slice(0, 4000) };
  }
}

async function googleOAuthRecovery(
  request: Request,
  env: TowerEnv,
  provider: "ga4" | "gsc",
  error: unknown,
) {
  const message = error instanceof Error ? error.message : String(error);
  if (!/Google token refresh failed: (401|502)|Google Analytics is not authorized yet/i.test(message)) {
    return null;
  }

  const startUrl = new URL("/google/oauth/start", request.url);
  const response = await googleOAuthStart(new Request(startUrl.toString(), { method: "GET" }), env);
  const authorizationUrl = response.headers.get("location");
  if (response.status !== 302 || !authorizationUrl) {
    return {
      ok: false,
      authorization_required: true,
      provider,
      error: message,
      link_generation_failed: true,
      status: response.status,
      note: "Google authorization is required, but the consent link could not be generated.",
    };
  }

  return {
    ok: false,
    authorization_required: true,
    provider,
    error: message,
    authorization_url: authorizationUrl,
    redirect_uri: new URL("/google/oauth/callback", request.url).toString(),
    state_ttl_minutes: 10,
    next_step: "Open authorization_url, approve Google Analytics/Search Console access, then rerun the failed audit.",
  };
}

async function callTool(request: Request, env: TowerEnv, name: string, args: Record<string, unknown>) {
  switch (name) {
    case "health":
      return {
        ok: true,
        service: "clinica-sao-paulo-control-tower-mcp",
        auth_configured: Boolean(env.MCP_AUTH_TOKEN),
        google_oauth_configured: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
        customer_id: (env.GOOGLE_ADS_CUSTOMER_ID || "4603647788").replace(/-/g, ""),
        nvidia: {
          configured: Boolean(env.NVIDIA_API_KEY),
          base_url: env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1",
          model: env.NVIDIA_MODEL || "nvidia/nemotron-3.5-lightning-30b-a3b",
        },
        judgment: {
          laya_configured: Boolean(env.LAYA_API_KEY || env.control_tower || env.CONTROL_TOWER),
          laya_http_url: env.LAYA_HTTP_URL || "https://api.laya-ai.com",
          jev_configured: Boolean(env.TYPESAFE_API_KEY),
          required: String(env.JUDGMENT_REQUIRED || "").toLowerCase() === "true",
        },
      };
    case "ads_auth_check": {
      try {
        return responseToJson(await googleAdsAuthCheck(env));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Google Ads auth check failed";
        if (/invalid_grant|expired or revoked/i.test(message)) {
          const startUrl = new URL("/google/ads/oauth/start", request.url);
          const response = await googleAdsOAuthStart(new Request(startUrl.toString(), { method: "GET" }), env);
          const authorizationUrl = response.headers.get("location");
          if (response.status === 302 && authorizationUrl) {
            return {
              ok: false,
              authorization_required: true,
              error: message,
              authorization_url: authorizationUrl,
              redirect_uri: new URL("/google/ads/oauth/callback", request.url).toString(),
              state_ttl_minutes: 10,
              next_step: "Open authorization_url, approve Google Ads access, then run ads_auth_check again.",
            };
          }
        }
        throw error;
      }
    }
    case "ads_oauth_start": {
      const startUrl = new URL("/google/ads/oauth/start", request.url);
      const response = await googleAdsOAuthStart(new Request(startUrl.toString(), { method: "GET" }), env);
      const authorizationUrl = response.headers.get("location");
      if (response.status !== 302 || !authorizationUrl) {
        return { ok: false, status: response.status, error: (await response.text()).slice(0, 300) };
      }
      return {
        ok: true,
        authorization_url: authorizationUrl,
        redirect_uri: new URL("/google/ads/oauth/callback", request.url).toString(),
        state_ttl_minutes: 10,
        note: "Open authorization_url, approve Google Ads access, then rerun ads_auth_check. This link is for the account owner only.",
      };
    }
    case "ads_audit":
      return responseToJson(await googleAdsAudit(env));
    case "ads_search": {
      const query = typeof args.query === "string" ? args.query : "";
      if (query.length < 10) throw new Error("query GAQL obrigatoria");
      return await googleAdsSearch(env, query);
    }
    case "ads_mutate": {
      const resource = args.resource as
        | "campaignBudgets"
        | "campaigns"
        | "adGroups"
        | "adGroupCriteria"
        | "adGroupAds"
        | "campaignCriteria"
        | "userLists"
        | "remarketingActions";
      const operations = Array.isArray(args.operations) ? args.operations : [];
      const confirm = args.confirm === true;
      const validateOnly = args.validateOnly === true;
      if (!resource || !operations.length) throw new Error("resource e operations obrigatorios");
      const campaignId = containsCampaignId(operations);
      const gate = await runAdsMutateJudgment(env, {
        action: `ads_mutate:${resource}`,
        campaignId,
        scope: campaignId === "24289443969" ? "ALTA_INTENCAO" : "UNKNOWN",
        validateOnly,
        confirm,
      });
      if (gate.decision === "block") {
        return { ok: false, gated: true, gate };
      }
      if (!validateOnly && !confirm) {
        throw new Error("confirm:true obrigatorio para ads_mutate live");
      }
      if (!validateOnly && gate.decision === "confirm" && !confirm) {
        return { ok: false, gated: true, gate, message: "human confirm required" };
      }
      return await googleAdsMutate(env, resource, operations, validateOnly, confirm);
    }
    case "ads_batch_mutate": {
      const operations = Array.isArray(args.operations) ? args.operations : [];
      const confirm = args.confirm === true;
      const validateOnly = args.validateOnly === true;
      if (!operations.length) throw new Error("operations obrigatorio");
      const campaignId = containsCampaignId(operations);
      const gate = await runAdsMutateJudgment(env, {
        action: "ads_batch_mutate",
        campaignId,
        scope: campaignId === "24289443969" ? "ALTA_INTENCAO" : "UNKNOWN",
        validateOnly,
        confirm,
      });
      if (gate.decision === "block") {
        return { ok: false, gated: true, gate };
      }
      if (!validateOnly && !confirm) {
        throw new Error("confirm:true obrigatorio para ads_batch_mutate live");
      }
      return await googleAdsBatchMutate(env, operations, validateOnly, confirm);
    }
    case "google_oauth_start": {
      const startUrl = new URL("/google/oauth/start", request.url);
      const response = await googleOAuthStart(new Request(startUrl.toString(), { method: "GET" }), env);
      const authorizationUrl = response.headers.get("location");
      if (response.status !== 302 || !authorizationUrl) {
        return { ok: false, status: response.status, error: (await response.text()).slice(0, 300) };
      }
      return {
        ok: true,
        authorization_url: authorizationUrl,
        redirect_uri: new URL("/google/oauth/callback", request.url).toString(),
        state_ttl_minutes: 10,
        scope: "Analytics readonly; Search Console readonly; Business Profile manage",
        note: "Open authorization_url, approve Google access, then rerun ga4_audit and gsc_audit. The link is short-lived.",
      };
    }
    case "ga4_audit": {
      try {
        return responseToJson(await googleGa4Audit(env));
      } catch (error) {
        const recovery = await googleOAuthRecovery(request, env, "ga4", error);
        if (recovery) return recovery;
        throw error;
      }
    }
    case "gsc_audit": {
      try {
        return responseToJson(await googleGscAudit(env));
      } catch (error) {
        const recovery = await googleOAuthRecovery(request, env, "gsc", error);
        if (recovery) return recovery;
        throw error;
      }
    }
    case "marketing_brief": {
      const treatment = typeof args.treatment === "string" ? args.treatment.trim() : "";
      if (!treatment || treatment.length > 160) throw new Error("treatment is required (max 160 characters)");
      const agent = env.CONTROL_AGENT.get(env.CONTROL_AGENT.idFromName("marketing-growth"));
      const response = await agent.fetch("https://control-agent/marketing/brief", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(args),
      });
      return responseToJson(response);
    }
    case "agent_pair_test": {
      const pair = args.pair === "laya-llm" ? "laya-llm" : "jev-nemotron";
      const state = typeof args.state === "string" ? args.state.trim() : "";
      if (!state || state.length > 4000) throw new Error("state is required (max 4000 characters)");
      const agent = env.CONTROL_AGENT.get(env.CONTROL_AGENT.idFromName("agent-pair-test"));
      const response = await agent.fetch("https://control-agent/pairs/test", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pair, state }),
      });
      return responseToJson(response);
    }
    case "nvidia_test": {
      const apiKey = env.NVIDIA_API_KEY;
      const configuredBaseUrl = env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1";
      const baseUrl = configuredBaseUrl.endsWith("/") ? configuredBaseUrl.slice(0, -1) : configuredBaseUrl;
      const model = env.NVIDIA_MODEL || "nvidia/nemotron-3.5-lightning-30b-a3b";
      if (!apiKey) {
        return { ok: false, provider: "nvidia-nim", configured: false, error: "NVIDIA_API_KEY not configured in Worker" };
      }
      const started = Date.now();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      try {
        const response = await fetch(baseUrl + "/chat/completions", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: "Bearer " + apiKey,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: "You are a health check. Reply with exactly NIM_OK." },
              { role: "user", content: "NIM health check" },
            ],
            temperature: 0,
            max_tokens: 8,
          }),
          signal: controller.signal,
        });
        const raw = await response.text();
        let data: any = null;
        try { data = raw ? JSON.parse(raw) : null; } catch {}
        const output = data?.choices?.[0]?.message?.content ?? "";
        const responseCheck = /NIM_OK/i.test(String(output));
        return {
          ok: response.ok && responseCheck,
          provider: "nvidia-nim",
          configured: true,
          model,
          http_status: response.status,
          latency_ms: Date.now() - started,
          response_check: responseCheck,
          error: response.ok ? undefined : "NVIDIA NIM returned HTTP " + response.status,
        };
      } catch (error) {
        return {
          ok: false,
          provider: "nvidia-nim",
          configured: true,
          model,
          latency_ms: Date.now() - started,
          error: error instanceof Error ? error.message : "NVIDIA NIM request failed",
        };
      } finally {
        clearTimeout(timeout);
      }
    }
    default:
      throw new Error(`Tool desconhecida: ${name}`);
  }
}

export async function handleTowerMcp(request: Request, env: TowerEnv): Promise<Response> {
  if (request.method === "GET") {
    return Response.json(
      {
        ok: true,
        mcp: "control-tower",
        transport: "json-rpc-http",
        server: SERVER_INFO,
        tools: TOOLS.map((t) => t.name),
        usage: "POST JSON-RPC: initialize | tools/list | tools/call",
      },
      { headers: { "cache-control": "no-store" } },
    );
  }

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let body: { jsonrpc?: string; id?: unknown; method?: string; params?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return jsonRpcError(null, -32700, "Parse error");
  }

  const id = body.id;
  const method = body.method || "";

  try {
    if (method === "initialize") {
      return jsonRpcResult(id, {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: SERVER_INFO,
      });
    }

    if (method === "notifications/initialized" || method === "initialized") {
      return new Response(null, { status: 204 });
    }

    if (method === "tools/list") {
      return jsonRpcResult(id, { tools: TOOLS });
    }

    if (method === "tools/call") {
      const params = body.params || {};
      const name = typeof params.name === "string" ? params.name : "";
      const args =
        params.arguments && typeof params.arguments === "object"
          ? (params.arguments as Record<string, unknown>)
          : {};
      if (!name) return jsonRpcError(id, -32602, "name obrigatorio");
      const result = await callTool(request, env, name, args);
      return jsonRpcResult(id, {
        content: [{ type: "text", text: JSON.stringify(result, null, 2).slice(0, 100000) }],
        structuredContent: result,
      });
    }

    if (method === "ping") {
      return jsonRpcResult(id, {});
    }

    return jsonRpcError(id, -32601, `Method not found: ${method}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tool failed";
    return jsonRpcResult(id, {
      content: [{ type: "text", text: message }],
      isError: true,
    });
  }
}

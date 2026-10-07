/**
 * Control Tower MCP — Streamable-style JSON-RPC over HTTP POST.
 * Tools: health, ads_auth_check, ads_audit, ads_search, ads_mutate, ga4_audit, gsc_audit.
 * Auth: same Bearer MCP_AUTH_TOKEN (checked by index before this handler).
 */

import {
  googleAdsAuthCheck,
  googleAdsAudit,
  googleAdsSearch,
  googleAdsMutate,
  googleAdsBatchMutate,
  containsCampaignId,
} from "./google-ads";
import { googleGa4Audit } from "./google-ga4";
import { googleGscAudit } from "./google-gsc";
import { runAdsMutateJudgment } from "./judgment-gate";

type TowerEnv = {
  GOOGLE_ADS_REFRESH_TOKEN?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_ADS_CUSTOMER_ID?: string;
  GOOGLE_ADS_LOGIN_CUSTOMER_ID?: string;
  GOOGLE_OAUTH_STORE: DurableObjectNamespace;
  MCP_AUTH_TOKEN?: string;
  TYPESAFE_API_KEY?: string;
  LAYA_HTTP_URL?: string;
  JUDGMENT_REQUIRED?: string;
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
    name: "ga4_audit",
    description: "Lista key events da property GA4 da clinica.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "gsc_audit",
    description: "Performance Search Console (queries, paginas, dispositivos).",
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

async function callTool(env: TowerEnv, name: string, args: Record<string, unknown>) {
  switch (name) {
    case "health":
      return {
        ok: true,
        service: "clinica-sao-paulo-control-tower-mcp",
        auth_configured: Boolean(env.MCP_AUTH_TOKEN),
        google_oauth_configured: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
        customer_id: (env.GOOGLE_ADS_CUSTOMER_ID || "4603647788").replace(/-/g, ""),
        judgment: {
          laya_configured: Boolean(env.LAYA_HTTP_URL),
          jev_configured: Boolean(env.TYPESAFE_API_KEY),
          required: String(env.JUDGMENT_REQUIRED || "").toLowerCase() === "true",
        },
      };
    case "ads_auth_check":
      return responseToJson(await googleAdsAuthCheck(env));
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
    case "ga4_audit":
      return responseToJson(await googleGa4Audit(env));
    case "gsc_audit":
      return responseToJson(await googleGscAudit(env));
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
      const result = await callTool(env, name, args);
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

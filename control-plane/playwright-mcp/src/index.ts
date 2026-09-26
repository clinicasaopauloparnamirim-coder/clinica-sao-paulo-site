import { routeAgentRequest } from "agents";
import { env, DurableObject } from "cloudflare:workers";
import { createMcpAgent } from "@cloudflare/playwright-mcp";
import { ControlAgent } from "./control-agent";

interface WhatsAppEnv {
  MCP_AUTH_TOKEN?: string;
  WHATSAPP_VERIFY_TOKEN?: string;
  WHATSAPP_APP_SECRET?: string;
  WHATSAPP_LEDGER: DurableObjectNamespace;
}

export class WhatsAppLedger extends DurableObject {
  async fetch(request: Request) {
    if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

    const payload: any = await request.json();
    const receivedAt = new Date().toISOString();
    const messages = Array.isArray(payload?.entry)
      ? payload.entry.flatMap((entry: any) =>
          Array.isArray(entry?.changes)
            ? entry.changes.flatMap((change: any) =>
                Array.isArray(change?.value?.messages) ? change.value.messages : [],
              )
            : [],
        )
      : [];

    for (const message of messages) {
      const referral = message?.referral ?? message?.context?.referral ?? null;
      const record = {
        received_at: receivedAt,
        message_id: message?.id ?? null,
        from: message?.from ?? null,
        type: message?.type ?? null,
        text: message?.text?.body ?? null,
        source_type: referral?.source_type ?? referral?.sourceType ?? null,
        source_id: referral?.source_id ?? referral?.sourceId ?? null,
        source_url: referral?.source_url ?? referral?.sourceUrl ?? null,
        headline: referral?.headline ?? null,
        ctwa_clid: referral?.ctwa_clid ?? referral?.ctwaClid ?? null,
        raw: message,
      };
      await this.ctx.storage.put(
        `message:${message?.id ?? crypto.randomUUID()}`,
        record,
      );
    }

    const id = crypto.randomUUID();
    await this.ctx.storage.put(`event:${Date.now()}:${id}`, {
      received_at: receivedAt,
      message_count: messages.length,
      raw: payload,
    });

    return Response.json({
      ok: true,
      id,
      message_count: messages.length,
      attributed_messages: messages.filter((message: any) =>
        Boolean(message?.referral ?? message?.context?.referral),
      ).length,
    });
  }
}

export { ControlAgent };

export const PlaywrightMCP = createMcpAgent(env.BROWSER);

function unauthorized() {
  return new Response("Unauthorized", {
    status: 401,
    headers: {
      "content-type": "text/plain; charset=UTF-8",
      "www-authenticate": "Bearer",
    },
  });
}

function authorized(request: Request, env: { MCP_AUTH_TOKEN?: string }) {
  const configured = env.MCP_AUTH_TOKEN;
  if (!configured) return false;
  const header = request.headers.get("Authorization") || "";
  return header === "Bearer " + configured;
}

async function validMetaSignature(body: string, signature: string, secret: string) {
  if (!signature.startsWith("sha256=")) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  const expected = "sha256=" + [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  if (signature.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= signature.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

export default {
  async fetch(request: Request, env: WhatsAppEnv, ctx: ExecutionContext) {
    const { pathname } = new URL(request.url);

    if (pathname === "/health") {
      return new Response(JSON.stringify({
        ok: true,
        service: "clinica-sao-paulo-playwright-mcp",
        control_agent: true,
        browser_binding: true,
        auth_configured: Boolean(env.MCP_AUTH_TOKEN),
      }), {
        status: 200,
        headers: { "content-type": "application/json; charset=UTF-8", "cache-control": "no-store" },
      });
    }

    if (pathname === "/webhooks/whatsapp") {
      if (request.method === "GET") {
        const url = new URL(request.url);
        const mode = url.searchParams.get("hub.mode");
        const token = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge");
        if (mode === "subscribe" && token && challenge && token === env.WHATSAPP_VERIFY_TOKEN) {
          return new Response(challenge, { status: 200, headers: { "content-type": "text/plain; charset=UTF-8" } });
        }
        return new Response("Forbidden", { status: 403 });
      }

      if (request.method === "POST") {
        const body = await request.text();
        if (env.WHATSAPP_APP_SECRET) {
          const signature = request.headers.get("x-hub-signature-256") || "";
          if (!signature || !(await validMetaSignature(body, signature, env.WHATSAPP_APP_SECRET))) {
            return new Response("Forbidden", { status: 403 });
          }
        }

        let payload: any;
        try {
          payload = JSON.parse(body);
        } catch {
          return new Response("Bad Request", { status: 400 });
        }

        const ledger = env.WHATSAPP_LEDGER.get(env.WHATSAPP_LEDGER.idFromName("whatsapp"));
        const stored = await ledger.fetch("https://ledger.internal/", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!stored.ok) return new Response("Ledger Error", { status: 500 });
        return new Response("EVENT_RECEIVED", { status: 200 });
      }

      return new Response("Method Not Allowed", { status: 405 });
    }

    const isAgentRoute = pathname.startsWith("/agents/");
    const isMcpRoute = pathname === "/sse" || pathname === "/sse/message" || pathname === "/mcp";

    if (isAgentRoute || isMcpRoute) {
      if (!authorized(request, env)) return unauthorized();
    }

    if (isAgentRoute) {
      const agentResponse = await routeAgentRequest(request, env);
      if (agentResponse) return agentResponse;
      return new Response("Not Found", { status: 404 });
    }

    if (!isMcpRoute) {
      return new Response("Not Found", { status: 404 });
    }

    if (pathname === "/sse" || pathname === "/sse/message") {
      return PlaywrightMCP.serveSSE("/sse").fetch(request, env, ctx);
    }

    return PlaywrightMCP.serve("/mcp").fetch(request, env, ctx);
  },
};

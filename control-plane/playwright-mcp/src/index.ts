import { routeAgentRequest } from "agents";
import { env, DurableObject } from "cloudflare:workers";
import { createMcpAgent } from "@cloudflare/playwright-mcp";
import { ControlAgent } from "./control-agent";
import { GoogleOAuthStore, googleGa4Audit, googleGa4Cleanup, googleOAuthCallback, googleOAuthStart } from "./google-ga4";
import { googleGscAudit } from "./google-gsc";
import { handleTowerMcp } from "./mcp-tower";
import { specialistSnapshot } from "./agent-registry";
import { googleAdsAuthCheck, googleAdsAudit, googleAdsBatchMutate, googleAdsMutate, googleAdsSearch, googleAdsOAuthStart, googleAdsOAuthCallback } from "./google-ads";

interface WhatsAppEnv {
  MCP_AUTH_TOKEN?: string;
  WHATSAPP_VERIFY_TOKEN?: string;
  WHATSAPP_APP_SECRET?: string;
  WHATSAPP_LEDGER: DurableObjectNamespace;
  GOOGLE_OAUTH_STORE: DurableObjectNamespace;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_ADS_REFRESH_TOKEN?: string;
  GOOGLE_ADS_CUSTOMER_ID?: string;
  GOOGLE_ADS_LOGIN_CUSTOMER_ID?: string;
  GA4_MEASUREMENT_ID?: string;
  GA4_API_SECRET?: string;
}

export class WhatsAppLedger extends DurableObject {
  async fetch(request: Request) {
    if (request.method === "GET" && new URL(request.url).pathname === "/audit") return Response.json(await this.audit());
    if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
    const payload: any = await request.json();
    const receivedAt = new Date().toISOString();

    // Browser-side click: no PII; only attribution identifiers and landing metadata.
    if (payload?.type === "click" && payload?.lead_id) {
      await this.ctx.storage.put(`click:${payload.lead_id}`, {
        received_at: receivedAt,
        lead_id: payload.lead_id,
        attribution: payload.attribution ?? {},
      });
      return Response.json({ ok: true, lead_id: payload.lead_id, recorded: "click" });
    }

    const messages = Array.isArray(payload?.entry)
      ? payload.entry.flatMap((entry: any) =>
          Array.isArray(entry?.changes)
            ? entry.changes.flatMap((change: any) =>
                Array.isArray(change?.value?.messages) ? change.value.messages : [],
              )
            : [],
        )
      : [];

    let attributedMessages = 0;
    for (const message of messages) {
      const referral = message?.referral ?? message?.context?.referral ?? null;
      const text = String(message?.text?.body ?? "");
      const ref = text.match(/CSP-[A-F0-9]{10}/i)?.[0]?.toUpperCase() ?? null;
      const click = ref ? await this.ctx.storage.get(`click:${ref}`) : null;
      if (click) attributedMessages++;
      const record = {
        received_at: receivedAt,
        message_id: message?.id ?? null,
        type: message?.type ?? null,
        lead_id: ref,
        attributed: Boolean(click || referral),
        attribution: click?.attribution ?? null,
        source_type: referral?.source_type ?? referral?.sourceType ?? null,
        source_id: referral?.source_id ?? referral?.sourceId ?? null,
        source_url: referral?.source_url ?? referral?.sourceUrl ?? null,
        headline: referral?.headline ?? null,
        ctwa_clid: referral?.ctwa_clid ?? referral?.ctwaClid ?? null,
      };
      await this.ctx.storage.put(`message:${message?.id ?? crypto.randomUUID()}`, record);
      if (click) { try { await sendGa4WhatsAppLead(env as unknown as WhatsAppEnv, click.attribution ?? null, receivedAt); } catch {} }
    }
    const id = crypto.randomUUID();
    await this.ctx.storage.put(`event:${Date.now()}:${id}`, {
      received_at: receivedAt,
      message_count: messages.length,
      attributed_messages: attributedMessages,
    });
    return Response.json({
      ok: true,
      id,
      message_count: messages.length,
      attributed_messages: attributedMessages,
    });
  }

  async audit() {
    const rows = await this.ctx.storage.list({ reverse: true, limit: 100 });
    const items = Array.from(rows.entries()).map(([key, value]) => ({
      key,
      received_at: value?.received_at ?? null,
      lead_id: value?.lead_id ?? null,
      attributed: value?.attributed ?? null,
      attribution: value?.attribution ?? null,
      source_type: value?.source_type ?? null,
      source_url: value?.source_url ?? null,
      type: value?.type ?? null,
    }));
    return {
      ok: true,
      total_sampled: items.length,
      clicks: items.filter(x => x.key.startsWith("click:")).length,
      messages: items.filter(x => x.key.startsWith("message:")).length,
      attributed_messages: items.filter(x => x.key.startsWith("message:") && x.attributed).length,
      items,
    };
  }
}

export { ControlAgent, GoogleOAuthStore };

const browserBinding = (env as unknown as { BROWSER: Parameters<typeof createMcpAgent>[0] }).BROWSER;
export const PlaywrightMCP = createMcpAgent(browserBinding);


async function sendGa4WhatsAppLead(env: WhatsAppEnv, attribution: Record<string, any> | null, receivedAt: string) {
  const measurementId = env.GA4_MEASUREMENT_ID;
  const apiSecret = env.GA4_API_SECRET;
  const clientId = attribution?.ga_client_id;
  if (!measurementId || !apiSecret || !clientId) return false;
  const params: Record<string, string> = {
    lead_id: String(attribution?.lead_id ?? ""),
    source: String(attribution?.utm_source ?? (attribution?.gclid ? "google" : "")),
    medium: String(attribution?.utm_medium ?? (attribution?.gclid ? "cpc" : "")),
    campaign: String(attribution?.utm_campaign ?? ""),
    landing_page: String(attribution?.landing_page ?? ""),
  };
  if (attribution?.gclid) params.gclid = String(attribution.gclid);
  const response = await fetch(
    `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        client_id: String(clientId),
        events: [{
          name: "whatsapp_lead",
          params: {
            ...params,
            engagement_time_msec: 1,
            timestamp_micros: String(Math.floor(new Date(receivedAt).getTime() * 1000)),
          },
        }],
      }),
    },
  );
  return response.ok;
}

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
  if (header === "Bearer " + configured) return true;
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/(?:^|;\s*)control_session=([^;]+)/);
  return match?.[1] === encodeURIComponent(configured);
}

function controlCookie(value: string, maxAge = 3600) {
  return "control_session=" + encodeURIComponent(value) + "; Max-Age=" + maxAge + "; Path=/; Secure; HttpOnly; SameSite=Strict";
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
        google_oauth_configured: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
      }), {
        status: 200,
        headers: { "content-type": "application/json; charset=UTF-8", "cache-control": "no-store" },
      });
    }

    if (pathname === "/control/login" && request.method === "POST") {
      const form = await request.formData();
      const token = String(form.get("token") || "");
      if (!env.MCP_AUTH_TOKEN || token !== env.MCP_AUTH_TOKEN) {
        return new Response("Acesso negado: MCP Auth Token invalido.", {
          status: 401,
          headers: { "content-type": "text/plain; charset=UTF-8", "cache-control": "no-store" },
        });
      }
      return new Response(null, {
        status: 303,
        headers: {
          "Location": "/control",
          "Set-Cookie": controlCookie(token),
          "cache-control": "no-store",
        },
      });
    }

    if (pathname === "/control/logout") {
      return new Response(null, {
        status: 303,
        headers: {
          "Location": "/control",
          "Set-Cookie": controlCookie("", 0),
          "cache-control": "no-store",
        },
      });
    }

    if (pathname === "/control/auth-check") {
      if (!authorized(request, env)) return unauthorized();
      return Response.json({ ok: true, authenticated: true }, { headers: { "cache-control": "no-store" } });
    }

    if (pathname === "/control") {
      const authenticated = authorized(request, env);
      const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Control Tower</title>
</head>
<body style="font-family:system-ui;background:#080b10;color:#eef2f7;display:grid;place-items:center;min-height:100vh;margin:0">
<main style="width:min(920px,92vw);background:#111722;border:1px solid #273142;border-radius:20px;padding:28px">
<h1>Control Tower</h1>
${authenticated ? `<p>Acesso autorizado</p>
<p><a href="/health">Health</a> | <a href="/google/ads/audit">Ads</a> | <a href="/mcp/tower">MCP Tower</a> | <a href="/control/logout">Sair</a></p>` : `<form method="POST" action="/control/login"><label>MCP Auth Token</label><br><input name="token" type="password" required style="width:100%;padding:12px"><br><button type="submit">Entrar</button></form>`}
</main></body></html>`;
      return new Response(html, {
        status: 200,
        headers: { "content-type": "text/html; charset=UTF-8", "cache-control": "no-store" },
      });
    }

    if (pathname === "/control/agents") {
      if (!authorized(request, env)) return unauthorized();
      return Response.json({ ok: true, ...specialistSnapshot() }, { headers: { "cache-control": "no-store" } });
    }

    if (pathname === "/google/ads/oauth/start") return googleAdsOAuthStart(request, env);
    if (pathname === "/google/ads/oauth/callback") return googleAdsOAuthCallback(request, env);

    if (pathname === "/google/ads/auth-check") {
      if (!authorized(request, env)) return unauthorized();
      try { return await googleAdsAuthCheck(env); }
      catch (error) { return new Response(error instanceof Error ? error.message : "Google Ads auth check failed", { status: 502 }); }
    }

    if (pathname === "/google/ads/audit") {
      if (!authorized(request, env)) return unauthorized();
      try { return await googleAdsAudit(env); }
      catch (error) { return new Response(error instanceof Error ? error.message : "Google Ads audit failed", { status: 502 }); }
    }

    if (pathname === "/google/ads/search" && request.method === "POST") {
      if (!authorized(request, env)) return unauthorized();
      try {
        const body = await request.json() as { query?: string };
        if (!body.query) return new Response("Missing query.", { status: 400 });
        return Response.json(await googleAdsSearch(env, body.query), { headers: { "cache-control": "no-store" } });
      } catch (error) {
        return new Response(error instanceof Error ? error.message : "Google Ads search failed", { status: 400 });
      }
    }

    if (pathname === "/google/ads/batch-mutate" && request.method === "POST") {
      if (!authorized(request, env)) return unauthorized();
      try {
        const body = await request.json() as { operations?: unknown[]; validateOnly?: boolean; confirm?: boolean };
        if (!Array.isArray(body.operations)) return new Response("Invalid batch mutation payload.", { status: 400 });
        return Response.json(await googleAdsBatchMutate(env, body.operations, body.validateOnly !== false, body.confirm === true), { headers: { "cache-control": "no-store" } });
      } catch (error) {
        return new Response(error instanceof Error ? error.message : "Google Ads batch mutation failed", { status: 400 });
      }
    }

    if (pathname === "/google/ads/mutate" && request.method === "POST") {
      if (!authorized(request, env)) return unauthorized();
      try {
        const body = await request.json() as { resource?: "campaignBudgets"|"campaigns"|"adGroups"|"adGroupCriteria"|"adGroupAds"|"campaignCriteria"|"userLists"|"remarketingActions"; operations?: unknown[]; validateOnly?: boolean; confirm?: boolean };
        if (!body.resource || !Array.isArray(body.operations)) return new Response("Invalid mutation payload.", { status: 400 });
        return Response.json(await googleAdsMutate(env, body.resource, body.operations, body.validateOnly !== false, body.confirm === true), { headers: { "cache-control": "no-store" } });
      } catch (error) { return new Response(error instanceof Error ? error.message : "Google Ads mutation failed", { status: 400 }); }
    }

    if (pathname === "/google/oauth/start") return googleOAuthStart(request, env);
    if (pathname === "/google/oauth/callback") return googleOAuthCallback(request, env);

    if (pathname === "/google/ga4/cleanup" && request.method === "POST") {
      if (!authorized(request, env)) return unauthorized();
      let body: { confirm?: boolean } = {};
      try { body = await request.json(); } catch {
        return new Response("Explicit confirmation required.", { status: 400 });
      }
      if (body.confirm !== true) return new Response("Explicit confirmation required: send {confirm:true}.", { status: 400 });
      try { return await googleGa4Cleanup(env); }
      catch (error) { return new Response(error instanceof Error ? error.message : "GA4 cleanup failed", { status: 502 }); }
    }

    if (pathname === "/google/ga4/audit") {
      if (!authorized(request, env)) return unauthorized();
      try { return await googleGa4Audit(env); }
      catch (error) { return new Response(error instanceof Error ? error.message : "GA4 audit failed", { status: 502 }); }
    }

    if (pathname === "/google/gsc/audit") {
      if (!authorized(request, env)) return unauthorized();
      try { return await googleGscAudit(env); }
      catch (error) { return new Response(error instanceof Error ? error.message : "Search Console audit failed", { status: 502 }); }
    }

    if (pathname === "/api/lead-click" && request.method === "POST") {
      try {
        const payload = await request.json() as { type?: string; lead_id?: string; attribution?: Record<string, unknown> };
        if (payload.type !== "click" || !payload.lead_id || !/^CSP-[A-F0-9]{10}$/i.test(payload.lead_id)) {
          return new Response("Invalid attribution payload.", { status: 400 });
        }
        const ledger = env.WHATSAPP_LEDGER.get(env.WHATSAPP_LEDGER.idFromName("whatsapp"));
        return await ledger.fetch("https://ledger.internal/", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch {
        return new Response("Bad Request", { status: 400 });
      }
    }

    if (pathname === "/control/whatsapp/audit") {
      if (!authorized(request, env)) return unauthorized();
      const ledger = env.WHATSAPP_LEDGER.get(env.WHATSAPP_LEDGER.idFromName("whatsapp"));
      const result = await ledger.fetch("https://ledger.internal/audit", { method: "GET" });
      return new Response(result.body, { status: result.status, headers: { "content-type": "application/json; charset=UTF-8", "cache-control": "no-store" } });
    }

    if (pathname === "/webhooks/whatsapp") {
      if (request.method === "GET") {
        const url = new URL(request.url);
        const mode = url.searchParams.get("hub.mode");
        const token = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge");
        if (mode === "subscribe" && token && challenge && token === env.WHATSAPP_VERIFY_TOKEN) {
          return new Response(challenge, { status: 200 });
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
        try { payload = JSON.parse(body); } catch { return new Response("Bad Request", { status: 400 }); }
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

    // Control Tower MCP (Ads / GA4 / GSC) — JSON-RPC HTTP
    if (pathname === "/mcp/tower" || pathname === "/mcp/control-tower") {
      if (!authorized(request, env)) return unauthorized();
      return handleTowerMcp(request, env);
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
      // Serve static site from public/ (wrangler.jsonc assets binding)
      const assets = (env as unknown as { ASSETS?: { fetch: (req: Request) => Promise<Response> } }).ASSETS;
      if (assets && typeof assets.fetch === "function") {
        const assetResponse = await assets.fetch(request);
        const headers = new Headers(assetResponse.headers);
        headers.set("x-content-type-options", "nosniff");
        headers.set("x-frame-options", "SAMEORIGIN");
        headers.set("referrer-policy", "strict-origin-when-cross-origin");
        headers.set("permissions-policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
        return new Response(assetResponse.body, {
          status: assetResponse.status,
          statusText: assetResponse.statusText,
          headers,
        });
      }
      return new Response("Not Found", { status: 404 });
    }

    if (pathname === "/sse" || pathname === "/sse/message") {
      return PlaywrightMCP.serveSSE("/sse").fetch(request, env, ctx);
    }

    return PlaywrightMCP.serve("/mcp").fetch(request, env, ctx);
  },
};

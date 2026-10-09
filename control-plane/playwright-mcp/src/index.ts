import { routeAgentRequest } from "agents";
import { env, DurableObject } from "cloudflare:workers";
import { createMcpAgent } from "@cloudflare/playwright-mcp";
import { ControlAgent } from "./control-agent";
import { GoogleOAuthStore, googleGa4Audit, googleGa4Cleanup, googleOAuthCallback, googleOAuthStart } from "./google-ga4";
import { googleGscAudit } from "./google-gsc";
import { trackAttributionEvent, getAttributionReport, investigateAttribution, setContactStatus } from "./attribution";
import { googleBusinessAudit } from "./google-business-profile";
import { handleTowerMcp } from "./mcp-tower";
import { specialistSnapshot } from "./agent-registry";
import { autonomousFunctionSnapshot } from "./autonomous-functions";
import { pairingSnapshot } from "./agent-pairing";
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
  NVIDIA_API_KEY?: string;
  NVIDIA_BASE_URL?: string;
  NVIDIA_MODEL?: string;
  TYPESAFE_API_KEY?: string;
  LAYA_HTTP_URL?: string;
  LAYA_API_KEY?: string;
  CONTROL_TOWER?: string;
  control_tower?: string;
  INVESTIGATOR_MODEL?: string;
}

export class WhatsAppLedger extends DurableObject {
  async fetch(request: Request) {
    const url = new URL(request.url);
    const dayOf = (iso: string) => new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Fortaleza", year: "numeric", month: "2-digit", day: "2-digit"
    }).format(new Date(iso));
    const inRange = (iso: string, start?: string | null, end?: string | null) => {
      const day = dayOf(iso);
      return (!start || day >= start) && (!end || day <= end);
    };

    if (request.method === "POST" && url.pathname === "/track") {
      const payload: any = await request.json();
      if (payload?.kind !== "attribution_event" || !payload?.event) return new Response("Bad Request", { status: 400 });
      const event = payload.event;
      await this.ctx.storage.put("touch:" + Date.now() + ":" + (event.event_id || crypto.randomUUID()), event);
      return Response.json({ ok: true });
    }

    if (request.method === "POST" && url.pathname === "/contact") {
      const payload: any = await request.json();
      const phone = typeof payload?.phone === "string" ? payload.phone.replace(/\D/g, "") : "";
      if (!phone || phone.length < 8) return new Response("Bad Request", { status: 400 });
      await this.ctx.storage.put("contact:" + phone, {
        phone, status: payload?.status || "unknown", note: payload?.note || null,
        updated_at: payload?.updated_at || new Date().toISOString()
      });
      return Response.json({ ok: true });
    }

    if (request.method === "GET" && url.pathname === "/report") {
      const start = url.searchParams.get("start");
      const end = url.searchParams.get("end");
      const touchValues = await this.ctx.storage.list<any>({ prefix: "touch:" });
      const messageValues = await this.ctx.storage.list<any>({ prefix: "message:" });
      const contactValues = await this.ctx.storage.list<any>({ prefix: "contact:" });

      const touches = [...touchValues.values()].filter((x: any) => x?.at && inRange(x.at, start, end));
      const messages = [...messageValues.values()].filter((x: any) => x?.received_at && inRange(x.received_at, start, end));
      const statusByPhone = new Map<string, any>();
      for (const value of contactValues.values()) if (value?.phone) statusByPhone.set(value.phone, value);

      const tokenTouch = new Map<string, any>();
      for (const touch of touches) {
        if (touch?.lead_token && !tokenTouch.has(String(touch.lead_token))) tokenTouch.set(String(touch.lead_token), touch);
      }

      const tokenFromText = (value: unknown) => {
        const m = typeof value === "string" ? value.match(/(?:Código|Codigo):\s*([A-Z0-9-]{4,40})/i) : null;
        return m ? m[1].toUpperCase() : null;
      };

      const contactMap = new Map<string, any>();
      for (const msg of messages) {
        const phone = typeof msg?.from === "string" ? msg.from.replace(/\D/g, "") : "";
        if (!phone) continue;
        let item = contactMap.get(phone);
        if (!item) {
          item = { phone, first_contact_at: msg.received_at, last_contact_at: msg.received_at, message_count: 0, lead_token: null, touch: null };
          contactMap.set(phone, item);
        }
        item.message_count++;
        if (msg.received_at < item.first_contact_at) item.first_contact_at = msg.received_at;
        if (msg.received_at > item.last_contact_at) item.last_contact_at = msg.received_at;
        const token = msg?.lead_token || tokenFromText(msg?.text);
        if (token && tokenTouch.has(String(token).toUpperCase()) && !item.touch) {
          item.lead_token = String(token).toUpperCase();
          item.touch = tokenTouch.get(item.lead_token);
        }
      }

      const allMessageList = [...messageValues.values()];
      const allCountByPhone = new Map<string, number>();
      for (const msg of allMessageList) {
        const phone = typeof msg?.from === "string" ? msg.from.replace(/\D/g, "") : "";
        if (phone) allCountByPhone.set(phone, (allCountByPhone.get(phone) || 0) + 1);
      }

      const byDay = new Map<string, any>();
      const getDay = (day: string) => {
        if (!byDay.has(day)) byDay.set(day, {
          date: day, page_views: 0, whatsapp_clicks: 0, maps_clicks: 0, phone_clicks: 0,
          unique_sessions: new Set<string>(), unique_lead_tokens: new Set<string>(),
          whatsapp_contacts: new Set<string>(), whatsapp_messages: 0
        });
        return byDay.get(day);
      };
      for (const touch of touches) {
        const d = getDay(dayOf(touch.at));
        if (touch.event_type === "page_view") d.page_views++;
        if (touch.event_type === "whatsapp_click") d.whatsapp_clicks++;
        if (touch.event_type === "maps_click") d.maps_clicks++;
        if (touch.event_type === "phone_click") d.phone_clicks++;
        if (touch.session_id) d.unique_sessions.add(String(touch.session_id));
        if (touch.lead_token) d.unique_lead_tokens.add(String(touch.lead_token));
      }
      for (const msg of messages) {
        const d = getDay(dayOf(msg.received_at));
        d.whatsapp_messages++;
        if (msg.from) d.whatsapp_contacts.add(String(msg.from).replace(/\D/g, ""));
      }

      const contacts = [...contactMap.values()].map((item: any) => {
        const touch = item.touch;
        return {
          phone: item.phone,
          first_contact_at: item.first_contact_at,
          last_contact_at: item.last_contact_at,
          message_count_in_range: item.message_count,
          message_count_all_time: allCountByPhone.get(item.phone) || item.message_count,
          returning_whatsapp_contact: (allCountByPhone.get(item.phone) || 0) > 1,
          patient_status: statusByPhone.get(item.phone)?.status || "unknown",
          source: touch?.source || null,
          medium: touch?.medium || null,
          campaign: touch?.campaign || null,
          term: touch?.term || null,
          content: touch?.content || null,
          gclid: touch?.gclid || null,
          fbclid: touch?.fbclid || null,
          landing_page: touch?.page || null,
          lead_token: item.lead_token,
          referrer: touch?.referrer || null
        };
      }).sort((a,b) => String(a.first_contact_at).localeCompare(String(b.first_contact_at)));

      return Response.json({
        ok: true,
        range: { start, end },
        totals: {
          tracked_events: touches.length,
          page_views: touches.filter((x:any) => x.event_type === "page_view").length,
          whatsapp_clicks: touches.filter((x:any) => x.event_type === "whatsapp_click").length,
          maps_clicks: touches.filter((x:any) => x.event_type === "maps_click").length,
          phone_clicks: touches.filter((x:any) => x.event_type === "phone_click").length,
          whatsapp_messages: messages.length,
          unique_whatsapp_contacts: new Set(messages.map((x:any) => String(x?.from || "").replace(/\D/g, "")).filter(Boolean)).size,
          attributed_whatsapp_contacts: contacts.filter((x:any) => Boolean(x.lead_token || x.gclid || x.source)).length
        },
        by_day: [...byDay.values()].map((d:any) => ({
          date:d.date, page_views:d.page_views, whatsapp_clicks:d.whatsapp_clicks,
          maps_clicks:d.maps_clicks, phone_clicks:d.phone_clicks,
          unique_sessions:d.unique_sessions.size, unique_lead_tokens:d.unique_lead_tokens.size,
          whatsapp_contacts:d.whatsapp_contacts.size, whatsapp_messages:d.whatsapp_messages
        })).sort((a,b)=>a.date.localeCompare(b.date)),
        contacts
      }, { headers: { "cache-control": "no-store" } });
    }

    if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
    const payload: any = await request.json();
    const receivedAt = new Date().toISOString();
    const messages = Array.isArray(payload?.entry)
      ? payload.entry.flatMap((entry: any) =>
          Array.isArray(entry?.changes)
            ? entry.changes.flatMap((change: any) =>
                Array.isArray(change?.value?.messages) ? change.value.messages : []
              ) : []
        ) : [];

    for (const message of messages) {
      const referral = message?.referral ?? message?.context?.referral ?? null;
      const leadToken = String(message?.text?.body || "").match(/(?:Código|Codigo):\s*([A-Z0-9-]{4,40})/i)?.[1] || null;
      await this.ctx.storage.put("message:" + (message?.id ?? crypto.randomUUID()), {
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
        lead_token: leadToken,
        raw: message
      });
    }
    const id = crypto.randomUUID();
    await this.ctx.storage.put("event:" + Date.now() + ":" + id, { received_at: receivedAt, message_count: messages.length, raw: payload });
    return Response.json({ ok:true, id, message_count:messages.length, attributed_messages:messages.filter((m:any)=>Boolean(m?.referral ?? m?.context?.referral)).length });
  }
}

export { ControlAgent, GoogleOAuthStore };

const browserBinding = (env as unknown as { BROWSER: Parameters<typeof createMcpAgent>[0] }).BROWSER;
export const PlaywrightMCP = createMcpAgent(browserBinding);

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
        nvidia_nim_configured: Boolean(env.NVIDIA_API_KEY),
        nvidia_base_url: env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1",
        nvidia_model: env.NVIDIA_MODEL || "nvidia/nemotron-3.5-lightning-30b-a3b",
        laya_configured: Boolean(env.LAYA_API_KEY || env.control_tower || env.CONTROL_TOWER),
        laya_http_url: env.LAYA_HTTP_URL || "https://api.laya.studio",
        investigator_model: env.INVESTIGATOR_MODEL || "z-ai/glm-5.3",
        whatsapp_ledger: true,
        google_business_profile: true,
        brain_count: specialistSnapshot().brainCount,
        capability_count: specialistSnapshot().capabilityCount,
        autonomous_function_count: autonomousFunctionSnapshot().count,
        pairings: pairingSnapshot(env),
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

    if (pathname === "/control/architecture") {
      if (!authorized(request, env)) return unauthorized();
      const snapshot = specialistSnapshot();
      const integrations = {
        nvidia_nim: {
          configured: Boolean(env.NVIDIA_API_KEY),
          model: env.NVIDIA_MODEL || "nvidia/nemotron-3.5-lightning-30b-a3b",
          base_url: env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1",
          role: "primary-reasoning",
        },
        cloudflare_workers_ai: { configured: true, role: "fallback-reasoning" },
        playwright_mcp: { configured: true, role: "browser-tools" },
        google_stack: {
          configured: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
          role: "ads-gsc-ga4",
        },
        whatsapp_ledger: { configured: true, role: "lead-attribution-memory" },
        agent_pairings: pairingSnapshot(env),
        external_marketing_bridge: {
          role: "Composio",
          toolkits: ["Semrush", "Ahrefs", "OpenSEO", "Meta Ads", "Instagram", "Google Ads", "GSC", "GA4"],
        },
      };
      return Response.json({
        ok: true,
        ...snapshot,
        integrations,
        execution_policy: "read-first; write requires explicit confirmation for financial, secret, or destructive effects",
      }, { headers: { "cache-control": "no-store" } });
    }

    if (pathname === "/google/ads/oauth/start") {
      if (!authorized(request, env)) return unauthorized();
      return googleAdsOAuthStart(request, env);
    }
    if (pathname === "/google/ads/oauth/callback") return googleAdsOAuthCallback(request, env);

    if (pathname === "/google/ads/auth-check") {
      if (!authorized(request, env)) return unauthorized();
      try { return await googleAdsAuthCheck(env); }
      catch (error) {
        const message = error instanceof Error ? error.message : "Google Ads auth check failed";
        if (/invalid_grant|expired or revoked/i.test(message)) {
          // Reuse the authenticated auth-check route to issue a short-lived,
          // single-use Google consent URL without exposing an unauthenticated OAuth start.
          const startRequest = new Request(new URL("/google/ads/oauth/start", request.url).toString(), { method: "GET" });
          const startResponse = await googleAdsOAuthStart(startRequest, env);
          const authorizationUrl = startResponse.headers.get("location");
          if (startResponse.status === 302 && authorizationUrl) {
            return Response.json({
              ok: false,
              authorization_required: true,
              error: message,
              authorization_url: authorizationUrl,
              redirect_uri: new URL("/google/ads/oauth/callback", request.url).toString(),
              state_ttl_minutes: 10,
              next_step: "Open authorization_url, approve Google Ads access, then run ads_auth_check again.",
            }, { headers: { "cache-control": "no-store" } });
          }
        }
        return new Response(message, { status: 502 });
      }
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

    if (pathname === "/google/oauth/start") {
      if (!authorized(request, env)) return unauthorized();
      return googleOAuthStart(request, env);
    }
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

    if (pathname === "/track" && request.method === "POST") {
      return trackAttributionEvent(env, request);
    }

    if (pathname === "/attribution/report" && request.method === "GET") {
      if (!authorized(request, env)) return unauthorized();
      const url = new URL(request.url);
      try {
        return Response.json(await getAttributionReport(env, url.searchParams.get("start") || undefined, url.searchParams.get("end") || undefined), { headers: { "cache-control": "no-store" } });
      } catch (error) {
        return new Response(error instanceof Error ? error.message : "Attribution report failed", { status: 502 });
      }
    }

    if (pathname === "/attribution/investigate" && request.method === "GET") {
      if (!authorized(request, env)) return unauthorized();
      const url = new URL(request.url);
      try {
        return Response.json(await investigateAttribution(env, url.searchParams.get("start") || undefined, url.searchParams.get("end") || undefined), { headers: { "cache-control": "no-store" } });
      } catch (error) {
        return new Response(error instanceof Error ? error.message : "Attribution investigation failed", { status: 502 });
      }
    }

    if (pathname === "/attribution/contact" && request.method === "POST") {
      if (!authorized(request, env)) return unauthorized();
      try {
        const body = await request.json() as { phone?: string; status?: string; note?: string };
        if (!body.phone || !body.status) return new Response("phone and status are required", { status: 400 });
        return await setContactStatus(env, body.phone, body.status, body.note);
      } catch (error) {
        return new Response(error instanceof Error ? error.message : "Contact status update failed", { status: 400 });
      }
    }

    if (pathname === "/google/business/audit" && request.method === "GET") {
      if (!authorized(request, env)) return unauthorized();
      try {
        const days = Math.max(1, Math.min(365, Number(new URL(request.url).searchParams.get("days") || "28")));
        return Response.json(await googleBusinessAudit(env, days), { headers: { "cache-control": "no-store" } });
      } catch (error) {
        return new Response(error instanceof Error ? error.message : "Google Business Profile audit failed", { status: 502 });
      }
    }

    if (pathname === "/google/business/oauth/start") {
      if (!authorized(request, env)) return unauthorized();
      return googleOAuthStart(request, env);
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

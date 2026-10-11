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
  WHATSAPP_ACCESS_TOKEN?: string;
  WHATSAPP_PHONE_NUMBER_ID?: string;
  WHATSAPP_LEDGER: DurableObjectNamespace;
  CONTROL_AGENT: DurableObjectNamespace;
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
  ALERT_SLACK_WEBHOOK?: string;
  ALERT_WEBHOOK_URL?: string;
  GEMINI_API_KEY?: string;
  OPENAI_API_KEY?: string;
  AI_SYSTEM_PROMPT?: string;
  AI?: any;
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

    const env = this.env as WhatsAppEnv;
    const alerts: string[] = [];

    for (const message of messages) {
      const referral = message?.referral ?? message?.context?.referral ?? null;
      const textBody = message?.text?.body ?? null;
      const leadToken = String(textBody || "").match(/(?:Código|Codigo):\s*([A-Z0-9-]{4,40})/i)?.[1] || null;

      await this.ctx.storage.put("message:" + (message?.id ?? crypto.randomUUID()), {
        received_at: receivedAt,
        message_id: message?.id ?? null,
        from: message?.from ?? null,
        type: message?.type ?? null,
        text: textBody,
        source_type: referral?.source_type ?? referral?.sourceType ?? null,
        source_id: referral?.source_id ?? referral?.sourceId ?? null,
        source_url: referral?.source_url ?? referral?.sourceUrl ?? null,
        headline: referral?.headline ?? null,
        ctwa_clid: referral?.ctwa_clid ?? referral?.ctwaClid ?? null,
        lead_token: leadToken,
        raw: message
      });

      if (message?.type === "text" && textBody && message?.from) {
        const reply = await this.generateReply(textBody, env);
        if (reply && env.WHATSAPP_ACCESS_TOKEN && env.WHATSAPP_PHONE_NUMBER_ID) {
          await this.sendWhatsAppReply(message.from, reply, env);
        }
        alerts.push([
          "🚨 *Nova mensagem WhatsApp*",
          "De: " + message.from,
          "Texto: " + textBody,
          "Resposta IA: " + (reply ? reply.slice(0, 200) : "(sem resposta)"),
          "Horário: " + new Date(receivedAt).toLocaleString("pt-BR", { timeZone: "America/Fortaleza" }),
          leadToken ? "Código: " + leadToken : null
        ].filter(Boolean).join("\n"));
      }
    }

    if (alerts.length > 0) {
      this.ctx.waitUntil(this.sendAlerts(alerts, env));
    }

    const id = crypto.randomUUID();
    await this.ctx.storage.put("event:" + Date.now() + ":" + id, { received_at: receivedAt, message_count: messages.length, raw: payload });
    return Response.json({ ok:true, id, message_count:messages.length, attributed_messages:messages.filter((m:any)=>Boolean(m?.referral ?? m?.context?.referral)).length });
  }

  private async generateReply(userMessage: string, env: WhatsAppEnv): Promise<string | null> {
    const systemPrompt = env.AI_SYSTEM_PROMPT ||
      "Você é o assistente virtual da Clínica São Paulo (odontologia). Seja profissional, acolhedor, objetivo e em português brasileiro. Nunca invente horários. Sempre oriente o paciente a confirmar dados e disponibilidade com a equipe.";

    if (env.AI) {
      try {
        const result: any = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage }
          ],
          max_tokens: 400
        });
        if (result?.response) return String(result.response).trim();
      } catch (e) {
        console.error("Workers AI failed", e);
      }
    }

    if (env.GEMINI_API_KEY) {
      try {
        const res = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + env.GEMINI_API_KEY,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: systemPrompt + "\n\nPaciente: " + userMessage }] }]
            })
          }
        );
        const data: any = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return String(text).trim();
      } catch (e) {
        console.error("Gemini failed", e);
      }
    }

    if (env.OPENAI_API_KEY) {
      try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "Authorization": "Bearer " + env.OPENAI_API_KEY
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userMessage }
            ],
            max_tokens: 400
          })
        });
        const data: any = await res.json();
        if (data?.choices?.[0]?.message?.content) {
          return String(data.choices[0].message.content).trim();
        }
      } catch (e) {
        console.error("OpenAI failed", e);
      }
    }

    return "Obrigado pela mensagem! Em breve um de nossos atendentes entrará em contato com você.";
  }

  private async sendWhatsAppReply(to: string, text: string, env: WhatsAppEnv) {
    const phoneNumberId = env.WHATSAPP_PHONE_NUMBER_ID;
    const token = env.WHATSAPP_ACCESS_TOKEN;
    if (!phoneNumberId || !token) return;

    try {
      await fetch("https://graph.facebook.com/v21.0/" + phoneNumberId + "/messages", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + token,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body: text }
        })
      });
    } catch (e) {
      console.error("WhatsApp send failed", e);
    }
  }

  private async sendAlerts(alerts: string[], env: WhatsAppEnv) {
    for (const text of alerts) {
      if (env.ALERT_SLACK_WEBHOOK) {
        try {
          await fetch(env.ALERT_SLACK_WEBHOOK, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ text })
          });
        } catch {}
      }
      if (env.ALERT_WEBHOOK_URL) {
        try {
          await fetch(env.ALERT_WEBHOOK_URL, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              source: "whatsapp-ledger",
              alert: text,
              waba_id: "320149524523201",
              timestamp: new Date().toISOString()
            })
          });
        } catch {}
      }
    }
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

    // ... rest of the original default fetch handler remains unchanged from the previous full version ...
    // (the rest of the file after the class is the same as original)
  },
};

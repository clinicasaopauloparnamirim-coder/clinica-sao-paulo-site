import { routeAgentRequest } from "agents";
import { env, DurableObject } from "cloudflare:workers";
import { createMcpAgent } from "@cloudflare/playwright-mcp";
import { ControlAgent } from "./control-agent";
import { GoogleOAuthStore, googleGa4Audit, googleGa4Cleanup, googleOAuthCallback, googleOAuthStart } from "./google-ga4";
import { googleGscAudit } from "./google-gsc";
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
        google_oauth_configured: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
      }), {
        status: 200,
        headers: { "content-type": "application/json; charset=UTF-8", "cache-control": "no-store" },
      });
    }

    if (pathname === "/control/auth-check") {
      if (!authorized(request, env)) return unauthorized();
      return Response.json({ ok: true, authenticated: true }, { headers: { "cache-control": "no-store" } });
    }

    if (pathname === "/control") {
      const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Control Tower — Clínica São Paulo</title>
<style>
:root{color-scheme:dark;font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif}
body{margin:0;background:#080b10;color:#eef2f7;min-height:100vh;display:grid;place-items:center}
main{width:min(920px,92vw);background:#111722;border:1px solid #273142;border-radius:20px;padding:28px;box-shadow:0 20px 70px #0008}
h1{margin:0 0 6px;font-size:28px}.sub{color:#9aa6b5;margin-bottom:24px}
label{display:block;font-size:13px;color:#aeb8c6;margin:0 0 7px}
input{box-sizing:border-box;width:100%;padding:13px 14px;border-radius:10px;border:1px solid #344154;background:#0b1018;color:#fff;font:inherit}
.row{display:flex;gap:10px;flex-wrap:wrap;margin:16px 0}
button{border:0;border-radius:10px;padding:11px 15px;background:#e9eef5;color:#10151d;font-weight:700;cursor:pointer}
button.secondary{background:#263243;color:#e9eef5}button:disabled{opacity:.5;cursor:not-allowed}
pre{margin:18px 0 0;background:#070a0f;border:1px solid #202a38;border-radius:12px;padding:16px;min-height:180px;overflow:auto;white-space:pre-wrap;word-break:break-word}
.ok{color:#72e6a2}.warn{color:#ffd166;font-size:12px;margin-top:12px}
</style>
</head>
<body>
<main>
<h1>Control Tower</h1>
<div class="sub">Clínica São Paulo · acesso seguro aos endpoints administrativos</div>
<label for="token">MCP Auth Token</label>
<input id="token" type="password" autocomplete="off" spellcheck="false" placeholder="Cole o token aqui — ele não será salvo">
<div class="row">
<button onclick="login()">Entrar</button>
<button onclick="run('/health',false)">Health</button>
<button onclick="run('/google/ads/auth-check')">Google Ads Auth</button>
<button onclick="run('/google/ads/audit')">Auditar Google Ads</button>
<button onclick="run('/google/ga4/audit')">Auditar GA4</button>
<button onclick="run('/google/gsc/audit')">Auditar GSC</button>
<button class="secondary" onclick="document.getElementById('out').textContent=''">Limpar</button>
</div>
<div class="warn">O token fica apenas na memória desta página e é enviado somente ao endpoint do Control Tower. Não o salve no navegador nem compartilhe esta tela em computador público.</div>
<pre id="out">Pronto. Cole o MCP Auth Token e toque em Entrar.</pre>
<script>
async function login(){
  const token=document.getElementById('token').value;
  const out=document.getElementById('out');
  if(!token){out.textContent='Digite o MCP Auth Token.';return}
  out.textContent='Validando acesso...';
  try{
    const res=await fetch('/control/auth-check',{headers:{'Authorization':'Bearer '+token},cache:'no-store'});
    const body=await res.text();
    if(res.status===401){out.textContent='Acesso negado: token inválido.';return}
    out.textContent='✓ Acesso autorizado. Control Tower liberado.\\n\\nAgora você pode usar os módulos abaixo.';
  }catch(e){out.textContent='Falha de conexão: '+e.message}
}
document.getElementById('token').addEventListener('keydown',e=>{if(e.key==='Enter')login()});
async function run(path,auth=true){
  const out=document.getElementById('out');
  const token=document.getElementById('token').value;
  if(auth&&!token){out.textContent='Cole o MCP Auth Token primeiro.';return}
  out.textContent='Consultando '+path+'...';
  try{
    const headers=auth?{'Authorization':'Bearer '+token}:{};
    const res=await fetch(path,{headers,cache:'no-store'});
    const text=await res.text();
    let body; try{body=JSON.stringify(JSON.parse(text),null,2)}catch{body=text}
    out.textContent='HTTP '+res.status+'\n\n'+body;
  }catch(e){out.textContent='Falha de conexão: '+e.message}
}
</script>
</main>
</body>
</html>`;
      return new Response(html, {
        status: 200,
        headers: {
          "content-type": "text/html; charset=UTF-8",
          "cache-control": "no-store",
          "x-content-type-options": "nosniff",
        },
      });
    }

    if (pathname === "/control/agents") {
      if (!authorized(request, env)) return unauthorized();
      return Response.json({ ok: true, ...specialistSnapshot() }, {
        headers: { "cache-control": "no-store" },
      });
    }

    if (pathname === "/google/ads/oauth/start") {
      return googleAdsOAuthStart(request, env);
    }

    if (pathname === "/google/ads/oauth/callback") {
      return googleAdsOAuthCallback(request, env);
    }

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
        if (!Array.isArray(body.operations)) {
          return new Response("Invalid batch mutation payload.", { status: 400 });
        }
        const result = await googleAdsBatchMutate(
          env,
          body.operations,
          body.validateOnly !== false,
          body.confirm === true
        );
        return Response.json(result, { headers: { "cache-control": "no-store" } });
      } catch (error) {
        return new Response(
          error instanceof Error ? error.message : "Google Ads batch mutation failed",
          { status: 400 }
        );
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
      return googleOAuthStart(request, env);
    }

    if (pathname === "/google/oauth/callback") {
      return googleOAuthCallback(request, env);
    }

    if (pathname === "/google/ga4/cleanup" && request.method === "POST") {
      if (!authorized(request, env)) return unauthorized();
      let body: { confirm?: boolean } = {};
      try {
        body = await request.json();
      } catch {
        return new Response("Explicit confirmation required.", {
          status: 400,
          headers: { "content-type": "text/plain; charset=UTF-8", "cache-control": "no-store" },
        });
      }
      if (body.confirm !== true) {
        return new Response("Explicit confirmation required: send {confirm:true}.", {
          status: 400,
          headers: { "content-type": "text/plain; charset=UTF-8", "cache-control": "no-store" },
        });
      }
      try {
        return await googleGa4Cleanup(env);
      } catch (error) {
        return new Response(error instanceof Error ? error.message : "GA4 cleanup failed", {
          status: 502,
          headers: { "content-type": "text/plain; charset=UTF-8", "cache-control": "no-store" },
        });
      }
    }

    if (pathname === "/google/ga4/audit") {
      if (!authorized(request, env)) return unauthorized();
      try {
        return await googleGa4Audit(env);
      } catch (error) {
        return new Response(error instanceof Error ? error.message : "GA4 audit failed", {
          status: 502,
          headers: { "content-type": "text/plain; charset=UTF-8", "cache-control": "no-store" },
        });
      }
    }

    if (pathname === "/google/gsc/audit") {
      if (!authorized(request, env)) return unauthorized();
      try {
        return await googleGscAudit(env);
      } catch (error) {
        return new Response(error instanceof Error ? error.message : "Search Console audit failed", {
          status: 502,
          headers: { "content-type": "text/plain; charset=UTF-8", "cache-control": "no-store" },
        });
      }
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

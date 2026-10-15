import { DurableObject } from "cloudflare:workers";

// analytics.edit is required by the protected GA4 key-event cleanup endpoint.
const GOOGLE_SCOPE = "https://www.googleapis.com/auth/analytics.edit https://www.googleapis.com/auth/webmasters.readonly https://www.googleapis.com/auth/business.manage https://www.googleapis.com/auth/userinfo.email";
const EXPECTED_GOOGLE_ACCOUNT = "clinicasaopauloparnamirim@gmail.com";

type GoogleEnv = {
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GA4_OAUTH_SETUP_TOKEN?: string;
  GOOGLE_OAUTH_STORE: DurableObjectNamespace;
};

export class GoogleOAuthStore extends DurableObject {
  async fetch(request: Request) {
    const url = new URL(request.url);
    if (request.method === "POST" && url.pathname === "/state") {
      const body = await request.json() as { state?: string; setup?: boolean };
      if (!body.state) return new Response("Bad Request", { status: 400 });
      await this.ctx.storage.put(`oauth_state:${body.state}`, { value: body.state, setup: body.setup === true, expires: Date.now() + 10 * 60_000 });
      return new Response("OK");
    }
    if (request.method === "POST" && url.pathname === "/setup-complete") {
      await this.ctx.storage.put("ga4_setup_complete", true);
      return new Response("OK");
    }
    if (request.method === "GET" && url.pathname === "/setup-complete") {
      return Response.json({ complete: (await this.ctx.storage.get<boolean>("ga4_setup_complete")) === true });
    }
    if (request.method === "POST" && (url.pathname === "/token" || url.pathname === "/ads-token")) {
      const body = await request.json() as { refresh_token?: string };
      if (!body.refresh_token) return new Response("Bad Request", { status: 400 });
      await this.ctx.storage.put(url.pathname === "/ads-token" ? "ads_refresh_token" : "refresh_token", body.refresh_token);
      return new Response("OK");
    }
    if (request.method === "GET" && url.pathname === "/state") {
      const stateKey = url.searchParams.get("state");
      if (!stateKey) return Response.json(null);
      const saved = await this.ctx.storage.get<{ value: string; expires: number }>(`oauth_state:${stateKey}`);
      return Response.json(saved ?? null);
    }
    if (request.method === "DELETE" && url.pathname === "/state") {
      const stateKey = url.searchParams.get("state");
      if (!stateKey) return new Response("Bad Request", { status: 400 });
      await this.ctx.storage.delete(`oauth_state:${stateKey}`);
      return new Response("OK");
    }
    if (request.method === "GET" && (url.pathname === "/token" || url.pathname === "/ads-token")) {
      const token = await this.ctx.storage.get<string>(url.pathname === "/ads-token" ? "ads_refresh_token" : "refresh_token");
      return Response.json({ configured: Boolean(token) }, {
        headers: { "cache-control": "no-store" },
      });
    }
    if (request.method === "GET" && url.pathname === "/ads-refresh-token") {
      const token = await this.ctx.storage.get<string>("ads_refresh_token");
      return token ? new Response(token, { headers: { "cache-control": "no-store" } }) : new Response("Not Found", { status: 404 });
    }
    if (request.method === "POST" && url.pathname === "/access-token") {
      const body = await request.json() as { client_id?: string; client_secret?: string };
      if (!body.client_id || !body.client_secret) {
        return new Response("Bad Request", { status: 400 });
      }
      const refreshToken = await this.ctx.storage.get<string>("refresh_token");
      if (!refreshToken) {
        return new Response("Google Analytics is not authorized yet.", { status: 401 });
      }
      const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: body.client_id,
          client_secret: body.client_secret,
          refresh_token: refreshToken,
          grant_type: "refresh_token",
        }),
      });
      if (!response.ok) {
        return new Response("Google token refresh failed.", { status: 502 });
      }
      const token = await response.json() as { access_token?: string; expires_in?: number };
      if (!token.access_token) {
        return new Response("Google did not return an access token.", { status: 502 });
      }
      return Response.json(
        { access_token: token.access_token, expires_in: token.expires_in ?? null },
        { headers: { "cache-control": "no-store" } },
      );
    }
    return new Response("Not Found", { status: 404 });
  }
}

function store(env: GoogleEnv) {
  return env.GOOGLE_OAUTH_STORE.get(env.GOOGLE_OAUTH_STORE.idFromName("google"));
}

async function exchangeCode(env: GoogleEnv, code: string, redirectUri: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID!,
      client_secret: env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!response.ok) throw new Error(`Google token exchange failed: ${response.status}`);
  return await response.json() as { access_token?: string; refresh_token?: string };
}

export async function googleAccessToken(env: GoogleEnv) {
  const response = await store(env).fetch("https://store.internal/access-token", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
    }),
  });
  if (!response.ok) {
    throw new Error(`Google token refresh failed: ${response.status}`);
  }
  const token = await response.json() as { access_token?: string };
  if (!token.access_token) throw new Error("Google did not return an access token.");
  return token.access_token;
}

export async function googleOAuthStart(request: Request, env: GoogleEnv, setup = false) {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    return new Response("Google OAuth client is not configured.", { status: 503 });
  }
  if (setup) {
    const completionResponse = await store(env).fetch("https://store.internal/setup-complete");
    const completion = await completionResponse.json() as { complete?: boolean };
    if (completion.complete) return new Response("Este link de configuração já foi utilizado.", { status: 410 });
  }
  const state = crypto.randomUUID();
  await store(env).fetch("https://store.internal/state", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ state, setup }),
  });
  const redirectUri = new URL("/google/oauth/callback", request.url).toString();
  const auth = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  auth.searchParams.set("client_id", env.GOOGLE_CLIENT_ID);
  auth.searchParams.set("redirect_uri", redirectUri);
  auth.searchParams.set("response_type", "code");
  auth.searchParams.set("scope", GOOGLE_SCOPE);
  auth.searchParams.set("access_type", "offline");
  auth.searchParams.set("prompt", "consent");
  auth.searchParams.set("state", state);
  auth.searchParams.set("login_hint", EXPECTED_GOOGLE_ACCOUNT);
  return new Response(null, {
    status: 302,
    headers: { location: auth.toString(), "cache-control": "no-store", "referrer-policy": "no-referrer" },
  });
}

export async function googleOAuthCallback(request: Request, env: GoogleEnv) {
  const url = new URL(request.url);
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  if (!state || !code) return new Response("Missing OAuth response.", { status: 400 });

  const stateResponse = await store(env).fetch(`https://store.internal/state?state=${encodeURIComponent(state)}`);
  const saved = await stateResponse.json() as { value?: string; setup?: boolean; expires?: number } | null;
  if (!saved || saved.value !== state || !saved.expires || saved.expires < Date.now()) {
    return new Response("Invalid or expired OAuth state.", { status: 400 });
  }
  await store(env).fetch(`https://store.internal/state?state=${encodeURIComponent(state)}`, { method: "DELETE" });

  const redirectUri = new URL("/google/oauth/callback", request.url).toString();
  if (saved.setup) {
    const completionResponse = await store(env).fetch("https://store.internal/setup-complete");
    const completion = await completionResponse.json() as { complete?: boolean };
    if (completion.complete) return new Response("Este link de configuração já foi utilizado.", { status: 410 });
  }

  const tokens = await exchangeCode(env, code, redirectUri);
  if (!tokens.access_token) return new Response("Google did not return an access token.", { status: 502 });
  const profileResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { authorization: `Bearer ${tokens.access_token}` },
  });
  if (!profileResponse.ok) return new Response("Não foi possível validar a conta Google autorizada.", { status: 502 });
  const profile = await profileResponse.json() as { email?: string; verified_email?: boolean };
  if (profile.email?.toLowerCase() !== EXPECTED_GOOGLE_ACCOUNT || profile.verified_email === false) {
    return new Response("Conta Google recusada. Autorize com clinicasaopauloparnamirim@gmail.com.", { status: 403 });
  }
  if (!tokens.refresh_token) return new Response("Google did not return a refresh token. Revoke the previous grant and authorize again.", { status: 400 });

  // Verify the newly issued access token against this GA4 property before replacing the stored refresh token.
  const validationResponse = await fetch("https://analyticsadmin.googleapis.com/v1beta/properties/552216899/keyEvents", {
    headers: { authorization: `Bearer ${tokens.access_token}` },
  });
  if (!validationResponse.ok) {
    return Response.json({
      ok: false,
      authorized_account: profile.email,
      validation_status: validationResponse.status,
      refresh_token_preserved: true,
      next: "The new grant cannot read the target GA4 property. The previous refresh token was preserved; verify GA4 permissions and consent again.",
    }, { status: 502, headers: { "cache-control": "no-store" } });
  }

  if (saved.setup) {
    try {
      const cleanup = await googleGa4CleanupWithAccessToken(tokens.access_token);
      if (cleanup.failures.length > 0) {
        return Response.json({
          ok: false,
          authorized_account: profile.email,
          cleanup,
          refresh_token_preserved: true,
          next: "Some key-event changes failed. The previous refresh token was preserved; correct permissions and retry before marking setup complete.",
        }, { status: 502, headers: { "cache-control": "no-store" } });
      }
      await store(env).fetch("https://store.internal/token", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ refresh_token: tokens.refresh_token }),
      });
      await store(env).fetch("https://store.internal/setup-complete", { method: "POST" });
      return Response.json({
        ok: true,
        authorized_account: profile.email,
        cleanup,
        refresh_token_rotated: true,
        next: "GA4 cleanup completed. Close this tab.",
      }, { status: 200, headers: { "cache-control": "no-store" } });
    } catch (error) {
      return Response.json({
        ok: false,
        authorized_account: profile.email,
        refresh_token_preserved: true,
        cleanup_error: error instanceof Error ? error.message : "GA4 cleanup failed",
        next: "The new authorization was not saved because cleanup failed. The previous refresh token remains in place.",
      }, { status: 502, headers: { "cache-control": "no-store" } });
    }
  }

  // For the regular OAuth path, only persist the new grant after the GA4 access check above succeeds.
  await store(env).fetch("https://store.internal/token", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ refresh_token: tokens.refresh_token }),
  });
  return new Response("Google Analytics + Search Console autorizados. Você pode fechar esta página.", {
    status: 200,
    headers: { "content-type": "text/plain; charset=UTF-8", "cache-control": "no-store" },
  });
}

async function googleGa4CleanupWithAccessToken(token: string) {
  const listResponse = await fetch("https://analyticsadmin.googleapis.com/v1beta/properties/552216899/keyEvents", {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!listResponse.ok) throw new Error(`GA4 Admin API list failed: ${listResponse.status}`);
  const data = await listResponse.json() as { keyEvents?: Array<{ name?: string; eventName?: string }> };
  const targets = new Set(["page_view", "session_start", "first_visit", "user_engagement", "generate_lead"]);
  const candidates = (data.keyEvents ?? []).filter((event) => targets.has(event.eventName ?? ""));
  const deleted: string[] = [];
  const failures: Array<{ event: string; status: number }> = [];

  for (const event of candidates) {
    if (!event.name) continue;
    const response = await fetch(`https://analyticsadmin.googleapis.com/v1beta/${event.name}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${token}` },
    });
    if (response.ok || response.status === 204) deleted.push(event.eventName!);
    else failures.push({ event: event.eventName!, status: response.status });
  }

  return {
    property: "properties/552216899",
    requested: [...targets],
    found: candidates.map((event) => event.eventName),
    deleted,
    failures,
    untouched: "clique_whatsapp, qualify_lead, close_convert_lead and Google Ads conversion were preserved. generate_lead was removed because current Zaraz config emits it on a WhatsApp click.",
  };
}

export async function googleGa4Cleanup(env: GoogleEnv) {
  const token = await googleAccessToken(env);
  try {
    return Response.json(await googleGa4CleanupWithAccessToken(token), {
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    throw error;
  }
}
export async function googleGa4Audit(env: GoogleEnv) {
  const token = await googleAccessToken(env);

  const summaryResponse = await fetch("https://analyticsadmin.googleapis.com/v1beta/accountSummaries", {
    headers: { authorization: `Bearer ${token}` },
  });
  const summaryRaw = await summaryResponse.text();
  let summaries: unknown = null;
  try { summaries = summaryRaw ? JSON.parse(summaryRaw) : null; } catch { summaries = { raw: summaryRaw }; }

  const propertyId = "552216899";
  const response = await fetch(`https://analyticsadmin.googleapis.com/v1beta/properties/${propertyId}/keyEvents`, {
    headers: { authorization: `Bearer ${token}` },
  });
  const raw = await response.text();
  let data: { keyEvents?: Array<{ name?: string; eventName?: string; countingMethod?: string }> } = {};
  try { data = raw ? JSON.parse(raw) : {}; } catch { data = {}; }

  if (!response.ok) {
    return Response.json({
      ok: false,
      property: `properties/${propertyId}`,
      status: response.status,
      error: data,
      accountSummaries: summaries,
      note: "Token works only if the authorized Google account is Admin/Editor on this GA4 property. Enable Analytics Admin API on the GCP project if needed.",
    }, { status: 200, headers: { "cache-control": "no-store" } });
  }

  return Response.json({
    ok: true,
    property: `properties/${propertyId}`,
    keyEvents: data.keyEvents ?? [],
    accountSummaries: summaries,
    note: "Read-only audit endpoint. No GA4 setting is changed automatically.",
  }, { headers: { "cache-control": "no-store" } });
}

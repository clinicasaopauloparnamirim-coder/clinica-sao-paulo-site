const GOOGLE_SCOPE = "https://www.googleapis.com/auth/analytics.edit";

type GoogleEnv = {
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_OAUTH_STORE: DurableObjectNamespace;
};

export class GoogleOAuthStore extends DurableObject {
  async fetch(request: Request) {
    const url = new URL(request.url);
    if (request.method === "POST" && url.pathname === "/state") {
      const body = await request.json() as { state?: string };
      if (!body.state) return new Response("Bad Request", { status: 400 });
      await this.ctx.storage.put("oauth_state", { value: body.state, expires: Date.now() + 10 * 60_000 });
      return new Response("OK");
    }
    if (request.method === "POST" && url.pathname === "/token") {
      const body = await request.json() as { refresh_token?: string };
      if (!body.refresh_token) return new Response("Bad Request", { status: 400 });
      await this.ctx.storage.put("refresh_token", body.refresh_token);
      return new Response("OK");
    }
    if (request.method === "GET" && url.pathname === "/state") {
      const saved = await this.ctx.storage.get<{ value: string; expires: number }>("oauth_state");
      return Response.json(saved ?? null);
    }
    if (request.method === "GET" && url.pathname === "/token") {
      const token = await this.ctx.storage.get<string>("refresh_token");
      return Response.json({ configured: Boolean(token), refresh_token: token ?? null });
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

async function accessToken(env: GoogleEnv) {
  const saved = await store(env).fetch("https://store.internal/token");
  const data = await saved.json() as { configured?: boolean; refresh_token?: string };
  if (!data.refresh_token) throw new Error("Google Analytics is not authorized yet.");

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID!,
      client_secret: env.GOOGLE_CLIENT_SECRET!,
      refresh_token: data.refresh_token,
      grant_type: "refresh_token",
    }),
  });
  if (!response.ok) throw new Error(`Google token refresh failed: ${response.status}`);
  const token = await response.json() as { access_token?: string };
  if (!token.access_token) throw new Error("Google did not return an access token.");
  return token.access_token;
}

export async function googleOAuthStart(request: Request, env: GoogleEnv) {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    return new Response("Google OAuth client is not configured.", { status: 503 });
  }
  const state = crypto.randomUUID();
  await store(env).fetch("https://store.internal/state", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ state }),
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
  return Response.redirect(auth.toString(), 302);
}

export async function googleOAuthCallback(request: Request, env: GoogleEnv) {
  const url = new URL(request.url);
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  if (!state || !code) return new Response("Missing OAuth response.", { status: 400 });

  const stateResponse = await store(env).fetch("https://store.internal/state");
  const saved = await stateResponse.json() as { value?: string; expires?: number } | null;
  if (!saved || saved.value !== state || !saved.expires || saved.expires < Date.now()) {
    return new Response("Invalid or expired OAuth state.", { status: 400 });
  }

  const redirectUri = new URL("/google/oauth/callback", request.url).toString();
  const tokens = await exchangeCode(env, code, redirectUri);
  if (!tokens.refresh_token) return new Response("Google did not return a refresh token. Revoke the previous grant and authorize again.", { status: 400 });

  await store(env).fetch("https://store.internal/token", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ refresh_token: tokens.refresh_token }),
  });
  return new Response("Google Analytics autorizado. Você pode fechar esta página.", {
    status: 200,
    headers: { "content-type": "text/plain; charset=UTF-8", "cache-control": "no-store" },
  });
}

export async function googleGa4Cleanup(env: GoogleEnv) {
  const token = await accessToken(env);
  const listResponse = await fetch("https://analyticsadmin.googleapis.com/v1beta/properties/552216899/keyEvents", {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!listResponse.ok) throw new Error(`GA4 Admin API list failed: ${listResponse.status}`);
  const data = await listResponse.json() as { keyEvents?: Array<{ name?: string; eventName?: string }> };
  const targets = new Set(["page_view", "session_start", "first_visit", "user_engagement"]);
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

  return Response.json({
    property: "properties/552216899",
    requested: [...targets],
    found: candidates.map((event) => event.eventName),
    deleted,
    failures,
    untouched: "generate_lead and clique_whatsapp were not modified.",
  }, { headers: { "cache-control": "no-store" } });
}

export async function googleGa4Audit(env: GoogleEnv) {
  const token = await accessToken(env);
  const response = await fetch("https://analyticsadmin.googleapis.com/v1beta/properties/552216899/keyEvents", {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`GA4 Admin API failed: ${response.status}`);
  const data = await response.json() as { keyEvents?: Array<{ name?: string; eventName?: string; count?: string }> };
  return Response.json({
    property: "properties/552216899",
    keyEvents: data.keyEvents ?? [],
    note: "Read-only audit endpoint. No GA4 setting is changed automatically.",
  }, { headers: { "cache-control": "no-store" } });
}

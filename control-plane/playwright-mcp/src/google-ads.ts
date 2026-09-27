const GOOGLE_ADS_API = "https://googleads.googleapis.com/v25";
const DEFAULT_CUSTOMER_ID = "4603647788";

type GoogleAdsEnv = {
  GOOGLE_ADS_REFRESH_TOKEN?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_ADS_CUSTOMER_ID?: string;
  GOOGLE_ADS_LOGIN_CUSTOMER_ID?: string;
  GOOGLE_OAUTH_STORE: DurableObjectNamespace;
};

function oauthStore(env: GoogleAdsEnv) {
  return env.GOOGLE_OAUTH_STORE.get(env.GOOGLE_OAUTH_STORE.idFromName("google"));
}

async function refreshAccessToken(env: GoogleAdsEnv) {
  let refreshToken = env.GOOGLE_ADS_REFRESH_TOKEN || "";
  if (!refreshToken) {
    const response = await oauthStore(env).fetch("https://store.internal/ads-refresh-token");
    if (response.ok) refreshToken = await response.text();
  }
  if (!refreshToken || !env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    throw new Error("Google Ads OAuth is not configured.");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!response.ok) throw new Error(`Google Ads token refresh failed: ${response.status}`);
  const token = await response.json() as { access_token?: string };
  if (!token.access_token) throw new Error("Google did not return an Ads access token.");
  return token.access_token;
}

async function adsRequest(env: GoogleAdsEnv, path: string, body: unknown) {
  const customerId = (env.GOOGLE_ADS_CUSTOMER_ID || DEFAULT_CUSTOMER_ID).replace(/-/g, "");
  const accessToken = await refreshAccessToken(env);
  const headers: Record<string, string> = {
    authorization: `Bearer ${accessToken}`,
    "content-type": "application/json",
  };
  if (env.GOOGLE_ADS_LOGIN_CUSTOMER_ID) {
    headers["login-customer-id"] = env.GOOGLE_ADS_LOGIN_CUSTOMER_ID.replace(/-/g, "");
  }
  const response = await fetch(`${GOOGLE_ADS_API}/customers/${customerId}/${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const raw = await response.text();
  let data: unknown;
  try { data = raw ? JSON.parse(raw) : null; } catch { data = { raw }; }
  if (!response.ok) {
    throw new Error(`Google Ads API ${response.status}: ${JSON.stringify(data).slice(0, 2000)}`);
  }
  return data;
}

export async function googleAdsAuthCheck(env: GoogleAdsEnv) {
  return Response.json({
    ok: true,
    customer_id: (env.GOOGLE_ADS_CUSTOMER_ID || DEFAULT_CUSTOMER_ID).replace(/-/g, ""),
    result: await adsRequest(env, "googleAds:search", {
      query: "SELECT customer.id, customer.descriptive_name FROM customer LIMIT 1",
    }),
  }, { headers: { "cache-control": "no-store" } });
}

export async function googleAdsAudit(env: GoogleAdsEnv) {
  const queries = {
    campaigns: `SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type, campaign.bidding_strategy_type, campaign.optimization_score, campaign_budget.amount_micros, metrics.impressions, metrics.clicks, metrics.ctr, metrics.average_cpc, metrics.cost_micros, metrics.conversions, metrics.cost_per_conversion FROM campaign WHERE segments.date DURING LAST_30_DAYS AND campaign.status != 'REMOVED' ORDER BY metrics.cost_micros DESC`,
    keywords: `SELECT campaign.name, ad_group.name, ad_group_criterion.criterion_id, ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type, ad_group_criterion.status, ad_group_criterion.quality_info.quality_score, metrics.impressions, metrics.clicks, metrics.average_cpc, metrics.cost_micros, metrics.conversions FROM keyword_view WHERE segments.date DURING LAST_30_DAYS AND ad_group_criterion.status != 'REMOVED' ORDER BY metrics.cost_micros DESC LIMIT 500`,
    conversions: `SELECT conversion_action.id, conversion_action.name, conversion_action.status, conversion_action.type, conversion_action.category, conversion_action.primary_for_goal, conversion_action.counting_type FROM conversion_action WHERE conversion_action.status != 'REMOVED' ORDER BY conversion_action.name`,
  };
  const [campaigns, keywords, conversions] = await Promise.all([
    adsRequest(env, "googleAds:search", { query: queries.campaigns }),
    adsRequest(env, "googleAds:search", { query: queries.keywords }),
    adsRequest(env, "googleAds:search", { query: queries.conversions }),
  ]);
  return Response.json({ ok: true, campaigns, keywords, conversions }, {
    headers: { "cache-control": "no-store" },
  });
}

export async function googleAdsBatchMutate(env: GoogleAdsEnv, operations: unknown[], validateOnly = true, confirm = false) {
  if (!operations.length || operations.length > 100) throw new Error("Batch mutation must contain 1-100 operations.");
  if (!validateOnly && confirm !== true) throw new Error("Explicit confirmation required for live mutation.");
  // Google Ads API googleAds:mutate expects "mutateOperations", not "operations"
  return adsRequest(env, "googleAds:mutate", { mutateOperations: operations, validateOnly });
}

export async function googleAdsMutate(
  env: GoogleAdsEnv,
  resource: "campaignBudgets" | "campaigns" | "adGroups" | "adGroupCriteria" | "adGroupAds" | "campaignCriteria" | "userLists" | "remarketingActions",
  operations: unknown[],
  validateOnly = true,
  confirm = false,
) {
  if (!["campaignBudgets","campaigns","adGroups","adGroupCriteria","adGroupAds","campaignCriteria","userLists","remarketingActions"].includes(resource)) throw new Error(`Unsupported Google Ads resource: ${resource}`);
  if (!operations.length || operations.length > 100) throw new Error("Mutation must contain 1-100 operations.");
  if (!validateOnly && confirm !== true) throw new Error("Explicit confirmation required for live mutation.");
  return adsRequest(env, `${resource}:mutate`, { operations, validateOnly });
}

async function exchangeAdsCode(env: GoogleAdsEnv, code: string, redirectUri: string) {
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
  if (!response.ok) throw new Error(`Google Ads token exchange failed: ${response.status}`);
  return await response.json() as { refresh_token?: string };
}

export async function googleAdsOAuthStart(request: Request, env: GoogleAdsEnv) {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    return new Response("Google OAuth client is not configured.", { status: 503 });
  }
  const state = crypto.randomUUID();
  await oauthStore(env).fetch("https://store.internal/state", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ state }),
  });
  const redirectUri = new URL("/google/ads/oauth/callback", request.url).toString();
  const auth = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  auth.searchParams.set("client_id", env.GOOGLE_CLIENT_ID);
  auth.searchParams.set("redirect_uri", redirectUri);
  auth.searchParams.set("response_type", "code");
  auth.searchParams.set("scope", "https://www.googleapis.com/auth/adwords");
  auth.searchParams.set("access_type", "offline");
  auth.searchParams.set("prompt", "consent");
  auth.searchParams.set("state", state);
  return Response.redirect(auth.toString(), 302);
}

export async function googleAdsOAuthCallback(request: Request, env: GoogleAdsEnv) {
  const url = new URL(request.url);
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  if (!state || !code) return new Response("Missing OAuth response.", { status: 400 });

  const store = oauthStore(env);
  const stateResponse = await store.fetch(`https://store.internal/state?state=${encodeURIComponent(state)}`);
  const saved = await stateResponse.json() as { value?: string; expires?: number } | null;
  if (!saved || saved.value !== state || !saved.expires || saved.expires < Date.now()) {
    return new Response("Invalid or expired OAuth state.", { status: 400 });
  }
  await store.fetch(`https://store.internal/state?state=${encodeURIComponent(state)}`, { method: "DELETE" });

  const redirectUri = new URL("/google/ads/oauth/callback", request.url).toString();
  const tokens = await exchangeAdsCode(env, code, redirectUri);
  if (!tokens.refresh_token) {
    return new Response("Google did not return a refresh token.", { status: 400 });
  }
  await store.fetch("https://store.internal/ads-token", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ refresh_token: tokens.refresh_token }),
  });
  return new Response("Google Ads autorizado no Control Tower. Você pode fechar esta página.", {
    status: 200,
    headers: { "content-type": "text/plain; charset=UTF-8", "cache-control": "no-store" },
  });
}

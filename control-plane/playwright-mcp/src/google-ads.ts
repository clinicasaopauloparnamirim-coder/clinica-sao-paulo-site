const GOOGLE_ADS_SCOPE = "https://www.googleapis.com/auth/adwords";
const GOOGLE_ADS_API = "https://googleads.googleapis.com/v25";
const DEFAULT_CUSTOMER_ID = "4603647788";

type GoogleAdsEnv = {
  GOOGLE_ADS_REFRESH_TOKEN?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_ADS_CUSTOMER_ID?: string;
};

async function refreshAccessToken(env: GoogleAdsEnv) {
  if (!env.GOOGLE_ADS_REFRESH_TOKEN || !env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    throw new Error("Google Ads OAuth is not configured.");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      refresh_token: env.GOOGLE_ADS_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new Error(`Google Ads token refresh failed: ${response.status}`);
  }

  const token = await response.json() as { access_token?: string; expires_in?: number };
  if (!token.access_token) throw new Error("Google did not return an Ads access token.");
  return token.access_token;
}

async function searchStream(env: GoogleAdsEnv, query: string) {
  const customerId = (env.GOOGLE_ADS_CUSTOMER_ID || DEFAULT_CUSTOMER_ID).replace(/-/g, "");
  const accessToken = await refreshAccessToken(env);

  const response = await fetch(
    `${GOOGLE_ADS_API}/customers/${customerId}/googleAds:searchStream`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ query }),
    },
  );

  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Google Ads API failed: ${response.status} ${body.slice(0, 500)}`);
  }

  return JSON.parse(body);
}

export async function googleAdsMutate(env: GoogleAdsEnv, resource: string, operations: unknown[], validateOnly = true, confirm = false) {
  const allowed = new Set(["adGroups", "adGroupCriteria", "adGroupAds", "campaignCriteria"]);
  if (!allowed.has(resource)) throw new Error("Blocked resource. Budget, billing, campaign creation and payment mutations are intentionally unavailable.");
  if (!Array.isArray(operations) || operations.length === 0) throw new Error("At least one mutation operation is required.");
  if (!validateOnly && confirm !== true) throw new Error("Explicit confirmation required for a live Google Ads mutation.");
  return adsRequest(env, `${resource}:mutate`, { operations, validateOnly });
}

export async function googleAdsAudit(env: GoogleAdsEnv) {
  const query = [
    "SELECT",
    "  customer.id,",
    "  customer.descriptive_name,",
    "  campaign.id,",
    "  campaign.name,",
    "  campaign.status,",
    "  metrics.impressions,",
    "  metrics.clicks,",
    "  metrics.cost_micros,",
    "  metrics.conversions",
    "FROM campaign",
    "WHERE campaign.status != 'REMOVED'",
    "ORDER BY campaign.id",
  ].join("\n");

  const data = await searchStream(env, query);
  return Response.json({
    ok: true,
    customer_id: env.GOOGLE_ADS_CUSTOMER_ID || DEFAULT_CUSTOMER_ID,
    scope: GOOGLE_ADS_SCOPE,
    mode: "read_only",
    campaigns: data,
  }, { headers: { "cache-control": "no-store" } });
}

export async function googleAdsAuthCheck(env: GoogleAdsEnv) {
  const query = "SELECT customer.id, customer.descriptive_name FROM customer LIMIT 1";
  const data = await searchStream(env, query);
  return Response.json({
    ok: true,
    configured: true,
    customer_id: env.GOOGLE_ADS_CUSTOMER_ID || DEFAULT_CUSTOMER_ID,
    scope: GOOGLE_ADS_SCOPE,
    mode: "read_only",
    result: data,
  }, { headers: { "cache-control": "no-store" } });
}

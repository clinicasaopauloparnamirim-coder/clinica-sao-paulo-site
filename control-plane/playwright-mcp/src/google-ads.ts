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
  if (!response.ok) throw new Error(`Google Ads token refresh failed: ${response.status}`);
  const token = await response.json() as { access_token?: string };
  if (!token.access_token) throw new Error("Google did not return an Ads access token.");
  return token.access_token;
}

async function adsRequest(env: GoogleAdsEnv, path: string, body: unknown) {
  const customerId = (env.GOOGLE_ADS_CUSTOMER_ID || DEFAULT_CUSTOMER_ID).replace(/-/g, "");
  const accessToken = await refreshAccessToken(env);
  const response = await fetch(`${GOOGLE_ADS_API}/customers/${customerId}/${path}`, {
    method: "POST",
    headers: { authorization: `Bearer ${accessToken}`, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Google Ads API failed: ${response.status} ${text.slice(0, 1200)}`);
  return JSON.parse(text);
}

async function searchStream(env: GoogleAdsEnv, query: string) {
  return adsRequest(env, "googleAds:searchStream", { query });
}

export async function googleAdsAuthCheck(env: GoogleAdsEnv) {
  return Response.json({ ok: true, configured: true, result: await searchStream(env, "SELECT customer.id, customer.descriptive_name FROM customer LIMIT 1") }, { headers: { "cache-control": "no-store" } });
}

export async function googleAdsAudit(env: GoogleAdsEnv) {
  const query = "SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type, campaign_budget.amount_micros FROM campaign WHERE campaign.status != 'REMOVED' ORDER BY campaign.name";
  return Response.json({ ok: true, mode: "read_only", result: await searchStream(env, query) }, { headers: { "cache-control": "no-store" } });
}

export async function googleAdsMutate(env: GoogleAdsEnv, resource: string, operations: unknown[], validateOnly = true, confirm = false) {
  const allowed = new Set(["adGroups", "adGroupCriteria", "adGroupAds", "campaignCriteria"]);
  if (!allowed.has(resource)) throw new Error("Blocked resource. Budget, billing, campaign creation and payment mutations are intentionally unavailable.");
  if (!Array.isArray(operations) || operations.length === 0) throw new Error("At least one mutation operation is required.");
  if (!validateOnly && confirm !== true) throw new Error("Explicit confirmation required for a live Google Ads mutation.");
  return adsRequest(env, `${resource}:mutate`, { operations, validateOnly });
}

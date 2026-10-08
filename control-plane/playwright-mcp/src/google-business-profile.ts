
import { googleAccessToken } from "./google-ga4";

type BusinessEnv = {
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_OAUTH_STORE: DurableObjectNamespace;
};

const ACCOUNT_API = "https://mybusinessaccountmanagement.googleapis.com/v1/accounts";
const LOCATION_API = "https://mybusinessbusinessinformation.googleapis.com/v1";
const PERFORMANCE_API = "https://businessprofileperformance.googleapis.com/v1";

async function jsonGet(url: string, token: string) {
  const response = await fetch(url, { headers: { authorization: "Bearer " + token } });
  const body = await response.text();
  let data: any = null;
  try { data = JSON.parse(body); } catch {}
  if (!response.ok) {
    throw new Error("Google Business Profile API " + response.status + ": " + (data?.error?.message || body || "request failed"));
  }
  return data;
}

function dateParts(date: Date) {
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

export async function googleBusinessAudit(env: BusinessEnv, days = 28) {
  const token = await googleAccessToken(env);
  const accounts = await jsonGet(ACCOUNT_API, token);
  const allLocations: any[] = [];

  for (const account of accounts?.accounts ?? []) {
    const accountName = String(account?.name || "");
    if (!accountName) continue;
    const locations = await jsonGet(
      LOCATION_API + "/" + accountName + "/locations?readMask=name,title,storefrontAddress,phoneNumbers,websiteUri,metadata",
      token,
    );
    for (const location of locations?.locations ?? []) {
      allLocations.push({ account, location });
    }
  }

  const selected = allLocations.filter(({ location }) => {
    const title = String(location?.title || "").toLowerCase();
    const website = String(location?.websiteUri || "").toLowerCase();
    const phone = JSON.stringify(location?.phoneNumbers || "");
    return title.includes("clinica sao paulo") ||
      website.includes("clinicasaopauloparnamirim.com.br") ||
      phone.includes("5584998947669");
  });

  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - Math.max(1, Math.min(365, days)) * 86400000);
  const start = dateParts(startDate);
  const end = dateParts(endDate);
  const metrics = [
    "WEBSITE_CLICKS",
    "CALL_CLICKS",
    "BUSINESS_DIRECTION_REQUESTS",
    "BUSINESS_IMPRESSIONS_DESKTOP_MAPS",
    "BUSINESS_IMPRESSIONS_MOBILE_MAPS",
    "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH",
    "BUSINESS_IMPRESSIONS_MOBILE_SEARCH",
  ];

  const matched: any[] = [];
  for (const item of selected) {
    const locationName = String(item.location?.name || "");
    if (!locationName) continue;
    const params = new URLSearchParams();
    for (const metric of metrics) params.append("dailyMetrics", metric);
    params.set("daily_range.start_date.year", String(start.year));
    params.set("daily_range.start_date.month", String(start.month));
    params.set("daily_range.start_date.day", String(start.day));
    params.set("daily_range.end_date.year", String(end.year));
    params.set("daily_range.end_date.month", String(end.month));
    params.set("daily_range.end_date.day", String(end.day));

    try {
      const performance = await jsonGet(
        PERFORMANCE_API + "/" + locationName + ":fetchMultiDailyMetricsTimeSeries?" + params.toString(),
        token,
      );
      matched.push({ account: item.account, location: item.location, performance });
    } catch (error) {
      matched.push({
        account: item.account,
        location: item.location,
        performance_error: error instanceof Error ? error.message : "performance request failed",
      });
    }
  }

  return {
    ok: true,
    api: "Google Business Profile Performance API",
    range: { start, end },
    matched_locations: matched,
    total_accessible_locations: allLocations.length,
  };
}

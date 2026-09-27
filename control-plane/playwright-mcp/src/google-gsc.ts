/** Google Search Console integration for Control Tower */

type GoogleEnv = {
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_OAUTH_STORE: DurableObjectNamespace;
};

const SITE_CANDIDATES = [
  "https://www.clinicasaopauloparnamirim.com.br/",
  "https://clinicasaopauloparnamirim.com.br/",
  "sc-domain:clinicasaopauloparnamirim.com.br",
];

function store(env: GoogleEnv) {
  return env.GOOGLE_OAUTH_STORE.get(env.GOOGLE_OAUTH_STORE.idFromName("google"));
}

async function accessToken(env: GoogleEnv) {
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

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function last28Days() {
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - 3); // GSC data lag
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 27);
  return { startDate: isoDate(start), endDate: isoDate(end) };
}

async function listSites(token: string) {
  const response = await fetch("https://www.googleapis.com/webmasters/v3/sites", {
    headers: { authorization: `Bearer ${token}` },
  });
  const raw = await response.text();
  let data: { siteEntry?: Array<{ siteUrl?: string; permissionLevel?: string }> } = {};
  try { data = raw ? JSON.parse(raw) : {}; } catch { /* ignore */ }
  if (!response.ok) {
    return { ok: false as const, status: response.status, error: data, sites: [] as string[] };
  }
  const sites = (data.siteEntry ?? []).map((s) => s.siteUrl!).filter(Boolean);
  return { ok: true as const, status: response.status, sites, siteEntry: data.siteEntry ?? [] };
}

async function queryAnalytics(token: string, siteUrl: string, dimensions: string[], rowLimit = 25) {
  const range = last28Days();
  const response = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        startDate: range.startDate,
        endDate: range.endDate,
        dimensions,
        rowLimit,
        type: "web",
      }),
    },
  );
  const raw = await response.text();
  let data: { rows?: Array<{ keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number }> } = {};
  try { data = raw ? JSON.parse(raw) : {}; } catch { /* ignore */ }
  return {
    ok: response.ok,
    status: response.status,
    range,
    rows: data.rows ?? [],
    error: response.ok ? undefined : data,
  };
}

export async function googleGscAudit(env: GoogleEnv) {
  const token = await accessToken(env);
  const listed = await listSites(token);

  if (!listed.ok) {
    return Response.json({
      ok: false,
      step: "sites.list",
      status: listed.status,
      error: listed.error,
      note: "Authorize with webmasters.readonly scope and ensure Search Console API is enabled. User must be a verified owner/user of the site in GSC.",
    }, { status: 200, headers: { "cache-control": "no-store" } });
  }

  // Prefer an exact match from listed sites, else try candidates
  let siteUrl =
    listed.sites.find((s) => s.includes("clinicasaopauloparnamirim")) ||
    SITE_CANDIDATES.find((c) => listed.sites.includes(c)) ||
    listed.sites[0] ||
    SITE_CANDIDATES[0];

  const byQuery = await queryAnalytics(token, siteUrl, ["query"], 30);
  const byPage = await queryAnalytics(token, siteUrl, ["page"], 20);
  const byDevice = await queryAnalytics(token, siteUrl, ["device"], 10);

  // If chosen site fails, try other candidates once
  if (!byQuery.ok) {
    for (const candidate of SITE_CANDIDATES) {
      if (candidate === siteUrl) continue;
      const trial = await queryAnalytics(token, candidate, ["query"], 10);
      if (trial.ok) {
        siteUrl = candidate;
        const q = await queryAnalytics(token, siteUrl, ["query"], 30);
        const p = await queryAnalytics(token, siteUrl, ["page"], 20);
        const d = await queryAnalytics(token, siteUrl, ["device"], 10);
        return Response.json({
          ok: true,
          siteUrl,
          sites: listed.siteEntry,
          range: q.range,
          topQueries: q.rows,
          topPages: p.rows,
          byDevice: d.rows,
          note: "Search Console performance (web), last ~28 days ending 3 days ago.",
        }, { headers: { "cache-control": "no-store" } });
      }
    }
  }

  return Response.json({
    ok: byQuery.ok,
    siteUrl,
    sites: listed.siteEntry,
    range: byQuery.range,
    topQueries: byQuery.rows,
    topPages: byPage.rows,
    byDevice: byDevice.rows,
    error: byQuery.ok ? undefined : byQuery.error,
    note: "Search Console performance (web), last ~28 days ending 3 days ago.",
  }, { headers: { "cache-control": "no-store" } });
}

const GOOGLE_ADS_API = "https://googleads.googleapis.com/v25";
const DEFAULT_CUSTOMER_ID = "4603647788";
const ALTA_INTENCAO_CAMPAIGN_ID = "24289443969";

import { runAdsMutateJudgment } from "./judgment-gate";

type GoogleAdsEnv = {
  GOOGLE_ADS_REFRESH_TOKEN?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_ADS_CUSTOMER_ID?: string;
  GOOGLE_ADS_LOGIN_CUSTOMER_ID?: string;
  GOOGLE_OAUTH_STORE: DurableObjectNamespace;
  WHATSAPP_LEDGER?: DurableObjectNamespace;
  TYPESAFE_API_KEY?: string;
  LAYA_HTTP_URL?: string;
  JUDGMENT_REQUIRED?: string;
};

function oauthStore(env: GoogleAdsEnv) {
  return env.GOOGLE_OAUTH_STORE.get(env.GOOGLE_OAUTH_STORE.idFromName("google"));
}

async function refreshAccessToken(env: GoogleAdsEnv) {
  // The most recently consented token in Durable Object storage takes precedence over
  // a legacy environment token, which may have been revoked and caused invalid_grant.
  let refreshToken = "";
  const stored = await oauthStore(env).fetch("https://store.internal/ads-refresh-token");
  if (stored.ok) refreshToken = (await stored.text()).trim();
  if (!refreshToken) refreshToken = env.GOOGLE_ADS_REFRESH_TOKEN || "";
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
  if (!response.ok) {
    const rawError = await response.text();
    let oauthError = "unknown_oauth_error";
    let oauthDescription = "";
    try {
      const parsed = JSON.parse(rawError) as { error?: string; error_description?: string };
      oauthError = String(parsed.error || oauthError).slice(0, 100);
      oauthDescription = String(parsed.error_description || "").slice(0, 240);
    } catch {
      // Do not include the raw response body or credentials in the error.
    }
    throw new Error(`Google Ads token refresh failed: ${response.status} ${oauthError}${oauthDescription ? " — " + oauthDescription : ""}`);
  }
  const token = (await response.json()) as { access_token?: string };
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

async function validateDataManagerAccess(env: GoogleAdsEnv) {
  const customerId = (env.GOOGLE_ADS_CUSTOMER_ID || DEFAULT_CUSTOMER_ID).replace(/-/g, "");
  try {
    const accessToken = await refreshAccessToken(env);
    const response = await fetch("https://datamanager.googleapis.com/v1/events:ingest", {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        destinations: [{
          reference: "csp_whatsapp_sales",
          operatingAccount: { accountType: "GOOGLE_ADS", accountId: customerId },
          loginAccount: { accountType: "GOOGLE_ADS", accountId: customerId },
          productDestinationId: "7854498475",
        }],
        consent: {
          adUserData: "CONSENT_GRANTED",
          adPersonalization: "CONSENT_DENIED",
        },
        events: [{
          destinationReferences: ["csp_whatsapp_sales"],
          transactionId: `CSP-VALIDATION-ONLY-${crypto.randomUUID()}`,
          eventTimestamp: new Date().toISOString(),
          eventSource: "MESSAGE",
          conversionValue: 1,
          currency: "BRL",
          adIdentifiers: { gclid: "TEST-GCLID-NOT-REAL-VALIDATION-ONLY" },
        }],
        validateOnly: true,
      }),
    });
    const raw = await response.text();
    let parsed: any = null;
    try { parsed = raw ? JSON.parse(raw) : null; } catch { parsed = null; }
    const details = Array.isArray(parsed?.error?.details) ? parsed.error.details : [];
    const reason = details.find((item: any) => item?.reason)?.reason
      ?? details.find((item: any) => item?.["@type"]?.includes("ErrorInfo"))?.reason
      ?? null;
    return {
      ok: response.ok,
      status: response.status,
      validate_only: true,
      conversion_uploaded: false,
      reason,
      message: String(parsed?.error?.message ?? (response.ok ? "Data Manager accepted the validation-only request." : "Data Manager rejected the validation-only request.")).slice(0, 700),
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      validate_only: true,
      conversion_uploaded: false,
      reason: "TOKEN_OR_NETWORK_ERROR",
      message: String(error instanceof Error ? error.message : "Data Manager validation failed.").slice(0, 500),
    };
  }
}

export async function googleAdsAuthCheck(env: GoogleAdsEnv) {
  const result = await adsRequest(env, "googleAds:search", {
    query: "SELECT customer.id, customer.descriptive_name FROM customer LIMIT 1",
  });
  const dataManager = await validateDataManagerAccess(env);
  return Response.json({
    ok: true,
    customer_id: (env.GOOGLE_ADS_CUSTOMER_ID || DEFAULT_CUSTOMER_ID).replace(/-/g, ""),
    google_ads: { ok: true, result },
    data_manager: dataManager,
  });
}

function salesLedger(env: GoogleAdsEnv) {
  if (!env.WHATSAPP_LEDGER) throw new Error("Confirmed-sale ledger is not configured.");
  return env.WHATSAPP_LEDGER.get(env.WHATSAPP_LEDGER.idFromName("whatsapp"));
}

async function settleSale(
  env: GoogleAdsEnv,
  input: { transaction_id: string; claim_token: string; status: "submitted" | "failed" | "uncertain"; request_id?: string; provider_status?: number; error_reason?: string },
) {
  return await salesLedger(env).fetch("https://ledger.internal/crm/ads-sales/settle", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
}

/**
 * Submits a real, explicitly confirmed sale. The CRM contact must already be in
 * stage "patient", be attributed to Google Ads, and contain a first-party click
 * identifier. The transaction ID is idempotent, and consent must be confirmed.
 * This is the only code path that sets validateOnly=false.
 */
export async function googleAdsSubmitConfirmedSale(env: GoogleAdsEnv, request: Request) {
  let payload: any;
  try { payload = await request.json(); }
  catch { return Response.json({ ok: false, error: "INVALID_JSON" }, { status: 400 }); }

  const contactId = String(payload?.contact_id ?? "");
  const transactionId = String(payload?.transaction_id ?? "").trim();
  const currency = String(payload?.currency ?? "BRL").toUpperCase();
  const value = Number(payload?.conversion_value);
  const timestamp = String(payload?.event_timestamp ?? "");
  const adUserDataConsent = String(payload?.consent?.ad_user_data ?? "");
  const adPersonalizationConsent = String(payload?.consent?.ad_personalization ?? "CONSENT_DENIED");
  const legalBasisConfirmed = payload?.legal_basis_confirmed === true;

  if (!/^[A-Za-z0-9_-]{8,80}$/.test(contactId)) {
    return Response.json({ ok: false, error: "INVALID_CONTACT_ID" }, { status: 400 });
  }
  if (!/^[A-Za-z0-9_-]{6,80}$/.test(transactionId)) {
    return Response.json({ ok: false, error: "INVALID_TRANSACTION_ID" }, { status: 400 });
  }
  if (!Number.isFinite(value) || value <= 0 || value > 1_000_000) {
    return Response.json({ ok: false, error: "CONVERSION_VALUE_MUST_BE_POSITIVE_BRL" }, { status: 400 });
  }
  if (currency !== "BRL") {
    return Response.json({ ok: false, error: "ONLY_BRL_IS_CONFIGURED" }, { status: 400 });
  }
  const saleTime = new Date(timestamp);
  const now = Date.now();
  if (!timestamp || !Number.isFinite(saleTime.getTime()) ||
      saleTime.getTime() > now + 5 * 60_000 ||
      saleTime.getTime() < now - 90 * 24 * 60 * 60_000) {
    return Response.json({ ok: false, error: "SALE_TIMESTAMP_OUT_OF_RANGE" }, { status: 400 });
  }
  if (adUserDataConsent !== "CONSENT_GRANTED" || !legalBasisConfirmed) {
    return Response.json({ ok: false, error: "RECORDED_CONSENT_AND_LEGAL_BASIS_REQUIRED" }, { status: 403 });
  }
  if (adPersonalizationConsent !== "CONSENT_GRANTED" && adPersonalizationConsent !== "CONSENT_DENIED") {
    return Response.json({ ok: false, error: "INVALID_AD_PERSONALIZATION_CONSENT" }, { status: 400 });
  }

  const claimResponse = await salesLedger(env).fetch("https://ledger.internal/crm/ads-sales/claim", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contact_id: contactId,
      transaction_id: transactionId,
      conversion_value: Math.round(value * 100) / 100,
      currency: "BRL",
      event_timestamp: saleTime.toISOString(),
      ad_user_data_consent: adUserDataConsent,
      ad_personalization_consent: adPersonalizationConsent,
      legal_basis_confirmed: true,
    }),
  });
  const claim = await claimResponse.json().catch(() => null) as any;
  if (!claimResponse.ok || !claim?.ok || !claim?.claim_token) {
    return Response.json({
      ok: false,
      error: String(claim?.error ?? "SALE_CLAIM_FAILED"),
      sale: claim?.sale ?? undefined,
    }, { status: claimResponse.status || 502, headers: { "cache-control": "no-store" } });
  }

  const click = claim.contact?.ad_identifiers ?? {};
  const adIdentifiers: Record<string, string> = {};
  for (const key of ["gclid", "gbraid", "wbraid"] as const) {
    const value = typeof click[key] === "string" ? click[key].trim().slice(0, 250) : "";
    if (value) adIdentifiers[key] = value;
  }
  // The ledger independently enforces the source and identifier preconditions.
  if (!Object.keys(adIdentifiers).length) {
    await settleSale(env, { transaction_id: transactionId, claim_token: claim.claim_token, status: "failed", provider_status: 422, error_reason: "NO_CLICK_ID" });
    return Response.json({ ok: false, error: "NO_GOOGLE_CLICK_IDENTIFIER" }, { status: 422 });
  }

  const customerId = (env.GOOGLE_ADS_CUSTOMER_ID || DEFAULT_CUSTOMER_ID).replace(/-/g, "");
  const requestBody = {
    destinations: [{
      reference: "csp_whatsapp_sales",
      operatingAccount: { accountType: "GOOGLE_ADS", accountId: customerId },
      loginAccount: { accountType: "GOOGLE_ADS", accountId: customerId },
      productDestinationId: "7854498475",
    }],
    consent: {
      adUserData: "CONSENT_GRANTED",
      adPersonalization: adPersonalizationConsent,
    },
    events: [{
      destinationReferences: ["csp_whatsapp_sales"],
      transactionId,
      eventTimestamp: saleTime.toISOString(),
      eventSource: "MESSAGE",
      conversionValue: Math.round(value * 100) / 100,
      currency: "BRL",
      adIdentifiers,
    }],
    validateOnly: false,
  };

  try {
    const accessToken = await refreshAccessToken(env);
    const response = await fetch("https://datamanager.googleapis.com/v1/events:ingest", {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
    const raw = await response.text();
    let parsed: any = null;
    try { parsed = raw ? JSON.parse(raw) : null; } catch { parsed = null; }
    if (!response.ok) {
      const details = Array.isArray(parsed?.error?.details) ? parsed.error.details : [];
      const reason = details.find((item: any) => item?.reason)?.reason
        ?? details.find((item: any) => item?.["@type"]?.includes("ErrorInfo"))?.reason
        ?? "PROVIDER_REJECTED";
      const settled = await settleSale(env, {
        transaction_id: transactionId,
        claim_token: claim.claim_token,
        status: response.status >= 500 ? "uncertain" : "failed",
        provider_status: response.status,
        error_reason: String(reason).slice(0, 120),
      });
      if (!settled.ok) return Response.json({ ok: false, error: "SETTLEMENT_FAILED_AFTER_PROVIDER_RESPONSE" }, { status: 502 });
      return Response.json({
        ok: false,
        status: response.status >= 500 ? "uncertain" : "failed",
        provider_status: response.status,
        error: String(reason).slice(0, 120),
        message: String(parsed?.error?.message ?? "Data Manager rejected the sale event.").slice(0, 500),
        conversion_uploaded: false,
      }, { status: 502, headers: { "cache-control": "no-store" } });
    }

    const requestId = typeof parsed?.requestId === "string" ? parsed.requestId : "";
    if (!requestId) {
      await settleSale(env, {
        transaction_id: transactionId,
        claim_token: claim.claim_token,
        status: "uncertain",
        provider_status: response.status,
        error_reason: "MISSING_REQUEST_ID",
      });
      return Response.json({
        ok: false, status: "uncertain", provider_status: response.status,
        error: "DATA_MANAGER_RETURNED_NO_REQUEST_ID",
      }, { status: 502, headers: { "cache-control": "no-store" } });
    }

    const settled = await settleSale(env, {
      transaction_id: transactionId,
      claim_token: claim.claim_token,
      status: "submitted",
      request_id: requestId,
      provider_status: response.status,
    });
    if (!settled.ok) {
      // Provider accepted the request. Do not retry automatically if local settlement fails.
      return Response.json({
        ok: true, status: "submitted_but_local_status_unconfirmed",
        request_id: requestId, transaction_id: transactionId,
        warning: "Do not resend this transaction ID; verify provider status first.",
      }, { status: 202, headers: { "cache-control": "no-store" } });
    }
    return Response.json({
      ok: true,
      status: "submitted",
      request_id: requestId,
      transaction_id: transactionId,
      conversion_uploaded: true,
      note: "Accepted asynchronously by Data Manager; processing status is not yet final.",
    }, { status: 202, headers: { "cache-control": "no-store" } });
  } catch {
    // A network exception may occur after the provider received the request, so
    // mark it uncertain and block automatic resubmission to prevent duplicates.
    await settleSale(env, {
      transaction_id: transactionId,
      claim_token: claim.claim_token,
      status: "uncertain",
      provider_status: 0,
      error_reason: "NETWORK_OUTCOME_UNCERTAIN",
    }).catch(() => undefined);
    return Response.json({
      ok: false, status: "uncertain",
      error: "NETWORK_OUTCOME_UNCERTAIN",
      note: "Do not resubmit automatically; check request status before attempting again.",
    }, { status: 502, headers: { "cache-control": "no-store" } });
  }
}

export async function googleAdsConfirmedSaleStatus(env: GoogleAdsEnv, request: Request) {
  const url = new URL(request.url);
  const transactionId = url.searchParams.get("transaction_id") || "";
  if (!/^[A-Za-z0-9_-]{6,80}$/.test(transactionId)) {
    return Response.json({ ok: false, error: "INVALID_TRANSACTION_ID" }, { status: 400 });
  }
  const storedResponse = await salesLedger(env).fetch(
    "https://ledger.internal/crm/ads-sales/status?transaction_id=" + encodeURIComponent(transactionId),
  );
  const stored = await storedResponse.json().catch(() => null) as any;
  if (!storedResponse.ok || !stored?.sale) {
    return Response.json({ ok: false, error: "SALE_SUBMISSION_NOT_FOUND" }, { status: storedResponse.status || 404 });
  }
  const sale = stored.sale;
  const requestId = typeof sale.request_id === "string" ? sale.request_id : "";
  if (!requestId || !["submitted", "uncertain"].includes(String(sale.status))) {
    const { claim_token: _claimToken, ...safeSale } = sale;
    return Response.json({ ok: true, sale: safeSale }, { headers: { "cache-control": "no-store" } });
  }
  try {
    const accessToken = await refreshAccessToken(env);
    const response = await fetch(
      "https://datamanager.googleapis.com/v1/requestStatus:retrieve?requestId=" + encodeURIComponent(requestId),
      { method: "GET", headers: { authorization: `Bearer ${accessToken}`, accept: "application/json" } },
    );
    const body = await response.json().catch(() => null) as any;
    if (!response.ok) return Response.json({
      ok: false, sale_status: sale.status, provider_status: response.status,
      error: "DATA_MANAGER_STATUS_LOOKUP_FAILED",
    }, { status: 502, headers: { "cache-control": "no-store" } });
    const destinations = Array.isArray(body?.requestStatusPerDestination)
      ? body.requestStatusPerDestination.map((item: any) => ({
          status: item?.requestStatus ?? item?.request_status ?? "REQUEST_STATUS_UNKNOWN",
          error_info: item?.errorInfo ?? item?.error_info ?? null,
          warning_info: item?.warningInfo ?? item?.warning_info ?? null,
        }))
      : [];
    return Response.json({
      ok: true,
      transaction_id: transactionId,
      request_id: requestId,
      local_status: sale.status,
      request_status_per_destination: destinations,
    }, { headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json({ ok: false, error: "DATA_MANAGER_STATUS_LOOKUP_FAILED" }, { status: 502 });
  }
}

export async function googleAdsAudit(env: GoogleAdsEnv) {
  const queries = {
    campaigns: `SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type,
      campaign.bidding_strategy_type, campaign.optimization_score, campaign_budget.amount_micros,
      metrics.impressions, metrics.clicks, metrics.ctr, metrics.average_cpc, metrics.cost_micros,
      metrics.conversions, metrics.cost_per_conversion
      FROM campaign WHERE segments.date DURING LAST_30_DAYS
      AND campaign.status != 'REMOVED' AND campaign.id = 24289443969
      ORDER BY metrics.cost_micros DESC`,
    keywords: `SELECT campaign.name, ad_group.name, ad_group_criterion.criterion_id,
      ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type,
      ad_group_criterion.status, ad_group_criterion.quality_info.quality_score,
      metrics.impressions, metrics.clicks, metrics.average_cpc, metrics.cost_micros, metrics.conversions
      FROM keyword_view WHERE segments.date DURING LAST_30_DAYS
      AND ad_group_criterion.status != 'REMOVED' AND campaign.id = 24289443969
      ORDER BY metrics.cost_micros DESC LIMIT 500`,
    conversions: `SELECT conversion_action.id, conversion_action.name, conversion_action.status,
      conversion_action.type, conversion_action.category, conversion_action.primary_for_goal,
      conversion_action.counting_type FROM conversion_action
      WHERE conversion_action.status != 'REMOVED' ORDER BY conversion_action.name`,
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

/**
 * Read-only GAQL. It deliberately cannot mutate Google Ads.
 * For live changes, callers must use the gated mutate functions below.
 */
export async function googleAdsSearch(env: GoogleAdsEnv, query: string) {
  if (!query || query.trim().length < 10) throw new Error("Invalid GAQL query.");
  const normalized = query.trim().toLowerCase();
  if (normalized.includes("search-2")) {
    throw new Error("Search-2 is permanently retired and out of scope.");
  }
  if (normalized.includes(" mutate ") || normalized.includes(":mutate") ||
      normalized.startsWith("insert ") || normalized.startsWith("update ") ||
      normalized.startsWith("delete ")) {
    throw new Error("Only read-only GAQL is allowed.");
  }
  const campaignScoped = /from\s+(campaign|keyword_view|search_term_view)\b/i.test(query);
  if (campaignScoped &&
      !new RegExp("campaign\\.id\\s*=\\s*"+ALTA_INTENCAO_CAMPAIGN_ID+"\\b", "i").test(query)) {
    throw new Error("Campaign-scoped GAQL must explicitly target approved campaign "+ALTA_INTENCAO_CAMPAIGN_ID+" only.");
  }
  return adsRequest(env, "googleAds:search", { query });
}

type MutationResource =
  | "campaignBudgets" | "campaigns" | "adGroups" | "adGroupCriteria"
  | "adGroupAds" | "campaignCriteria" | "userLists" | "remarketingActions";

const MUTABLE_RESOURCES = new Set<MutationResource>([
  "campaignBudgets", "campaigns", "adGroups", "adGroupCriteria",
  "adGroupAds", "campaignCriteria", "userLists", "remarketingActions",
]);

export function containsCampaignId(value: unknown): string | undefined {
  const text = JSON.stringify(value ?? "");
  const match = text.match(/campaigns[\\/](\\d+)/);
  return match?.[1];
}

function assertMutationScope(resource: MutationResource, operations: unknown[]) {
  if (!MUTABLE_RESOURCES.has(resource)) throw new Error(`Unsupported Google Ads resource: ${resource}`);
  if (resource === "campaignBudgets") {
    throw new Error("campaignBudgets mutation is permanently blocked by Control Tower policy.");
  }
  const campaignId = containsCampaignId(operations);
  if (campaignId && campaignId !== ALTA_INTENCAO_CAMPAIGN_ID) {
    throw new Error(`Campaign ${campaignId} is outside the approved Control Tower scope.`);
  }
  if (!campaignId) {
    throw new Error("Live Ads mutation must identify the approved campaign resource.");
  }
}

export async function googleAdsBatchMutate(
  env: GoogleAdsEnv,
  operations: unknown[],
  validateOnly = true,
  confirm = false,
) {
  if (!Array.isArray(operations) || operations.length < 1 || operations.length > 100) {
    throw new Error("Batch mutation must contain 1-100 operations.");
  }
  if (!validateOnly) assertMutationScope("campaigns", operations);

  const gate = await runAdsMutateJudgment(env, {
    action: "ads_batch_mutate",
    campaignId: ALTA_INTENCAO_CAMPAIGN_ID,
    validateOnly,
    confirm,
  });
  if (gate.decision === "block") throw new Error(gate.reasons.join("; "));
  if (!validateOnly && !confirm) throw new Error("confirm:true is required for live Ads mutation.");

  return adsRequest(env, "googleAds:mutate", {
    mutateOperations: operations,
    validateOnly,
  });
}

export async function googleAdsMutate(
  env: GoogleAdsEnv,
  resource: MutationResource,
  operations: unknown[],
  validateOnly = true,
  confirm = false,
) {
  if (!Array.isArray(operations) || operations.length < 1 || operations.length > 100) {
    throw new Error("Mutation must contain 1-100 operations.");
  }
  if (!validateOnly) assertMutationScope(resource, operations);

  const gate = await runAdsMutateJudgment(env, {
    action: `ads_mutate:${resource}`,
    campaignId: ALTA_INTENCAO_CAMPAIGN_ID,
    validateOnly,
    confirm,
  });
  if (gate.decision === "block") throw new Error(gate.reasons.join("; "));
  if (!validateOnly && !confirm) throw new Error("confirm:true is required for live Ads mutation.");

  return adsRequest(env, `${resource}:mutate`, { operations, validateOnly });
}

const EXPECTED_GOOGLE_ADS_ACCOUNT = "clinicasaopauloparnamirim@gmail.com";

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
  return await response.json() as { refresh_token?: string; id_token?: string };
}

async function isExpectedGoogleAccount(idToken: string, clientId: string): Promise<boolean> {
  // Ask Google's tokeninfo endpoint to validate the signed ID token; never decode
  // an unverified JWT locally and never persist a token before checking its identity.
  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
    { headers: { accept: "application/json" } },
  );
  if (!response.ok) return false;
  const claims = await response.json() as {
    aud?: string;
    email?: string;
    email_verified?: string | boolean;
    iss?: string;
  };
  const verifiedEmail = claims.email_verified === true || claims.email_verified === "true";
  const issuerOk = claims.iss === "https://accounts.google.com" || claims.iss === "accounts.google.com";
  return claims.aud === clientId
    && claims.email?.toLowerCase() === EXPECTED_GOOGLE_ADS_ACCOUNT
    && verifiedEmail
    && issuerOk;
}

export async function googleAdsOAuthStart(request: Request, env: GoogleAdsEnv) {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    return new Response("Google OAuth client is not configured.", { status: 503 });
  }
  const state = crypto.randomUUID();
  await oauthStore(env).fetch("https://store.internal/state", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ state, ttl_ms: 30 * 60_000 }),
  });
  const redirectUri = new URL("/google/ads/oauth/callback", request.url).toString();
  const auth = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  auth.searchParams.set("client_id", env.GOOGLE_CLIENT_ID);
  auth.searchParams.set("redirect_uri", redirectUri);
  auth.searchParams.set("response_type", "code");
  auth.searchParams.set("scope", "openid email https://www.googleapis.com/auth/adwords https://www.googleapis.com/auth/datamanager");
  auth.searchParams.set("access_type", "offline");
  auth.searchParams.set("prompt", "consent");
  auth.searchParams.set("state", state);
  return Response.redirect(auth.toString(), 302);
}

// Mobile OAuth entry. The authorization start endpoint is public only for this
// flow; the callback below verifies Google-signed identity and the expected clinic
// account before persisting a refresh token. Every request still receives a fresh,
// server-persisted one-time OAuth state.
export async function googleAdsOAuthMobileStart(request: Request, env: GoogleAdsEnv) {
  return googleAdsOAuthStart(request, env);
}

export async function googleAdsOAuthCallback(request: Request, env: GoogleAdsEnv) {
  const url = new URL(request.url);
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  if (!state || !code) return new Response("Missing OAuth response.", { status: 400 });

  const stateResponse = await oauthStore(env).fetch(`https://store.internal/state?state=${encodeURIComponent(state)}`);
  const saved = stateResponse.ok
    ? await stateResponse.json() as { value?: string; expires?: number }
    : null;
  if (!saved || saved.value !== state || !saved.expires || saved.expires < Date.now()) {
    return new Response("Invalid or expired OAuth state.", { status: 400 });
  }
  await oauthStore(env).fetch(`https://store.internal/state?state=${encodeURIComponent(state)}`, { method: "DELETE" });

  const redirectUri = new URL("/google/ads/oauth/callback", request.url).toString();
  const tokens = await exchangeAdsCode(env, code, redirectUri);
  if (!tokens.refresh_token) return new Response("Google did not return a refresh token.", { status: 400 });
  if (!tokens.id_token || !env.GOOGLE_CLIENT_ID
      || !(await isExpectedGoogleAccount(tokens.id_token, env.GOOGLE_CLIENT_ID))) {
    return new Response(
      "Autorização não concluída: entre com a conta Google autorizada da Clínica São Paulo e tente novamente.",
      { status: 403, headers: { "content-type": "text/plain; charset=UTF-8", "cache-control": "no-store" } },
    );
  }

  await oauthStore(env).fetch("https://store.internal/ads-token", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ refresh_token: tokens.refresh_token }),
  });

  return new Response("Google Ads autorizado no Control Tower. Você pode fechar esta página.", {
    status: 200,
    headers: { "content-type": "text/plain; charset=UTF-8", "cache-control": "no-store" },
  });
}

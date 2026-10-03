/**
 * Judgment Bus — Laya (prefer) / Jev (fallback) / local rule fallback.
 * Fail-closed for live Ads mutates when judgment is required and provider errors.
 * No PII in state. Thresholds applied in code, not in the model prompt alone.
 */

export type GateDecision = "allow" | "confirm" | "block";

export type JudgmentInput = {
  action: string;
  campaignId?: string;
  scope?: string;
  validateOnly?: boolean;
  confirm?: boolean;
};

export type JudgmentResult = {
  decision: GateDecision;
  provider: "laya" | "jev" | "local_rules" | "skipped";
  reasons: string[];
  scores?: Record<string, number | string>;
};

type JudgmentEnv = {
  TYPESAFE_API_KEY?: string;
  LAYA_HTTP_URL?: string;
  JUDGMENT_REQUIRED?: string;
};

const ALTA_INTENCAO = "24289443969";

function localRules(input: JudgmentInput): JudgmentResult {
  const reasons: string[] = [];
  let decision: GateDecision = "allow";

  if (!input.validateOnly && input.confirm !== true) {
    decision = "block";
    reasons.push("confirm:true required for live mutate");
  }

  if (input.campaignId && input.campaignId !== ALTA_INTENCAO) {
    decision = "block";
    reasons.push(`campaign ${input.campaignId} out of scope (ALTA INTENCAO only)`);
  }

  if (input.action.toLowerCase().includes("search-2") || input.scope?.includes("Search-2")) {
    decision = "block";
    reasons.push("Search-2 is retired / out of scope");
  }

  if (decision === "allow" && !input.validateOnly) {
    decision = "confirm";
    reasons.push("live mutate always requires explicit human confirm path");
  }

  if (input.validateOnly) {
    decision = "allow";
    reasons.push("validateOnly simulation");
  }

  return { decision, provider: "local_rules", reasons };
}

async function callJev(env: JudgmentEnv, state: string): Promise<JudgmentResult | null> {
  if (!env.TYPESAFE_API_KEY) return null;
  try {
    const res = await fetch("https://api.typesafe.ai/v1/systemone", {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.TYPESAFE_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "jev-latest",
        state,
        questions: {
          decision: {
            type: "choice",
            instructions: "Gate for Google Ads Control Tower mutate",
            criteria: {
              allow: "Safe automated apply after validateOnly",
              confirm: "Human must confirm",
              block: "Must not run",
            },
          },
          is_mutate: {
            type: "noul",
            instructions: "This changes live Google Ads spend or structure",
          },
        },
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as any;
    const choice = String(data?.answers?.decision?.value || data?.decision || "confirm").toLowerCase();
    const decision: GateDecision =
      choice === "allow" || choice === "block" || choice === "confirm" ? choice : "confirm";
    return {
      decision,
      provider: "jev",
      reasons: ["jev systemone response"],
      scores: data?.answers || data,
    };
  } catch {
    return null;
  }
}

async function callLaya(env: JudgmentEnv, state: string): Promise<JudgmentResult | null> {
  if (!env.LAYA_HTTP_URL) return null;
  try {
    const res = await fetch(env.LAYA_HTTP_URL.replace(/\/$/, "") + "/decide", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        state,
        questions: {
          decision: {
            type: "choice",
            criteria: { allow: "safe", confirm: "human", block: "deny" },
          },
        },
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as any;
    const choice = String(data?.decision || data?.answers?.decision || "confirm").toLowerCase();
    const decision: GateDecision =
      choice === "allow" || choice === "block" || choice === "confirm" ? choice : "confirm";
    return { decision, provider: "laya", reasons: ["laya http response"], scores: data };
  } catch {
    return null;
  }
}

function merge(local: JudgmentResult, remote: JudgmentResult | null): JudgmentResult {
  if (!remote) return local;
  const rank = { block: 3, confirm: 2, allow: 1 } as const;
  const decision = rank[remote.decision] >= rank[local.decision] ? remote.decision : local.decision;
  return {
    decision,
    provider: remote.provider,
    reasons: [...local.reasons, ...remote.reasons],
    scores: remote.scores,
  };
}

/**
 * Run judgment before ads_mutate / ads_batch_mutate.
 * Local rules always run. Laya then Jev if configured.
 * If JUDGMENT_REQUIRED=true and both remotes fail on live mutate → block.
 */
export async function runAdsMutateJudgment(
  env: JudgmentEnv,
  input: JudgmentInput,
): Promise<JudgmentResult> {
  const local = localRules(input);
  if (local.decision === "block") return local;

  const state = [
    `action=${input.action}`,
    `campaign=${input.campaignId || ALTA_INTENCAO}`,
    `scope=${input.scope || "ALTA_INTENCAO"}`,
    `validateOnly=${Boolean(input.validateOnly)}`,
    `confirm=${Boolean(input.confirm)}`,
  ].join(" ");

  const laya = await callLaya(env, state);
  if (laya) return merge(local, laya);

  const jev = await callJev(env, state);
  if (jev) return merge(local, jev);

  const required = String(env.JUDGMENT_REQUIRED || "").toLowerCase() === "true";
  if (required && !input.validateOnly) {
    return {
      decision: "block",
      provider: "local_rules",
      reasons: [...local.reasons, "JUDGMENT_REQUIRED but Laya/Jev unavailable — fail-closed"],
    };
  }

  return local;
}

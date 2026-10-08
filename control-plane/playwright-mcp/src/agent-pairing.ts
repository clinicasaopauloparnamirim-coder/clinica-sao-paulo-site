export type PairId = "jev-glm" | "laya-llm";

export type PairEnv = {
  TYPESAFE_API_KEY?: string;
  LAYA_HTTP_URL?: string;
  FREELLMAPI_URL?: string;
  FREELLMAPI_API_KEY?: string;
  FREELLMAPI_MODEL?: string;
};

export type PairResult = {
  pair: PairId;
  ok: boolean;
  decision_provider?: "jev" | "laya";
  llm_provider?: "freellmapi";
  model?: string;
  decision?: string;
  text?: string;
  errors: string[];
};

function baseUrl(value: string) {
  return value.replace(/\/$/, "");
}

async function freeLlmChat(env: PairEnv, system: string, prompt: string) {
  if (!env.FREELLMAPI_URL || !env.FREELLMAPI_API_KEY) {
    throw new Error("FreeLLMAPI credentials not configured");
  }
  const model = env.FREELLMAPI_MODEL || "auto";
  const res = await fetch(baseUrl(env.FREELLMAPI_URL) + "/v1/chat/completions", {
    method: "POST",
    headers: {
      authorization: "Bearer " + env.FREELLMAPI_API_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
      temperature: 0.1,
      max_tokens: 1200,
    }),
  });
  const raw = await res.text();
  if (!res.ok) throw new Error("FreeLLMAPI " + res.status + ": " + raw.slice(0, 300));
  const data = JSON.parse(raw) as any;
  return {
    model: String(data?.model || model),
    text: String(data?.choices?.[0]?.message?.content || ""),
  };
}

async function jevDecision(env: PairEnv, state: string) {
  if (!env.TYPESAFE_API_KEY) throw new Error("JEV/TypeSafe credentials not configured");
  const res = await fetch("https://api.typesafe.ai/v1/systemone", {
    method: "POST",
    headers: {
      authorization: "Bearer " + env.TYPESAFE_API_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "jev-latest",
      state,
      questions: {
        decision: {
          type: "choice",
          instructions: "Choose the safest operational disposition.",
          criteria: {
            allow: "safe and evidenced",
            confirm: "human confirmation required",
            block: "unsafe, unsupported, or unverified",
          },
        },
      },
    }),
  });
  const raw = await res.text();
  if (!res.ok) throw new Error("JEV " + res.status + ": " + raw.slice(0, 300));
  const data = JSON.parse(raw) as any;
  return String(data?.answers?.decision?.value || data?.decision || "confirm").toLowerCase();
}

async function layaDecision(env: PairEnv, state: string) {
  if (!env.LAYA_HTTP_URL) throw new Error("Laya HTTP endpoint not configured");
  const res = await fetch(baseUrl(env.LAYA_HTTP_URL) + "/decide", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      state,
      questions: {
        decision: {
          type: "choice",
          instructions: "Choose the safest operational disposition.",
          criteria: { allow: "safe", confirm: "human", block: "deny" },
        },
      },
    }),
  });
  const raw = await res.text();
  if (!res.ok) throw new Error("Laya " + res.status + ": " + raw.slice(0, 300));
  const data = JSON.parse(raw) as any;
  return String(data?.answers?.decision?.value || data?.answers?.decision || data?.decision || "confirm").toLowerCase();
}

export async function runAgentPair(env: PairEnv, pair: PairId, state: string): Promise<PairResult> {
  const errors: string[] = [];
  try {
    if (pair === "jev-glm") {
      const decision = await jevDecision(env, state);
      const llm = await freeLlmChat(
        env,
        "Você é o parceiro de raciocínio do JEV. Não substitua o juiz. Analise somente as evidências fornecidas e a decisão recebida. Retorne uma recomendação curta e verificável.",
        "ESTADO:\n" + state + "\nDECISÃO JEV: " + decision,
      );
      return { pair, ok: true, decision_provider: "jev", llm_provider: "freellmapi", model: llm.model, decision, text: llm.text, errors };
    }

    const decision = await layaDecision(env, state);
    const llm = await freeLlmChat(
      env,
      "Você é o parceiro de raciocínio do Laya. Laya produz a decisão tipada; você interpreta, encontra riscos e explica a decisão sem alterá-la.",
      "ESTADO:\n" + state + "\nDECISÃO LAYA: " + decision,
    );
    return { pair, ok: true, decision_provider: "laya", llm_provider: "freellmapi", model: llm.model, decision, text: llm.text, errors };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
    return { pair, ok: false, errors };
  }
}

export function pairingSnapshot(env: PairEnv) {
  return {
    freellmapi: {
      configured: Boolean(env.FREELLMAPI_URL && env.FREELLMAPI_API_KEY),
      url_configured: Boolean(env.FREELLMAPI_URL),
      model: env.FREELLMAPI_MODEL || "auto",
    },
    jev_glm: {
      decision_engine_configured: Boolean(env.TYPESAFE_API_KEY),
      llm_partner: "FreeLLMAPI",
    },
    laya_llm: {
      decision_engine_configured: Boolean(env.LAYA_HTTP_URL),
      llm_partner: "FreeLLMAPI",
    },
    policy: "decision engine remains authoritative; LLM is analysis partner, never an execution authority",
  };
}

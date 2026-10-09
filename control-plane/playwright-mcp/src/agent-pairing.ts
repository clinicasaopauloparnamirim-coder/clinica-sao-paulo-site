export type PairId = "jev-nemotron" | "laya-llm";

export type PairEnv = {
  TYPESAFE_API_KEY?: string;
  LAYA_HTTP_URL?: string;
  LAYA_API_KEY?: string;
  control_tower?: string;
  NVIDIA_API_KEY?: string;
  NVIDIA_BASE_URL?: string;
  NVIDIA_MODEL?: string;
};

export type PairResult = {
  pair: PairId;
  ok: boolean;
  decision_provider?: "jev" | "laya";
  analysis_provider?: "nvidia-nim";
  model?: string;
  decision?: string;
  text?: string;
  errors: string[];
};

function baseUrl(value: string) {
  return value.replace(/\/$/, "");
}

async function nvidiaAnalysis(env: PairEnv, system: string, prompt: string) {
  if (!env.NVIDIA_API_KEY) {
    throw new Error("NVIDIA_API_KEY not configured; Nemotron analysis unavailable");
  }
  const endpoint = baseUrl(env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1");
  const model = env.NVIDIA_MODEL || "nvidia/nemotron-3.5-lightning-30b-a3b";
  const res = await fetch(endpoint + "/chat/completions", {
    method: "POST",
    headers: {
      authorization: "Bearer " + env.NVIDIA_API_KEY,
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
  if (!res.ok) throw new Error("NVIDIA NIM " + res.status + ": " + raw.slice(0, 300));
  const data = JSON.parse(raw) as any;
  const text = String(data?.choices?.[0]?.message?.content || "");
  if (!text) throw new Error("NVIDIA NIM returned an empty analysis");
  return { model: String(data?.model || model), text };
}

async function jevDecision(env: PairEnv, state: string) {
  if (!env.TYPESAFE_API_KEY) throw new Error("JEV/TypeSafe credentials not configured in Worker");
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
  return String(
    data?.answers?.decision?.choice ??
    data?.answers?.decision?.value ??
    data?.decision?.choice ??
    data?.decision?.value ??
    data?.decision ??
    "confirm",
  ).toLowerCase();
}

async function layaDecision(env: PairEnv, state: string) {
  const endpoint = baseUrl(env.LAYA_HTTP_URL || "https://api.laya-ai.com");
  const headers: Record<string, string> = { "content-type": "application/json" };
  const layaApiKey = env.LAYA_API_KEY || env.control_tower;
  if (layaApiKey) headers.authorization = "Bearer " + layaApiKey;
  const res = await fetch(endpoint + "/v1/systemone", {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: "laya",
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
  return String(
    data?.answers?.decision?.choice ??
    data?.answers?.decision?.value ??
    data?.decision?.choice ??
    data?.decision?.value ??
    data?.decision ??
    "confirm",
  ).toLowerCase();
}

export async function runAgentPair(env: PairEnv, pair: PairId, state: string): Promise<PairResult> {
  const errors: string[] = [];
  try {
    const isJev = pair === "jev-nemotron";
    const decision = isJev
      ? await jevDecision(env, state)
      : await layaDecision(env, state);
    const analysis = await nvidiaAnalysis(
      env,
      isJev
        ? "Você é o parceiro analítico do JEV no Control Tower. JEV é a autoridade de decisão. Não altere a decisão; analise as evidências fornecidas, identifique riscos e recomende verificações concretas."
        : "Você é o parceiro analítico do Laya no Control Tower. Laya é a autoridade de decisão. Não altere a decisão; analise as evidências fornecidas, identifique riscos e recomende verificações concretas.",
      "ESTADO:\n" + state + "\nDECISÃO " + (isJev ? "JEV" : "LAYA") + ": " + decision,
    );
    return {
      pair,
      ok: true,
      decision_provider: isJev ? "jev" : "laya",
      analysis_provider: "nvidia-nim",
      model: analysis.model,
      decision,
      text: analysis.text,
      errors,
    };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
    return { pair, ok: false, errors };
  }
}

export function pairingSnapshot(env: PairEnv) {
  return {
    nvidia_nim: {
      configured: Boolean(env.NVIDIA_API_KEY),
      model: env.NVIDIA_MODEL || "nvidia/nemotron-3.5-lightning-30b-a3b",
      role: "analysis partner; never overrides JEV/Laya decision",
    },
    jev_nemotron: {
      decision_engine_configured: Boolean(env.TYPESAFE_API_KEY),
      analysis_partner: "NVIDIA NIM / Nemotron",
    },
    laya_llm: {
      decision_engine_configured: Boolean(env.LAYA_API_KEY || env.control_tower),
      endpoint: env.LAYA_HTTP_URL || "https://api.laya-ai.com",
      api_key_configured: Boolean(env.LAYA_API_KEY || env.control_tower),
      analysis_partner: "NVIDIA NIM / Nemotron",
    },
    policy: "JEV/Laya remain authoritative decision engines; NVIDIA NIM analyzes evidence but never receives execution authority",
  };
}

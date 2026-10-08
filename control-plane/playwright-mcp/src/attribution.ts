
export interface AttributionEvent {
  event_type: "page_view" | "whatsapp_click" | "maps_click" | "phone_click" | "custom";
  event_id?: string;
  at?: string;
  session_id?: string;
  lead_token?: string;
  page?: string;
  referrer?: string;
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
  gclid?: string;
  fbclid?: string;
  user_agent?: string;
  link_location?: string;
  metadata?: Record<string, unknown>;
}

export interface AttributionEnv {
  WHATSAPP_LEDGER: DurableObjectNamespace;
  NVIDIA_API_KEY?: string;
  NVIDIA_BASE_URL?: string;
  INVESTIGATOR_MODEL?: string;
  LAYA_HTTP_URL?: string;
  LAYA_API_KEY?: string;
  CONTROL_TOWER?: string;
}

function ledger(env: AttributionEnv) {
  return env.WHATSAPP_LEDGER.get(env.WHATSAPP_LEDGER.idFromName("whatsapp"));
}

function clean(value: unknown, max = 500): string | undefined {
  if (typeof value !== "string") return undefined;
  const v = value.trim();
  return v ? v.slice(0, max) : undefined;
}

function normalizeEvent(input: any): AttributionEvent {
  const eventType = input?.event_type;
  return {
    event_type: eventType === "whatsapp_click" || eventType === "maps_click" ||
      eventType === "phone_click" || eventType === "custom" ? eventType : "page_view",
    event_id: clean(input?.event_id, 120),
    at: clean(input?.at, 40),
    session_id: clean(input?.session_id, 120),
    lead_token: clean(input?.lead_token, 40),
    page: clean(input?.page, 500),
    referrer: clean(input?.referrer, 1000),
    source: clean(input?.source, 100),
    medium: clean(input?.medium, 100),
    campaign: clean(input?.campaign, 200),
    term: clean(input?.term, 300),
    content: clean(input?.content, 300),
    gclid: clean(input?.gclid, 250),
    fbclid: clean(input?.fbclid, 250),
    user_agent: clean(input?.user_agent, 500),
    link_location: clean(input?.link_location, 120),
    metadata: input?.metadata && typeof input.metadata === "object" ? input.metadata : undefined,
  };
}

export async function trackAttributionEvent(env: AttributionEnv, request: Request) {
  let body: any;
  try { body = await request.json(); }
  catch { return new Response("Bad Request", { status: 400 }); }
  const event = normalizeEvent(body);
  event.at = event.at || new Date().toISOString();
  event.event_id = event.event_id || crypto.randomUUID();
  const response = await ledger(env).fetch("https://ledger.internal/track", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ kind: "attribution_event", event }),
  });
  if (!response.ok) return new Response("Attribution ledger failed", { status: 502 });
  return Response.json({ ok: true, event_id: event.event_id }, { headers: { "cache-control": "no-store" } });
}

export async function setContactStatus(env: AttributionEnv, phone: string, status: string, note?: string) {
  const normalized = phone.replace(/\D/g, "");
  if (!normalized || normalized.length < 8) throw new Error("Invalid phone.");
  const allowed = new Set(["unknown", "lead", "patient", "former_patient", "not_patient"]);
  if (!allowed.has(status)) throw new Error("Invalid status.");
  const response = await ledger(env).fetch("https://ledger.internal/contact", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      kind: "contact_status",
      phone: normalized,
      status,
      note: clean(note, 500),
      updated_at: new Date().toISOString(),
    }),
  });
  if (!response.ok) throw new Error("Could not store contact status.");
  return Response.json({ ok: true, phone: normalized, status }, { headers: { "cache-control": "no-store" } });
}

export async function getAttributionReport(env: AttributionEnv, start?: string, end?: string) {
  const q = new URLSearchParams({ mode: "report" });
  if (start) q.set("start", start);
  if (end) q.set("end", end);
  const response = await ledger(env).fetch("https://ledger.internal/report?" + q.toString());
  if (!response.ok) throw new Error("Attribution report failed.");
  return await response.json();
}

function systemPrompt() {
  return [
    "Você é a Laya, investigadora de atribuição comercial da Clínica São Paulo.",
    "Audite números; não aceite métricas de plataforma sem confronto com evidência.",
    "Reconstrua clique -> site -> WhatsApp/telefone/Maps -> conversa -> contato -> paciente.",
    "Separe conversões técnicas de leads reais.",
    "Nunca invente dados ausentes; marque como desconhecido.",
    "Procure duplicidade, contato recorrente, discrepância entre Google Ads e site/WhatsApp e vazamento de atribuição.",
    "A pergunta principal é: quais gastos geraram pessoas reais e quais não foram comprovados como paciente?",
  ].join("\n");
}

async function callLaya(env: AttributionEnv, report: unknown) {
  const key = env.LAYA_API_KEY || env.CONTROL_TOWER;
  const base = (env.LAYA_HTTP_URL || "").replace(/\/$/, "");
  if (!key || !base) return { status: "not_configured" };
  try {
    const response = await fetch(base + "/v1/systemone", {
      method: "POST",
      headers: { authorization: "Bearer " + key, "content-type": "application/json" },
      body: JSON.stringify({
        model: "laya",
        state: JSON.stringify(report),
        questions: {
          investigation: {
            type: "text",
            instructions: "Classifique os principais achados como confirmed, probable ou unverified e aponte o que precisa ser investigado a seguir.",
          },
        },
      }),
    });
    if (!response.ok) return { status: "error", http_status: response.status };
    return { status: "ok", data: await response.json() };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Laya request failed" };
  }
}

async function callGlm53(env: AttributionEnv, report: unknown, laya: unknown) {
  if (!env.NVIDIA_API_KEY) return { status: "not_configured" };
  const base = (env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1").replace(/\/$/, "");
  const model = env.INVESTIGATOR_MODEL || "z-ai/glm-5.3";
  const userPrompt = [
    "Faça uma auditoria forense da atribuição abaixo.",
    "Entregue: resumo diário, fontes, contatos únicos, contatos recorrentes, WhatsApp por dia, conversões técnicas versus leads reais, lacunas de rastreamento e próximos testes.",
    "Dê prioridade a evidência observável. Não transforme inferência em fato.",
    "",
    JSON.stringify({ report, laya }, null, 2),
  ].join("\n");
  try {
    const response = await fetch(base + "/chat/completions", {
      method: "POST",
      headers: { authorization: "Bearer " + env.NVIDIA_API_KEY, "content-type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt() },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.1,
        top_p: 1,
        max_tokens: 5000,
        stream: false,
      }),
    });
    if (!response.ok) return { status: "error", http_status: response.status };
    const data = await response.json() as any;
    return {
      status: "ok",
      model,
      answer: data?.choices?.[0]?.message?.content ?? null,
      usage: data?.usage ?? null,
    };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "GLM-5.3 request failed" };
  }
}

export async function investigateAttribution(env: AttributionEnv, start?: string, end?: string) {
  const report = await getAttributionReport(env, start, end);
  const laya = await callLaya(env, report);
  const glm53 = await callGlm53(env, report, laya);
  return {
    ok: true,
    investigator: {
      role: "Laya — attribution investigator",
      deep_analyst: "GLM-5.3",
    },
    range: { start: start ?? null, end: end ?? null },
    report,
    laya,
    glm53,
  };
}

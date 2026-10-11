// WhatsApp AI helpers for Clínica São Paulo
// Used by WhatsAppLedger Durable Object

export interface WhatsAppAIEnv {
  WHATSAPP_ACCESS_TOKEN?: string;
  WHATSAPP_PHONE_NUMBER_ID?: string;
  ALERT_SLACK_WEBHOOK?: string;
  ALERT_WEBHOOK_URL?: string;
  GEMINI_API_KEY?: string;
  OPENAI_API_KEY?: string;
  AI_SYSTEM_PROMPT?: string;
  AI?: any;
}

export async function generateReply(userMessage: string, env: WhatsAppAIEnv): Promise<string | null> {
  const systemPrompt = env.AI_SYSTEM_PROMPT ||
    "Você é o assistente virtual da Clínica São Paulo (odontologia). Seja profissional, acolhedor, objetivo e em português brasileiro. Nunca invente horários. Sempre oriente o paciente a confirmar dados e disponibilidade com a equipe.";

  // 1. Cloudflare Workers AI (preferido)
  if (env.AI) {
    try {
      const result: any = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ],
        max_tokens: 400
      });
      if (result?.response) return String(result.response).trim();
    } catch (e) {
      console.error("Workers AI failed", e);
    }
  }

  // 2. Fallback Gemini
  if (env.GEMINI_API_KEY) {
    try {
      const res = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + env.GEMINI_API_KEY,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: systemPrompt + "\n\nPaciente: " + userMessage }] }]
          })
        }
      );
      const data: any = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return String(text).trim();
    } catch (e) {
      console.error("Gemini failed", e);
    }
  }

  // 3. Fallback OpenAI
  if (env.OPENAI_API_KEY) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "Authorization": "Bearer " + env.OPENAI_API_KEY
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage }
          ],
          max_tokens: 400
        })
      });
      const data: any = await res.json();
      if (data?.choices?.[0]?.message?.content) {
        return String(data.choices[0].message.content).trim();
      }
    } catch (e) {
      console.error("OpenAI failed", e);
    }
  }

  return "Obrigado pela mensagem! Em breve um de nossos atendentes entrará em contato com você.";
}

export async function sendWhatsAppReply(to: string, text: string, env: WhatsAppAIEnv) {
  const phoneNumberId = env.WHATSAPP_PHONE_NUMBER_ID;
  const token = env.WHATSAPP_ACCESS_TOKEN;
  if (!phoneNumberId || !token) return;

  try {
    await fetch("https://graph.facebook.com/v21.0/" + phoneNumberId + "/messages", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text }
      })
    });
  } catch (e) {
    console.error("WhatsApp send failed", e);
  }
}

export async function sendAlerts(alerts: string[], env: WhatsAppAIEnv) {
  for (const text of alerts) {
    if (env.ALERT_SLACK_WEBHOOK) {
      try {
        await fetch(env.ALERT_SLACK_WEBHOOK, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ text })
        });
      } catch {}
    }
    if (env.ALERT_WEBHOOK_URL) {
      try {
        await fetch(env.ALERT_WEBHOOK_URL, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            source: "whatsapp-ledger",
            alert: text,
            waba_id: "320149524523201",
            timestamp: new Date().toISOString()
          })
        });
      } catch {}
    }
  }
}

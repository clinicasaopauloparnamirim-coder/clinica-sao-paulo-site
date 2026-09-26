const ALLOWED_ORIGINS = new Set([
  "https://clinicasaopauloparnamirim.com.br",
  "https://www.clinicasaopauloparnamirim.com.br",
]);

const MODEL = "@cf/zai-org/glm-4.7-flash";

function json(data, status = 200, origin = "") {
  const headers = {
    "content-type": "application/json; charset=UTF-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  };
  if (origin) {
    headers["access-control-allow-origin"] = origin;
    headers["access-control-allow-methods"] = "POST, OPTIONS";
    headers["access-control-allow-headers"] = "content-type";
    headers["vary"] = "Origin";
  }
  return new Response(JSON.stringify(data), { status, headers });
}

function toOpenAIChatCompletion(result) {
  if (result && Array.isArray(result.choices)) {
    return result;
  }

  const nativeToolCalls = Array.isArray(result?.tool_calls)
    ? result.tool_calls
    : [];

  const toolCalls = nativeToolCalls.map((call, index) => {
    const fn = call?.function || {};
    const name = fn.name || call?.name || "unknown";
    const rawArguments = fn.arguments ?? call?.arguments ?? {};
    const argumentsText =
      typeof rawArguments === "string"
        ? rawArguments
        : JSON.stringify(rawArguments);

    return {
      id: call?.id || `call_${index + 1}_${crypto.randomUUID()}`,
      type: "function",
      function: {
        name,
        arguments: argumentsText,
      },
    };
  });

  const hasToolCalls = toolCalls.length > 0;
  const message = {
    role: "assistant",
    content: result?.response ?? (hasToolCalls ? null : ""),
    ...(hasToolCalls ? { tool_calls: toolCalls } : {}),
  };

  return {
    id: `chatcmpl_${crypto.randomUUID()}`,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model: MODEL,
    choices: [
      {
        index: 0,
        message,
        finish_reason: hasToolCalls ? "tool_calls" : "stop",
      },
    ],
    ...(result?.usage ? { usage: result.usage } : {}),
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";

    if (url.pathname === "/api/page-agent/v1/chat/completions") {
      if (!ALLOWED_ORIGINS.has(origin)) {
        return json({ error: { message: "Origin not allowed." } }, 403);
      }

      if (request.method === "OPTIONS") {
        return json({}, 204, origin);
      }

      if (request.method !== "POST") {
        return json({ error: { message: "Method not allowed." } }, 405, origin);
      }

      const contentLength = Number(request.headers.get("Content-Length") || 0);
      if (contentLength > 350000) {
        return json({ error: { message: "Request too large." } }, 413, origin);
      }

      let body;
      try {
        body = await request.json();
      } catch {
        return json({ error: { message: "Invalid JSON." } }, 400, origin);
      }

      body.model = MODEL;
      body.stream = false;

      try {
        const result = await env.AI.run(MODEL, body);
        return json(toOpenAIChatCompletion(result), 200, origin);
      } catch (error) {
        console.error("Page Agent inference failed:", error?.message || error);
        return json(
          { error: { message: "AI service temporarily unavailable." } },
          503,
          origin,
        );
      }
    }

    if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
      const asset = await env.ASSETS.fetch(request);
      const type = asset.headers.get("content-type") || "";
      if (type.includes("text/html")) {
        return new HTMLRewriter()
          .on("body", {
            element(element) {
              element.append(
                '<script type="module" src="/page-agent-init.js" defer></script>',
                { html: true },
              );
            },
          })
          .transform(asset);
      }
      return asset;
    }

    const asset = await env.ASSETS.fetch(request);
    const pathname = url.pathname;
    const staticAsset = /\\.(?:css|js|mjs|png|jpe?g|webp|avif|gif|svg|ico|woff2?)$/i.test(pathname);
    if (!staticAsset) return asset;
    const headers = new Headers(asset.headers);
    headers.set("cache-control", "public, max-age=604800, s-maxage=2592000");
    return new Response(asset.body, { status: asset.status, statusText: asset.statusText, headers });
  },
};

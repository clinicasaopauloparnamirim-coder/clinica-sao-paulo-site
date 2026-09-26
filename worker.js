const STATIC_ASSET_RE = /\.(?:css|js|mjs|png|jpe?g|webp|avif|gif|svg|ico|woff2?)$/i;

function withSecurityHeaders(response) {
  const headers = new Headers(response.headers);
  headers.set("x-content-type-options", "nosniff");
  headers.set("x-frame-options", "SAMEORIGIN");
  headers.set("referrer-policy", "strict-origin-when-cross-origin");
  headers.set("permissions-policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
  if (new URL(response.url).protocol === "https:") {
    headers.set("strict-transport-security", "max-age=31536000; includeSubDomains");
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    const url = new URL(request.url);
    if (STATIC_ASSET_RE.test(url.pathname)) {
      const headers = new Headers(response.headers);
      headers.set("cache-control", "public, max-age=604800, s-maxage=2592000");
      return withSecurityHeaders(new Response(response.body, { status: response.status, statusText: response.statusText, headers }));
    }
    return withSecurityHeaders(response);
  },
};

import { routeAgentRequest } from "agents";
import { env } from "cloudflare:workers";
import { createMcpAgent } from "@cloudflare/playwright-mcp";
import { ControlAgent } from "./control-agent";

export { ControlAgent };

export const PlaywrightMCP = createMcpAgent(env.BROWSER);

function unauthorized() {
  return new Response("Unauthorized", {
    status: 401,
    headers: {
      "content-type": "text/plain; charset=UTF-8",
      "www-authenticate": "Bearer",
    },
  });
}

function authorized(request: Request, env: { MCP_AUTH_TOKEN?: string }) {
  const configured = env.MCP_AUTH_TOKEN;
  if (!configured) return false;
  const header = request.headers.get("Authorization") || "";
  return header === "Bearer " + configured;
}

export default {
  async fetch(request: Request, env: { MCP_AUTH_TOKEN?: string }, ctx: ExecutionContext) {
    const { pathname } = new URL(request.url);

    if (pathname === "/health") {
      return new Response(JSON.stringify({
        ok: true,
        service: "clinica-sao-paulo-playwright-mcp",
        control_agent: true,
        browser_binding: true,
        auth_configured: Boolean(env.MCP_AUTH_TOKEN),
      }), {
        status: 200,
        headers: { "content-type": "application/json; charset=UTF-8", "cache-control": "no-store" },
      });
    }

    const agentResponse = await routeAgentRequest(request, env);
    if (agentResponse) return agentResponse;

    if (pathname !== "/sse" && pathname !== "/sse/message" && pathname !== "/mcp") {
      return new Response("Not Found", { status: 404 });
    }

    if (!authorized(request, env)) return unauthorized();

    if (pathname === "/sse" || pathname === "/sse/message") {
      return PlaywrightMCP.serveSSE("/sse").fetch(request, env, ctx);
    }

    return PlaywrightMCP.serve("/mcp").fetch(request, env, ctx);
  },
};

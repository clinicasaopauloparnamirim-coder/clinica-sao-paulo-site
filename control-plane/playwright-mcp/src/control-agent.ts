import { Agent } from "agents";
import { generateText, stepCountIs } from "ai";
import { createWorkersAI } from "workers-ai-provider";

type ControlEnv = {
  AI: Ai;
  MCP_OBJECT: DurableObjectNamespace;
};

export type ControlAgentState = {
  status: "ready" | "degraded";
  version: 2;
  capabilities: string[];
  browser_mcp: "connected" | "disconnected";
  ai: "ready" | "error";
};

const READ_ONLY_BROWSER_TOOLS = new Set([
  "browser_navigate",
  "browser_snapshot",
  "browser_take_screenshot",
  "browser_console_messages",
  "browser_network_requests",
]);

function getReadOnlyTools(tools: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(tools).filter(([name]) =>
      [...READ_ONLY_BROWSER_TOOLS].some(
        (toolName) => name === toolName || name.endsWith("_" + toolName),
      ),
    ),
  );
}

export class ControlAgent extends Agent<ControlEnv, ControlAgentState> {
  initialState: ControlAgentState = {
    status: "ready",
    version: 2,
    capabilities: ["mcp", "browser-readonly", "workers-ai", "persistent-state"],
    browser_mcp: "disconnected",
    ai: "ready",
  };

  async onStart() {
    try {
      await this.addMcpServer("Playwright Browser", this.env.MCP_OBJECT, {
        id: "playwright-browser",
      });

      this.setState({
        ...this.state,
        status: "ready",
        browser_mcp: "connected",
      });
    } catch (error) {
      console.error("[ControlAgent] Playwright MCP connection failed:", error);
      this.setState({
        ...this.state,
        status: "degraded",
        browser_mcp: "disconnected",
      });
    }
  }

  async onRequest(request: Request) {
    const url = new URL(request.url);

    if (url.pathname.endsWith("/inspect") && request.method === "POST") {
      if (this.state.browser_mcp !== "connected") {
        return Response.json(
          { ok: false, error: "browser_mcp_disconnected" },
          { status: 503 },
        );
      }

      let body: { prompt?: string } = {};
      try {
        body = await request.json();
      } catch {
        return Response.json(
          { ok: false, error: "invalid_json" },
          { status: 400 },
        );
      }

      const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
      if (!prompt || prompt.length > 2000) {
        return Response.json(
          { ok: false, error: "prompt_required_or_too_long" },
          { status: 400 },
        );
      }

      try {
        const workersai = createWorkersAI({ binding: this.env.AI });
        const allTools = this.mcp.getAITools();
        const readOnlyTools = getReadOnlyTools(allTools);

        const result = await generateText({
          model: workersai("@cf/zai-org/glm-4.7-flash"),
          system:
            "Você é o ControlAgent da Clínica São Paulo. " +
            "Faça somente inspeção e leitura de páginas. " +
            "Você não pode clicar, digitar, enviar formulários, comprar, excluir, publicar, " +
            "alterar configurações ou executar ações com efeitos externos. " +
            "Não solicite senhas, tokens ou dados pessoais. " +
            "Responda em português do Brasil. " +
            "Use as ferramentas disponíveis somente quando forem necessárias.",
          prompt,
          tools: readOnlyTools,
          stopWhen: stepCountIs(6),
        });

        return Response.json({
          ok: true,
          agent: "ControlAgent",
          model: "@cf/zai-org/glm-4.7-flash",
          tools_available: Object.keys(readOnlyTools),
          text: result.text,
        });
      } catch (error) {
        console.error("[ControlAgent] AI inspection failed:", error);
        this.setState({ ...this.state, ai: "error" });
        return Response.json(
          { ok: false, error: "ai_inspection_failed" },
          { status: 500 },
        );
      }
    }

    return Response.json({
      ok: this.state.status === "ready" && this.state.browser_mcp === "connected",
      agent: "ControlAgent",
      state: this.state,
      mcp: {
        servers: this.getMcpServers().servers,
        tool_count: this.getMcpServers().tools.length,
        tools: this.getMcpServers().tools.map((tool) => tool.name),
      },
      readonly_tools: [...READ_ONLY_BROWSER_TOOLS],
    });
  }
}

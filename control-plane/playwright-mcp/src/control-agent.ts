import { Agent } from "agents";

type ControlEnv = {
  MCP_OBJECT: DurableObjectNamespace;
};

export type ControlAgentState = {
  status: "ready" | "degraded";
  version: 1;
  capabilities: string[];
  browser_mcp: "connected" | "disconnected";
};

export class ControlAgent extends Agent<ControlEnv, ControlAgentState> {
  initialState: ControlAgentState = {
    status: "ready",
    version: 1,
    capabilities: ["mcp", "browser", "persistent-state"],
    browser_mcp: "disconnected",
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

  async onRequest() {
    return Response.json({
      ok: this.state.status === "ready" && this.state.browser_mcp === "connected",
      agent: "ControlAgent",
      state: this.state,
      mcp: {
        servers: this.getMcpServers().servers,
        tool_count: this.getMcpServers().tools.length,
        tools: this.getMcpServers().tools.map((tool) => tool.name),
      },
    });
  }
}

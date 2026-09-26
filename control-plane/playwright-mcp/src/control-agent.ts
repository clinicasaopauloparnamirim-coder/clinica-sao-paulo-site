import { Agent } from "agents";

export type ControlAgentState = {
  status: "ready";
  version: 1;
  capabilities: string[];
};

export class ControlAgent extends Agent<Env, ControlAgentState> {
  initialState: ControlAgentState = {
    status: "ready",
    version: 1,
    capabilities: ["mcp", "browser", "persistent-state"],
  };

  async onRequest() {
    return Response.json({
      ok: true,
      agent: "ControlAgent",
      state: this.state,
    });
  }
}

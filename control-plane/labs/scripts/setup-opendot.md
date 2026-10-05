# Open-dot + OpenAI Agents + Composio

## Pré-requisitos (secrets — NÃO commit)

- OPENAI_API_KEY
- COMPOSIO_API_KEY (https://dashboard.composio.dev)

## Packages (npm)

```bash
npm install @composio/core @composio/openai-agents @openai/agents
```

Versions checked 2026-10-05: @composio/core@0.22.0, @openai/agents@0.19.0

## Minimal agent (read-only gate)

```ts
import { Composio } from "@composio/core";
import { OpenAIAgentsProvider } from "@composio/openai-agents";
import { Agent, run } from "@openai/agents";

const composio = new Composio({ provider: new OpenAIAgentsProvider() });
const session = await composio.create("clinica-lab-user");
const tools = await session.tools();
const agent = new Agent({
  name: "Clinica Lab",
  instructions: "Read-only. Use tools only when asked. No production mutations.",
  tools,
});
const result = await run(agent, "List connected toolkits only");
console.log(result.finalOutput);
```

## Open-dot UI

```bash
git clone https://github.com/composio-community/open-dot.git
cd open-dot && npm install
# .env.local with keys — never commit
npm run dev
```

## Gate

- approved: false até teste read-only passar
- Não conectar Search-2 / contas Ads de produção

export type ExternalAgentStatus = "integrated" | "requires-host-runtime" | "not-runtime-proven";

export type ExternalAgentDefinition = {
  id: "hermes" | "jev" | "laya" | "freellmapi";
  name: string;
  role: string;
  repository: string;
  integrationPath: string;
  status: ExternalAgentStatus;
  controlTowerRole: string;
  runtimeRequirement: string;
};

export const EXTERNAL_AGENTS: ExternalAgentDefinition[] = [
  {
    id: "hermes",
    name: "Hermes Agent",
    role: "Agente hospedeiro/autônomo para execução de tarefas, skills, ferramentas e sessões persistentes.",
    repository: "NousResearch/hermes-agent",
    integrationPath: "Hermes MCP/tool bridge -> Control Tower",
    status: "requires-host-runtime",
    controlTowerRole: "executor externo e camada de automação; não substitui o COMMANDER/Nemotron",
    runtimeRequirement: "Host Linux/macOS/WSL2 ou Android/Termux com Hermes instalado; Cloudflare Worker não executa o runtime Python local.",
  },
  {
    id: "jev",
    name: "Jev",
    role: "System 1 de decisões tipadas, usado para julgamento bounded e roteamento.",
    repository: "browser-use/jev-ultrafast / TypeSafe Jev backend",
    integrationPath: "Composio JEV connection -> Control Tower/Hermes decision path; optional direct TypeSafe API from Worker",
    status: "integrated",
    controlTowerRole: "camada de decisão/verificação antes de ações e parceiro do LLM no par JEV + GLM",
    runtimeRequirement: "A conexão JEV do Control Tower está ativa e já executou avaliações. O Worker, quando chamar TypeSafe diretamente, ainda requer TYPESAFE_API_KEY.",
  },
  {
    id: "laya",
    name: "Laya",
    role: "Modelo System 1 local de decisões tipadas, multilingual e sem geração de texto.",
    repository: "he-jev/laya",
    integrationPath: "Laya HTTP /v1/systemone -> Control Tower judgment gate",
    status: "requires-host-runtime",
    controlTowerRole: "decision engine rápido e parceiro do LLM no par Laya + LLM",
    runtimeRequirement: "LAYA_HTTP_URL apontando para um serviço Laya; LAYA_API_KEY é opcional conforme a configuração do servidor.",
  },
  {
    id: "freellmapi",
    name: "FreeLLMAPI",
    role: "Barramento OpenAI-compatible para modelos e fallback/routing de LLMs.",
    repository: "tashfeenahmed/freellmapi",
    integrationPath: "Control Tower -> /v1/chat/completions -> selected LLM",
    status: "requires-host-runtime",
    controlTowerRole: "infraestrutura de inferência; nunca recebe autoridade de execução",
    runtimeRequirement: "FREELLMAPI_URL + FREELLMAPI_API_KEY; o servidor FreeLLMAPI precisa estar acessível ao Worker.",
  },
];

export function externalAgentSnapshot() {
  return {
    count: EXTERNAL_AGENTS.length,
    agents: EXTERNAL_AGENTS,
    policy: {
      secretsInRepository: "blocked",
      externalRuntimeRequired: true,
      runtimeProof: "must-be-tested-on-host",
      pairing: {
        "jev-glm": "Jev decides; FreeLLMAPI-provided LLM analyzes",
        "laya-llm": "Laya decides; FreeLLMAPI-provided LLM analyzes",
      },
    },
  };
}

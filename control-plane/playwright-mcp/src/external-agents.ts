export type ExternalAgentStatus = "integrated" | "requires-host-runtime" | "not-runtime-proven";

export type ExternalAgentDefinition = {
  id: "hermes" | "jev" | "laya" | "nvidia-nim";
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
    integrationPath: "Composio JEV connection -> Control Tower decision path; optional direct TypeSafe API from Worker",
    status: "integrated",
    controlTowerRole: "autoridade de decisão/verificação antes de ações; NVIDIA NIM analisa sem substituir a decisão",
    runtimeRequirement: "A conexão JEV via Composio foi executada com sucesso. A rota direta no Worker ainda exige TYPESAFE_API_KEY.",
  },
  {
    id: "laya",
    name: "Laya",
    role: "Modelo System 1 de decisões tipadas, multilingual e sem geração de texto.",
    repository: "he-jev/laya",
    integrationPath: "Laya HTTP /v1/systemone -> Control Tower judgment gate; NVIDIA NIM analysis partner",
    status: "requires-host-runtime",
    controlTowerRole: "decision engine; NVIDIA NIM analisa riscos sem alterar a decisão tipada",
    runtimeRequirement: "LAYA_HTTP_URL apontando para um serviço Laya; LAYA_API_KEY é opcional conforme a configuração do servidor.",
  },
  {
    id: "nvidia-nim",
    name: "NVIDIA NIM / Nemotron",
    role: "Inferência e análise secundária no Control Tower.",
    repository: "NVIDIA Nemotron / NVIDIA NIM",
    integrationPath: "Control Tower -> NVIDIA NIM /chat/completions",
    status: "integrated",
    controlTowerRole: "COMMANDER e parceiro analítico de JEV/Laya; não recebe autoridade de execução",
    runtimeRequirement: "NVIDIA_API_KEY configurada no Worker; inferência específica do pareamento precisa ser validada pela rota protegida /pairs/test.",
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
        "jev-nemotron": "JEV decides; NVIDIA NIM / Nemotron analyzes",
        "laya-llm": "Laya decides; NVIDIA NIM / Nemotron analyzes",
      },
    },
  };
}

// Runtime note: deployment must pass CI before being treated as live.

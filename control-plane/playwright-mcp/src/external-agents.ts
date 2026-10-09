export type ExternalAgentStatus = "integrated" | "requires-host-runtime" | "not-runtime-proven" | "configured-unverified";

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
    repository: "malevrigns/agent-jev / TypeSafe hosted API",
    integrationPath: "Composio JEV connection -> Control Tower decision path; optional direct TypeSafe API from Worker",
    status: "not-runtime-proven",
    controlTowerRole: "candidato a autoridade de decisão/verificação antes de ações; NVIDIA NIM não deve substituir a decisão tipada",
    runtimeRequirement: "A chamada Jev via Composio falhou por ausência de conexão ativa nesta sessão, e o Worker reporta jev_configured=false. Requer credencial e inferência validada antes de uso como gate.",
  },
  {
    id: "laya",
    name: "Laya",
    role: "Modelo System 1 de decisões tipadas, multilingual e sem geração de texto.",
    repository: "NandhaKishorM/laya (open-source) / hosted API provider laya-ai.com",
    integrationPath: "Laya HTTP /v1/systemone -> Control Tower judgment gate; NVIDIA NIM analysis partner",
    status: "not-runtime-proven",
    controlTowerRole: "candidato a decision engine; NVIDIA NIM analisa riscos sem alterar a decisão tipada",
    runtimeRequirement: "O Worker reporta laya_configured=false. A API hospedada documenta https://api.laya-ai.com/v1/systemone e exige bearer key; alternativamente, é preciso hospedar laya-serve e provar uma inferência.",
  },
  {
    id: "nvidia-nim",
    name: "NVIDIA NIM / Nemotron",
    role: "Inferência e análise secundária no Control Tower.",
    repository: "NVIDIA Nemotron / NVIDIA NIM",
    integrationPath: "Control Tower -> NVIDIA NIM /chat/completions",
    status: "configured-unverified",
    controlTowerRole: "modelo de raciocínio para Commander e parceiro analítico de Jev/Laya; não recebe autoridade de execução",
    runtimeRequirement: "O Worker reporta a chave NIM configurada; falta um teste real de inferência que valide status HTTP, conteúdo de resposta e pareamento. Configuração não equivale a inferência comprovada.",
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

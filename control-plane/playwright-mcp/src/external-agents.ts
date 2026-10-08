export type ExternalAgentStatus = "integrated" | "requires-host-runtime" | "not-runtime-proven";

export type ExternalAgentDefinition = {
  id: "hermes" | "jev" | "laya";
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
    integrationPath: "Hermes plugin/MCP/tool bridge -> Control Tower",
    status: "requires-host-runtime",
    controlTowerRole: "executor externo e camada de automação; não substitui o COMMANDER/Nemotron",
    runtimeRequirement: "Host Linux/macOS/WSL2 ou Android/Termux com Hermes instalado; Cloudflare Worker não executa o runtime Python local.",
  },
  {
    id: "jev",
    name: "Jev",
    role: "System 1 de decisões tipadas, usado para julgamento bounded e roteamento.",
    repository: "ourines/hermes-jev / bojansandhaus/jev-decisions-hermes",
    integrationPath: "Hermes plugin -> Jev backend (TypeSafe/Cloudflare/OpenRouter) -> Control Tower decision gate",
    status: "requires-host-runtime",
    controlTowerRole: "camada de decisão/verificação antes de ações e como apoio ao JUDGE",
    runtimeRequirement: "Credencial/backend Jev configurado no host Hermes; nenhuma credencial será gravada no repositório.",
  },
  {
    id: "laya",
    name: "Laya",
    role: "Modelo System 1 local de decisões tipadas, multilingual e sem geração de texto.",
    repository: "he-jev/laya / pavlealeksic/laya-hermes",
    integrationPath: "Hermes plugin -> Laya local/torch (ou backend compatível) -> Control Tower decision gate",
    status: "requires-host-runtime",
    controlTowerRole: "fallback/local decision engine para reduzir dependência de APIs externas",
    runtimeRequirement: "Host com Python e recursos para carregar o checkpoint Laya; opcionalmente laya-serve para expor /v1/systemone.",
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
    },
  };
}

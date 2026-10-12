import { autonomousFunctionSnapshot } from "./autonomous-functions";
import { externalAgentSnapshot } from "./external-agents";
export type SpecialistId =
  | "orchestrator"
  | "google-ads"
  | "gbp"
  | "ga4"
  | "gsc-seo"
  | "cloudflare"
  | "github-deploy"
  | "whatsapp-leads";

export type SpecialistMode = "read" | "write";

export type SpecialistDefinition = {
  id: SpecialistId;
  name: string;
  mission: string;
  allowedModes: SpecialistMode[];
  financialActions: "blocked";
};

export type BrainId =
  | "control-tower"
  | "marketing-growth"
  | "engineering-security";

export type BrainReadiness = "partial" | "blocked" | "configured-unverified" | "registry-only";

export type BrainDefinition = {
  id: BrainId;
  name: string;
  mission: string;
  readiness: BrainReadiness;
  readinessReason: string;
  toolExecutionPath: "plan-only" | "worker-native" | "external-tool-runner" | "mixed" | "catalog-only";
  toolFamilies: string[];
  connectedToolSlugs: string[];
  plannedToolSlugs?: string[];
};

export type CapabilityStatus = "runtime-verified" | "partial" | "configured-unverified" | "design-only" | "blocked";

export type CapabilityDefinition = {
  id: number;
  name: string;
  brain: BrainId;
  mission: string;
  status: CapabilityStatus;
  evidence: string;
};

export const SPECIALISTS: SpecialistDefinition[] = [
  {
    id: "orchestrator",
    name: "Control Tower Orchestrator",
    mission: "Decompor tarefas, selecionar especialistas, consolidar evidências e bloquear ações fora da política.",
    allowedModes: ["read", "write"],
    financialActions: "blocked",
  },
  {
    id: "google-ads",
    name: "Google Ads Agent",
    mission: "Auditar e operar campanhas, grupos, anúncios, palavras-chave e negativas. Nunca alterar orçamento, pagamentos ou faturamento.",
    allowedModes: ["read", "write"],
    financialActions: "blocked",
  },
  {
    id: "gbp",
    name: "Google Business Profile Agent",
    mission: "Gerenciar e auditar o Perfil da Empresa, avaliações, posts, mídia e desempenho quando a API estiver habilitada.",
    allowedModes: ["read", "write"],
    financialActions: "blocked",
  },
  {
    id: "ga4",
    name: "GA4 Agent",
    mission: "Auditar eventos, conversões, aquisição e instrumentação sem apagar ou alterar dados destrutivamente sem confirmação explícita.",
    allowedModes: ["read", "write"],
    financialActions: "blocked",
  },
  {
    id: "gsc-seo",
    name: "GSC SEO Agent",
    mission: "Cruzar Search Console, SEO técnico, indexação, consultas e páginas com o restante do funil.",
    allowedModes: ["read", "write"],
    financialActions: "blocked",
  },
  {
    id: "cloudflare",
    name: "Cloudflare Agent",
    mission: "Auditar e operar Worker, configuração, observabilidade, cache e integrações mantendo foco no free tier.",
    allowedModes: ["read", "write"],
    financialActions: "blocked",
  },
  {
    id: "github-deploy",
    name: "GitHub Deploy Agent",
    mission: "Inspecionar código, criar branches, commits e PRs e acompanhar CI/CD sem expor secrets.",
    allowedModes: ["read", "write"],
    financialActions: "blocked",
  },
  {
    id: "whatsapp-leads",
    name: "WhatsApp & Leads Agent",
    mission: "Auditar atribuição, eventos, webhook, origem dos leads e funil WhatsApp.",
    allowedModes: ["read", "write"],
    financialActions: "blocked",
  },
];

export const BRAINS: BrainDefinition[] = [
  {
    id: "engineering-security",
    name: "CÉREBRO 1 — NVIDIA NEMOTRON | ANÁLISE, INVESTIGAÇÃO E VERIFICAÇÃO",
    readiness: "partial",
    toolExecutionPath: "mixed",
    readinessReason: "NVIDIA NIM só é operacional após chave rotacionada e inferência real confirmada. Engenharia e segurança também dependem de CI/CD e verificação das credenciais.",
    mission: "Analisar evidências, encontrar contradições, executar verificação independente e apoiar engenharia/segurança sem autoridade para contornar políticas.",
    toolFamilies: ["NVIDIA NIM/Nemotron", "Red Team/Judge", "GitHub", "Cloudflare Workers", "CI/CD", "Durable Objects", "Webhook Security", "Playwright MCP"],
    connectedToolSlugs: ["GITHUB_LIST_REPOSITORY_WORKFLOWS"],
    plannedToolSlugs: ["NVIDIA NIM — requer credencial nova e teste de inferência"],
  },
  {
    id: "control-tower",
    name: "CÉREBRO 2 — CHATGPT / OPENAI | COMANDO E ORQUESTRAÇÃO",
    readiness: "partial",
    toolExecutionPath: "mixed",
    readinessReason: "OpenAI é o provedor primário pretendido do ControlAgent; a disponibilidade real depende de OPENAI_API_KEY e de inferência validada. Workers AI é fallback e não deve ser apresentado como ChatGPT.",
    mission: "Decompor objetivos, coordenar especialistas, elaborar planos, registrar evidências e pedir verificação independente antes de aceitar conclusões.",
    toolFamilies: ["OpenAI API / ChatGPT", "Control Agent", "MCP", "Composio", "JEV", "LAYA", "Workers AI fallback", "Evidence Ledger", "GAUNTLET LOOP"],
    connectedToolSlugs: ["CUSTOM_CONTROL_TOWER_ADS_AUDIT", "CUSTOM_CONTROL_TOWER_GSC_AUDIT", "CUSTOM_CONTROL_TOWER_GA4_AUDIT"],
    plannedToolSlugs: ["OpenAI API — requer OPENAI_API_KEY e inferência validada"],
  },
  {
    id: "marketing-growth",
    name: "CÉREBRO 3 — MARKETINGGROWTH | SEO, MÍDIA E CONVERSÃO",
    readiness: "partial",
    toolExecutionPath: "external-tool-runner",
    readinessReason: "Leituras de Google Ads, GA4, Search Console, OpenSEO e Instagram foram comprovadas; atribuição completa até lead qualificado/agendamento e publicação automatizada ainda não estão comprovadas.",
    mission: "Aumentar aquisição local e conversão, unindo SEO, Perfil da Empresa, tráfego pago, Instagram, WhatsApp e mensuração.",
    toolFamilies: ["OpenSEO", "Google Ads", "GA4", "GSC", "Google Business Profile", "Instagram", "WhatsApp", "Ahrefs", "Semrush"],
    connectedToolSlugs: ["CUSTOM_OPENSEO_RUN_SITE_AUDIT", "CUSTOM_OPENSEO_GET_AUDIT_ISSUES", "CUSTOM_CONTROL_TOWER_ADS_AUDIT", "CUSTOM_CONTROL_TOWER_GSC_AUDIT", "CUSTOM_CONTROL_TOWER_GA4_AUDIT", "INSTAGRAM_GET_USER_INFO", "INSTAGRAM_GET_USER_INSIGHTS", "WHATSAPP_GET_PHONE_NUMBERS"],
  },
];

export const CAPABILITIES: CapabilityDefinition[] = [
  { id: 1, name: "Autonomous orchestration", brain: "control-tower", mission: "Decompor objetivo em um plano executável e selecionar especialistas.", status: "partial", evidence: "ControlAgent + specialist registry + NIM orchestration endpoint." },
  { id: 2, name: "Parallel specialist delegation", brain: "control-tower", mission: "Permitir que funções independentes sejam executadas em paralelo fora do Worker via tool runner.", status: "blocked", evidence: "Composio MULTI_EXECUTE_TOOL já disponível para até 50 ferramentas independentes." },
  { id: 3, name: "Long-context synthesis", brain: "control-tower", mission: "Consolidar grandes conjuntos de evidências antes de decidir.", status: "blocked", evidence: "Nemotron bloqueado até rotação da chave NVIDIA e confirmação explícita de NVIDIA_KEY_ROTATED=true." },
  { id: 4, name: "MCP/tool bridge", brain: "control-tower", mission: "Conectar o raciocínio do modelo às ferramentas externas por um cliente MCP.", status: "partial", evidence: "Playwright MCP conectado ao ControlAgent; Composio fornece a ponte externa." },
  { id: 5, name: "GAUNTLET LOOP", brain: "control-tower", mission: "Buscar, confrontar, testar, localizar falhas, classificar, registrar e repetir.", status: "design-only", evidence: "Loop definido como protocolo central e exposto como capability." },
  { id: 6, name: "Forensic auditing", brain: "control-tower", mission: "Procurar anomalias e inconsistências em sistemas de negócio.", status: "partial", evidence: "Control Tower Ads/GSC/GA4 + OpenSEO audit disponíveis." },
  { id: 7, name: "Contradiction detection", brain: "control-tower", mission: "Comparar fontes e rejeitar conclusões sustentadas por uma única fonte.", status: "design-only", evidence: "JUDGE + RED TEAM separados no registro para verificação cruzada." },
  { id: 8, name: "Red-team verification", brain: "control-tower", mission: "Tentar falsificar a própria conclusão antes de aceitá-la.", status: "design-only", evidence: "Brain dedicado e policy gate incorporados ao snapshot." },
  { id: 9, name: "Self-correction and fallback", brain: "control-tower", mission: "Rebaixar para um modelo alternativo quando o NIM falhar sem derrubar o serviço.", status: "blocked", evidence: "NIM desabilitado por segurança até a chave ser rotacionada; o caminho alternativo deve funcionar sem usar a chave antiga." },
  { id: 10, name: "Coding agent", brain: "engineering-security", mission: "Ler código, corrigir arquitetura e preparar mudanças verificáveis.", status: "partial", evidence: "GitHub tools + CI workflow existentes." },
  { id: 11, name: "CI/CD autopilot", brain: "engineering-security", mission: "Typecheck, deploy, smoke test e proteção de rotas.", status: "partial", evidence: "control-plane-deploy-v2.yml roda build, deploy, smoke e protected-route checks." },
  { id: 12, name: "Semantic SEO", brain: "marketing-growth", mission: "Cruzar intenção, palavras-chave, entidades, SERP e arquitetura de conteúdo.", status: "partial", evidence: "OpenSEO keyword metrics/ranked keywords + Ahrefs/Semrush disponíveis." },
  { id: 13, name: "Local SEO / GBP", brain: "marketing-growth", mission: "Aumentar presença local e validar concorrência no entorno.", status: "partial", evidence: "OpenSEO local SERP, GBP profile/reviews/questions e projetos locais disponíveis." },
  { id: 14, name: "Google Ads optimizer", brain: "marketing-growth", mission: "Encontrar desperdício, gaps, termos e mudanças seguras sem tocar em faturamento.", status: "partial", evidence: "Ads audit/search/mutate existem; live mutation exige confirm=true." },
  { id: 15, name: "Full-funnel attribution", brain: "marketing-growth", mission: "Ligar anúncio, landing page, Instagram, GA4, GSC e WhatsApp ao mesmo funil.", status: "partial", evidence: "Instagram profile/media insights foram lidos via Composio; snapshots sanitizados serão persistidos no ControlAgent e usados em marketing_brief. A atribuição até lead qualificado/agendamento ainda não passou no teste end-to-end." },
  { id: 16, name: "Operational memory / evidence ledger", brain: "control-tower", mission: "Guardar estado, decisões e evidências para não repetir trabalho ou perder contexto.", status: "partial", evidence: "Cloudflare Agents persistent state + WhatsAppLedger + architecture snapshot." },
  { id: 17, name: "Cost-aware routing", brain: "control-tower", mission: "Priorizar free-tier, cache e ferramentas já conectadas antes de pesquisas caras.", status: "design-only", evidence: "Policy free-tier-first e OpenSEO credit-aware registry." },
  { id: 18, name: "Judge / verifier gate", brain: "control-tower", mission: "Separar conclusão de ação e bloquear financeiro, secrets e operações destrutivas sem confirmação.", status: "partial", evidence: "Policy codificada no registry e nas rotas de mutação." },
  { id: 19, name: "Continuous monitoring", brain: "control-tower", mission: "Permitir recorrência e alertas orientados por condição em vez de checagem manual repetitiva.", status: "design-only", evidence: "Infraestrutura de automations disponível e arquitetura preparada para health/diagnostic endpoints." },
  { id: 20, name: "Research synthesis", brain: "control-tower", mission: "Fundir fontes SEO, anúncios, analytics e SERP para gerar oportunidades.", status: "partial", evidence: "Semrush + Ahrefs + OpenSEO + Google stack conectáveis pelo tool runner." },
  { id: 21, name: "Incident response / recovery", brain: "engineering-security", mission: "Detectar falha, reduzir blast radius, corrigir e revalidar pelo CI.", status: "partial", evidence: "Fallback do NIM, GitHub CI e protected-route smoke checks." },
];

export function getSpecialist(id: SpecialistId) {
  return SPECIALISTS.find((specialist) => specialist.id === id) ?? null;
}

export function specialistSnapshot() {
  return {
    version: 2,
    architecture: "cloudflare-agents",
    brainCount: BRAINS.length,
    capabilityCount: CAPABILITIES.length,
    brains: BRAINS,
    capabilities: CAPABILITIES,
    policy: {
      financialActions: "blocked",
      secretsInChat: "blocked",
      destructiveActions: "explicit-confirmation",
      preferredCost: "free-tier-first",
    },
    specialists: SPECIALISTS,
    autonomousFunctions: autonomousFunctionSnapshot(),
    externalAgents: externalAgentSnapshot(),
  };
}

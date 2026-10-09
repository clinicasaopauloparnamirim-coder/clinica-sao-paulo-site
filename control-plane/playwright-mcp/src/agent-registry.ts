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
  | "commander"
  | "researcher"
  | "engineer"
  | "seo"
  | "ads"
  | "red-team"
  | "judge"
  | "marketing-growth"
  | "nvidia-ecosystem";

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
    id: "commander",
    name: "COMMANDER",
    readiness: "partial",
    toolExecutionPath: "plan-only",
    readinessReason: "Genera planos no endpoint /orchestrate, mas o runtime não despacha diretamente as ferramentas externas do Composio.",
    mission: "Receber o objetivo, decompor o trabalho, escolher cérebros, coordenar dependências e manter o estado do ciclo.",
    toolFamilies: ["Control Tower", "MCP", "Durable State", "OpenAI-compatible inference", "Hermes", "Jev", "Laya"],
    connectedToolSlugs: ["CUSTOM_CONTROL_TOWER_ADS_AUDIT", "CUSTOM_CONTROL_TOWER_GSC_AUDIT", "CUSTOM_CONTROL_TOWER_GA4_AUDIT"],
  },
  {
    id: "researcher",
    name: "RESEARCHER",
    readiness: "partial",
    toolExecutionPath: "external-tool-runner",
    readinessReason: "OpenSEO e GSC têm acesso externo validado; a execução automática de pesquisa cruzada pelo Worker não está comprovada.",
    mission: "Pesquisar o ambiente externo, concorrentes, mercado e evidências de busca sem confiar em uma única fonte.",
    toolFamilies: ["Semrush", "Ahrefs", "OpenSEO", "web research"],
    connectedToolSlugs: ["SEMRUSH_BACKLINKS_OVERVIEW", "SEMRUSH_PAID_RESULTS", "AHREFS_RETRIEVE_SITE_EXPLORER_METRICS", "AHREFS_RETRIEVE_ORGANIC_KEYWORDS"],
  },
  {
    id: "engineer",
    name: "ENGINEER",
    readiness: "partial",
    toolExecutionPath: "external-tool-runner",
    readinessReason: "GitHub e CI/CD funcionam; um agente de código autônomo dentro do Worker não está comprovado.",
    mission: "Inspecionar código, alterar arquitetura com segurança, validar tipos, CI/CD e deploy.",
    toolFamilies: ["GitHub", "Cloudflare Workers", "Playwright MCP"],
    connectedToolSlugs: ["GITHUB_LIST_REPOSITORY_WORKFLOWS"],
    plannedToolSlugs: ["Hermes Agent host runtime", "Jev decision API", "Laya decision API"],
  },
  {
    id: "seo",
    name: "SEO",
    readiness: "partial",
    toolExecutionPath: "external-tool-runner",
    readinessReason: "OpenSEO lista os projetos e GSC lista as propriedades; os projetos OpenSEO retornam ga4_not_connected.",
    mission: "Unificar SEO técnico, semântico, indexação, local SEO, intenção e oportunidades de conteúdo.",
    toolFamilies: ["OpenSEO", "GSC", "Ahrefs", "Semrush", "GBP"],
    connectedToolSlugs: ["CUSTOM_OPENSEO_RUN_SITE_AUDIT", "CUSTOM_OPENSEO_GET_AUDIT_ISSUES", "CUSTOM_OPENSEO_GET_RANKED_KEYWORDS", "CUSTOM_OPENSEO_GET_LOCAL_SERP_RESULTS"],
  },
  {
    id: "ads",
    name: "ADS",
    readiness: "partial",
    toolExecutionPath: "mixed",
    readinessReason: "Google Ads direto responde; o OAuth Google Ads nas rotas internas do Control Tower retorna invalid_grant.",
    mission: "Auditar performance de mídia paga, termos, qualidade, atribuição e governança de mudanças.",
    toolFamilies: ["Google Ads", "Meta Ads", "Semrush paid search"],
    connectedToolSlugs: ["CUSTOM_CONTROL_TOWER_ADS_AUDIT", "CUSTOM_CONTROL_TOWER_ADS_SEARCH", "GOOGLEADS_GET_RMF_REPORT", "SEMRUSH_PAID_RESULTS"],
  },
  {
    id: "red-team",
    name: "RED TEAM",
    readiness: "blocked",
    toolExecutionPath: "plan-only",
    readinessReason: "Não há verificação red-team independente executada e registrada como parte do runtime atual.",
    mission: "Tentar provar que o diagnóstico está errado, encontrar contradições, vazamentos, regressões e falsos positivos.",
    toolFamilies: ["Cross-source comparison", "Playwright", "GitHub CI"],
    connectedToolSlugs: [],
  },
  {
    id: "judge",
    name: "JUDGE",
    readiness: "partial",
    toolExecutionPath: "mixed",
    readinessReason: "Regras locais de bloqueio existem; Jev e Laya não estão configurados como provedores ativos no Worker.",
    mission: "Validar evidências, classificar riscos, impedir ações destrutivas e exigir prova antes de declarar vitória.",
    toolFamilies: ["Evidence ledger", "Policy gate", "NIM reasoning"],
    connectedToolSlugs: [],
  },
  {
    id: "marketing-growth",
    name: "MARKETING / GROWTH",
    readiness: "partial",
    toolExecutionPath: "mixed",
    readinessReason: "Há dados de Ads, GA4, GSC e SEO por conectores, mas Meta Ads/Instagram não estão conectados e o ciclo lead-agendamento-venda-retenção não foi validado de ponta a ponta.",
    mission: "Transformar inteligência de SEO, Ads e social em aquisição local: criatividade, conteúdo, mídia, WhatsApp, atribuição e CRO.",
    toolFamilies: [
      "Semrush",
      "Ahrefs",
      "OpenSEO",
      "Google Ads",
      "Meta Ads",
      "Instagram",
      "Google Business Profile",
      "GA4",
      "GSC",
      "WhatsApp",
      "ContentStudio / vidIQ",
    ],
    connectedToolSlugs: [
      "SEMRUSH_PAID_RESULTS",
      "SEMRUSH_COMPETITORS_IN_PAID_SEARCH",
      "AHREFS_RETRIEVE_ORGANIC_KEYWORDS",
      "AHREFS_GET_SERP_OVERVIEW",
      "CUSTOM_OPENSEO_GET_KEYWORD_METRICS",
      "CUSTOM_OPENSEO_GET_LOCAL_SERP_RESULTS",
      "CUSTOM_OPENSEO_GET_BUSINESS_PROFILE",
      "CUSTOM_OPENSEO_GET_BUSINESS_REVIEWS",
      "CUSTOM_CONTROL_TOWER_ADS_AUDIT",
      "CUSTOM_CONTROL_TOWER_GSC_AUDIT",
      "CUSTOM_CONTROL_TOWER_GA4_AUDIT",
      "marketing_brief",
    ],
    plannedToolSlugs: [
      "METAADS_GET_INSIGHTS",
      "METAADS_LIST_ADS",
      "INSTAGRAM_GET_USER_INSIGHTS",
      "INSTAGRAM_GET_IG_MEDIA_INSIGHTS",
      "WhatsApp CRM qualification and appointment outcome",
    ],
  },
  {
    id: "nvidia-ecosystem",
    name: "NVIDIA ECOSYSTEM INTELLIGENCE",
    readiness: "configured-unverified",
    toolExecutionPath: "catalog-only",
    readinessReason: "O registro e o roteamento existem e o Worker reporta NIM configurado; ainda falta uma inferência real com resposta validada e uma execução de ferramenta sob este cérebro.",
    mission: "Descobrir, auditar e avaliar componentes oficiais NVIDIA/NVlabs; verificar licença, segurança, evidências e encaixe nos oito papéis existentes sem ganhar autoridade sobre o caminho financeiro.",
    toolFamilies: ["NVIDIA NIM / Nemotron", "NeMo Agent Toolkit", "OpenShell", "NeMo-Relay", "SkillSpector / SkillEvaluator", "GitHub NVIDIA repositories"],
    connectedToolSlugs: [],
    plannedToolSlugs: ["NVIDIA NIM inference test", "GitHub NVIDIA repository audit", "SkillSpector security gate", "NeMo evaluation harness"],
  },
];

export const CAPABILITIES: CapabilityDefinition[] = [
  { id: 1, name: "Autonomous orchestration", brain: "commander", mission: "Decompor objetivo em um plano executável e selecionar especialistas.", status: "partial", evidence: "ControlAgent + specialist registry + NIM orchestration endpoint." },
  { id: 2, name: "Parallel specialist delegation", brain: "commander", mission: "Permitir que funções independentes sejam executadas em paralelo fora do Worker via tool runner.", status: "blocked", evidence: "Composio MULTI_EXECUTE_TOOL já disponível para até 50 ferramentas independentes." },
  { id: 3, name: "Long-context synthesis", brain: "researcher", mission: "Consolidar grandes conjuntos de evidências antes de decidir.", status: "configured-unverified", evidence: "Nemotron 3.5 Lightning exposto via NIM; arquitetura preparada para grandes contextos." },
  { id: 4, name: "MCP/tool bridge", brain: "commander", mission: "Conectar o raciocínio do modelo às ferramentas externas por um cliente MCP.", status: "partial", evidence: "Playwright MCP conectado ao ControlAgent; Composio fornece a ponte externa." },
  { id: 5, name: "GAUNTLET LOOP", brain: "red-team", mission: "Buscar, confrontar, testar, localizar falhas, classificar, registrar e repetir.", status: "design-only", evidence: "Loop definido como protocolo central e exposto como capability." },
  { id: 6, name: "Forensic auditing", brain: "red-team", mission: "Procurar anomalias e inconsistências em sistemas de negócio.", status: "partial", evidence: "Control Tower Ads/GSC/GA4 + OpenSEO audit disponíveis." },
  { id: 7, name: "Contradiction detection", brain: "judge", mission: "Comparar fontes e rejeitar conclusões sustentadas por uma única fonte.", status: "design-only", evidence: "JUDGE + RED TEAM separados no registro para verificação cruzada." },
  { id: 8, name: "Red-team verification", brain: "red-team", mission: "Tentar falsificar a própria conclusão antes de aceitá-la.", status: "design-only", evidence: "Brain dedicado e policy gate incorporados ao snapshot." },
  { id: 9, name: "Self-correction and fallback", brain: "commander", mission: "Rebaixar para um modelo alternativo quando o NIM falhar sem derrubar o serviço.", status: "configured-unverified", evidence: "NVIDIA NIM primeiro; Cloudflare Workers AI como fallback." },
  { id: 10, name: "Coding agent", brain: "engineer", mission: "Ler código, corrigir arquitetura e preparar mudanças verificáveis.", status: "partial", evidence: "GitHub tools + CI workflow existentes." },
  { id: 11, name: "CI/CD autopilot", brain: "engineer", mission: "Typecheck, deploy, smoke test e proteção de rotas.", status: "partial", evidence: "control-plane-deploy-v2.yml roda build, deploy, smoke e protected-route checks." },
  { id: 12, name: "Semantic SEO", brain: "seo", mission: "Cruzar intenção, palavras-chave, entidades, SERP e arquitetura de conteúdo.", status: "partial", evidence: "OpenSEO keyword metrics/ranked keywords + Ahrefs/Semrush disponíveis." },
  { id: 13, name: "Local SEO / GBP", brain: "seo", mission: "Aumentar presença local e validar concorrência no entorno.", status: "partial", evidence: "OpenSEO local SERP, GBP profile/reviews/questions e projetos locais disponíveis." },
  { id: 14, name: "Google Ads optimizer", brain: "ads", mission: "Encontrar desperdício, gaps, termos e mudanças seguras sem tocar em faturamento.", status: "partial", evidence: "Ads audit/search/mutate existem; live mutation exige confirm=true." },
  { id: 15, name: "Full-funnel attribution", brain: "marketing-growth", mission: "Ligar anúncio, landing page, GA4, GSC e WhatsApp ao mesmo funil.", status: "partial", evidence: "GA4/GSC/Ads/WhatsApp ledger e ferramentas de Meta disponíveis." },
  { id: 16, name: "Operational memory / evidence ledger", brain: "judge", mission: "Guardar estado, decisões e evidências para não repetir trabalho ou perder contexto.", status: "partial", evidence: "Cloudflare Agents persistent state + WhatsAppLedger + architecture snapshot." },
  { id: 17, name: "Cost-aware routing", brain: "judge", mission: "Priorizar free-tier, cache e ferramentas já conectadas antes de pesquisas caras.", status: "design-only", evidence: "Policy free-tier-first e OpenSEO credit-aware registry." },
  { id: 18, name: "Judge / verifier gate", brain: "judge", mission: "Separar conclusão de ação e bloquear financeiro, secrets e operações destrutivas sem confirmação.", status: "partial", evidence: "Policy codificada no registry e nas rotas de mutação." },
  { id: 19, name: "Continuous monitoring", brain: "commander", mission: "Permitir recorrência e alertas orientados por condição em vez de checagem manual repetitiva.", status: "design-only", evidence: "Infraestrutura de automations disponível e arquitetura preparada para health/diagnostic endpoints." },
  { id: 20, name: "Research synthesis", brain: "researcher", mission: "Fundir fontes SEO, anúncios, analytics e SERP para gerar oportunidades.", status: "partial", evidence: "Semrush + Ahrefs + OpenSEO + Google stack conectáveis pelo tool runner." },
  { id: 21, name: "Incident response / recovery", brain: "engineer", mission: "Detectar falha, reduzir blast radius, corrigir e revalidar pelo CI.", status: "partial", evidence: "Fallback do NIM, GitHub CI e protected-route smoke checks." },
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

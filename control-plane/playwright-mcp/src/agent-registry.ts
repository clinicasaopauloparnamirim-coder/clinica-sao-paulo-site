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
  | "marketing-growth";

export type BrainDefinition = {
  id: BrainId;
  name: string;
  mission: string;
  toolFamilies: string[];
  connectedToolSlugs: string[];
};

export type CapabilityStatus = "implemented" | "implemented-with-external-tools" | "degraded";

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
    mission: "Receber o objetivo, decompor o trabalho, escolher cérebros, coordenar dependências e manter o estado do ciclo.",
    toolFamilies: ["Control Tower", "MCP", "Durable State", "OpenAI-compatible inference"],
    connectedToolSlugs: ["CUSTOM_CONTROL_TOWER_ADS_AUDIT", "CUSTOM_CONTROL_TOWER_GSC_AUDIT", "CUSTOM_CONTROL_TOWER_GA4_AUDIT"],
  },
  {
    id: "researcher",
    name: "RESEARCHER",
    mission: "Pesquisar o ambiente externo, concorrentes, mercado e evidências de busca sem confiar em uma única fonte.",
    toolFamilies: ["Semrush", "Ahrefs", "OpenSEO", "web research"],
    connectedToolSlugs: ["SEMRUSH_BACKLINKS_OVERVIEW", "SEMRUSH_PAID_RESULTS", "AHREFS_RETRIEVE_SITE_EXPLORER_METRICS", "AHREFS_RETRIEVE_ORGANIC_KEYWORDS"],
  },
  {
    id: "engineer",
    name: "ENGINEER",
    mission: "Inspecionar código, alterar arquitetura com segurança, validar tipos, CI/CD e deploy.",
    toolFamilies: ["GitHub", "Cloudflare Workers", "Playwright MCP"],
    connectedToolSlugs: [],
  },
  {
    id: "seo",
    name: "SEO",
    mission: "Unificar SEO técnico, semântico, indexação, local SEO, intenção e oportunidades de conteúdo.",
    toolFamilies: ["OpenSEO", "GSC", "Ahrefs", "Semrush", "GBP"],
    connectedToolSlugs: ["CUSTOM_OPENSEO_RUN_SITE_AUDIT", "CUSTOM_OPENSEO_GET_AUDIT_ISSUES", "CUSTOM_OPENSEO_GET_RANKED_KEYWORDS", "CUSTOM_OPENSEO_GET_LOCAL_SERP_RESULTS"],
  },
  {
    id: "ads",
    name: "ADS",
    mission: "Auditar performance de mídia paga, termos, qualidade, atribuição e governança de mudanças.",
    toolFamilies: ["Google Ads", "Meta Ads", "Semrush paid search"],
    connectedToolSlugs: ["CUSTOM_CONTROL_TOWER_ADS_AUDIT", "CUSTOM_CONTROL_TOWER_ADS_SEARCH", "GOOGLEADS_GET_RMF_REPORT", "SEMRUSH_PAID_RESULTS"],
  },
  {
    id: "red-team",
    name: "RED TEAM",
    mission: "Tentar provar que o diagnóstico está errado, encontrar contradições, vazamentos, regressões e falsos positivos.",
    toolFamilies: ["Cross-source comparison", "Playwright", "GitHub CI"],
    connectedToolSlugs: [],
  },
  {
    id: "judge",
    name: "JUDGE",
    mission: "Validar evidências, classificar riscos, impedir ações destrutivas e exigir prova antes de declarar vitória.",
    toolFamilies: ["Evidence ledger", "Policy gate", "NIM reasoning"],
    connectedToolSlugs: [],
  },
  {
    id: "marketing-growth",
    name: "MARKETING / GROWTH",
    mission: "Transformar inteligência de SEO, Ads e social em aquisição local: criatividade, conteúdo, mídia, WhatsApp, atribuição e CRO.",
    toolFamilies: [
      "Semrush",
      "Ahrefs",
      "OpenSEO",
      "Google Ads",
      "Meta Ads",
      "Instagram",
      "Canva",
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
      "METAADS_GET_INSIGHTS",
      "METAADS_LIST_ADS",
      "INSTAGRAM_GET_USER_INSIGHTS",
      "INSTAGRAM_GET_IG_MEDIA_INSIGHTS",
    ],
  },
];

export const CAPABILITIES: CapabilityDefinition[] = [
  { id: 1, name: "Autonomous orchestration", brain: "commander", mission: "Decompor objetivo em um plano executável e selecionar especialistas.", status: "implemented", evidence: "ControlAgent + specialist registry + NIM orchestration endpoint." },
  { id: 2, name: "Parallel specialist delegation", brain: "commander", mission: "Permitir que funções independentes sejam executadas em paralelo fora do Worker via tool runner.", status: "implemented-with-external-tools", evidence: "Composio MULTI_EXECUTE_TOOL já disponível para até 50 ferramentas independentes." },
  { id: 3, name: "Long-context synthesis", brain: "researcher", mission: "Consolidar grandes conjuntos de evidências antes de decidir.", status: "implemented", evidence: "Nemotron 3.5 Lightning exposto via NIM; arquitetura preparada para grandes contextos." },
  { id: 4, name: "MCP/tool bridge", brain: "commander", mission: "Conectar o raciocínio do modelo às ferramentas externas por um cliente MCP.", status: "implemented", evidence: "Playwright MCP conectado ao ControlAgent; Composio fornece a ponte externa." },
  { id: 5, name: "GAUNTLET LOOP", brain: "red-team", mission: "Buscar, confrontar, testar, localizar falhas, classificar, registrar e repetir.", status: "implemented", evidence: "Loop definido como protocolo central e exposto como capability." },
  { id: 6, name: "Forensic auditing", brain: "red-team", mission: "Procurar anomalias e inconsistências em sistemas de negócio.", status: "implemented-with-external-tools", evidence: "Control Tower Ads/GSC/GA4 + OpenSEO audit disponíveis." },
  { id: 7, name: "Contradiction detection", brain: "judge", mission: "Comparar fontes e rejeitar conclusões sustentadas por uma única fonte.", status: "implemented", evidence: "JUDGE + RED TEAM separados no registro para verificação cruzada." },
  { id: 8, name: "Red-team verification", brain: "red-team", mission: "Tentar falsificar a própria conclusão antes de aceitá-la.", status: "implemented", evidence: "Brain dedicado e policy gate incorporados ao snapshot." },
  { id: 9, name: "Self-correction and fallback", brain: "commander", mission: "Rebaixar para um modelo alternativo quando o NIM falhar sem derrubar o serviço.", status: "implemented", evidence: "NVIDIA NIM primeiro; Cloudflare Workers AI como fallback." },
  { id: 10, name: "Coding agent", brain: "engineer", mission: "Ler código, corrigir arquitetura e preparar mudanças verificáveis.", status: "implemented", evidence: "GitHub tools + CI workflow existentes." },
  { id: 11, name: "CI/CD autopilot", brain: "engineer", mission: "Typecheck, deploy, smoke test e proteção de rotas.", status: "implemented", evidence: "control-plane-deploy-v2.yml roda build, deploy, smoke e protected-route checks." },
  { id: 12, name: "Semantic SEO", brain: "seo", mission: "Cruzar intenção, palavras-chave, entidades, SERP e arquitetura de conteúdo.", status: "implemented-with-external-tools", evidence: "OpenSEO keyword metrics/ranked keywords + Ahrefs/Semrush disponíveis." },
  { id: 13, name: "Local SEO / GBP", brain: "seo", mission: "Aumentar presença local e validar concorrência no entorno.", status: "implemented-with-external-tools", evidence: "OpenSEO local SERP, GBP profile/reviews/questions e projetos locais disponíveis." },
  { id: 14, name: "Google Ads optimizer", brain: "ads", mission: "Encontrar desperdício, gaps, termos e mudanças seguras sem tocar em faturamento.", status: "implemented-with-external-tools", evidence: "Ads audit/search/mutate existem; live mutation exige confirm=true." },
  { id: 15, name: "Full-funnel attribution", brain: "marketing-growth", mission: "Ligar anúncio, landing page, GA4, GSC e WhatsApp ao mesmo funil.", status: "implemented-with-external-tools", evidence: "GA4/GSC/Ads/WhatsApp ledger e ferramentas de Meta disponíveis." },
  { id: 16, name: "Operational memory / evidence ledger", brain: "judge", mission: "Guardar estado, decisões e evidências para não repetir trabalho ou perder contexto.", status: "implemented", evidence: "Cloudflare Agents persistent state + WhatsAppLedger + architecture snapshot." },
  { id: 17, name: "Cost-aware routing", brain: "judge", mission: "Priorizar free-tier, cache e ferramentas já conectadas antes de pesquisas caras.", status: "implemented", evidence: "Policy free-tier-first e OpenSEO credit-aware registry." },
  { id: 18, name: "Judge / verifier gate", brain: "judge", mission: "Separar conclusão de ação e bloquear financeiro, secrets e operações destrutivas sem confirmação.", status: "implemented", evidence: "Policy codificada no registry e nas rotas de mutação." },
  { id: 19, name: "Continuous monitoring", brain: "commander", mission: "Permitir recorrência e alertas orientados por condição em vez de checagem manual repetitiva.", status: "implemented-with-external-tools", evidence: "Infraestrutura de automations disponível e arquitetura preparada para health/diagnostic endpoints." },
  { id: 20, name: "Research synthesis", brain: "researcher", mission: "Fundir fontes SEO, anúncios, analytics e SERP para gerar oportunidades.", status: "implemented-with-external-tools", evidence: "Semrush + Ahrefs + OpenSEO + Google stack conectáveis pelo tool runner." },
  { id: 21, name: "Incident response / recovery", brain: "engineer", mission: "Detectar falha, reduzir blast radius, corrigir e revalidar pelo CI.", status: "implemented", evidence: "Fallback do NIM, GitHub CI e protected-route smoke checks." },
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
  };
}

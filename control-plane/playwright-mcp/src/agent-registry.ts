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

export function getSpecialist(id: SpecialistId) {
  return SPECIALISTS.find((specialist) => specialist.id === id) ?? null;
}

export function specialistSnapshot() {
  return {
    version: 1,
    architecture: "cloudflare-agents",
    policy: {
      financialActions: "blocked",
      secretsInChat: "blocked",
      destructiveActions: "explicit-confirmation",
      preferredCost: "free-tier-first",
    },
    specialists: SPECIALISTS,
  };
}

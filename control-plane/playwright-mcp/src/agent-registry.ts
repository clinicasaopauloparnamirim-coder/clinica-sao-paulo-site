import { autonomousFunctionSnapshot } from "./autonomous-functions";
import { externalAgentSnapshot } from "./external-agents";
export type SpecialistId =
  | "orchestrator" | "google-ads" | "gbp" | "ga4" | "gsc-seo" | "cloudflare" | "github-deploy" | "whatsapp-leads"
  | "forensic-auditor" | "researcher" | "coding-engineer" | "technical-seo" | "local-seo" | "red-team"
  | "judge" | "crm-manager" | "attribution-analyst" | "instagram-content" | "cro-optimizer" | "nvidia-nim-analyst";

export type SpecialistMode = "read" | "write";

export type SpecialistDefinition = {
  id: SpecialistId;
  brain: BrainId;
  name: string;
  mission: string;
  allowedModes: SpecialistMode[];
  financialActions: "blocked";
  readiness: "runtime-verified" | "partial" | "configured-unverified" | "registry-only" | "blocked";
  readinessReason: string;
};

export type BrainId =
  | "commander" | "researcher" | "engineer" | "seo" | "ads" | "red-team" | "judge" | "marketing-growth" | "nvidia-ecosystem";

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
  { id: "orchestrator", brain: "commander", name: "Control Tower Orchestrator", mission: "Decompor objetivos, delegar agentes independentes, impor a política e consolidar evidências verificáveis.", allowedModes: ["read", "write"], financialActions: "blocked", readiness: "partial", readinessReason: "Rotas de Control Tower e registro estão presentes; autonomia de ponta a ponta ainda requer testes por tarefa." },
  { id: "google-ads", brain: "ads", name: "Google Ads Agent", mission: "Auditar a campanha autorizada, métricas, termos e conversões em modo de leitura; mutações permanecem sujeitas ao gate.", allowedModes: ["read", "write"], financialActions: "blocked", readiness: "partial", readinessReason: "Leitura real confirmada para a campanha 24289443969; Search-2 e mudanças financeiras ficam fora do escopo." },
  { id: "gbp", brain: "seo", name: "Google Business Profile Agent", mission: "Auditar perfil local, categoria, avaliações e ações locais quando as permissões da API estiverem disponíveis.", allowedModes: ["read", "write"], financialActions: "blocked", readiness: "configured-unverified", readinessReason: "Código de auditoria existe; disponibilidade de todas as operações e publicação não foi validada nesta rodada." },
  { id: "ga4", brain: "marketing-growth", name: "GA4 Agent", mission: "Auditar aquisição, páginas de entrada, eventos-chave e medição de leads sem alterar dados de analytics.", allowedModes: ["read", "write"], financialActions: "blocked", readiness: "partial", readinessReason: "Leituras GA4 foram comprovadas anteriormente; painel deverá confirmar a resposta em cada sessão." },
  { id: "gsc-seo", brain: "seo", name: "Search Console / SEO Agent", mission: "Investigar consultas, páginas, indexação, CTR e oportunidades orgânicas locais.", allowedModes: ["read", "write"], financialActions: "blocked", readiness: "partial", readinessReason: "Leituras GSC/OpenSEO foram comprovadas; operações de indexação são somente diagnósticas no escopo atual." },
  { id: "cloudflare", brain: "engineer", name: "Cloudflare Operations Agent", mission: "Verificar Worker, rotas, releases e observabilidade; mudanças exigem validação antes de produção.", allowedModes: ["read", "write"], financialActions: "blocked", readiness: "partial", readinessReason: "A API de leitura e o deploy por GitHub Actions existem; acesso de escrita direto não é presumido." },
  { id: "github-deploy", brain: "engineer", name: "GitHub / CI-CD Agent", mission: "Inspecionar código, versionar mudanças, acionar workflows e conferir resultados do CI/CD.", allowedModes: ["read", "write"], financialActions: "blocked", readiness: "runtime-verified", readinessReason: "O repositório e o workflow de deploy são acessíveis; a conexão Google Cloud CLI também passou no teste de autenticação." },
  { id: "whatsapp-leads", brain: "marketing-growth", name: "WhatsApp & Leads Agent", mission: "Rastrear origem e status do lead, validar o webhook e apoiar o funil sem enviar mensagens não autorizadas.", allowedModes: ["read", "write"], financialActions: "blocked", readiness: "partial", readinessReason: "Rotas e ledger existem; envio de mensagem permanece opt-in e assinatura do webhook deve ser verificada em produção." },
  { id: "forensic-auditor", brain: "researcher", name: "Auditor Forense", mission: "Cruzar métricas e evidências de Ads, GA4, GSC, Cloudflare e GitHub para identificar discrepâncias.", allowedModes: ["read"], financialActions: "blocked", readiness: "partial", readinessReason: "Processo de auditoria definido e fontes conectadas; execução paralela precisa ser registrada por tarefa." },
  { id: "researcher", brain: "researcher", name: "Research & Intelligence Agent", mission: "Pesquisar fontes internas e externas, separar fatos de hipóteses e produzir sínteses com rastreabilidade.", allowedModes: ["read"], financialActions: "blocked", readiness: "partial", readinessReason: "Capacidade de pesquisa disponível por ferramentas conectadas; não executa mutações comerciais." },
  { id: "coding-engineer", brain: "engineer", name: "Software Engineering Agent", mission: "Implementar alterações pequenas, tipadas e testáveis, com commits, revisão e rollback.", allowedModes: ["read"], financialActions: "blocked", readiness: "partial", readinessReason: "Ferramentas GitHub/CI disponíveis; alterações devem passar por build e smoke test antes da promoção." },
  { id: "technical-seo", brain: "seo", name: "Technical SEO Agent", mission: "Auditar estrutura, schema, canonical, sitemap, robots, velocidade e indexação.", allowedModes: ["read"], financialActions: "blocked", readiness: "partial", readinessReason: "Auditorias de SEO estão disponíveis; publicação de mudanças de páginas requer validação explícita." },
  { id: "local-seo", brain: "seo", name: "Local SEO & NAP Agent", mission: "Manter consistência de nome, endereço e telefone e encontrar oportunidades locais por raio e intenção.", allowedModes: ["read"], financialActions: "blocked", readiness: "configured-unverified", readinessReason: "O objetivo NAP/SEO local foi definido; a atualização automática de diretórios ainda não foi comprovada." },
  { id: "red-team", brain: "red-team", name: "Red Team / Failure Hunter", mission: "Tentar falsificar resultados, localizar rotas abertas, falhas silenciosas, permissões excessivas e regressões.", allowedModes: ["read"], financialActions: "blocked", readiness: "registry-only", readinessReason: "O papel está separado no registry; os testes de ataque controlados e recorrentes ainda precisam de execução comprovada." },
  { id: "judge", brain: "judge", name: "JEV / LAYA Decision Gate Agent", mission: "Classificar ações como permitir, exigir confirmação ou bloquear, mantendo fail-safe se os juízes falharem.", allowedModes: ["read"], financialActions: "blocked", readiness: "configured-unverified", readinessReason: "JEV/LAYA têm caminhos de integração previstos, mas a ligação integral ao runtime deve ser validada separadamente." },
  { id: "crm-manager", brain: "marketing-growth", name: "CRM & Pipeline Agent", mission: "Cadastrar leads, atualizar etapa comercial e registrar origem sem armazenar conteúdo clínico sensível.", allowedModes: ["read", "write"], financialActions: "blocked", readiness: "configured-unverified", readinessReason: "O CRUD será servido por rotas autenticadas e pelo Durable Object; só será promovido após CI e smoke test." },
  { id: "attribution-analyst", brain: "marketing-growth", name: "Attribution & Revenue Analyst", mission: "Unir UTMs, cliques, chamadas, WhatsApp, conversões técnicas e status comercial, marcando lacunas como desconhecidas.", allowedModes: ["read"], financialActions: "blocked", readiness: "partial", readinessReason: "Ledger de atribuição existe; ligação completa até agendamento/paciente ainda precisa de validação end-to-end." },
  { id: "instagram-content", brain: "marketing-growth", name: "Instagram Content Agent", mission: "Planejar conteúdo e medir alcance e leads atribuídos, sem publicar ou enviar DMs automaticamente.", allowedModes: ["read"], financialActions: "blocked", readiness: "configured-unverified", readinessReason: "Leituras de perfil/insights foram feitas; publicação automatizada não está autorizada neste plano." },
  { id: "cro-optimizer", brain: "marketing-growth", name: "Landing Page & CRO Agent", mission: "Identificar atrito no agendamento, testar CTA e melhorar a conversão sem implantar experimentos sem validação.", allowedModes: ["read"], financialActions: "blocked", readiness: "registry-only", readinessReason: "Missão e indicadores foram definidos; experimento A/B e cálculo confiável de conversão ainda não estão implementados." },
  { id: "nvidia-nim-analyst", brain: "nvidia-ecosystem", name: "NVIDIA Nemotron / NIM Agent", mission: "Analisar evidências e código com modelo secundário, sem autoridade própria para executar ações.", allowedModes: ["read"], financialActions: "blocked", readiness: "blocked", readinessReason: "A auditoria anterior identificou risco de credencial NVIDIA em texto simples; não declarar NIM operacional até rotação e inferência real confirmadas." },
];

export const BRAINS: BrainDefinition[] = [
  { id: "commander", name: "CÉREBRO 1 — COMMANDER / CONTROL TOWER", readiness: "partial", toolExecutionPath: "mixed", readinessReason: "Orquestração e rotas autenticadas existem; cada agente só é operacional após teste real próprio.", mission: "Receber objetivos, decompor trabalho, distribuir tarefas independentes e exigir evidência antes de concluir.", toolFamilies: ["Control Tower", "ControlAgent", "MCP", "Composio", "Evidence Ledger", "GAUNTLET LOOP"], connectedToolSlugs: ["CUSTOM_CONTROL_TOWER_ADS_AUTH_CHECK", "CUSTOM_CONTROL_TOWER_ADS_SEARCH"] },
  { id: "researcher", name: "CÉREBRO 2 — RESEARCH & INTELLIGENCE", readiness: "partial", toolExecutionPath: "external-tool-runner", readinessReason: "Fontes de pesquisa conectadas; as conclusões devem conservar referências e separar fato de inferência.", mission: "Buscar, confrontar e sintetizar evidências de ferramentas, conversas, código, SEO, Ads e analytics.", toolFamilies: ["Composio", "OpenSEO", "Search Console", "GA4", "Ahrefs", "Semrush", "GitHub search"], connectedToolSlugs: ["CUSTOM_OPENSEO_GET_SEARCH_OPPORTUNITIES", "CUSTOM_OPENSEO_GET_SEARCH_CONSOLE_PERFORMANCE"] },
  { id: "engineer", name: "CÉREBRO 3 — ENGINEERING / INFRA / CI-CD", readiness: "partial", toolExecutionPath: "mixed", readinessReason: "GitHub Actions e deploy estão disponíveis; Cloudflare e produção precisam de smoke test após cada release.", mission: "Implementar, testar, publicar e recuperar mudanças com proveniência commit → CI → release → runtime.", toolFamilies: ["GitHub", "GitHub Actions", "Cloudflare Workers", "Durable Objects", "Playwright MCP"], connectedToolSlugs: ["GITHUB_CREATE_A_DEPLOYMENT"] },
  { id: "seo", name: "CÉREBRO 4 — SEO LOCAL / TÉCNICO / GEO-AEO", readiness: "partial", toolExecutionPath: "external-tool-runner", readinessReason: "Search Console e OpenSEO têm leituras reais; ações de publicação e NAP externo não estão automaticamente comprovadas.", mission: "Aumentar presença orgânica e local, mantendo consistência de entidade, schema, páginas, indexação e NAP.", toolFamilies: ["Google Search Console", "OpenSEO", "Google Business Profile", "Ahrefs", "Semrush"], connectedToolSlugs: ["CUSTOM_OPENSEO_GET_SEARCH_CONSOLE_PERFORMANCE", "CUSTOM_OPENSEO_GET_SEARCH_OPPORTUNITIES"] },
  { id: "ads", name: "CÉREBRO 5 — GOOGLE ADS / AQUISIÇÃO PAGA", readiness: "partial", toolExecutionPath: "external-tool-runner", readinessReason: "Autenticação e leitura restrita foram verificadas para a campanha 24289443969; nenhuma mutação foi executada.", mission: "Medir custos, consultas, qualidade, conversões e desperdício em modo read-first; preservar o bloqueio a Search-2 e orçamento.", toolFamilies: ["Google Ads API", "GAQL", "GA4 attribution", "Landing page CRO"], connectedToolSlugs: ["CUSTOM_CONTROL_TOWER_ADS_AUTH_CHECK", "CUSTOM_CONTROL_TOWER_ADS_SEARCH", "CUSTOM_CONTROL_TOWER_ADS_AUDIT"] },
  { id: "red-team", name: "CÉREBRO 6 — RED TEAM / FAILURE HUNTER", readiness: "registry-only", toolExecutionPath: "plan-only", readinessReason: "O papel e a metodologia estão definidos, mas não há evidência de um ciclo contínuo de ataque controlado em runtime.", mission: "Tentar quebrar cada conclusão e mudança, encontrar fail-open, privilégios excessivos, regressões e falsos positivos.", toolFamilies: ["Security tests", "GitHub CI", "Route smoke tests", "Policy checks"], connectedToolSlugs: [] },
  { id: "judge", name: "CÉREBRO 7 — JEV / LAYA / DECISION GOVERNANCE", readiness: "configured-unverified", toolExecutionPath: "mixed", readinessReason: "Integrações externas foram chamadas separadamente, mas o pareamento com o runtime do Worker não está comprovado em todos os caminhos.", mission: "Permitir, pedir confirmação ou bloquear com uma política única; falha de ambos os juízes bloqueia ações mutáveis.", toolFamilies: ["JEV", "LAYA", "Judgment Gate", "Fail-safe policy"], connectedToolSlugs: ["JEV_EVALUATE_STATE"], plannedToolSlugs: ["Validar ambos os juízes no runtime antes de promover"] },
  { id: "marketing-growth", name: "CÉREBRO 8 — MARKETINGGROWTH / CRM / CONVERSÃO", readiness: "partial", toolExecutionPath: "external-tool-runner", readinessReason: "Leituras de Ads, GA4, GSC e Instagram foram demonstradas em diferentes sessões; atribuição completa até paciente ainda não foi provada.", mission: "Transformar aquisição em leads e agendamentos mensuráveis por meio de Ads, conteúdo, WhatsApp, CRM e CRO.", toolFamilies: ["Google Ads", "GA4", "Search Console", "Instagram", "WhatsApp", "CRM", "Attribution"], connectedToolSlugs: ["CUSTOM_CONTROL_TOWER_ADS_AUDIT", "CUSTOM_CONTROL_TOWER_GA4_AUDIT", "CUSTOM_CONTROL_TOWER_GSC_AUDIT"] },
  { id: "nvidia-ecosystem", name: "CÉREBRO 9 — NVIDIA / NEMOTRON / MODEL ROUTING", readiness: "blocked", toolExecutionPath: "mixed", readinessReason: "A auditoria anterior identificou uma chave NVIDIA suspeita em binding plaintext; não declarar o modelo operacional sem rotação de credencial e smoke test real.", mission: "Gerenciar modelos de raciocínio e análise secundária sem substituir o julgamento tipado nem contornar políticas.", toolFamilies: ["NVIDIA NIM", "Nemotron", "Model routing", "Fallback", "Token/cost telemetry"], connectedToolSlugs: [], plannedToolSlugs: ["Rotacionar chave, confirmar NVIDIA_KEY_ROTATED=true e executar inferência real"] },
];

export const CAPABILITIES: CapabilityDefinition[] = [
  { id: 1, name: "Autonomous orchestration", brain: "commander", mission: "Decompor objetivo em um plano executável e selecionar especialistas.", status: "partial", evidence: "ControlAgent + specialist registry + NIM orchestration endpoint." },
  { id: 2, name: "Parallel specialist delegation", brain: "commander", mission: "Permitir que funções independentes sejam executadas em paralelo fora do Worker via tool runner.", status: "blocked", evidence: "Composio MULTI_EXECUTE_TOOL já disponível para até 50 ferramentas independentes." },
  { id: 3, name: "Long-context synthesis", brain: "researcher", mission: "Consolidar grandes conjuntos de evidências antes de decidir.", status: "blocked", evidence: "Nemotron bloqueado até rotação da chave NVIDIA e confirmação explícita de NVIDIA_KEY_ROTATED=true." },
  { id: 4, name: "MCP/tool bridge", brain: "commander", mission: "Conectar o raciocínio do modelo às ferramentas externas por um cliente MCP.", status: "partial", evidence: "Playwright MCP conectado ao ControlAgent; Composio fornece a ponte externa." },
  { id: 5, name: "GAUNTLET LOOP", brain: "commander", mission: "Buscar, confrontar, testar, localizar falhas, classificar, registrar e repetir.", status: "design-only", evidence: "Loop definido como protocolo central e exposto como capability." },
  { id: 6, name: "Forensic auditing", brain: "researcher", mission: "Procurar anomalias e inconsistências em sistemas de negócio.", status: "partial", evidence: "Control Tower Ads/GSC/GA4 + OpenSEO audit disponíveis." },
  { id: 7, name: "Contradiction detection", brain: "judge", mission: "Comparar fontes e rejeitar conclusões sustentadas por uma única fonte.", status: "design-only", evidence: "JUDGE + RED TEAM separados no registro para verificação cruzada." },
  { id: 8, name: "Red-team verification", brain: "red-team", mission: "Tentar falsificar a própria conclusão antes de aceitá-la.", status: "design-only", evidence: "Brain dedicado e policy gate incorporados ao snapshot." },
  { id: 9, name: "Self-correction and fallback", brain: "nvidia-ecosystem", mission: "Rebaixar para um modelo alternativo quando o NIM falhar sem derrubar o serviço.", status: "blocked", evidence: "NIM desabilitado por segurança até a chave ser rotacionada; o caminho alternativo deve funcionar sem usar a chave antiga." },
  { id: 10, name: "Coding agent", brain: "engineer", mission: "Ler código, corrigir arquitetura e preparar mudanças verificáveis.", status: "partial", evidence: "GitHub tools + CI workflow existentes." },
  { id: 11, name: "CI/CD autopilot", brain: "engineer", mission: "Typecheck, deploy, smoke test e proteção de rotas.", status: "partial", evidence: "control-plane-deploy-v2.yml roda build, deploy, smoke e protected-route checks." },
  { id: 12, name: "Semantic SEO", brain: "seo", mission: "Cruzar intenção, palavras-chave, entidades, SERP e arquitetura de conteúdo.", status: "partial", evidence: "OpenSEO keyword metrics/ranked keywords + Ahrefs/Semrush disponíveis." },
  { id: 13, name: "Local SEO / GBP", brain: "seo", mission: "Aumentar presença local e validar concorrência no entorno.", status: "partial", evidence: "OpenSEO local SERP, GBP profile/reviews/questions e projetos locais disponíveis." },
  { id: 14, name: "Google Ads optimizer", brain: "ads", mission: "Encontrar desperdício, gaps, termos e mudanças seguras sem tocar em faturamento.", status: "partial", evidence: "Ads audit/search/mutate existem; live mutation exige confirm=true." },
  { id: 15, name: "Full-funnel attribution", brain: "marketing-growth", mission: "Ligar anúncio, landing page, Instagram, GA4, GSC e WhatsApp ao mesmo funil.", status: "partial", evidence: "Instagram profile/media insights foram lidos via Composio; snapshots sanitizados serão persistidos no ControlAgent e usados em marketing_brief. A atribuição até lead qualificado/agendamento ainda não passou no teste end-to-end." },
  { id: 16, name: "Operational memory / evidence ledger", brain: "commander", mission: "Guardar estado, decisões e evidências para não repetir trabalho ou perder contexto.", status: "partial", evidence: "Cloudflare Agents persistent state + WhatsAppLedger + architecture snapshot." },
  { id: 17, name: "Cost-aware routing", brain: "researcher", mission: "Priorizar free-tier, cache e ferramentas já conectadas antes de pesquisas caras.", status: "design-only", evidence: "Policy free-tier-first e OpenSEO credit-aware registry." },
  { id: 18, name: "Judge / verifier gate", brain: "judge", mission: "Separar conclusão de ação e bloquear financeiro, secrets e operações destrutivas sem confirmação.", status: "partial", evidence: "Policy codificada no registry e nas rotas de mutação." },
  { id: 19, name: "Continuous monitoring", brain: "engineer", mission: "Permitir recorrência e alertas orientados por condição em vez de checagem manual repetitiva.", status: "design-only", evidence: "Infraestrutura de automations disponível e arquitetura preparada para health/diagnostic endpoints." },
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
    agentCount: SPECIALISTS.length,
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
    agents: SPECIALISTS,
    autonomousFunctions: autonomousFunctionSnapshot(),
    externalAgents: externalAgentSnapshot(),
  };
}

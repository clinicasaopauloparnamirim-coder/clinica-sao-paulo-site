export type AutonomousFunctionMode = "plan" | "audit" | "execute" | "verify";

export type AutonomousFunctionStatus = "implemented" | "implemented-with-external-tools" | "guarded";

export type AutonomousFunction = {
  id: number;
  key: string;
  name: string;
  mode: AutonomousFunctionMode;
  ownerBrain: string;
  mission: string;
  inputs: string[];
  outputs: string[];
  requiredTools: string[];
  status: AutonomousFunctionStatus;
  safety: "read-first" | "write-confirmed" | "verify-required";
};

export const AUTONOMOUS_FUNCTIONS: AutonomousFunction[] = [
  { id:1, key:"orchestrator", name:"Cérebro de Orquestração", mode:"plan", ownerBrain:"commander", mission:"Receber um objetivo, decompor o trabalho, selecionar agentes e construir uma sequência executável.", inputs:["goal","mode","architecture_state"], outputs:["selected_agents","dependencies","plan","blockers"], requiredTools:["Control Tower","NIM"], status:"implemented", safety:"read-first" },
  { id:2, key:"forensic-auditor", name:"Auditor Forense", mode:"audit", ownerBrain:"red-team", mission:"Investigar sistemas e encontrar anomalias, desperdícios, falhas e inconsistências.", inputs:["system","evidence"], outputs:["findings","severity","evidence_gaps"], requiredTools:["Google Ads","GSC","GA4","OpenSEO","GitHub"], status:"implemented-with-external-tools", safety:"verify-required" },
  { id:3, key:"architecture-mapper", name:"Segundo Cérebro / Mapa Operacional", mode:"audit", ownerBrain:"researcher", mission:"Construir um mapa vivo de sistemas, ferramentas, dependências, capacidades e pontos de falha.", inputs:["repository","connections","tool_inventory"], outputs:["architecture_map","dependencies","unused_tools","gaps"], requiredTools:["GitHub","Composio","Control Tower"], status:"implemented-with-external-tools", safety:"read-first" },
  { id:4, key:"long-context-synthesizer", name:"Sintetizador de Longo Contexto", mode:"audit", ownerBrain:"researcher", mission:"Consolidar grandes volumes de código, logs, documentação e decisões para detectar padrões e conflitos.", inputs:["documents","logs","history"], outputs:["synthesis","contradictions","priority_findings"], requiredTools:["NIM"], status:"implemented", safety:"read-first" },
  { id:5, key:"coding-engineer", name:"Engenheiro de Software", mode:"execute", ownerBrain:"engineer", mission:"Inspecionar código, propor patches, executar validações e acompanhar CI/CD.", inputs:["repo","task","constraints"], outputs:["patch","tests","ci_result","deploy_result"], requiredTools:["GitHub","Cloudflare","CI/CD"], status:"implemented-with-external-tools", safety:"write-confirmed" },
  { id:6, key:"red-team", name:"Red Team", mode:"verify", ownerBrain:"red-team", mission:"Tentar quebrar uma solução, encontrar regressões, riscos, contradições e falsos positivos.", inputs:["proposal","evidence","requirements"], outputs:["attack_findings","rejected_claims","required_changes"], requiredTools:["NIM","GitHub","Browser"], status:"implemented", safety:"verify-required" },
  { id:7, key:"invisible-error-hunter", name:"Caçador de Erros Invisíveis", mode:"audit", ownerBrain:"red-team", mission:"Procurar aquilo que deveria existir mas não existe: integrações ausentes, eventos quebrados e ferramentas sem uso real.", inputs:["expected_architecture","runtime_state"], outputs:["missing_capabilities","silent_failures","coverage_gaps"], requiredTools:["Control Tower","Composio","GitHub"], status:"implemented-with-external-tools", safety:"verify-required" },
  { id:8, key:"mcp-bridge", name:"Ponte MCP", mode:"execute", ownerBrain:"commander", mission:"Preparar schemas de ferramentas, selecionar tools e retornar contratos para execução pelo cliente MCP/tool runner.", inputs:["tool_schemas","goal"], outputs:["tool_plan","tool_calls","tool_results_contract"], requiredTools:["MCP","Composio","NIM"], status:"implemented-with-external-tools", safety:"write-confirmed" },
  { id:9, key:"subagent-delegator", name:"Delegador de Subagentes", mode:"plan", ownerBrain:"commander", mission:"Dividir o trabalho em agentes especialistas independentes e consolidar os resultados.", inputs:["goal","specialists"], outputs:["subtasks","parallel_groups","merge_plan"], requiredTools:["NIM","Composio MULTI_EXECUTE_TOOL"], status:"implemented-with-external-tools", safety:"read-first" },
  { id:10, key:"google-ads-autonomous", name:"Google Ads Autônomo", mode:"execute", ownerBrain:"ads", mission:"Auditar, diagnosticar e preparar mudanças seguras em campanhas, termos, qualidade, localização e conversões.", inputs:["account","campaign_scope","evidence"], outputs:["audit","recommendations","safe_mutations","verification_plan"], requiredTools:["Google Ads","GA4","GSC"], status:"implemented-with-external-tools", safety:"write-confirmed" },
  { id:11, key:"semantic-seo", name:"SEO Semântico Autônomo", mode:"execute", ownerBrain:"seo", mission:"Mapear entidades, intenção, clusters, SERPs, gaps semânticos, interlinking e canibalização.", inputs:["domain","keywords","serps"], outputs:["topic_map","content_gaps","internal_links","page_actions"], requiredTools:["OpenSEO","Ahrefs","Semrush","GSC"], status:"implemented-with-external-tools", safety:"write-confirmed" },
  { id:12, key:"local-seo-intelligence", name:"Local Search Intelligence", mode:"audit", ownerBrain:"seo", mission:"Medir cobertura geográfica, concorrência, 3-pack, reviews, GBP e oportunidades locais.", inputs:["business","center","radius","keywords"], outputs:["local_grid","heatmap","competitor_ranking","gaps"], requiredTools:["OpenSEO","DataForSEO","GBP"], status:"implemented-with-external-tools", safety:"read-first" },
  { id:13, key:"intelligent-cicd", name:"CI/CD Inteligente", mode:"execute", ownerBrain:"engineer", mission:"Acoplar revisão por IA ao build, testes, deploy, smoke tests e análise de logs.", inputs:["commit","workflow","logs"], outputs:["review","test_verdict","deploy_verdict","recovery_plan"], requiredTools:["GitHub Actions","NIM","Cloudflare"], status:"implemented-with-external-tools", safety:"write-confirmed" },
  { id:14, key:"operational-memory", name:"Memória Operacional", mode:"execute", ownerBrain:"judge", mission:"Registrar decisões, evidências, tentativas, falhas e dependências para evitar repetição e perda de contexto.", inputs:["event","decision","evidence"], outputs:["ledger_entry","updated_state","historical_context"], requiredTools:["Durable State","WhatsApp Ledger","GitHub"], status:"implemented", safety:"read-first" },
  { id:15, key:"contradiction-reconciler", name:"Reconciliação de Contradições", mode:"verify", ownerBrain:"judge", mission:"Cruzar fontes que divergem e investigar qual evidência explica a diferença.", inputs:["source_a","source_b","source_c"], outputs:["reconciliation","confidence","next_checks"], requiredTools:["NIM","Google Ads","GA4","GSC","WhatsApp"], status:"implemented-with-external-tools", safety:"verify-required" },
  { id:16, key:"deep-research", name:"Pesquisa Profunda", mode:"audit", ownerBrain:"researcher", mission:"Buscar evidência, contra-evidência e síntese em múltiplas fontes antes de decidir.", inputs:["question","sources"], outputs:["hypotheses","evidence","counter_evidence","conclusion"], requiredTools:["Web Research","Ahrefs","Semrush","OpenSEO","NIM"], status:"implemented-with-external-tools", safety:"verify-required" },
  { id:17, key:"believe-nothing", name:"Modo NÃO ACREDITE EM NADA", mode:"verify", ownerBrain:"judge", mission:"Exigir classificação explícita da evidência e impedir conclusões sem prova suficiente.", inputs:["claims","evidence"], outputs:["confirmed","probable","unproven","contradictory","unknown"], requiredTools:["NIM","Evidence Ledger"], status:"implemented", safety:"verify-required" },
  { id:18, key:"autonomous-architect", name:"Arquiteto Autônomo", mode:"plan", ownerBrain:"judge", mission:"Reprojetar o Control Tower a partir do estado real, classificando componentes em manter, remover, substituir, integrar, automatizar e monitorar.", inputs:["architecture","tool_inventory","failures","costs","security"], outputs:["keep","remove","replace","integrate","automate","monitor","migration_plan"], requiredTools:["NIM","GitHub","Composio","Control Tower"], status:"implemented", safety:"verify-required" },
  { id:19, key:"cost-router", name:"Roteador de Custo", mode:"plan", ownerBrain:"judge", mission:"Selecionar o modelo e a ferramenta adequados por complexidade, custo, contexto e criticidade.", inputs:["task","complexity","context_size","cost_policy"], outputs:["model","tool_path","estimated_cost","fallback"], requiredTools:["NIM","Workers AI","Provider registry"], status:"implemented", safety:"read-first" },
  { id:20, key:"judge-verifier", name:"JUIZ / VERIFICADOR", mode:"verify", ownerBrain:"judge", mission:"Auditar o plano ou resultado final, rejeitar execução sem evidência e exigir correção antes da aprovação.", inputs:["plan","execution_result","policy","evidence"], outputs:["pass","findings","required_changes"], requiredTools:["NIM","RED TEAM","Evidence Ledger"], status:"implemented", safety:"verify-required" },
];

export function getAutonomousFunction(id: number) {
  return AUTONOMOUS_FUNCTIONS.find((fn) => fn.id === id) ?? null;
}

export function autonomousFunctionSnapshot() {
  return {
    count: AUTONOMOUS_FUNCTIONS.length,
    functions: AUTONOMOUS_FUNCTIONS,
    policy: {
      evidenceClasses: ["CONFIRMADO", "PROVÁVEL", "NÃO COMPROVADO", "CONTRADITÓRIO", "DESCONHECIDO"],
      financialActions: "blocked",
      destructiveActions: "explicit-confirmation",
      secretsInChat: "blocked",
      costPolicy: "free-tier-first",
    },
  };
}

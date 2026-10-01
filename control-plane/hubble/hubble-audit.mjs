#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(new URL(".", import.meta.url).pathname, "../..");

const read = (relative) => {
  const file = path.join(root, relative);
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
};

const findings = [];

function finding(id, severity, title, evidence, recommendation) {
  findings.push({ id, severity, title, evidence, recommendation });
}

const claude = read("CLAUDE.md");
const agents = read("AGENTS.md");
const skill = read(".agents/skills/clinica-control-tower/SKILL.md");
const registry = read("control-plane/playwright-mcp/src/agent-registry.ts");
const agent = read("control-plane/playwright-mcp/src/control-agent.ts");
const tower = read("control-plane/playwright-mcp/src/mcp-tower.ts");
const ads = read("control-plane/playwright-mcp/src/google-ads.ts");
const pkg = read("control-plane/playwright-mcp/package.json");
const ci = read(".github/workflows/control-plane.yml");
const deploy = read(".github/workflows/control-plane-deploy-v2.yml");

if (!claude) {
  finding("HUBBLE-001", "high", "CLAUDE.md ausente",
    "Arquivo CLAUDE.md não encontrado na raiz.",
    "Manter contrato operacional explícito para Claude alinhado a AGENTS.md.");
}

if (!agents || !skill) {
  finding("HUBBLE-002", "critical", "Contrato operacional incompleto",
    "AGENTS.md ou skill clinica-control-tower não encontrado.",
    "Restaurar as regras de operação antes de permitir mudanças arquiteturais.");
}

const specialistIds = [
  "orchestrator",
  "google-ads",
  "gbp",
  "ga4",
  "gsc-seo",
  "cloudflare",
  "github-deploy",
  "whatsapp-leads",
];

if (registry) {
  for (const id of specialistIds) {
    if (!registry.includes(`id: "${id}"`)) {
      finding(`HUBBLE-SPEC-${id}`, "high", `Especialista ${id} ausente`,
        `agent-registry.ts não contém o ID esperado: ${id}.`,
        "Revisar catálogo de especialistas.");
    }
  }
} else {
  finding("HUBBLE-003", "critical", "Registry de especialistas ausente",
    "agent-registry.ts não foi encontrado.",
    "Restaurar registry antes de operar o orquestrador.");
}

if (agent && !/callTool|execute.*specialist|specialist.*execute|handle.*specialist/i.test(agent)) {
  finding("HUBBLE-004", "high", "Orchestrator não demonstra execução de especialistas",
    "control-agent.ts contém planejamento via generateText, mas não há executor de especialistas no mesmo caminho.",
    "Separar plan de execution e criar um executor verificável por especialista.");
}

if (agent && !/intent/i.test(agent)) {
  finding("HUBBLE-005", "medium", "Intent declarativo ausente no runtime",
    "ControlAgent não possui contrato explícito de intent/consequência.",
    "Declarar a consequência esperada antes de uma ação para permitir verificação posterior.");
}

if (tower && !tower.includes('confirm:true obrigatório') && !tower.includes('confirm:true')) {
  finding("HUBBLE-006", "high", "Gate de confirmação não evidente no MCP Tower",
    "mcp-tower.ts não contém a regra textual de confirmação esperada.",
    "Manter confirm=true obrigatório para mutations live.");
}

if (ads && !ads.includes("Explicit confirmation required for live mutation")) {
  finding("HUBBLE-007", "critical", "Google Ads mutation sem confirmação explícita",
    "google-ads.ts não contém a proteção esperada.",
    "Bloquear mutations live sem confirmação explícita.");
}

if (ads && !ads.includes("24146336625")) {
  finding("HUBBLE-008", "high", "Search-2 não está protegido no código",
    "O campaign ID 24146336625 não aparece no módulo de mutação.",
    "Implementar proteção em código para o Search-2 além da regra documental.");
}

if (pkg) {
  const parsed = JSON.parse(pkg);
  if (!parsed.scripts?.test) {
    finding("HUBBLE-009", "high", "Suíte de testes ausente",
      "package.json define build/deploy, mas não possui script test.",
      "Adicionar testes de regressão para auth, mutation gates, Search-2 e contratos.");
  }
}

if (ci && !ci.includes("hubble-audit.mjs")) {
  finding("HUBBLE-010", "high", "CI não executa Hubble",
    "control-plane.yml não chama o auditor Hubble.",
    "Adicionar Hubble como gate de pull request.");
}

if (deploy && !deploy.includes("health")) {
  finding("HUBBLE-011", "medium", "Deploy sem smoke",
    "Workflow de deploy não contém smoke de /health.",
    "Exigir smoke pós-deploy.");
}

if (deploy && !/grep -q/.test(deploy)) {
  finding("HUBBLE-012", "medium", "Smoke de produção estreito",
    "O smoke de deploy valida health/OAuth, mas não prova comportamento do site ou Control Tower.",
    "Adicionar smoke de runtime e checks adjacentes antes de declarar deploy completo.");
}

const summary = findings.reduce((acc, item) => {
  acc[item.severity] = (acc[item.severity] || 0) + 1;
  return acc;
}, { critical: 0, high: 0, medium: 0, low: 0 });

const output = {
  audit: "Hubble",
  version: 1,
  root,
  status: summary.critical ? "BLOCKED" : summary.high ? "NEEDS_WORK" : "READY",
  summary,
  findings,
  generatedAt: new Date().toISOString(),
};

console.log(JSON.stringify(output, null, 2));

const failOn = process.argv.includes("--fail-on=critical") ? "critical"
  : process.argv.includes("--fail-on=high") ? "high"
  : process.argv.includes("--fail-on=medium") ? "medium"
  : null;

const rank = { low: 0, medium: 1, high: 2, critical: 3 };
if (failOn && findings.some((item) => rank[item.severity] >= rank[failOn])) process.exit(1);

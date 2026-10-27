import { readFileSync } from "node:fs";

const files = {
  agents: "AGENTS.md",
  canonicalSkill: ".agents/skills/clinica-control-tower/SKILL.md",
  cursorSkill: ".cursor/skills/clinica-control-tower/SKILL.md",
  integration: "control-plane/docs/INTEGRACAO-CLAUDE-CHATGPT.md",
  readiness: "control-plane/registry/tool-readiness.yaml",
  acceptance: "control-plane/tests/BRAIN-RUNTIME-ACCEPTANCE-2026-10-09.md",
  inventory: "control-plane/registry/INVENTARIO-MOLECULAR-MEMORIA-2026-10-06.md",
};

const contents = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path, "utf8")]),
);
const failures = [];
const pass = (label) => console.log(`PASS  ${label}`);
const fail = (label) => failures.push(label);
const includes = (key, snippet, label) => {
  if (contents[key].includes(snippet)) pass(label);
  else fail(`${label} — missing: ${snippet}`);
};

if (contents.canonicalSkill === contents.cursorSkill) pass("canonical and Cursor skill copies are byte-identical");
else fail("canonical and Cursor skill copies have drifted");

includes("agents", "For **every Clínica operational task**", "AGENTS covers read-only and mutating operational tasks");
includes("agents", "HYPD is retired by the user's explicit decision", "AGENTS records that HYPD is retired");
includes("agents", "Search-2", "AGENTS defines the excluded campaign scope");
includes("canonicalSkill", "HYPD is retired by explicit user decision", "canonical skill excludes HYPD");
includes("canonicalSkill", "active campaign ID `24289443969`", "daily Ads reads are scoped to the active campaign");
includes("canonicalSkill", "## Chat entry-point boundary", "skill explains the ChatGPT context boundary");
includes("integration", "## 2) ChatGPT pessoal Go — Projeto e continuidade", "integration guide uses the Go-eligible Project path");
includes("integration", "HYPD foi retirado", "integration guide excludes HYPD");
includes("integration", "não permite criar novos GPTs personalizados", "integration guide does not recommend an unavailable Go GPT-creation path");
if (contents.integration.includes("**Explore GPTs** → **Create a GPT**")) {
  fail("integration guide still instructs a personal Go user to create a new GPT");
} else {
  pass("integration guide does not prescribe creating a new GPT on personal Go");
}
includes("readiness", "assume_repo_context_loaded_in_chat: false", "readiness marks repository bootstrap as non-automatic");
includes("readiness", "exclude_hypd: true", "readiness excludes HYPD");
includes("readiness", 'daily_cross_channel_report: "partial;', "readiness does not overstate daily-report completion");
includes("acceptance", "## P0 — Continuidade entre conversas e relatório de marketing", "acceptance criteria include a fresh-context continuity test");
includes("inventory", "## 13. AUDITORIA DA CONTINUIDADE ENTRE CONVERSAS", "inventory records root-cause findings");

if (failures.length) {
  console.error(`\nContinuity contract failed: ${failures.length} issue(s)`);
  for (const failure of failures) console.error(`FAIL  ${failure}`);
  process.exitCode = 1;
} else {
  console.log("\nContinuity contract passed. This validates repository consistency only, not a live ChatGPT conversation.");
}

# Repository Verification Run — 2026-10-05

## Scope
Read-only verification of repository identities and first-order fit for the Control Tower registry.

Operating loop: understand -> define done -> plan -> execute -> verify -> critique -> re-verify -> report evidence.

## Guardrails
- No production code changed.
- `main` was not targeted.
- No secrets were read or written.
- Google Ads Search-2 is out of scope.
- Zernio is out of scope.
- No repository was approved for production use from README claims alone.

## Direct GitHub evidence

| Candidate | Repository | Identity | First-order finding | Control Tower disposition |
|---|---|---|---|---|
| JEV | malevrigns/agent-jev | CONFIRMED | Typed-decision gate model; useful as a decision/reflex component, not an autonomous orchestrator. | Candidate |
| Laya | vishalmysore/layaAgent | CONFIRMED | Browser-only agent architecture with System 1/System 2 gating and explicit human approval for side effects. | Candidate |
| MonkeyCode | chaitin/MonkeyCode | CONFIRMED | Enterprise AI development platform with cloud environments, task management, model management and self-hosting. | Candidate |
| FreeLLMAPI | tashfeenahmed/freellmapi | CONFIRMED | OpenAI-compatible aggregation/router across free LLM providers; introduces external-provider and quota dependencies. | Candidate |
| Open-SEO | every-app/open-seo | CONFIRMED | Self-hostable SEO service; README states DataForSEO API dependency. | Candidate |
| Browser Harness | browser-use/browser-harness | CONFIRMED | Browser/CDP control harness with MCP server; high-impact browser capability. | Candidate |
| Ruflo | ruvnet/ruflo | CONFIRMED | Agent meta-harness around Claude Code/Codex with agents, swarms, memory and MCP/CLI layers. | Candidate |
| Superpowers | obra/superpowers | CONFIRMED | Coding-agent methodology/skills layer; complements orchestration rather than replacing it. | Candidate |
| Hermes Agent | NousResearch/hermes-agent | CONFIRMED | Autonomous agent with terminal backends, channels, cron, subagents and memory/skills. | Candidate; high-risk sandbox first |

## Critical critique

Identity is now directly verified for all nine GitHub candidates. That does NOT prove that each is the exact artifact previously discussed in every earlier audit, nor does it prove production suitability.

The Control Tower therefore keeps `approved: false` for all candidates.

The strongest architectural distinction found in this pass:
- JEV/Laya = decision/gating layer.
- Superpowers = engineering workflow/skills layer.
- Browser Harness = browser execution layer.
- Ruflo/Hermes = orchestration/autonomous-agent layer.
- MonkeyCode = development platform/environment layer.
- FreeLLMAPI = model-provider routing layer.
- Open-SEO = SEO execution/data layer.

These are complementary categories, not nine interchangeable agents.

## Next controlled test
For each candidate, the next gate should be a bounded read-only or sandboxed capability test with explicit pass/fail criteria. No production credentials should be supplied until the candidate passes its own test.

## Verdict
PASS — repository identity verification.
INCONCLUSIVE — production suitability and exact equivalence to every historical audit.
NO-GO — automatic production approval at this stage.

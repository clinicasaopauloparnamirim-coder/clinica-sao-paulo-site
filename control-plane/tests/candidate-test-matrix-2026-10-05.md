# Control Tower — Candidate Test Matrix

Date: 2026-10-05
Status: READY FOR CONTROLLED TESTING

## Gate model

1. Identity — repository is the intended public project.
2. Static capability — required interface/docs/config are directly observable.
3. Sandbox execution — run without production credentials or production mutation.
4. Evidence — capture command/output and read back result.
5. Approval — only after repeated PASS.

## Test order

### Gate A — decision layer
**JEV**
- Test: feed a fixed, non-sensitive decision set.
- Expected: structured probability/distribution output without text generation.
- PASS: deterministic schema and documented behavior observed.
- FAIL: output contract or runtime does not match documentation.
- Production access: none.

**Laya**
- Test: reproduce a read-only browser workflow in its local/browser environment.
- Expected: decision gate can HOLD/route steps and side-effect actions require approval.
- PASS: read-only task completes and side-effect gate is demonstrable.
- Production access: none.

### Gate B — engineering workflow
**Superpowers**
- Test: apply its workflow to a disposable change in a test branch.
- Expected: specification -> plan -> implementation -> verification workflow.
- PASS: agent follows workflow without touching production.
- Production access: none.

**MonkeyCode**
- Test: inspect/deploy isolated development environment only.
- Expected: task/environment lifecycle can be exercised without clinic credentials.
- PASS: disposable task reaches validation state.
- Production access: none.

### Gate C — execution
**Browser Harness**
- Test: browser navigation against a harmless public page.
- Expected: CDP/MCP control works; helper generation remains confined to test workspace.
- PASS: navigation/read-only extraction and cleanup verified.
- Production login: forbidden.

### Gate D — orchestration
**Ruflo**
- Test: MCP/CLI read-only initialization and a disposable multi-step task.
- Expected: orchestration works and evidence can be collected.
- PASS: task coordination + termination are verified.
- Production credentials: none.

**Hermes**
- Test: Docker/sandbox profile, read-only task, then deliberate denied side-effect.
- Expected: sandbox boundary and allow-list behavior are observable.
- PASS: task works inside sandbox AND denied action stays denied.
- Production credentials: none.

### Gate E — infrastructure/data
**FreeLLMAPI**
- Test: isolated local/API-compatible endpoint using non-sensitive test key/provider.
- Expected: routing/fallback/usage behavior.
- PASS: request succeeds through documented interface and fallback is observable.
- Production API keys: forbidden.

**Open-SEO**
- Test: self-hosted/read-only SEO query using a disposable DataForSEO credential if required.
- Expected: service starts and returns a bounded SEO result.
- PASS: data path works; no write capability required.
- Production SEO credentials: forbidden.

## Architecture rule

No candidate is installed into the Control Tower core yet.

The first integration candidate must win by evidence, not by popularity, README claims, or previous score.

## Current verdict

READY — test matrix defined.
NOT APPROVED — no candidate has yet passed sandbox execution.

---
name: clinica-control-tower
description: Operate the Clínica São Paulo project with rigorous agent workflows: investigate before acting, define a finish condition, execute only authorized changes, verify the real artifact, critique the result, and iterate until the evidence supports completion.
---

# Clínica Control Tower

This is the project's local operating skill for high-confidence agent work. It adapts the verification-first principles of rigorous agent workflows to this repository and its Control Tower.

## Core rule

Never treat a generated response, successful API call, or plausible diff as proof that the task is finished.

The completion loop is:

1. **Understand** — inspect the repository, current state, relevant integrations, and existing constraints.
2. **Define done** — write concrete acceptance checks before changing anything.
3. **Plan** — identify the smallest safe set of changes and the exact systems affected.
4. **Execute** — make only changes authorized by the task.
5. **Verify** — inspect the real artifact/state after the mutation.
6. **Critique** — actively look for omissions, regressions, collateral changes, and false positives.
7. **Re-verify** — rerun the failed or incomplete checks after correction.
8. **Report evidence** — state exactly what changed, what was checked, and what remains inconclusive.

If evidence is missing, report **INCONCLUSIVE** rather than claiming success.

## Project-specific guardrails

- The repository is the source of truth for the site and Control Tower implementation.
- Preserve existing deployment architecture unless the task explicitly asks to change it.
- Do not change Google Ads campaign **Search-2** unless the user explicitly authorizes that change.
- For authorized Google Ads mutations, validate first when the available action supports validation, mutate, then re-read the affected resource and verify the final state.
- Never expose, commit, echo, or place credentials, OAuth refresh tokens, API keys, Cloudflare tokens, or other secrets in files, logs, prompts, commits, or reports.
- Prefer existing project workflows and documented interfaces over inventing new infrastructure.
- When a task depends on live external data, retrieve the current data before making substantive claims.
- Distinguish observed facts from interpretation and from assumptions.

## Evidence ladder

Use the strongest available evidence:

1. Direct read-back from the mutated API/resource.
2. Real application behavior or smoke test.
3. Automated test/build/typecheck output.
4. Git diff / changed-file inspection.
5. Static reasoning.

Static reasoning alone is never sufficient for a claim that a live mutation succeeded.

## Change protocol

Before a mutation, record internally:

- target resource;
- current state;
- requested end state;
- authorization scope;
- validation command/action;
- post-change read-back;
- rollback or correction path.

After a mutation:

- re-read the target;
- compare actual state with requested state;
- inspect related resources for collateral effects;
- run the narrowest meaningful smoke/evaluation;
- only then report completion.

## Agent delegation

For complex work, split responsibilities instead of pretending one pass is enough:

- **Discovery**: facts, current state, constraints, dependencies.
- **Execution**: performs the authorized change.
- **Verification**: independently checks the real result.
- **Critic**: searches for omissions and regressions.
- **Reporter**: produces the final evidence trail.

For small tasks these roles may be performed by one agent sequentially, but the reasoning stages must still occur.

## Control Tower tasks

For Google Ads, GSC, GA4, Cloudflare, website, SEO, deployment, or competitor-audit tasks:

- collect all relevant current data first;
- do not stop at the first visible result;
- check the adjacent surfaces that materially affect the conclusion;
- for competitors, when requested, check the relevant site, Google Business Profile evidence, social presence, active advertising evidence where available, and auction/ad data where available;
- after any change, verify the changed resource directly;
- include exact scope/time period for metrics.

## Finish-condition template

Before execution, define:

- **Goal**
- **Scope**
- **Allowed mutations**
- **Acceptance checks**
- **Evidence required**
- **Known limitations**

The final response should mirror this:

- **DONE**: exact changes verified.
- **EVIDENCE**: commands/read-backs/results.
- **NOT DONE / INCONCLUSIVE**: anything that could not be verified.
- **NEXT ACTION**: only if something remains.

## Anti-failure rules

Do not:

- claim an action happened because a tool returned without an obvious error;
- say "I audited everything" when only one surface was inspected;
- ask the user to manually verify something that the connected tools can verify directly;
- loop endlessly on the same failed path;
- invent missing data;
- silently broaden a requested mutation;
- report a deployment as live without a real post-deploy smoke check.

The goal is not more activity. The goal is **verified outcomes with an auditable trail**.

---
name: clinica-control-tower
description: Operate the Clínica São Paulo project with rigorous autonomous execution, GAUNTLET LOOP, route alternatives after failures, and verified delivery. Use for engineering, deployments, SEO, marketing, integrations, agents, and Control Tower work.
---

# Clínica Control Tower — Protocolo Mestre

This is the project's canonical operating skill for coding agents and Control Tower work. Follow it instead of treating documentation, planning, or a first failed tool call as the deliverable.

## Core rule: persist until verified

**The job is to deliver the verified outcome, not to narrate why the first route failed.** Keep working through the authorized tools and systems until the acceptance checks pass or a genuinely unavoidable external/human dependency remains. An error is diagnostic evidence, not an automatic stop condition.

Never treat a generated response, successful API call, plausible diff, available adapter, green health endpoint, or documentation page as proof that the requested task is complete.

## Required GAUNTLET LOOP

For each substantial task, repeat this loop until the acceptance criteria pass:

**buscar → confrontar alternativas → testar/revisar → identificar falhas → cruzar com arquitetura → classificar → registrar decisão → repetir**

Operational stages:

1. **Understand** — retrieve the current task, established conversation/project constraints, architecture, current state, and available connected tools.
2. **Define done** — set concrete acceptance checks before mutation. For an agent integration, that means created, authenticated, environment test passed, real task executed, result persisted, and logs reviewed.
3. **Map routes** — inspect relevant APIs, app UI, connectors/MCPs, repository/workflows, available runtimes, provider login methods, and current credentials. Use independent safe routes in parallel when useful.
4. **Plan safely** — select the smallest effective change, identify affected resources, preserve a rollback path, and avoid needless spend.
5. **Execute** — perform authorized mutations directly through the best available path. Do not substitute a list of instructions for an action the connected tools can perform.
6. **Verify** — read back the real destination state and execute the narrowest real-world test of the desired behavior.
7. **Critique** — search independently for missed dependencies, collateral effects, silent failure, untested assumptions, and false positives.
8. **Correct and repeat** — fix any failed check, use a different hypothesis/path when a route fails, and rerun the failed acceptance checks.
9. **Report evidence** — summarize what changed, tests/results, what remains, and only the exact next human action if one is indispensable.

## Autonomy and failure recovery

- **Autonomy by default:** when the user has already authorized the task, use available connected APIs, repositories, services, agents, and secrets managers without asking them to approve every normal step again.
- **Do not stop at the first blocker.** Preserve the error, classify it (authentication, authorization, network, missing runtime, invalid config, provider failure, platform/tool restriction, or application bug), form a new testable hypothesis, and attempt a materially different authorized route.
- **No repetitive loops.** Do not repeat the same unsuccessful call without a new hypothesis. Track attempts and the information gained; stop only when the task is complete or the remaining dependency is demonstrably external.
- **Alternative-route checklist:** as applicable, evaluate the authenticated UI, supported REST/API endpoint, provider's official browser/device auth, another authorized connector, existing worker/MCP, repository workflow/CI, isolated runner/sandbox, existing provider binding, and a safe rollback/redeployment path.
- **Do not hand the task back to the user.** Never ask them to diagnose a system, copy output, run terminal/CLI commands, or send screenshots/prints if an available authorized tool can inspect or change it. Do not require desktop-only work when a mobile-safe route exists.
- **Human action is the last mile, not the first response.** Exhaust safe automation before asking the user to help. If only an interactive step remains (login, MFA, OAuth consent, CAPTCHA, account selection, or a secret only the user possesses), prepare everything else first and request one precise action with a direct URL to the exact screen. Do not give a generic “go read the docs” response. Do not ask the user to expose a password or secret in chat; use the provider's secure login/secret UI.
- **Authorization is not a security bypass.** Broad user authorization supports normal operations on systems the tools actually expose. It does not permit bypassing authentication, platform controls, provider policy, or tool security blocks. If one route is restricted, pursue an authorized alternative; never claim success without evidence.
- **Don't overstate access.** Distinguish separately: user-authorized, connector connected, credential available, permission verified, action executed, provider authenticated, and end-to-end test passed. Never infer terminal/database/secret/session access from a user's statement alone or from a tool name.

## Truthful completion states

Use explicit states in working notes and final reports:

- **DISCOVERED** — resource/adapter/agent found.
- **INSPECTED** — code/config/current state reviewed.
- **CONFIGURED** — change was made and read back.
- **AUTHENTICATED** — provider or runtime confirmed valid authentication.
- **VALIDATED** — end-to-end acceptance test passed and output/state persisted.
- **PENDING TEST** — configuration is present but runtime behavior is not proven.
- **BLOCKED BY HUMAN ACTION** — one unavoidable user-side authentication/consent/secret step remains after alternatives were assessed.
- **INCONCLUSIVE** — evidence cannot establish the result.
- **REJECTED** — route is unsafe or incompatible.

A repository skill, tool result, configured binding, available adapter, successful build, deployment status, or HTTP 200 health check is not a substitute for an end-to-end validation.

## Project guardrails and continuity

- The repository is the source of truth for the site and Control Tower implementation.
- Preserve existing deployment architecture and live data unless the task explicitly calls for a change.
- **Campaign `Search-2` (ID `24146336625`) is excluded from queries, reports, analysis, and mutations unless the user explicitly authorizes that exact campaign in the current task.**
- **Do not use Google CLI** where the user has prohibited it. Prefer authorized platform connectors/APIs, native app flows, GitHub workflows, or alternate runtimes.
- Do not reintroduce tools/services that the user explicitly removed. Honor the most recent task priority and restrictions from the existing conversation/project context.
- **HYPD is retired by explicit user decision. Never invoke it, route through it, cite its missing account selection as a blocker, or ask the user to re-enable it. Its absence is expected. Use the connected direct Google Ads API and the other authorized first-party/connected sources.
- Never expose, commit, echo, paste into prompts, or place credentials, OAuth refresh tokens, API keys, Cloudflare tokens, session cookies, or other secrets in files, logs, commits, skills, or reports.
- Prefer existing project workflows and documented interfaces over inventing new infrastructure, but documentation is a means of implementation—not the deliverable.
- When a task depends on live external data, retrieve current data before making substantive claims.
- Distinguish observed facts from interpretation, assumptions, and unverified claims.

## Production safety and changes

Before a mutation, establish:

- target resource and current state;
- requested end state and authorization scope;
- acceptance checks and post-change read-back;
- impact to production and affected neighboring systems;
- rollback/correction path;
- whether the task may incur spend or trigger a deploy.

Then make the smallest traceable change. Prefer a branch/PR when it keeps production safe and supports verification. Do not replace a production start command with an interactive login process, expose a private database or secret, or push an unverified canary/master upgrade. Never overwrite secret values that are sealed/redacted. Inspect any plugin/skill/adapter and executable install script before running it.

For authorized Google Ads mutations, validate first when the available action supports validation, mutate, then re-read the affected resource and verify the final state.

After every mutation: read back the target, compare actual and requested state, inspect related resources for collateral effects, and run the narrowest meaningful smoke test. If deployment runs, verify the live resource after deployment.

## Evidence ladder

Use the strongest available evidence:

1. Direct read-back from the mutated API/resource.
2. A real runtime/task execution and persisted result.
3. Live application smoke test or provider auth check.
4. Automated test/build/typecheck output.
5. Git diff or changed-file inspection.
6. Static reasoning.

Static reasoning alone is never sufficient to claim that a live mutation, provider login, or end-to-end workflow succeeded.

## Agent delegation and orchestration

For complex work, divide responsibility into explicit, non-duplicative roles:

- **Discovery:** current state, constraints, dependencies, and candidate routes.
- **Execution:** makes the authorized change.
- **Verification:** independently validates the real destination.
- **Critic:** searches for omissions, regressions, and false positives.
- **Reporter:** records evidence and unresolved dependencies.

For small work, one agent may perform these stages sequentially, but must not skip them. Keep context, artifact links, decisions, IDs, test output, and unresolved issues in a durable shared record so later agents do not repeat discovery or contradict previous findings.

For integrations, separately verify adapter exists, runtime is installed, authentication works, tools/workspace are reachable, environment test passes, a real task completes, and Paperclip/Control Tower persists its output. Do not equate “adapter available” with “agent connected.”

Each Control Tower brain/specialist must have a defined role, inputs/outputs, allowed tools, dependencies, and acceptance criteria—not just a name in a registry. Verify routing/pairings and actual inference, not only configured flags.

## Control Tower and marketing tasks

For Google Ads, Search Console, GA4, Cloudflare, website, SEO, social, attribution, deployment, or competitor-audit tasks:

- collect all relevant current data before reaching a conclusion;
- do not stop at the first visible result or audit only one surface when neighboring integrations materially affect the conclusion;
- for competitors, when requested, inspect relevant sites, Google Business Profile evidence, social presence, active advertising evidence where available, and auction/ad data where available;
- after any change, verify the affected resource directly;
- include exact metric scope and time period;
- preserve established clinic facts, local context, pricing, positioning, and user constraints; do not invent results or patient data.

## Finish-condition template

Before execution, define:

- **Goal**
- **Scope**
- **Allowed mutations**
- **Acceptance checks**
- **Evidence required**
- **Known limitations and rollback**

Final response:

- **DONE / STATUS:** exact state, not optimistic language.
- **CHANGED:** actual changes.
- **EVIDENCE:** read-backs/tests/results.
- **NOT DONE / INCONCLUSIVE:** what could not be validated and why.
- **NEXT ACTION:** at most the specific human action that is genuinely unavoidable.

Do not ask the user to manually confirm facts the connected tools can establish. Do not stop working to present unnecessary process narration. Do not claim work continues in the background if no scheduled task/automation exists.

## Standard for completion

Persist until the acceptance criteria pass or a specific external/human dependency is proven unavoidable. A failed route requires investigation and a materially different authorized route—not resignation. The goal is **verified outcomes, with an auditable trail, and the least possible workload handed back to the user**.

## Mandatory continuity and daily marketing workflow

At the start of every Clinic marketing/data run, recover and apply this repository's current state before selecting tools: root `AGENTS.md`, this skill, and the latest continuity/status addendum in `control-plane/registry/`. Treat the registry as state to recover, not as a reason to assume a tool still works; verify access with a real read.

For a daily cross-channel report, run read-only unless the user separately authorized changes:
1. Fix the exact reporting date in the clinic's local timezone (`America/Fortaleza`) and state it in the result.
2. Query direct Google Ads first using the active campaign ID `24289443969` and customer `4603647788`, with a date filter in GAQL. Read campaign totals and, where available, keyword and search-term details for that active campaign. Cross-check totals through an independent GAQL/report route when available. Do not run broad campaign reports that return excluded `Search-2` rows. Use the direct Google Ads Composio route; do not use HYPD. If a batch executor is blocked, issue independent single-source read calls rather than repeating the blocked batch.
3. Read GA4 for the same date: source/medium or campaign attribution, sessions, landing pages, and configured key events/conversions.
4. Read Search Console query and page data for the same date. Respect its normal data lag; mark recent data as incomplete when appropriate. An empty query result alone does not prove zero traffic or non-indexing.
5. Read the existing OpenSEO project, saved keywords, and latest rank-tracker snapshot. Cross-reference the observed Ads terms, organic queries, and landing pages. Do not trigger credit-charging research unless authorized.
6. If a batch/combined execution is blocked, classify the error and try a materially different, permitted route (for example, independent read-only calls). Do not repeat the same blocked call without a new hypothesis. A failure in one source does not cancel the rest of the audit; report that source as blocked/inconclusive and continue where safe.
7. Separate raw source metrics, calculations, interpretation, and unknowns. Label each source as verified, incomplete, blocked, or not checked. Do not invent a comparison baseline when it is unavailable.
8. Do not ask the user for screenshots, copied output, or reconnection when an authorized tool can perform the read. Ask for human action only after available routes have been tested and one specific external dependency is proven unavoidable.

Files and skills in this repository are not automatically loaded by every arbitrary ChatGPT chat. Never claim that editing a repository file, saving a memory, or seeing an ACTIVE connector guarantees future-chat behavior. When a new execution environment is used, explicitly recover these artifacts before acting; if this environment cannot retrieve them, say that continuity was not recovered instead of improvising.


## Chat entry-point boundary

These files are durable project rules, not a global ChatGPT system prompt. A regular chat does not automatically read this repository merely because it exists. In every supported agent/project environment, explicitly load this `AGENTS.md`, this canonical skill, and the latest status registry before choosing a tool. If that bootstrap did not happen, continuity is NOT RECOVERED; do not improvise, ask the user to repeat the history, or claim that prior rules were applied. The default ChatGPT account-level UI configuration cannot be changed through GitHub repository edits.

# Control Tower Gauntlet

The Control Tower uses a Gauntlet Loop for changes that can alter production behavior.

## Required loop

1. Define a concrete finish condition before execution.
2. Capture the current state as the baseline.
3. Build the smallest authorized change.
4. Verify the real artifact/resource.
5. Dispatch an independent critic with fresh context.
6. The critic checks the result against the finish condition and baseline, not against the builder's explanation.
7. If the critic finds a material gap, return to the builder with only the scoped finding.
8. Re-verify the correction.
9. Stop only when the acceptance checks pass or the remaining evidence is explicitly inconclusive.
10. Record evidence: baseline, change, verification, critique, correction, final state.

## Non-negotiable gates

- Never bypass Control Tower policy because a downstream tool accepts the request.
- Never treat an API success response as proof of final state.
- Never allow the builder to be its own final critic.
- Never use a score as the sole exit condition when a concrete comparison is available.
- Never mutate Search-2 without explicit project authorization.
- Never mutate campaign budgets through the normal Control Tower Google Ads path.
- Never expose secrets in prompts, logs, commits, reports, or artifacts.

## Evidence hierarchy

Direct read-back > real smoke test > automated test/build > diff inspection > static reasoning.

If the strongest applicable evidence is unavailable, report INCONCLUSIVE.

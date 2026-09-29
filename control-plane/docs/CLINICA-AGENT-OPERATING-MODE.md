# Clínica Control Tower — Agent Operating Model

This document records the project's verification-first operating model.

It is inspired by the public pstack methodology by Lauren Tan, but is a project-specific implementation rather than a copy of the upstream plugin.

## Lifecycle

1. Understand the real current state.
2. Define an observable finish condition.
3. Plan the smallest safe change.
4. Execute only the authorized mutation.
5. Verify the real artifact/resource.
6. Run an independent critique for omissions and regressions.
7. Correct and re-verify when necessary.
8. Report evidence and limitations.

## Why this exists

The recurring failure mode this prevents is reporting "done" after producing a plausible answer or after a tool call, without proving that the requested state actually exists.

## Project-specific controls

- Search-2 is protected from mutation unless explicitly authorized.
- Secrets never belong in source control.
- Live integrations require current-state reads.
- Deployment claims require post-deploy smoke tests.
- External-data conclusions must identify the relevant time period and scope.

## Skill

Canonical skill:
`.agents/skills/clinica-control-tower/SKILL.md`

Cursor compatibility copy:
`.cursor/skills/clinica-control-tower/SKILL.md`

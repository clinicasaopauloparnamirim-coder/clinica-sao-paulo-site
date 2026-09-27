---
name: control-tower-audit
description: Audit the Control Tower repository, Cloudflare Worker configuration, guardrails, runtime bindings and release readiness without deploying or changing paid settings.
---

# control-tower-audit

## Procedure
1. Inspect repository status, current branch and recent commits.
2. Inspect .gitignore, lockfiles, package manifests, wrangler configuration and all Control Tower workflows.
3. Check secrets handling: no credentials in source, config, logs or generated artifacts.
4. Validate Durable Object bindings, OAuth store references and route imports.
5. Run dependency installation and build/typecheck in a controlled environment.
6. Review deployment triggers and ensure audit work cannot accidentally deploy.
7. Report evidence, blockers, fixes and remaining risks.
## Safety
- Read-only by default.
- Never deploy.
- Never mutate ad budgets.
- Never delete production.
- Preserve unrelated changes.

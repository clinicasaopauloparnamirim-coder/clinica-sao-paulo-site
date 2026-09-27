---
name: github-ci-repair
description: Diagnose and repair GitHub Actions failures while keeping production deployment disabled until validation is complete.
---

# github-ci-repair

## Procedure
1. Read all relevant workflows and the latest failed runs.
2. Identify the first actionable failure in the logs.
3. Fix source/workflow issues with the smallest safe change.
4. Ensure package installation is reproducible and the lockfile is not ignored.
5. Keep deploy workflows manual-only during repair and verification.
6. Validate build/typecheck and inspect the resulting diff.
7. Never merge automatically and never deploy as part of repair.
## Evidence
Record the failing run, failed step, root cause, changed files and validation result.

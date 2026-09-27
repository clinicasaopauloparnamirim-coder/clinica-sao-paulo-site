# Control Tower — Permanent Rules

1. FREE/R$0 first. Prefer free-tier, existing connectors, existing quotas and read-only audits before any paid feature or new infrastructure.
2. Never expose secrets. Never place API keys, OAuth refresh tokens, client secrets, passwords, bearer tokens or private credentials in Git, logs, prompts, screenshots, generated files or public URLs.
3. Never change advertising budget without explicit confirmation. Audit and prepare changes, but do not increase, decrease, enable new spend or create a new payment obligation automatically.
4. Never delete production. Do not delete production resources, data, domains, Workers, campaigns, conversion actions, or tracking configuration as part of routine repair.
5. Never deploy without validation. A deployment requires successful build/test/smoke validation and an explicit deployment action; audits and preparation must remain non-deploying.
6. Always build/test after a change. Run the smallest relevant validation for the changed scope, then the full build before release preparation.
7. Always verify references before removing files. Search code, workflows, configuration, documentation and runtime references before deleting or renaming anything.
8. Prefer official APIs/connectors over browser automation when the official API provides the needed read operation.
9. Treat paid-ad changes as staged artifacts: audit -> prepare -> validate -> explicit activation.
10. Preserve the existing working tree and committed corrections; never overwrite unrelated work.

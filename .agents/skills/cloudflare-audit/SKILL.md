---
name: cloudflare-audit
description: Audit Cloudflare Workers, bindings, routes, secrets usage and MCP readiness without deploying.
---

# cloudflare-audit

## Procedure
1. Inspect wrangler.toml/wrangler.jsonc, Worker entrypoints and Durable Object migrations.
2. Check that secrets are accessed through bindings and are never committed.
3. Verify health, auth and MCP routes in source.
4. Review deploy workflow triggers and smoke tests.
5. Validate types/build before any deployment decision.
## Safety
Never run a deployment during an audit. Report missing runtime configuration instead of inventing it.

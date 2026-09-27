---
name: zernio-control-tower
description: Use the Zernio MCP as the Control Tower's social and connected-account layer. Verify connected accounts before live actions and prefer read-only inspection before mutations.
---

# Zernio Control Tower

Use the `zernio` MCP server configured by this plugin.

## Connection check

First verify the connection by calling the Zernio account-listing tool. A successful result should return the connected platforms/accounts, or explicitly report that none are connected.

## Operating rules

- Use Zernio only through the configured MCP server.
- Do not ask the user to paste an API key into repository files, prompts, commits, or logs.
- Prefer OAuth for interactive Codex use.
- For autonomous use, require a secret supplied outside the repository (for example an environment variable or secret vault).
- Start with read-only account, analytics, and configuration inspection.
- Before any write action, identify the exact target account and resource and request confirmation when the action is consequential.
- Never claim a Google Ads or Google Business Profile connection is live until the Zernio account/tool response confirms it.

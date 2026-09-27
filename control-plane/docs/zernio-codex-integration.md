# Zernio ↔ Codex integration for Control Tower

## Architecture

Control Tower packages the hosted Zernio MCP server as a Codex-compatible plugin:

Codex → Control Tower Zernio plugin → https://mcp.zernio.com/mcp → Zernio connected accounts

The plugin contains no credentials.

## Authentication

Use the Zernio hosted MCP OAuth flow for interactive Codex use. The Zernio server supports OAuth 2.1 with PKCE and dynamic client registration.

Fallback for autonomous agents: use a dedicated Zernio API key supplied through a secret manager or environment variable. Never commit the key to this repository.

## First connection

From the Codex environment:

    codex mcp add zernio --url https://mcp.zernio.com/mcp
    codex mcp login zernio
    codex mcp list

For a plugin-based setup, install/load the Control Tower plugin and then run the same connection/login flow if Codex requests authorization.

## Verification

Ask Codex:

    Use the Zernio MCP and list my connected accounts.

The Zernio documentation identifies `accounts_list` as the connection test. A working connection returns the connected platform/account IDs or `No accounts connected`.

## Google data

After Zernio reports the expected connected Google accounts, use the Zernio tools to inspect Google Ads and Google Business Profile data. Do not infer that those accounts are connected from GitHub access alone.

## Security

No OAuth tokens, refresh tokens, client secrets, Zernio API keys, or Google credentials belong in GitHub. Store secrets outside the repository.

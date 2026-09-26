# Clínica São Paulo — Playwright MCP Control Plane

This Worker is the external browser-agent layer for the clinic project.

- Existing site Worker: serves the clinic site and Page Agent.
- This Worker: runs Cloudflare Browser Run + Playwright MCP.
- Browser automation is isolated from the public site Worker.
- Authentication uses the MCP_AUTH_TOKEN Worker secret.
- No account password/API secret belongs in this repository.

## Deploy

From this directory:

    npm install
    npm run build
    npx wrangler deploy

Create the secret without putting it in Git:

    npx wrangler secret put MCP_AUTH_TOKEN

After deployment the server exposes /sse and /mcp on its workers.dev hostname. The MCP client must send:

    Authorization: Bearer <MCP_AUTH_TOKEN>

## Safe first test

Connect the MCP client to /sse, open https://clinicasaopauloparnamirim.com.br/ and ask it only to read the clinic address.

Do not connect Google Ads or Sheets accounts until browser authentication and permissions are reviewed.

## Security

This browser agent can navigate, click and type on external sites. Keep the endpoint private, use the bearer token, least-privilege account permissions, and never paste credentials into prompts.

Prefer official APIs/connectors for Google Ads/Sheets where available; use browser automation only where the UI is actually required.

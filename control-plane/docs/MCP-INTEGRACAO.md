# Integração MCP — Clínica São Paulo

Dois servidores MCP no mesmo Worker.

## Base

```
https://clinica-sao-paulo-site.clinicasaopauloparnamirim.workers.dev
Authorization: Bearer <MCP_AUTH_TOKEN>
```

| MCP | URL | Uso |
|-----|-----|-----|
| **Control Tower** | `POST/GET /mcp/tower` | Ads, GA4, GSC |
| **Playwright** | `/sse` ou `/mcp` | Browser no site da clínica |

---

## 1) Control Tower MCP (`/mcp/tower`)

### Tools

| Tool | Descrição |
|------|-----------|
| `health` | Status do worker |
| `ads_auth_check` | OAuth Ads ok? |
| `ads_audit` | Campanhas + keywords + conversões 30d |
| `ads_search` | GAQL (`query` string) |
| `ads_mutate` | Mutate (exige `confirm: true`) |
| `ads_batch_mutate` | Batch mutate (`confirm: true`) |
| `ga4_audit` | Key events GA4 |
| `gsc_audit` | Search Console |

### Teste rápido

```bash
TOKEN=seu_mcp_token
BASE=https://clinica-sao-paulo-site.clinicasaopauloparnamirim.workers.dev

curl -sS -H "Authorization: Bearer $TOKEN" "$BASE/mcp/tower"

curl -sS -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' \
  "$BASE/mcp/tower"

curl -sS -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"health","arguments":{}}}' \
  "$BASE/mcp/tower"
```

### Clientes

**Grok / Cursor / Claude Desktop** (exemplo TOML):

```toml
[mcp_servers.clinica-control-tower]
url = "https://clinica-sao-paulo-site.clinicasaopauloparnamirim.workers.dev/mcp/tower"
headers = { "Authorization" = "Bearer SEU_TOKEN" }
enabled = true
```

**Gemini (Interactions API)** — se o cliente aceitar MCP HTTP:

```json
{
  "type": "mcp_server",
  "name": "control-tower",
  "url": "https://clinica-sao-paulo-site.clinicasaopauloparnamirim.workers.dev/mcp/tower"
}
```

(+ credential Bearer no painel Gemini, se disponível)

---

## 2) Playwright MCP (`/sse`)

Browser automation (navigate, snapshot, screenshot, …).  
Preferir só o domínio da clínica. ControlAgent já restringe a read-only + allowlist.

```toml
[mcp_servers.clinica-playwright]
url = "https://clinica-sao-paulo-site.clinicasaopauloparnamirim.workers.dev/sse"
headers = { "Authorization" = "Bearer SEU_TOKEN" }
enabled = true
```

---

## Regras

- Search-2 (24146336625) está PAUSED — não reativar sem pedido explícito
- ALTA INTENÇÃO (24289443969) é a campanha principal
- Mutates: sempre `confirm: true` e pedido claro do dono
- Não publicar o token

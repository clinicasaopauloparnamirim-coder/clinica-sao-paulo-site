# Cloudflare Workers Builds — deploy command

O log de erro `Could not resolve "agents"` acontece quando o **Workers Builds** roda só:

```bash
npx wrangler deploy
```

sem `npm install`.

## Corrigir no dashboard Cloudflare

**Workers & Pages** → projeto conectado ao repo → **Settings** → **Build** → **Deploy command**:

```bash
npm install --prefix control-plane/playwright-mcp && npm install && npx wrangler deploy --config wrangler.jsonc --keep-vars
```

Root directory: `/` (repo root)

## Nome do Worker

- Config: `clinica-sao-paulo-site`
- CI às vezes espera `weathered-tree-2839` e sobrescreve o nome

Prefira o deploy via **GitHub Actions** `Control Plane Deploy V2` (já com secrets e smoke test).

## Assets (site live)

`wrangler.jsonc` publica `./public` como ASSETS. Sem esse deploy, o domínio continua com HTML antigo (Zaraz duplo em cache).

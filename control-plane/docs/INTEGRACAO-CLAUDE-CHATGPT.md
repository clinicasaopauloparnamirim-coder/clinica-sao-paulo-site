# Integração fácil — Claude + ChatGPT (acesso total)

Tempo: ~5 minutos por ferramenta.

## 1) Token (uma vez)

1. Cloudflare Dashboard → Workers → `clinica-sao-paulo-site` → Settings → Variables  
   **ou** GitHub repo → Settings → Secrets → `MCP_AUTH_TOKEN`
2. Copie o valor. Não publique em chat público.

Base URL:
```
https://clinica-sao-paulo-site.clinicasaopauloparnamirim.workers.dev
```

OpenAPI (importar nas Actions):
```
https://raw.githubusercontent.com/clinicasaopauloparnamirim-coder/clinica-sao-paulo-site/main/control-plane/docs/openapi-control-tower.yaml
```

---

## 2) ChatGPT (Custom GPT) — mais fácil

1. Abra https://chatgpt.com → **Explore GPTs** → **Create a GPT**
2. **Configure** → nome: `Clínica SP Control Tower`
3. **Instructions** (cole):

```
Você opera o Control Tower da Clínica São Paulo (Parnamirim/RN).
Customer ID Google Ads: 4603647788.
Use as Actions disponíveis (ads audit, search, mutate, ga4, gsc).
Regras:
- Não altere a campanha Search-2 sem o usuário pedir explicitamente.
- Mutates live: validateOnly=false e confirm=true.
- Responda em português.
- Campanha ALTA INTENÇÃO id 24289443969; Search-2 id 24146336625.
```

4. **Actions** → **Import from URL** → cole o link do OpenAPI acima  
   (ou **Schema** → cole o YAML)
5. **Authentication** → **API Key** →  
   - Auth Type: **Bearer**  
   - API Key: cole o `MCP_AUTH_TOKEN`
6. **Save** → use esse GPT para auditar/criar Ads, GA4, GSC.

Se o import por URL falhar, baixe o YAML do repo e cole em Schema.

---

## 3) Claude (Projeto) — mais fácil

### Opção A — Projeto + você cola resultados (zero bloqueio)

1. Claude.ai → **Projects** → **Create project** → `Clínica SP`
2. **Custom instructions**:

```
Control Tower Clínica São Paulo. Customer 4603647788.
Campanhas: Search-2 (24146336625), ALTA INTENÇÃO (24289443969).
Quando precisar de dados live, peça ao usuário para rodar no Grok/Control Tower
ou use os JSONs que ele colar. Não invente métricas.
Não altere Search-2 sem pedido explícito. Português.
```

3. Anexe o arquivo `openapi-control-tower.yaml` e este guia no Project knowledge.

### Opção B — Claude com conector HTTP (se disponível no seu plano)

1. Settings → Connectors / Custom → **Add**
2. Base URL: `https://clinica-sao-paulo-site.clinicasaopauloparnamirim.workers.dev`
3. Header: `Authorization` = `Bearer SEU_TOKEN`
4. Importe o OpenAPI ou liste os paths do YAML

Se o ambiente Claude bloquear `workers.dev`, peça no Cloudflare um **Custom Domain**:
`control.clinicasaopauloparnamirim.com.br` → Worker `clinica-sao-paulo-site`
e use essa URL no conector.

---

## 4) Teste rápido (qualquer um)

```
GET /health
GET /google/ads/audit
POST /google/ads/search
Body: {"query":"SELECT campaign.id, campaign.name, campaign.status FROM campaign WHERE campaign.status != 'REMOVED'"}
```

---

## Regras de segurança

- Token só no GPT/Connector, nunca no chat de grupo.
- Preferir `adsSearch` e `adsAudit` no dia a dia; `mutate` só com confirmação.
- Não compartilhar `GOOGLE_CLIENT_SECRET` nem refresh tokens — só o Bearer do Worker.

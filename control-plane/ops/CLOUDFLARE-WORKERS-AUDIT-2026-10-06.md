# AUDITORIA MOLECULAR — CLOUDFLARE WORKERS
Data: 2026-10-06
Branch: audit/stack-rebuild-2026-10-06

## 1. Regra de verdade
- código/config presente != Worker atualmente implantado;
- commit histórico != runtime atual;
- endpoint público verificável != acesso administrativo ao Cloudflare.

## 2. Linha do tempo anterior ao OpenManus
2026-09-25 — commit 0cdb0030: primeiro Worker de assets, Wrangler name weathered-tree-2839.
2026-09-26 02:11 — commit 7f328975: Page Agent edge AI Worker, endpoint /api/page-agent/v1/chat/completions, modelo @cf/zai-org/glm-4.7-flash, CORS restrito aos domínios da clínica e limite de 350000 bytes.
2026-09-26 02:11–02:30 — commits d573808b, a7110ddd, 0f8b21d0, 14a86548: bootstrap/locale/upgrade/normalização do Page Agent.
2026-09-26 02:53 — commit 3e44682f: arquitetura com DOIS Workers: site+Page Agent e um Worker separado de Playwright MCP/Browser Run.
2026-09-26 03:17 — commit 7ce19c1d: ajuste do nome do MCP Worker.
2026-09-26 11:18 — commits 2eb7ba6f e e2e41d03: Cloudflare Agents/ControlAgent.
2026-09-26 13:45 — commit fde9b075: Page Agent isolado do site público.
2026-09-26 13:50 — commit 83e0319a: removido public/page-agent-init.js.
2026-09-27 — commit 42160447: canonicalização edge www -> raiz e cache/header no worker.js.

## 3. Topologia atual encontrada
Worker principal configurado no root wrangler.jsonc: clinica-sao-paulo-site.
Entry point atual: control-plane/playwright-mcp/src/index.ts.
Esse Worker concentra site estático, Control Tower, MCP, Google Ads/GA4/GSC, webhook WhatsApp, agentes e rotas de browser.
Bindings/DOs atuais: WHATSAPP_LEDGER, MCP_OBJECT, CONTROL_AGENT, GOOGLE_OAUTH_STORE; AI e BROWSER.

## 4. Durable Objects
1. WhatsAppLedger — persiste mensagens/eventos do webhook e dados de referral/CTWA quando disponíveis.
2. PlaywrightMCP — camada Browser Run/Playwright MCP.
3. ControlAgent — agente persistente, Workers AI, orchestration e browser somente leitura com allowlist.
4. GoogleOAuthStore — estado persistente de OAuth Google.

## 5. Achado crítico que estava invisível
worker.js existe na raiz hoje, mas NÃO é o entry point atual. É código legado/alternativo de entrega de assets, redirect www -> raiz, cache e security headers.
Risco: um agente ou humano pode interpretar esse arquivo como Worker em produção e reativar uma arquitetura antiga.
Classificação: P1.

## 6. Segunda duplicidade
control-plane/playwright-mcp/wrangler.toml também descreve o Worker clinica-sao-paulo-site e repete AI, BROWSER e os quatro DOs.
O pipeline oficial usa o root wrangler.jsonc.
Risco: duas fontes de configuração podem divergir.
Classificação: P1.

## 7. Falhas de observabilidade
Não há, nesta sessão, acesso administrativo verificável ao inventário da conta Cloudflare.
Logo não posso provar quantos Workers existem no painel, quais estão ativos, routes, custom domains, schedules, triggers ou consumo.
O endpoint workers.dev usado no smoke test não foi acessível pelo navegador desta sessão; o domínio público da clínica respondeu.

## 8. Segurança atual observável no código
MCP/control protegido por MCP_AUTH_TOKEN.
Cookie de controle: Secure, HttpOnly, SameSite=Strict.
Webhook WhatsApp suporta validação HMAC.
ControlAgent navega somente nos hosts da clínica e usa ferramentas de browser read-only.
Mutações Google Ads exigem confirm=true e passam pelo judgment gate; Search-2 é bloqueado.
Headers: nosniff, SAMEORIGIN, referrer-policy e permissions-policy.

## 9. Riscos adicionais
workflow control-plane-deploy-v2.yml executa npx tsc --noEmit || true; portanto typecheck pode falhar sem bloquear o deploy.
O deploy automático centraliza o Worker para mudanças em public/**, wrangler.jsonc e control-plane.

## 10. Veredito
Comprovado: houve Worker inicial de assets; Page Agent edge; arquitetura de dois Workers com Playwright MCP; isolamento/remoção do Page Agent público; criação de ControlAgent; consolidação atual em um Worker principal com Durable Objects.
Não comprovado: se weathered-tree-2839 ainda existe na conta; se o antigo Worker separado clinica-sao-paulo-playwright-mcp ainda existe; se Page Agent está ativo em produção; inventário administrativo completo da conta.

## 11. Gate final
Para fechar 100% do Cloudflare, é necessária evidência administrativa da conta: Workers/Pages, deployments, routes, custom domains, vars/secrets, bindings, Durable Objects, cron/triggers, queues, KV/R2/D1, logs e consumo.
Sem isso, dizer que 'todos os Workers estão ativos/conectados' seria inventar.
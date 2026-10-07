# AUDITORIA MOLECULAR — CLOUDFLARE WORKERS / CONTROL TOWER
Data: 2026-10-07
Branch: audit/stack-rebuild-2026-10-06

## 0. Método executado — GAUNTLET LOOP
1. Buscar: histórico de commits, branches, arquivos de configuração e runtime code.
2. Confrontar: estado atual vs histórico e vs Constitution/Agent Rules.
3. Testar/revisar: simulações estáticas de guards, comparação com branch de policy-kernel e consulta à documentação atual do Cloudflare.
4. Identificar falhas: divergências de escopo, gates, configuração, versões e observabilidade.
5. Cruzar com arquitetura: Worker central, Durable Objects, Agents, MCP, Browser Run, Google OAuth, WhatsApp.
6. Classificar: P0/P1/P2 conforme impacto.
7. Registrar decisão: nenhuma alteração na main; evidências gravadas nesta branch de auditoria.
8. Repetir até não surgirem novos candidatos relevantes nesta superfície.

Regra de verdade:
- código/config presente != Worker atualmente implantado;
- commit histórico != runtime atual;
- API/tool success != estado final;
- sem read-back administrativo do Cloudflare, inventário da conta permanece INCONCLUSIVO.

## 1. Linha do tempo dos Workers
2026-09-25 — 0cdb0030: primeiro Worker de assets, Wrangler name weathered-tree-2839.
2026-09-26 02:11 — 7f328975: Page Agent edge AI Worker, endpoint /api/page-agent/v1/chat/completions, Workers AI com @cf/zai-org/glm-4.7-flash.
2026-09-26 02:11–02:30 — d573808b, a7110ddd, 0f8b21d0, 14a86548: bootstrap/locale/upgrade/normalização do Page Agent.
2026-09-26 02:53 — 3e44682f: Worker separado de Playwright MCP/Browser Run, isolado do Worker do site.
2026-09-26 03:17 — 7ce19c1d: ajuste de nome do MCP Worker.
2026-09-26 11:18 — 2eb7ba6f + e2e41d03: Cloudflare Agents/ControlAgent.
2026-09-26 11:19 — f81bba4e: ControlAgent conectado ao Playwright MCP via RPC.
2026-09-26 11:55 — c0821616: package voltou de 1.1.1 para 0.0.5 porque 0.0.5 era a versão publicada usada pelo projeto naquele momento.
2026-09-26 13:45 — fde9b075: Page Agent isolado do site público.
2026-09-26 13:50 — 83e0319a: removido public/page-agent-init.js.
2026-09-27 — 42160447: canonicalização www -> raiz e cache/header no worker.js.
2026-09-26–10-03 — consolidação no Worker central com Control Tower, MCP, Google, WhatsApp e Durable Objects.

## 2. Topologia atual do código
Root wrangler.jsonc:
- name = clinica-sao-paulo-site
- main = ./control-plane/playwright-mcp/src/index.ts
- AI binding
- BROWSER binding
- ASSETS binding
- run_worker_first para /, /index.html e /api/*
- Durable Objects: WhatsAppLedger, PlaywrightMCP, ControlAgent, GoogleOAuthStore.

Rotas no Worker principal incluem:
- /health
- /control/*
- /control/agents
- /agents/*
- /sse
- /mcp
- /mcp/tower
- /google/ads/*
- /google/ga4/*
- /google/gsc/audit
- /webhooks/whatsapp

## 3. Durable Objects auditados
1. WhatsAppLedger
   - grava messages e events no armazenamento persistente;
   - inclui texto, sender, ids, referral/CTWA e raw payload.
2. PlaywrightMCP
   - camada do servidor MCP/Browser Run.
3. ControlAgent
   - Agent persistente sobre Durable Object;
   - Workers AI;
   - planejamento/orchestration;
   - browser tools somente leitura no domínio da clínica.
4. GoogleOAuthStore
   - estados OAuth temporários;
   - refresh tokens Google persistidos.

## 4. P0 — BUG DE SEGURANÇA DE ESCOPO NO ADS MUTATE
A Constitution determina:
- somente campanha ALTA INTENÇÃO 24289443969;
- Search-2 fora de escopo;
- nunca mutar budget pela rota normal do Control Tower.

Porém o runtime principal em mcp-tower.ts chama runAdsMutateJudgment() com:
campaignId = "24289443969"
independentemente dos IDs presentes em operations.

O mesmo runtime expõe resource = "campaignBudgets".

google-ads.ts apenas verifica:
- 1–100 operations;
- confirm=true para live;
- resource permitido.

Ele NÃO extrai os campaign IDs das operations e NÃO bloqueia campaignBudgets.

Resultado de teste estático controlado:
- operation apontando para Search-2 + confirm=true -> gate local recebe ALTA INTENÇÃO, não o ID real da operation, então não bloqueia pelo ID.
- operation de budget + confirm=true -> gate local não contém regra de bloqueio de budget.
Isso é incompatível com a Constitution e com a regra operacional permanente.

Existe uma implementação mais forte no branch feat/control-tower-browser-harness-gauntlet/control-plane/policy-kernel.ts que:
- extrai campaign IDs das operations;
- bloqueia Search-2/retired;
- bloqueia campanhas fora de escopo;
- bloqueia qualquer budget mutation.

Esse policy-kernel NÃO existe na main.
Classificação: P0 — BLOQUEADO até uma proteção equivalente estar realmente ligada ao caminho de mutate e revalidada por read-back/teste.

## 5. P0/P1 — GOVERNANÇA MAIS FORTE EXISTE EM BRANCH, NÃO NA MAIN
Encontrados em branches de auditoria:
- control-plane/GAUNTLET.md
- control-plane/policy-kernel.ts
- control-plane/policy-kernel.test.ts
- control-plane/hubble/hubble-audit.mjs

Na main esses arquivos não estão presentes.

O GAUNTLET de branch especifica evidence hierarchy e proíbe builder de ser seu próprio critic.
O Hubble identifica, entre outros pontos, que o ControlAgent planeja especialistas mas não demonstra executor.

Classificação: P1 — governança projetada não está consolidada no caminho principal.

## 6. P1 — CONTROLAGENT É ORQUESTRADOR DE PLANO, NÃO EXECUTOR DE ESPECIALISTAS
agent-registry.ts declara especialistas:
orchestrator, google-ads, gbp, ga4, gsc-seo, cloudflare, github-deploy, whatsapp-leads.

ControlAgent /orchestrate usa Workers AI para escolher IDs e produzir plano.
No caminho atual não existe executor que pegue esses IDs e efetivamente despache as operações dos especialistas.
O próprio Hubble branch detectou esse gap.

Conclusão: "orquestração" existe como planejamento LLM, não como dispatcher comprovado de ponta a ponta.
Classificação: P1.

## 7. P1 — DUPLICIDADE DE CONFIGURAÇÃO WRANGLER
Existem:
- root wrangler.jsonc — source utilizado pelo workflow oficial;
- control-plane/playwright-mcp/wrangler.toml — descrição paralela do Worker.

O wrangler.toml interno não define ASSETS como o root config faz.
Um deploy manual pelo diretório interno pode divergir do pipeline oficial e quebrar serving estático ou routing.
Classificação: P1 alto.

## 8. P1 — DEPENDÊNCIAS ATRASADAS / DIVERGÊNCIA DE RELEASE
Código atual fixa:
- agents 0.24.0;
- ai 7.0.114;
- wrangler 4.68.0;
- workers-ai-provider 4.0.0;
- @cloudflare/playwright-mcp 0.0.5.

Estado atual consultado:
- agents 0.26.0 no npm;
- ai 7.0.122+ no npm;
- wrangler 4.146.0 no npm na consulta mais recente;
- workers-ai-provider 4.0.0 continua corrente.
- documentação Cloudflare de Playwright MCP informa v1.1.1 como release atual, mas o npm consultado ainda mostra 0.0.5.

Conclusão: há drift claro em agents/ai/wrangler. Para Playwright MCP existe divergência entre docs de release e artefato npm; não atualizar cegamente até verificar o artefato oficial publicado.
Classificação: P1 de manutenção/risco de compatibilidade.

## 9. P1 — TYPECHECK NÃO BLOQUEIA DEPLOY
Workflow atual:
npx tsc --noEmit || true

Portanto falha de TypeScript pode não impedir deploy.
O smoke atual testa /health e checks simples do public/index.html, não a semântica completa de ControlAgent/MCP/Ads guards.
Classificação: P1.

## 10. P1 — OAUTH GOOGLE EXPOSTO FORA DO CONTROL AUTH
As rotas /google/oauth/start e /google/ads/oauth/start não passam pelo guard /control.
O callback grava o refresh token no GoogleOAuthStore após validação de state.

A validação de state reduz CSRF, mas não existe no código mostrado um vínculo do state a uma sessão autenticada de operador.
Isso deixa a superfície de autorização mais aberta do que o restante do Control Tower.
Classificação: P1 de hardening; requer threat-model/teste de OAuth antes de confiar no endpoint como superfície privada.

## 11. P1 — RETENÇÃO DE LEADS/PII NO WHATSAPP LEDGER
WhatsAppLedger grava:
- from;
- text;
- message id;
- referral;
- raw payload.

Não há TTL/retention policy visível no código auditado.
Isso cria retenção potencialmente indefinida de dados de conversa.
Classificação: P1 de privacidade/LGPD e governança de dados.

## 12. P2 — worker.js LEGADO
worker.js continua no root, porém o Worker atual aponta para control-plane/playwright-mcp/src/index.ts.
O arquivo antigo contém redirect/cache/security headers e é parte da história do edge Worker.
Classificação: P2 de dívida/ambiguidade; não remover até confirmar se alguma automação externa ainda depende dele.

## 13. P2 — PAGE AGENT PÚBLICO FOI REMOVIDO
A história mostra que o Page Agent Edge existiu e depois:
- foi isolado do site público;
- public/page-agent-init.js foi removido.
Não há evidência atual no main de que o Page Agent público esteja ativo.
Classificação: histórico confirmado, não runtime atual.

## 14. O QUE NÃO FOI POSSÍVEL PROVAR
Não existe nesta sessão um conector administrativo Cloudflare exposto para listar a conta.
Não posso provar:
- quantidade real de Workers na conta;
- existência atual do antigo weathered-tree-2839;
- existência atual do Worker separado clinica-sao-paulo-playwright-mcp;
- deployments/versions ativos;
- routes;
- custom domains;
- cron/triggers;
- secrets/vars atuais;
- uso/consumo;
- queues/KV/R2/D1.

O teste direto de URL pelo navegador/contêiner também não pôde resolver os hosts workers.dev/DNS nesta sessão.
Logo o estado administrativo Cloudflare permanece INCONCLUSIVO.

## 15. VEREDITO FINAL DO LOOP
A busca parou nesta superfície porque os novos candidatos encontrados passaram a ser variações/documentação dos mesmos componentes, e não novos Workers independentes comprovados.

Achados principais:
- P0: mutation scope/budget guard não é robusto no runtime principal.
- P1: policy-kernel/Hubble/Gauntlet existem em branches, mas não na main.
- P1: ControlAgent planeja especialistas, mas executor end-to-end não foi demonstrado.
- P1: duas configs Wrangler.
- P1: dependency drift.
- P1: typecheck não bloqueante.
- P1: OAuth surface mais aberta que o Control Tower.
- P1: retenção de dados WhatsApp sem TTL visível.
- P2: worker.js legado.

Nenhuma mutação foi feita na main durante esta auditoria.

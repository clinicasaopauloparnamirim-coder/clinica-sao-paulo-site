# Testes de aceitação do runtime — 3 cérebros

Data: 2026-10-09

## Regras de status

- `PASS`: execução real e resultado conferido na fonte.
- `FAIL`: teste executado e requisito não atendido.
- `BLOCKED`: acesso/consentimento/serviço necessário indisponível.
- `INCONCLUSIVE`: falta evidência suficiente.
- `configured-unverified`: segredo/configuração presente, sem inferência ou transação de teste validada.
- `design-only`: apenas documentação/código de planejamento, sem runtime independente.

Conexão ativa, repositório existente, endpoint de saúde verde, prompt detalhado ou CI verde isoladamente não promovem um cérebro para PASS.

## P0 — Harness / registro

1. `GET /health` público deve retornar somente `{"ok":true}`, sem inventário de agentes, status de provedores ou flags de configuração. `GET /control/health` exige autenticação para expor diagnóstico detalhado.
2. `GET /control/architecture` autenticado deve expor a arquitetura operacional vigente e seus estados de prontidão com motivo.
3. O workflow de deploy falha se `/health` público retornar campos extras ou se `/control/health` permitir acesso sem autenticação; contagens de arquitetura não devem ficar na resposta pública.
4. `npm install && npm run build` dentro de `control-plane/playwright-mcp` precisa passar antes do merge.
5. CI/smoke de rotas protegidas deve passar após o deploy autorizado.
6. `/orchestrate` deve distinguir plano de execução, identificar executor real e não declarar tool call concluída sem um resultado.

## P0 — ferramenta e identidade de execução

Para qualquer cérebro:
1. declarar ferramenta exata (tool slug), conta ativa e schema;
2. executar uma ação mínima sem efeitos colaterais;
3. validar saída/schema e registrar evidência;
4. executar teste negativo de acesso/escopo;
5. ler novamente estado da fonte, quando aplicável;
6. parar após duas falhas consecutivas da mesma etapa, registrar blocker e não repetir em loop.

## Matriz de aceitação — arquitetura consolidada

| Cérebro | Funções agrupadas | Critério mínimo de PASS | Estado de referência |
|---|---|---|---|
| Control Tower | Orquestração, pesquisa, JEV/Laya/Nemotron, red team, julgamento, memória, política e GAUNTLET LOOP | Plano → ferramenta autorizada → resultado verificado e registrado; acesso não autenticado bloqueado | Parcial; execução e credenciais integradas ainda exigem reteste |
| Marketing Growth | SEO, Google Ads, GA4, Search Console, Perfil da Empresa, Instagram, WhatsApp e atribuição | Ler fontes reais, separar eventos técnicos de leads e comprovar atribuição sem alterações de campanha ou publicações | Parcial; leituras reais existem, funil ponta a ponta não comprovado |
| Engenharia e Segurança | Código, GitHub, Cloudflare, webhook, segredos, CI/CD e recuperação | Build/typecheck, remoção de binding inseguro, testes negativos do webhook, smoke das rotas protegidas e leitura pós-deploy | Bloqueado até rotação da chave NVIDIA e comprovação do deploy |


## Testes de integração já executados (09/10/2026)

| Integração | Resultado | Evidência |
|---|---|---|
| Worker Control Tower health | PASS | `ok:true`; judgment providers Jev/Laya falsos; NVIDIA configurado |
| Google Ads direto (Composio) | PASS para leitura | Query de leitura limitada à campanha `24289443969`, estado ENABLED |
| Google Ads via Worker | BLOCKED | OAuth `400 invalid_grant`; exige consentimento humano |
| GSC direto | PASS | propriedades de domínio e URL autorizadas |
| GA4 direto | PASS | nove eventos-chave retornados |
| GA4 via Worker | FAIL | falha de refresh token `502` |
| GSC via Worker | FAIL | falha de refresh token `502` |
| OpenSEO `LIST_PROJECTS` | PASS | dois projetos para o domínio |
| OpenSEO → GA4, ambos projetos | FAIL | `ga4_not_connected` |
| Jev via Composio | FAIL/BLOCKED | sem conexão ativa reconhecida para toolkit Jev |
| Instagram profile/media insights | PASS (read-only) | Composio ACTIVE; perfil oficial 3.723 seguidores/74 publicações; media insights e dados por cidade retornaram |
| Instagram snapshot → ControlAgent | DEPLOYED / PENDING RUNTIME | main já recebeu bridge REST autenticada + OpenAPI; falta sincronizar o catálogo Composio e executar write/read, negativa de escopo e consumo por marketing_brief |
| Meta Ads | BLOCKED | sem conexão ativa e leitura de campanha confirmada |
| GitHub workflows | PASS | workflows recentes do Control Plane completados |
| Cloudflare direto | FAIL anterior | formato inválido do `X-Auth-Key`; conexão separada Cloudflare MCP ativa não valida esse conector |

## Critério de liberação

Nenhuma publicação de código em produção e nenhuma mutação de campanhas devem ser aprovadas apenas porque um teste unitário passou. Merge/deploy requer review do diff e CI verde; mudança de Ads requer escopo explícito, simulação quando disponível, autorização do usuário e verificação de leitura após a mudança.

Campanha aprovada de Ads: `24289443969` (ALTA INTENÇÃO). Campanha `Search-2` permanece fora do escopo de análise e mutação.

## Novos testes necessários após deploy autorizado

1. Gerar link via `google_oauth_start`, concluir consentimento do titular e validar `ga4_audit` + `gsc_audit` sem HTTP 502.
2. Gerar link via `ads_oauth_start`, concluir consentimento e confirmar que callback valida o `state` guardado e rejeita estado expirado/alterado. Não alterar campanhas durante o teste.
3. Executar `nvidia_test` e exigir HTTP 2xx + conteúdo `NIM_OK`; chave configurada não basta.
4. Executar `agent_pair_test` com estado sintético e registrar qual provedor respondeu. Se Jev/Laya falhar, não promover o cérebro para verde.
5. Executar `marketing_brief` para tema sintético e validar duas variantes, todos os estágios do funil, `published=false`, `media_assets_generated=false` e revisão humana requerida.
6. Confirmar que o toolkit Composio sincroniza as novas tools MCP. Tool no servidor que não aparece no cliente deve continuar marcada como indisponível nesse caminho.
7. Após refresh do esquema OpenAPI no Composio, executar `marketingSocialSnapshotWrite` com o perfil oficial e dados sanitizados; conferir contagens; executar `marketingSocialSnapshotRead` e validar perfil/captura.
8. Repetir `marketingSocialSnapshotWrite` com username fora do escopo e exigir HTTP 403; testar payload acima de 24.000 caracteres e exigir HTTP 413. Verificar também que chamadas sem bearer são rejeitadas.
9. Executar `marketingBrief` com tema não sensível; confirmar `instagram_context.available=true`, frescor correto e `published=false`. Não publicar nada durante a aceitação.


## P0 — Continuidade entre conversas e relatório de marketing (2026-10-27)

### Critérios obrigatórios do teste
1. A conversa/ambiente de execução nova recupera o estado operacional da Clínica antes de selecionar ferramentas; não depende de o usuário repetir a história.
2. O relatório de ontem resolve a data em `America/Fortaleza` e consulta diretamente a conta Google Ads `4603647788`, campanha em escopo `24289443969`, sem HYPD e sem consultar `Search-2`.
3. GA4, Search Console e OpenSEO são consultados independentemente para a mesma janela. Um bloqueio numa execução em lote exige chamadas individuais seguras, não repetição da mesma chamada bloqueada.
4. O resultado lista cada fonte e seu estado `VERIFIED / INCOMPLETE / BLOCKED / NOT CHECKED`; inclui evidências e separa dados medidos de interpretação.
5. O teste falha se o agente pedir print, pedir reconexão antes de tentar a rota direta, inventar números, declarar conclusão sem read-back, ou afirmar que as instruções do GitHub são automaticamente carregadas por todo chat.
6. A leitura real confirma que HYPD não foi chamado e que o relatório não incluiu a campanha excluída `Search-2`.

### Estado observado nesta auditoria
- Direct Google Ads in a single conversation: **PASS (read-only)** for 2026-10-26; two independent routes agreed on the active campaign totals.
- Repository policy entry points: **PARTIAL** before correction. The root `AGENTS.md` scope was mostly repository-changing tasks, and the canonical/mirrored skill copies diverged after an earlier edit.
- ChatGPT Go Custom GPT path: **REJECTED for new personal GPT creation** per current OpenAI Help Center eligibility; the guide has been corrected to stop recommending it.
- ChatGPT Project as cross-conversation context: **NOT CONFIGURED / NOT VERIFIED** by the available tools.
- End-to-end same-date report across Google Ads + GA4 + Search Console + OpenSEO: **INCONCLUSIVE / NOT VALIDATED**.
- Automatic loading of repository instructions into arbitrary new ChatGPT chats: **NOT AVAILABLE THROUGH THESE REPOSITORY TOOLS**; repository changes cannot establish this.
- Control Tower Worker daily cross-channel route: **NOT VALIDATED**; the published OpenAPI does not expose one date-scoped four-source report and the Ads OAuth path was previously observed failing `invalid_grant`.

A green repository contract test only proves that the repository's duplicate instructions and status claims remain aligned. It does not prove that ChatGPT loaded the files, selected the right tools, or completed a live marketing report.

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

1. `GET /health` deve reportar `brain_count:3`, `capability_count:21` e `autonomous_function_count:20`.
2. `GET /control/architecture` autenticado deve expor três definições e estados de prontidão com motivo.
3. O workflow de deploy falha se o runtime retornar qualquer contagem diferente de três cérebros.
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

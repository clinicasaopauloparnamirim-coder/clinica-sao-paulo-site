# Testes de aceitação do runtime — 9 cérebros

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

1. `GET /health` deve reportar `brain_count:9`, `capability_count:21` e `autonomous_function_count:20`.
2. `GET /control/architecture` autenticado deve expor nove definições e estados de prontidão com motivo.
3. O workflow de deploy falha se o runtime retornar oito cérebros.
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

## Matriz de aceitação

| Cérebro | Teste mínimo PASS | Situação inicial desta auditoria |
|---|---|---|
| 1 Commander | Plano válido → tool dispatcher executa ferramenta permitida → output gravado/verificado | Parcial; o endpoint atual produz planos, não despacha diretamente Composio |
| 2 Control Tower | Health + arquitetura + ledger + política de escopo passarem | Parcial; Worker health passa, os OAuth internos de Ads/GA4/GSC falham |
| 3 Researcher | Coletar ao menos duas fontes e preservar citações/contradições | Inconclusivo como runtime autônomo |
| 4 Engineer | Branch isolada, patch, build/typecheck e PR com CI verde | CI funciona; agente de código autônomo não comprovado |
| 5 SEO | Consulta GSC/OpenSEO real e auditoria reproduzível | Parcial; GSC e OpenSEO direto funcionam; OpenSEO GA4 desconectado |
| 6 Ads | Consulta apenas campanha ativa, saída reconciliada com fonte; nenhuma mutação não aprovada | Parcial; Google Ads direto responde, OAuth do Worker exige reautorização |
| 7 Marketing/Growth | Conteúdo/variantes + snapshot Instagram persistido/read-back + revisão + eventos + lead qualificado + jornada downstream | Parcial; Instagram read APIs funcionam, ponte persistente exige deploy/testes negativos, Meta Ads e funil completo pendentes |
| 8 Red Team/Judge | Teste contraditório falha solução ruim e bloqueia ação não permitida | Bloqueado como serviço independente; regras locais de segurança existem |
| 9 NVIDIA | Inferência NIM com status 2xx, resposta não vazia, assertion de saída e métrica de latência | Configurado, mas inferência ainda não comprovada por saída desta auditoria |

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


## Atualização de execução — 2026-10-10

### Estado confirmado em produção

- SHA de `main`: `df9bb3f9d89065c7b5e6dbcee73c440a9e82f22b`.
- [Deploy V2 #38011333014](https://github.com/clinicasaopauloparnamirim-coder/clinica-sao-paulo-site/actions/runs/38011333014): concluído com sucesso; instalação, typecheck, deploy, smoke test, verificação Zaraz e rotas protegidas concluídos.
- [Control Plane push #38011333005](https://github.com/clinicasaopauloparnamirim-coder/clinica-sao-paulo-site/actions/runs/38011333005): concluído com sucesso.
- Leitura live de `CUSTOM_CONTROL_TOWER_HEALTH`: `ok=true`, autenticação configurada, NVIDIA configurado para `nvidia/nemotron-3.5-lightning-30b-a3b`; JEV não configurado e LAYA configurado, mas isso não prova inferência de nenhum deles.
- Leitura live de `INSTAGRAM_GET_USER_INFO`: perfil `@clinicasaopauloparnamirim`, 3.723 seguidores, 1.813 seguindo e 74 mídias. Sem efeitos colaterais.

### MarketingGrowth — status por caminho

| Capacidade | Status | Evidência/limite |
|---|---|---|
| REST autenticado `POST /marketing/social-snapshot` + read-back | PASS, conforme testes de produção registrados na execução de 2026-10-10 | Snapshot sanitizado persistido e relido; não confundir com sincronização recorrente. |
| Rejeição de bearer inválido | PASS | HTTP 401 observado no teste de produção. |
| Rejeição de perfil fora do escopo | PASS | Username não autorizado rejeitado no teste de produção. |
| Payload excessivo >24.000 caracteres | INCONCLUSIVE no nível da aplicação | Proxy pode rejeitar antes do Worker; não promover para PASS sem evidência da resposta emitida pela aplicação. |
| `POST /marketing/brief` com contexto social | PASS para fluxo seguro com fallback | Contexto disponível/fresco, duas variantes, sete etapas, revisão humana obrigatória, `published=false`, `media_assets_generated=false`. |
| Geração autônoma pelo modelo | FAIL / degradado | Saídas anteriores continham geografia não solicitada, metas sem base, placeholders e caracteres de outro idioma; no último teste conhecido, o modelo foi rejeitado e o fallback determinístico foi usado. |
| Operações MarketingGrowth no catálogo Composio | BLOCKED | Nova busca `tool_search` em 2026-10-10 retornou ferramentas genéricas do Control Tower, mas não retornou operações de social snapshot nem marketing brief. Conexão ACTIVE não equivale a sincronização do catálogo. |
| Inferência NVIDIA/Nemotron | INCONCLUSIVE | Health confirma configuração; nenhuma saída de inferência validada nesta rodada. |
| Instagram publishing / Meta Ads | Não executado | Nenhuma publicação nem mutação de anúncios realizada. |

### Próximas ações técnicas

1. Atualizar/sincronizar a definição do custom MCP no Composio e repetir descoberta das operações existentes; não duplicar endpoints REST.
2. Testar inferência NIM com resposta não vazia e assertion explícita; não promover com base em configuração/health.
3. Melhorar a saída do modelo com schema/JSON estruturado ou contrato equivalente, com testes de aceitação para idioma, geografia, alegações comerciais e fallback; manter publicação desativada.
4. Executar o briefing novamente via caminho REST autenticado e validar read-back/contexto após a correção.
5. Não alterar campanhas, orçamento, lances, palavras-chave nem publicar conteúdo.

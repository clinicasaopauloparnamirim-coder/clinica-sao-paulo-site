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
| 7 Marketing/Growth | Conteúdo/variantes + revisão + eventos + lead qualificado + jornada downstream | Parcial; dados diretos existem, Meta/Instagram e o funil completo ainda não |
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
| Meta Ads/Instagram | BLOCKED | contas não ativas na listagem |
| GitHub workflows | PASS | workflows recentes do Control Plane completados |
| Cloudflare direto | FAIL anterior | formato inválido do `X-Auth-Key`; conexão separada Cloudflare MCP ativa não valida esse conector |

## Critério de liberação

Nenhuma publicação de código em produção e nenhuma mutação de campanhas devem ser aprovadas apenas porque um teste unitário passou. Merge/deploy requer review do diff e CI verde; mudança de Ads requer escopo explícito, simulação quando disponível, autorização do usuário e verificação de leitura após a mudança.

Campanha aprovada de Ads: `24289443969` (ALTA INTENÇÃO). Campanha `Search-2` permanece fora do escopo de análise e mutação.

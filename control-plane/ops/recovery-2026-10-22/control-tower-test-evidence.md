# Control Tower — Evidências de teste (2026-10-22)

Este arquivo lista cada teste executado nesta rodada, com a ferramenta usada, o escopo, o resultado observado e a limitação. Não contém segredos. Valores de chave, token ou segredo foram usados apenas por referência e não foram impressos.

Horários estão no fuso de Brasília (UTC-3), conforme os registros das chamadas.

## 1. GitHub (conector `gh`)

| Horário | Teste | Resultado |
|---|---|---|
| 23:37 | `gh auth status` | Autenticado na conta `clinicasaopauloparnamirim-coder` via GH_TOKEN |
| 23:37 | `gh repo view clinica-sao-paulo-site` | Repositório público, branch padrão `main`, último push 2026-10-22T12:07Z |
| 23:38 | Árvore recursiva da `main` | 201 arquivos (blobs) |
| 23:38 | Lista de branches | 103 branches |
| 23:38 | `gh repo clone` | Clone em `/workspace/cot/repo`, HEAD `d37ff5c` |
| 23:44 | Push de branch isolada `fix/p1-whatsapp-webhook-fail-closed-2026-10-22` | Sucesso. Branch criada no GitHub. Nenhum pull request aberto, nenhum merge |

Observação: o `git push` direto falhou com "could not read Username" porque o helper de credenciais não estava configurado. A correção foi passar o token do conector por helper temporário, sem alterar configuração global.

## 2. Google Ads (conector somente leitura `google-ads`)

Escopo: cliente `4603647788`, campanha `24289443969`. Campanha `Search-2` (`24146336625`) não foi consultada. Nenhuma mutação. A senha salva `google_ads_account_login` não foi usada.

| Horário | Consulta | Resultado |
|---|---|---|
| 23:40 | `google_ads_get_customers` com `keywords=[]` | 3 clientes visíveis: 9604060191, 9239975717 e 4603647788 (Clínica São Paulo) |
| 23:41 | GAQL `campaign` por ID `24289443969` | Campanha `SEARCH | PARNAMIRIM | ALTA INTENÇÃO`, status ENABLED, canal SEARCH, lance MANUAL_CPC, orçamento diário 17.000.000 micros (R$ 17,00/dia) |
| 23:41 | GAQL métricas de 30 dias, agregadas | 1.361 impressões, 103 cliques, R$ 193,59 de custo, 8 conversões |
| 23:41 | GAQL métricas diárias, mesmo período | 19 linhas retornadas, primeira página de 5 linhas conferida |

Limitação: o período é `LAST_30_DAYS` no fuso da conta (America/Fortaleza). Conversões vêm do próprio Google Ads, não foram cruzadas com leads reais.

## 3. Cloudflare via conector MCP (`cloudflare`)

Escopo: somente leitura (GET). Nenhuma escrita.

| Horário | Teste | Resultado |
|---|---|---|
| 23:40 | `whoami` | Identidade `clinicasaopauloparnamirim@gmail.com` |
| 23:42 | `GET /accounts` | 1 conta: `6f992de6...` (nome padrão da conta de e-mail) |
| 23:42 | `GET /workers/scripts` | 3 Workers: `clinica-sao-paulo-site`, `jev-control-tower`, `weathered-tree-2839` |
| 23:42 | `GET .../settings` dos 3 Workers | Bindings listados por nome e tipo (sem valores) |
| 23:42 | `GET .../versions` do site principal | Versões mais recentes: 547, 546, 545 |
| 23:42 | `GET .../deployments` do site principal | Último deployment com 100% do tráfego na versão 546 |
| 23:42 | `GET .../secrets` do `jev-control-tower` | Lista vazia (credenciais do JEV estão como `plain_text`, ver bloqueios) |

Achados de binding, somente nomes e tipos:
- `clinica-sao-paulo-site`: `NVIDIA_API_KEY` é `secret_text`. Não existe binding chamado `N`. Há também `NVIDIA_KEY_ROTATED` do tipo `plain_text`, um marcador cujo significado precisa de confirmação do dono.
- `jev-control-tower`: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` e `GOOGLE_REFRESH_TOKEN` são `plain_text`.

## 4. Cloudflare via token direto salvo (`cloudflare_deploy_token`)

Teste feito pelo subagente de P0 com a referência do segredo, sem imprimir o valor. Resultado: HTTP 403, erro 9109 "Invalid access token". Não foi possível confirmar conta, Workers ou segredos por esse caminho.

## 5. Cloudflare via Composio (`composio`, toolkit `cloudflare`)

| Horário | Conta Composio | Ferramenta | Resultado |
|---|---|---|---|
| 23:43 | `cloudflare_broth-zimb` | `CLOUDFLARE_LIST_ACCOUNTS` | HTTP 400, código 6003/6103 "Invalid format for X-Auth-Key header" |
| 23:43 | `cloudflare_donkey-swile` | `CLOUDFLARE_LIST_ACCOUNTS` | Mesmo erro 6003/6103 |

A conexão aparece como `ACTIVE` no status do Composio, mas a chamada real falha. Pelo critério do protocolo, status ativo não prova autorização.

## 6. Composio (geral)

| Horário | Teste | Resultado |
|---|---|---|
| 23:40 | `COMPOSIO_SEARCH_TOOLS` para leitura de Workers | Encontrou 12 ferramentas Cloudflare e OpenSEO, com status das conexões |
| 23:43 | `COMPOSIO_SEARCH_TOOLS` para n8n | Não há toolkit n8n. Retornou apenas ferramentas do toolkit `mistral_ai` |

## 7. OpenSEO (conector `openseo`)

| Horário | Teste | Resultado |
|---|---|---|
| 23:40 | `list_projects` | 2 projetos: `BR Local SEO` (pt, 2076) e `Clínica São Paulo Parnamirim` (en, 2840) |
| 23:40 | `get_project_context` do projeto `BR Local SEO` | Contexto salvo lido, sem competidores e sem registros de pesquisa |
| 23:41 | `get_google_analytics_measurement_health` | 1 fluxo web (`G-EGTYJM0REP`), 4 eventos-chave, 0 problemas de diagnóstico |
| 23:41 | `get_search_console_performance` | Propriedade `sc-domain:clinicasaopauloparnamirim.com.br`, período 2026-09-23 a 2026-10-20, 20 linhas de consulta |

Limitação: o relatório do Search Console mostra cliques baixos (uma consulta com 1 clique). O período termina em 20/10, por atraso natural dos dados.

## 8. Meta Ads Manager (conector `meta-marketing`)

| Horário | Teste | Resultado |
|---|---|---|
| 23:44 | Seleção da conta ativa `clinicasaopauloparnamirim@gmail.com` na configuração, salva pela ferramenta de configuração do conector | Aplicada sem confirmação, por ser troca entre contas já autorizadas |
| 23:44 | `meta_marketing_get_ad_accounts` | Erro HTTP 401, código 190, subcódigo 460: sessão invalidada por troca de senha ou revogação. Reautorização necessária |

## 9. Instagram (conector `instagram`)

Não testado. O conector exige seleção de conta, e a conta `@clinicasaopauloparnamirim` está autorizada, mas a leitura não foi executada nesta rodada.

## 10. NVIDIA NIM

| Teste | Resultado |
|---|---|
| Chamada pública sem credencial ao endpoint de modelos (subagente P0) | HTTP 200. Prova apenas que o endpoint responde; não prova que o NIM está autorizado nem que uma chave funciona |
| Inferência autenticada | Não executada. Não há chave aprovada para teste |
| Busca por padrão `nvapi-` no HEAD e em todo o histórico (1.106 commits), contagem sem exibição | 0 ocorrências com 20+ caracteres |

## 11. Webhook WhatsApp (teste local sintético, sem rede)

Subagente P1, branch `fix/p1-whatsapp-webhook-fail-closed-2026-10-22`, commit `6370fbf`.

| Caso | Antes | Depois |
|---|---|---|
| Assinatura correta | Aceito | Aceito |
| Assinatura errada | Rejeitado | Rejeitado |
| Assinatura ausente | Rejeitado | Rejeitado |
| Segredo ausente | Rejeitado | Rejeitado |

Também passaram: `scripts/test-whatsapp-attribution.mjs` e `git diff --check`. Não passou ainda: `npx tsc --noEmit`, porque não havia `node_modules`. Nenhum evento real foi enviado ao WhatsApp nem à Meta.

## 12. Local SEO Heatmap (P1)

Subagente de P1, repositório separado `local-seo-heatmap`, branch `fix/p1-local-seo-heatmap-auth-2026-10-22`, commit `e1c0895`.

| Teste | Resultado |
|---|---|
| `npx tsc --noEmit` | Código 0 |
| `/api/scans` sem credencial | HTTP 401 |
| `/api/scans` com token sintético inválido | HTTP 401 |
| `/api/scans` com token sintético válido | Chegou à validação e retornou 400, sem gravar nada |
| `/api/scans` com variável `LOCAL_SEO_API_TOKEN` ausente | HTTP 503 |
| Build de produção | Compilou e passou o TypeScript, mas falhou na geração de páginas por divergência de schema SQLite (`Scan.shape` ausente) |
| Push da branch | Enviado ao GitHub em 23:52 (sem pull request) |

Limitação: os 32 endpoints de escrita foram protegidos, mas o build não fecha. Não houve teste em produção.

## 13. Não testado

- Staging real do WhatsApp com evento assinado pelo provedor (não há staging comprovado).
- Pull request, merge ou deploy de qualquer branch corrigida.
- n8n (sem conector e sem referência no repositório).
- Instagram (conta não selecionada para leitura).
- Google Business Profile (sem teste nesta rodada).
- Composio como rota de escrita para Cloudflare.

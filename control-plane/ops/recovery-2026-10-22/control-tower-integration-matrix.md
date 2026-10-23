# Control Tower — Matriz de integrações (2026-10-22)

Cada componente recebe um único estado da lista oficial. Evidências estão em [control-tower-test-evidence.md](/workspace/cot/results/control-tower-test-evidence.md). Estado "comprovado" significa que uma chamada real foi executada e retornou dados, não que a conexão está ativa.

| Componente | Estado | Escopo testado | Evidência resumida | Limitação |
|---|---|---|---|---|
| GitHub (repositório `clinica-sao-paulo-site`) | OPERATIONAL COMPROVADO | Leitura, clone, listagem de branches, push de branch isolada | Árvore com 201 arquivos, 103 branches, push de `fix/p1-whatsapp-webhook-fail-closed-2026-10-22` | Nenhum merge permitido. Push na main não foi testado e não deve ser feito |
| Google Ads, campanha 24289443969 | OPERATIONAL SOMENTE PARA LEITURA | GAQL de campanha e métricas de 30 dias | Campanha ENABLED, 1.361 impressões, 103 cliques, R$ 193,59, 8 conversões | Sem escrita. Campanha Search-2 não consultada |
| Google Ads, senha salva | AUTORIZAÇÃO AUSENTE | Não usada | Regra do dono: apenas conector em leitura | Não há uso autorizado de senha |
| GA4 (medição, via OpenSEO) | OPERATIONAL SOMENTE PARA LEITURA | Saúde de medição do fluxo `G-EGTYJM0REP` | 1 fluxo, 4 eventos-chave, 0 problemas | Leitura de visão orgânica e receita não rodou nesta rodada |
| Google Search Console (via OpenSEO) | OPERATIONAL SOMENTE PARA LEITURA | Desempenho de consultas, 2026-09-23 a 2026-10-20 | 20 linhas retornadas | Dados recentes podem estar incompletos |
| OpenSEO | OPERATIONAL SOMENTE PARA LEITURA | Listagem de projetos e contexto | 2 projetos, contexto lido | Sem execução de auditoria nem gasto de créditos |
| Cloudflare via conector MCP | OPERATIONAL SOMENTE PARA LEITURA | Contas, Workers, bindings (nomes e tipos), versões, deployments | Versão ativa 546 com 100% do tráfego | Escrita não testada e não autorizada |
| Cloudflare via token direto salvo | FALHOU | GET de contas, Workers e segredos | HTTP 403, erro 9109 "Invalid access token" | Token precisa ser renovado pelo dono |
| Cloudflare via Composio | FALHOU | Leitura de contas nas duas contas conectadas | HTTP 400, erro 6103 em `X-Auth-Key` | Conexão aparece como ACTIVE, mas a chamada falha. Status ativo não prova autorização |
| Composio (plataforma e busca de ferramentas) | PARCIAL | Busca de ferramentas, status de conexões | Toolkits `cloudflare` e `custom_openseo` com conexão ativa | Execução real só comprovada para OpenSEO nesta rodada |
| n8n | CAPACIDADE INDISPONÍVEL | Procura por conector e referências | 0 arquivos no repositório mencionam n8n; Composio não tem toolkit n8n | Confirmar se n8n existe e onde roda |
| Meta Ads Manager | AUTORIZAÇÃO AUSENTE | Listagem de contas de anúncio | HTTP 401, código 190, subcódigo 460 | Dono precisa reautorizar o conector Meta |
| Instagram Business (`@clinicasaopauloparnamirim`) | CONECTADO NÃO TESTADO | Não executado | Conta autorizada na configuração | Exige seleção de conta e leitura própria |
| WhatsApp Business Webhook (código) | PARCIAL | Teste local sintético com quatro casos | Casos antes e depois passaram; commit `6370fbf` | Sem staging real. Sem evento real do provedor. Build TypeScript não rodou |
| WhatsApp envio de mensagens | FORA DO ESCOPO | Não testado | Regra do dono: nenhuma mensagem real | Não deve ser testado sem aprovação |
| NVIDIA NIM (inferência) | AUTORIZAÇÃO AUSENTE | Endpoint público sem credencial retornou HTTP 200 | Não há chave aprovada para inferência | Rotação da chave precisa ser confirmada pelo dono |
| Worker `clinica-sao-paulo-site` | OPERATIONAL SOMENTE PARA LEITURA | Bindings, versões, deployments | Binding `NVIDIA_API_KEY` é `secret_text` | Divergência: documentação cita v344; ativa é 546 |
| Worker `jev-control-tower` | FALHOU | Bindings por tipo | `GOOGLE_CLIENT_SECRET` e `GOOGLE_REFRESH_TOKEN` são `plain_text` | Credencial em texto simples exige decisão do dono |
| Worker `weathered-tree-2839` | OPERATIONAL SOMENTE PARA LEITURA | Bindings por tipo | Sem segredo em texto simples | Não é componente do Control Tower na documentação |
| Local SEO Heatmap (repositório separado) | PARCIAL | Autenticação nos 32 endpoints de escrita e checagem de tipos | Commit `e1c0895` enviado em branch isolada. 401 sem token, 401 com token inválido, 503 sem variável | Build falha na geração de páginas por divergência de schema SQLite. Não testado em produção |
| Agentes e cérebros | PARCIAL | Ver inventário | 9 cérebros e 20 especialistas no código | Divergência com documentação de 2026-10-12 (3 cérebros) |

## Notas de leitura

A coluna de estado segue a regra do dono: rótulos como ACTIVE ou CONNECTED não bastam. Por isso o Composio aparece como PARCIAL apesar de as conexões estarem ativas, e o Cloudflare via Composio aparece como FALHOU.

Para a rota Cloudflare, a recomendação do protocolo (testar leitura antes de escrita) já foi cumprida: a leitura pelo conector MCP funciona e a leitura pelo Composio não funciona. Nenhuma escrita foi feita por nenhuma rota.

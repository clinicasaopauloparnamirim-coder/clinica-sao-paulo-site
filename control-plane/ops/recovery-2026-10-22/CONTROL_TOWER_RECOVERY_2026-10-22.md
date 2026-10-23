# Control Tower — Relatório de recuperação (2026-10-22)

Este relatório resume o que foi montado, o que foi testado de fato, o que falhou ou não foi testado e o que precisa da sua aprovação. Nada foi mesclado na main, nada foi alterado em produção, nenhuma mensagem foi enviada e nenhum dado de paciente ou credencial aparece aqui.

## Resumo em uma frase

As leituras de GA4, Search Console, Google Ads, GitHub e Cloudflare (pelo conector MCP) funcionam e foram comprovadas. Três problemas de segurança precisam da sua decisão: credenciais em texto simples no Worker `jev-control-tower`, token direto da Cloudflare inválido e chave NVIDIA a confirmar. Meta está sem autorização válida e n8n não foi localizado.

## O que está montado

Foram produzidos seis arquivos de entrega. Todos foram gerados em um clone local e serão enviados em uma branch de documentação isolada, `control-tower/recovery-2026-10-22`, sem pull request nem merge.

- Inventário de agentes e cérebros: [control-tower-agent-inventory.md](/workspace/cot/results/control-tower-agent-inventory.md)
- Inventário de repositórios e branches: [control-tower-repository-inventory.md](/workspace/cot/results/control-tower-repository-inventory.md)
- Matriz de integrações com estado oficial: [control-tower-integration-matrix.md](/workspace/cot/results/control-tower-integration-matrix.md)
- Evidências de teste com horários: [control-tower-test-evidence.md](/workspace/cot/results/control-tower-test-evidence.md)
- Bloqueios e decisões do dono: [control-tower-blockers.md](/workspace/cot/results/control-tower-blockers.md)
- Este relatório consolidado: [CONTROL_TOWER_RECOVERY_2026-10-22.md](/workspace/cot/results/CONTROL_TOWER_RECOVERY_2026-10-22.md)

Os nove identificadores lógicos são `commander`, `researcher`, `engineer`, `seo`, `ads`, `red-team`, `judge`, `marketing-growth` e `nvidia-ecosystem`. O código tem 20 especialistas e 20 funções autônomas. A documentação de 12/10 diz que há três cérebros, e isso ainda não foi resolvido. O maior risco de falsa prontidão é o Red Team, que só existe no registro, e o JEV e o CRM, que estão configurados mas não verificados.

Os agentes e grupos não foram criados nem alterados, conforme sua instrução.

## Correções em branches isoladas

Duas correções foram feitas em branches separadas, cada uma com commit próprio, e enviadas ao GitHub sem merge.

O webhook do WhatsApp agora rejeita assinatura ausente, vazia ou mal formatada, e compara a assinatura em tempo constante. Os quatro casos sintéticos passaram. Branch `fix/p1-whatsapp-webhook-fail-closed-2026-10-22`, commit `6370fbf`. O relatório do subagente registra falha no push, mas esse push foi refeito depois pelo coordenador e concluiu com sucesso às 23:44. Relatório: [p1-whatsapp-webhook-report.md](/workspace/cot/results/p1-whatsapp-webhook-report.md). Ainda falta `tsc` e teste em staging real.

Os endpoints de criação, alteração e exclusão do Local SEO Heatmap agora exigem token (`LOCAL_SEO_API_TOKEN`). Sem credencial retorna 401, e sem variável configurada retorna 503. Branch `fix/p1-local-seo-heatmap-auth-2026-10-22`, commit `e1c0895`, no repositório `local-seo-heatmap`. O relatório do subagente registra falha no push, mas o push foi refeito às 23:52 e concluiu com sucesso. Relatório: [p1-local-seo-heatmap-report.md](/workspace/cot/results/p1-local-seo-heatmap-report.md). O build compila, mas falha na geração de páginas por divergência de schema do SQLite. O push já foi feito.

Para P0 da NVIDIA não houve commit, porque o HEAD não contém a chave em texto simples. Ver a seção de segurança abaixo.

## O que foi testado de fato

- GitHub: leitura do repositório, clone, listagem de 103 branches e push das duas branches isoladas.
- Google Ads: leitura da campanha 24289443969. Em 30 dias: 1.361 impressões, 103 cliques, R$ 193,59 de custo e 8 conversões. A campanha está ativa, em Search, com lance manual e orçamento de R$ 17,00 por dia. Não houve escrita e a senha salva não foi usada.
- GA4 e Search Console, pelo OpenSEO: saúde de medição do fluxo `G-EGTYJM0REP` sem problemas, e desempenho de consultas de 23/09 a 20/10.
- Cloudflare, pelo conector MCP: contas, Workers, bindings (só nomes e tipos), versões e deployments. A versão ativa é a 546, com 100% do tráfego. A versão 547 existe, mas não aparece como deployment. A documentação cita v344, e isso está desatualizado.
- Webhook do WhatsApp: teste local sintético com assinatura correta, errada, ausente e segredo ausente.
- Histórico do git: busca por padrão de chave NVIDIA em 1.106 commits, sem exibir valores. Nenhuma ocorrência com formato real.

## O que falhou

- Token direto da Cloudflare salvo como `cloudflare_deploy_token`: HTTP 403, erro 9109.
- Cloudflare pelo Composio: as duas contas conectadas retornam erro 6103 no cabeçalho de autenticação. A conexão aparece como ativa, mas não funciona.
- Meta Ads Manager: sessão OAuth invalidada (erro 190/460). Precisa ser reautorizada.
- Push direto pelo git: falhou por falta de credencial no helper. Foi resolvido sem alterar a configuração global.

## O que não foi testado

Instagram não foi lido, porque a conta precisa ser selecionada primeiro. n8n não foi localizado: nenhum arquivo do repositório o menciona e não há conector no Composio. O repositório `open-seo-mcp-skills` retorna 404. O staging do WhatsApp não existe e nenhum evento real foi enviado ao provedor. O build TypeScript do WhatsApp não rodou. Nenhuma escrita foi testada em nenhuma integração.

## Segurança: achados que pedem sua decisão

O Worker `jev-control-tower` tem `GOOGLE_CLIENT_SECRET` e `GOOGLE_REFRESH_TOKEN` configurados como texto simples, e não como segredo. Isso não estava no documento de referência. Recomendo rotacionar as duas credenciais no Google Cloud e cadastrá-las como segredos do Worker.

Sobre a NVIDIA: o binding de produção `NVIDIA_API_KEY` é do tipo segredo, o que é correto. Não encontramos chave em texto simples no código atual nem no histórico. Ainda assim, há um marcador `NVIDIA_KEY_ROTATED` que não sabemos interpretar, e você precisa confirmar no painel da NVIDIA se a chave antiga foi revogada.

## O que precisa da sua aprovação

1. Aprovar ou recusar o merge da correção do WhatsApp e decidir se haverá staging para evento assinado.
2. Aprovar ou recusar o merge da correção do Local SEO Heatmap, depois de corrigir o schema do SQLite.
3. Decidir a rotação das credenciais do JEV e confirmar a revogação da chave NVIDIA.
4. Gerar novo token da Cloudflare com permissão de edição de Workers e substituir o salvo.
5. Reautorizar o conector Meta.
6. Reconectar a Cloudflare no Composio, se você quiser usar essa rota.
7. Informar onde está o n8n e confirmar o nome do repositório `open-seo-mcp-skills`.
8. Decidir qual é a arquitetura vigente, com 3 ou 9 cérebros, e se a versão 547 do Worker deve ir a produção.

## Limites mantidos

Nenhuma alteração na main. Nenhuma alteração em Workers de produção. Nenhuma mensagem real no WhatsApp. Nenhuma mutação no Google Ads, inclusive na campanha Search-2. Nenhum uso da senha salva do Google Ads com permissão de edição.

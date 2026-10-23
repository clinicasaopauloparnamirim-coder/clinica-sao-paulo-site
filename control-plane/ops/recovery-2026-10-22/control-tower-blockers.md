# Control Tower — Bloqueios e decisões do dono (2026-10-22)

Esta lista separa o que impede a operação do que só pode ser decidido pelo dono. Nenhuma das ações abaixo foi executada por agentes, porque exigem aprovação explícita ou acesso que não temos.

## Prioridade alta (segurança)

1. **Credenciais em texto simples no Worker `jev-control-tower`.** As variáveis `GOOGLE_CLIENT_SECRET` e `GOOGLE_REFRESH_TOKEN` estão configuradas como `plain_text`, não como segredo. Isso foi observado em 2026-10-22 às 23:42 pela leitura de bindings, sem exibir valores. Ação do dono: aprovar rotação do refresh token e do client secret no Google Cloud e cadastrá-los como segredos do Worker. Esse achado não estava no documento de referência e não é coberto pelo P0 da NVIDIA.

2. **Chave NVIDIA (P0).** O binding de produção do site é `NVIDIA_API_KEY` do tipo `secret_text`, o que é correto. Não encontramos padrão `nvapi-` com 20 ou mais caracteres no HEAD nem em 1.106 commits do histórico. O subagente de P0 apontou commits de 2026-10-12 que citam o formato, sem valor. Ainda assim: (a) o marcador `NVIDIA_KEY_ROTATED` do tipo `plain_text` indica que houve rotação, mas não sabemos se a chave antiga foi revogada no painel da NVIDIA; (b) o dono precisa confirmar essa revogação. Ação do dono: confirmar no painel da NVIDIA se a chave antiga foi revogada e se a atual é a que está em `NVIDIA_API_KEY`.

3. **Token direto da Cloudflare (`cloudflare_deploy_token`) inválido.** Retorna HTTP 403, erro 9109. Ação do dono: gerar novo token com permissão Workers Scripts: Edit e salvá-lo como segredo substituindo o atual. Enquanto isso, o conector MCP da Cloudflare segue como rota de leitura.

## Prioridade alta (integrações)

4. **Meta Ads Manager sem autorização válida.** A sessão OAuth foi invalidada (erro 190/460), provavelmente por troca de senha ou revogação. Ação do dono: reautorizar o conector em Conectores, em "Gerenciar" e "Configurar". Não é possível resolver por agente.

5. **Composio com Cloudflare falhando.** As duas contas conectadas retornam erro 6103 no cabeçalho `X-Auth-Key`. Ação do dono: reconectar a conta Cloudflare no Composio, preferindo um token de API com formato correto. Até lá, usar o conector MCP da Cloudflare.

6. **n8n não localizado.** Nenhum arquivo do repositório menciona n8n e não há conector n8n no Composio. Ação do dono: informar onde o n8n roda, se existe, e qual conta. Sem essa informação o serviço fica como CAPACIDADE INDISPONÍVEL.

## Decisões de merge e deploy (pedem aprovação explícita)

7. **Branch `fix/p1-whatsapp-webhook-fail-closed-2026-10-22`** (commit `6370fbf`). Contém a validação fail-closed do webhook do WhatsApp. Falta rodar o build TypeScript e um teste em staging real. Decisão do dono: aprovar ou não o merge, e se haverá staging para evento assinado pelo provedor.

8. **Branch `fix/p0-nvidia-key-removal-2026-10-22`.** Não tem commit, porque o HEAD não contém a chave em texto simples. A branch existe apenas no clone local e não foi enviada ao GitHub. Não há o que aprovar sem a confirmação do item 2.

9. **Branch do Local SEO Heatmap.** Resultado pendente nesta rodada. Ver o relatório específico quando concluído.

10. **Branch de documentação `control-tower/recovery-2026-10-22`.** Contém os seis arquivos de entrega. Aceita pelo documento do dono para branch isolada. Decisão do dono: se deve ser mantida ou fechada.

## Divergências de documentação a corrigir

11. **Número de cérebros.** O código tem 9 identificadores em `BRAINS`. O registro de 2026-10-12 diz `brain_count=3`. Decidir qual é a arquitetura vigente. Este relatório não resolve a divergência por conta própria.

12. **Versão do Worker.** O documento de referência cita v344. A versão com 100% do tráfego agora é a 546, e existe a versão 547 criada depois. Confirmar se a 547 foi feita de propósito e se deve ir para produção.

13. **Repositório `open-seo-mcp-skills`.** Retorna 404 no GitHub. Ou o nome está errado, ou o repositório foi removido, ou não há acesso. Confirmar o nome correto.

## Limites que não serão tratados sem autorização

- Nenhuma mutação de Google Ads, incluindo campanha Search-2.
- Nenhuma mensagem real de WhatsApp ou Meta.
- Nenhum deploy de Worker em produção.
- Nenhum uso da senha salva do Google Ads com permissão de edição.
9. **Branch do Local SEO Heatmap** (`fix/p1-local-seo-heatmap-auth-2026-10-22`, commit `e1c0895`, repositório `local-seo-heatmap`). Protege os 32 endpoints de escrita com token. O build falha na geração de páginas por divergência de schema SQLite (`Scan.shape` ausente). Decisão do dono: autorizar a correção do schema antes de qualquer merge, e definir o valor de `LOCAL_SEO_API_TOKEN` no ambiente de produção.

# Integração — Control Tower no ChatGPT/Claude: estado verificado

**Auditoria de 2026-10-27: DOCUMENTAÇÃO ≠ CONFIGURAÇÃO ≠ EXECUÇÃO VALIDADA.** Este guia descreve caminhos possíveis; não prova que o chat atual ou uma conversa nova tenha carregado as instruções, autenticado no Worker ou concluído um relatório ponta a ponta.

## Estado e limites importantes
- **HYPD está retirado por decisão explícita do usuário. Não usar nem sugerir reconexão.**
- O plano pessoal ChatGPT Go não permite criar novos GPTs personalizados segundo a Central de Ajuda consultada em 2026-10-27: https://help.openai.com/pt-br/articles/8554397-creating-and-editing-gpts. Não instruir esta conta a criar um GPT novo.
- O repositório não injeta suas instruções automaticamente em um chat comum do ChatGPT. Um arquivo no GitHub ou uma skill instalada em outro agente não prova que um chat novo a carregou.
- A alternativa nativa compatível com Go para manter instruções e arquivos juntos é um **Projeto do ChatGPT**. O projeto oferece contexto compartilhado entre conversas dentro dele, mas não configura o Worker, não conecta uma API automaticamente e não garante que a ferramenta correta será escolhida. Fonte: https://help.openai.com/pt-br/articles/10169521-projects-in-chatgpt.
- As ações do Worker continuam **não validadas ponta a ponta para relatório diário**: o endpoint GA4 exposto na especificação audita eventos-chave e o endpoint GSC usa uma janela de aproximadamente 28 dias; não há uma ação única de relatório diário com data explícita para as quatro fontes.
- A conexão direta Google Ads via Composio retornou dados de 2026-10-26 por duas consultas independentes em 2026-10-27. A rota interna de Ads do Worker já foi observada com erro OAuth `invalid_grant`; isso não deve bloquear a conexão direta quando ela estiver ativa.



## 1) Token (uma vez)

1. Cloudflare Dashboard → Workers → `clinica-sao-paulo-site` → Settings → Variables  
   **ou** GitHub repo → Settings → Secrets → `MCP_AUTH_TOKEN`
2. Copie o valor. Não publique em chat público.

Base URL:
```
https://clinica-sao-paulo-site.clinicasaopauloparnamirim.workers.dev
```

OpenAPI (importar nas Actions):
```
https://raw.githubusercontent.com/clinicasaopauloparnamirim-coder/clinica-sao-paulo-site/main/control-plane/docs/openapi-control-tower.yaml
```

---

## 2) ChatGPT pessoal Go — Projeto e continuidade

Esta é a opção adequada para manter contexto entre conversas em uma conta pessoal Go. O projeto precisa ser configurado na interface do ChatGPT; **as ferramentas disponíveis nesta sessão não permitem criar ou editar esse objeto por API**. Não confundir este Projeto do ChatGPT com o repositório/Control Tower da Clínica.

### Instruções do Projeto (texto-base)

```
Você opera os dados e marketing da Clínica São Paulo (Parnamirim/RN). Responda em português brasileiro e execute, não apenas planeje.

Antes de qualquer tarefa da Clínica, recupere as instruções e o estado deste Projeto. Aplique GAUNTLET LOOP: buscar → confrontar rotas → testar/revisar → identificar falhas → cruzar com arquitetura → classificar → registrar evidência → repetir apenas com hipótese nova.

Google Ads: customer_id 4603647788; campanha em escopo 24289443969 (SEARCH | PARNAMIRIM | ALTA INTENÇÃO). Priorize a integração direta Google Ads. Use a data exata em America/Fortaleza. HYPD foi retirado e nunca deve ser chamado, recomendado ou tratado como bloqueio.

Search-2 (24146336625) está fora de escopo para consulta, relatório, análise e mutação sem autorização explícita específica na tarefa atual.

Relatório diário: ler Google Ads, GA4, Search Console e OpenSEO para a mesma data. Se a execução em lote falhar, usar chamadas independentes e seguras; não repetir a mesma chamada bloqueada. Respeitar a defasagem normal do Search Console. Para cada fonte, marcar VERIFIED, INCOMPLETE, BLOCKED ou NOT CHECKED.

Modo padrão somente leitura. Não alterar campanhas, configurações, site nem publicar conteúdo a partir de uma auditoria. Não pedir prints, dados copiados ou reconexões antes de testar as rotas diretas autorizadas. Não inventar métricas nem dizer “resolvido” sem ler a fonte real e verificar o resultado. Um arquivo no GitHub não significa que um chat comum o carregou automaticamente.
```

### Limites que não devem ser escondidos

- As conexões Composio do ambiente de execução precisam ser selecionadas e usadas diretamente. Para o relatório de Ads já foi provado que a leitura direta funciona; não é necessário configurar o Worker ou copiar `MCP_AUTH_TOKEN` só para obter métricas de campanha.
- O Worker é um caminho separado. Seu OAuth de Google Ads já foi observado com `invalid_grant`, e a OpenAPI publicada ainda não fornece um relatório diário único que una Ads, GA4, Search Console e OpenSEO.
- A instrução do Projeto melhora a continuidade dentro dele, mas não prova que toda ferramenta está funcional. Cada tarefa precisa consultar os dados atuais e registrar evidências.

## 3) Claude (Projeto) — mais fácil

### Opção A — Projeto + você cola resultados (zero bloqueio)

1. Claude.ai → **Projects** → **Create project** → `Clínica SP`
2. **Custom instructions**:

```
Control Tower Clínica São Paulo. Customer 4603647788.
Campanhas: Search-2 (24146336625), ALTA INTENÇÃO (24289443969).
Quando precisar de dados live, peça ao usuário para rodar no Grok/Control Tower
ou use os JSONs que ele colar. Não invente métricas.
Não altere Search-2 sem pedido explícito. Português.
```

3. Anexe o arquivo `openapi-control-tower.yaml` e este guia no Project knowledge.

### Opção B — Claude com conector HTTP (se disponível no seu plano)

1. Settings → Connectors / Custom → **Add**
2. Base URL: `https://clinica-sao-paulo-site.clinicasaopauloparnamirim.workers.dev`
3. Header: `Authorization` = `Bearer SEU_TOKEN`
4. Importe o OpenAPI ou liste os paths do YAML

Se o ambiente Claude bloquear `workers.dev`, peça no Cloudflare um **Custom Domain**:
`control.clinicasaopauloparnamirim.com.br` → Worker `clinica-sao-paulo-site`
e use essa URL no conector.

---

## 4) Teste rápido (qualquer um)

```
GET /health
GET /google/ads/audit
POST /google/ads/search
Body: {"query":"SELECT campaign.id, campaign.name, campaign.status FROM campaign WHERE campaign.status != 'REMOVED'"}
```

---

## Regras de segurança

- Token só no GPT/Connector, nunca no chat de grupo.
- Modo somente leitura por padrão. `adsSearch` e `adsAudit` só podem ser tratados como prontos depois de autenticação e teste real. Mutação exige uma solicitação específica e autorização própria.
- Não compartilhar `GOOGLE_CLIENT_SECRET` nem refresh tokens — só o Bearer do Worker.

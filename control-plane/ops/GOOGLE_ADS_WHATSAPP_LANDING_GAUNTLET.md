# Google Ads + WhatsApp + Landing Page Gauntlet

**Data:** 2026-10-05/06
**Campanha auditada:** SEARCH | PARNAMIRIM | ALTA INTENÇÃO (24289443969)
**Campanha aposentada:** fora de escopo

## 1. Definição correta de 100/100

Não tratar como a mesma métrica:
- Google Ads Optimization Score: mede a otimização da campanha/conta e vai de 0 a 100%.
- Quality Score: diagnóstico de palavras-chave; não é a mesma coisa que Optimization Score.
- Lighthouse/PageSpeed: mede performance, acessibilidade, boas práticas e SEO da página.
- Landing Page Experience: componente do Quality Score e depende de relevância, utilidade, navegação e coerência com o anúncio.

O objetivo operacional é deixar cada camada verde, não maquiar uma nota isolada.

## 2. Recomendações vivas encontradas no Google Ads

### CAMPAIGN_BUDGET
- Atual: R$17/dia.
- Recomendado pelo Google: R$21/dia.
- Estimativa do Google: +12 cliques/semana no cenário recomendado.
- Decisão: NÃO aplicar ainda. A campanha apresenta apenas 1 conversão no período auditado e o rastreamento de WhatsApp ainda está sendo fechado. Aumentar orçamento antes de validar o sinal pode apenas comprar mais tráfego não comprovado.

### SITELINK_ASSET
- Recomendação ativa.
- O objeto retornado pelo Google não contém os textos dos sitelinks nesta consulta; a própria documentação da API informa que a recomendação gerada pode retornar o objeto de sitelink vazio e servir como indicador de adicionar pelo menos um sitelink.
- Decisão: aplicar somente depois de validar que os destinos existem, são relevantes para o anúncio e mantêm o money-path de WhatsApp.

### SEARCH_PARTNERS_OPT_IN
- Recomendação ativa.
- Decisão: NÃO aplicar automaticamente. Primeiro validar qualidade/lead rate, porque ampliar inventário sem conversão confiável pode aumentar volume sem aumentar leads.

## 3. Money-path implantado no código

Google Ads → landing page → clique WhatsApp → lead_id → Cloudflare Durable Object → mensagem WhatsApp → atribuição → GA4 (quando GA4_MEASUREMENT_ID + GA4_API_SECRET estiverem configurados) → Google Ads conversion

### Evidência de implementação
- public/whatsapp-attribution.js captura gclid, gbraid, wbraid, UTMs, página de entrada e client ID do GA4 quando disponível.
- Cada clique recebe uma referência não-PII CSP-XXXXXXXXXX.
- O código registra o clique no Worker em /api/lead-click.
- A referência é acrescentada à mensagem pré-preenchida do WhatsApp.
- O webhook /webhooks/whatsapp procura a referência na primeira mensagem e vincula o clique ao lead.
- /control/whatsapp/audit permite auditoria autenticada do ledger.
- O Worker pode enviar whatsapp_lead ao GA4 pelo Measurement Protocol quando os dois secrets de servidor estiverem configurados.

## 4. Critérios de fechamento

P0 verde somente quando:
1. Clique em WhatsApp gera registro no ledger.
2. Mensagem recebida contém/é vinculada ao lead_id.
3. Atribuição contém origem/campanha/GCLID quando presentes.
4. whatsapp_lead aparece no GA4.
5. O evento é marcado como evento principal e convertido no Google Ads para otimização.
6. Não existe dupla contagem Zaraz + outra implementação do mesmo evento.
7. Landing page passa os testes de performance, acessibilidade, boas práticas e SEO sem regressão.
8. Recomendações do Google Ads são auditadas individualmente; recomendações prejudiciais ao objetivo de leads não são aplicadas só para fabricar 100%.

## 5. Regra de governança

Nenhuma recomendação de orçamento, Search Partners ou estratégia de lance será aplicada automaticamente enquanto o sinal de conversão WhatsApp não estiver comprovadamente funcionando.
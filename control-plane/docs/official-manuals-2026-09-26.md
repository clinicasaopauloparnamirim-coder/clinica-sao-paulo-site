# Control Tower — Manual técnico oficial do stack
## Atualizado em 26/09/2026

Este índice consolida a documentação oficial consultada para o projeto Clínica São Paulo. A referência é a documentação dos próprios fornecedores.

## Google Analytics 4
- Admin API: https://developers.google.com/analytics/devguides/config/admin/v1
- REST / Key Events: https://developers.google.com/analytics/devguides/config/admin/v1/rest
- List Key Events: https://developers.google.com/analytics/devguides/config/admin/v1/rest/v1beta/properties.keyEvents/list
- Delete Key Event: https://developers.google.com/analytics/devguides/config/admin/v1/rest/v1beta/properties.keyEvents/delete
- Data API: https://developers.google.com/analytics/devguides/reporting/data/v1
- Event parameters: https://developers.google.com/analytics/devguides/collection/ga4/event-parameters
- Admin API changelog: https://developers.google.com/analytics/devguides/config/admin/v1/changelog
- Data API changelog: https://developers.google.com/analytics/devguides/reporting/data/v1/changelog

Atualizações relevantes: Key Events são o recurso atual para eventos principais; a Admin API expõe list/get/patch/delete; em 14/09/2026 a Data API adicionou consultas conversacionais em alpha.

## Google Tag Manager / Google Tag
- GTM: https://developers.google.com/tag-platform/tag-manager
- Google Ads conversions via GTM: https://support.google.com/tagmanager/answer/6105160
- Google tag / Ads conversions: https://support.google.com/google-ads/answer/7548399
- Consent Mode: https://developers.google.com/tag-platform/security/concepts/consent-mode
- Consent Mode setup: https://developers.google.com/tag-platform/security/guides/consent

Regra: não duplicar GA4/Zaraz/GTM sem demonstrar qual camada é a fonte do evento.

## Cloudflare Zaraz
- Overview: https://developers.cloudflare.com/zaraz/
- Web API: https://developers.cloudflare.com/zaraz/web-api/
- Track: https://developers.cloudflare.com/zaraz/web-api/track/
- Monitoring: https://developers.cloudflare.com/zaraz/monitoring/
- Monitoring API: https://developers.cloudflare.com/zaraz/monitoring/monitoring-api/
- Google Analytics + Cloudflare: https://developers.cloudflare.com/fundamentals/reference/google-analytics/
- Supported tools: https://developers.cloudflare.com/zaraz/reference/supported-tools/

Zaraz Monitoring/Monitoring API é relevante para investigar o clique_whatsapp que está em 0 no GA4.

## Cloudflare Workers / Wrangler
- Wrangler: https://developers.cloudflare.com/workers/wrangler/
- Configuration: https://developers.cloudflare.com/workers/wrangler/configuration/
- Environments: https://developers.cloudflare.com/workers/wrangler/environments/
- Secrets: https://developers.cloudflare.com/workers/configuration/secrets/
- Environment variables: https://developers.cloudflare.com/workers/configuration/environment-variables/
- Routes: https://developers.cloudflare.com/workers/configuration/routing/
- Limits: https://developers.cloudflare.com/workers/platform/limits/
- Pricing: https://developers.cloudflare.com/workers/platform/pricing/

Regra: secrets não entram em vars, código-fonte ou Git.

## Google Ads API
- Conversion management: https://developers.google.com/google-ads/api/docs/conversions/overview
- Getting started: https://developers.google.com/google-ads/api/docs/conversions/getting-started
- Campaigns: https://developers.google.com/google-ads/api/docs/campaigns/overview
- Release notes: https://developers.google.com/google-ads/api/docs/release-notes
- Deprecations: https://developers.google.com/google-ads/api/docs/deprecations

Atualizações verificadas: v25.2 em 23/09/2026; developer tokens depreciados/sunset em 09/09/2026; mudança de segmentação de idioma para Search com vigência em 30/09/2026.

## Google Business Profile / Maps
- Overview: https://developers.google.com/my-business/content/overview
- Basic setup: https://developers.google.com/my-business/content/basic-setup
- API: https://developers.google.com/my-business
- Change log: https://developers.google.com/my-business/content/change-log

Regra: acesso programático ao GBP exige elegibilidade/aprovação.

## Google Search Console
- Overview: https://developers.google.com/webmaster-tools/about
- API reference: https://developers.google.com/webmaster-tools/v1/api_reference_index

## WhatsApp Business Platform
- Cloud API: https://developers.facebook.com/docs/whatsapp/cloud-api/overview
- Meta Postman collection: https://www.postman.com/meta/whatsapp-business-platform/documentation/wlk6lh4/whatsapp-cloud-api

Não atribuir automaticamente um WhatsApp a Google Ads sem identificador/correlação verificável.

## GitHub
- Secrets: https://docs.github.com/en/actions/concepts/security/secrets
- Secrets reference: https://docs.github.com/en/actions/reference/security/secrets

## Estado técnico em 26/09/2026
O Control Plane já possui OAuth Google para GA4, Durable Object para estado OAuth/refresh token, auditoria GA4, limpeza de Key Events, webhook WhatsApp, ledger de mensagens, Playwright MCP e ControlAgent.

Alterações nesta branch:
- OAuth state individual e de uso único.
- Limpeza GA4 exige confirmação explícita.
- Nenhuma limpeza de GA4 foi executada nesta etapa.

## Próxima integração
1. Configurar OAuth Web Application no Google Cloud.
2. Cadastrar o callback do Worker.
3. Guardar GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET como secrets.
4. Autorizar GA4 com analytics.edit.
5. Executar primeiro a auditoria.
6. Conferir Key Events reais.
7. Só então executar a limpeza confirmada.
8. Auditar Zaraz Monitoring para o clique_whatsapp.
9. Depois alinhar GTM e Google Ads.

## Política de custo
Prioridade: recursos gratuitos e limites do plano Free. Evitar rotinas de alta frequência sem necessidade.
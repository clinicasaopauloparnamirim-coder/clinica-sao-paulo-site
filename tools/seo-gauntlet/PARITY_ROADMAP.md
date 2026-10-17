# Parity roadmap: SEO Monster → Clínica SEO Gauntlet

**Principle:** use SEOMonster as a capability reference, not as a fourth brain. The architecture remains exactly three brains; Heartseomap remains our proprietary local SEO / Google Maps component. The Gauntlet is a shared audit engine/data source that can feed the existing brains through defined contracts.

Status key:
- **PARCIAL** — related signal exists, but semantics/coverage are not equivalent.
- **PENDENTE** — not implemented or not validated against real credentials.
- **BLOQUEADO POR CREDENCIAL** — requires a user-authorized read-only connection.
- **NÃO AUTOMATIZAR** — write operation deliberately excluded from default audit.

## 70-tool inventory

### General (1)
- `system_status` — PENDENTE: report enabled modules, versions, credential status and health probes without exposing secrets.

### Google Search Console (18)
- `gsc_list_properties` — BLOQUEADO POR CREDENCIAL
- `gsc_search_analytics` — BLOQUEADO POR CREDENCIAL
- `gsc_top_queries` — BLOQUEADO POR CREDENCIAL
- `gsc_top_pages` — BLOQUEADO POR CREDENCIAL
- `gsc_compare_periods` — BLOQUEADO POR CREDENCIAL
- `gsc_inspect_url` — BLOQUEADO POR CREDENCIAL
- `gsc_batch_inspect_urls` — BLOQUEADO POR CREDENCIAL
- `gsc_list_sitemaps` — BLOQUEADO POR CREDENCIAL
- `gsc_submit_sitemap` — NÃO AUTOMATIZAR; qualquer envio exige autorização explícita
- `gsc_request_indexing` — NÃO AUTOMATIZAR; qualquer solicitação exige autorização explícita
- `gsc_query_opportunities` — BLOQUEADO POR CREDENCIAL
- `gsc_query_gaps` — BLOQUEADO POR CREDENCIAL
- `gsc_new_queries` — BLOQUEADO POR CREDENCIAL
- `gsc_top_pages_by_query` — BLOQUEADO POR CREDENCIAL
- `gsc_portfolio_summary` — BLOQUEADO POR CREDENCIAL
- `gsc_trending_pages` — BLOQUEADO POR CREDENCIAL
- `gsc_decaying_pages` — BLOQUEADO POR CREDENCIAL
- `gsc_coverage_audit` — BLOQUEADO POR CREDENCIAL

### Google Analytics 4 (7)
- `ga4_run_report` — BLOQUEADO POR CREDENCIAL
- `ga4_top_landing_pages` — BLOQUEADO POR CREDENCIAL
- `ga4_traffic_by_channel` — BLOQUEADO POR CREDENCIAL
- `ga4_organic_search_overview` — BLOQUEADO POR CREDENCIAL
- `ga4_setup_audit` — BLOQUEADO POR CREDENCIAL; leitura apenas
- `ga4_site_search` — BLOQUEADO POR CREDENCIAL
- `ga4_landing_page_conversions` — BLOQUEADO POR CREDENCIAL

### PageSpeed Insights (2)
- `psi_analyze` — PENDENTE: consultar dados de laboratório e distinguir de dados de campo
- `psi_opportunities` — PENDENTE: oportunidades Lighthouse, sem prometer posição no Google

### Cloudflare (13)
- `cf_list_zones` — BLOQUEADO POR CREDENCIAL
- `cf_zone_info` — BLOQUEADO POR CREDENCIAL
- `cf_list_dns` — BLOQUEADO POR CREDENCIAL
- `cf_web_analytics` — BLOQUEADO POR CREDENCIAL
- `cf_purge_cache` — NÃO AUTOMATIZAR
- `cf_purge_cache_all` — NÃO AUTOMATIZAR
- `cf_settings_audit` — BLOQUEADO POR CREDENCIAL; leitura apenas
- `cf_settings_update` — NÃO AUTOMATIZAR
- `cf_list_redirects` — BLOQUEADO POR CREDENCIAL; leitura apenas
- `cf_create_redirect` — NÃO AUTOMATIZAR
- `cf_delete_redirect` — NÃO AUTOMATIZAR
- `cf_bulk_redirect_upsert` — NÃO AUTOMATIZAR
- `cf_managed_robots` — somente leitura por padrão; qualquer configure/disable exige aprovação separada

### IndexNow (2)
- `indexnow_submit` — NÃO AUTOMATIZAR
- `indexnow_bulk_submit` — NÃO AUTOMATIZAR

### Technical SEO (8)
- `inspect_meta` — PARCIAL: title/description/robots/OG; expandir Twitter/hreflang
- `check_canonical` — PARCIAL: presença/duplicidade; ampliar checagem de destino e host
- `mixed_content_check` — PARCIAL: segunda passagem detecta recursos HTTP em páginas HTTPS
- `redirect_chain_audit` — PARCIAL: cadeia por URL; comparar variantes www/raiz e HTTP/HTTPS
- `robots_txt_validate` — PARCIAL: HTTP, regras básicas e Sitemap; implementar grupos, RFC 9309 e cache-edge
- `sitemap_validate` — PARCIAL: XML e URLs; ampliar sitemap index/gzip/limites e lastmod
- `sitemap_health` — PARCIAL: verificação de status das URLs; adicionar amostragem/configuração e histograma
- `robots_ai_posture` — PENDENTE: gerador offline de recomendações, sem gravar robots.txt

### Chrome UX Report (2)
- `crux_history` — PENDENTE: dados históricos reais e credenciais opcionais
- `crux_snapshot` — PENDENTE: métricas de campo p75, com sinalização de ausência de dados

### Structured data / cross-site / on-page (7)
- `inspect_schema` — PARCIAL: tipos JSON-LD identificados na segunda passagem
- `validate_schema` — PARCIAL: sintaxe JSON-LD; validação semântica Google pendente
- `hreflang_consistency_check` — PARCIAL: extrai hreflang; reciprocidade e alvos pendentes
- `internal_link_graph` — PARCIAL: crawl interno limitado; grau, órfãs, profundidade e links quebrados pendentes
- `lighthouse_budget` — PENDENTE
- `internal_link_recommend` — PENDENTE; precisa combinar grafo interno com dados GSC
- `onpage_serp_gap` — PENDENTE; precisa SERP/concorrentes e comparação semântica

### Content intelligence (4)
- `content_opportunities` — BLOQUEADO POR CREDENCIAL
- `content_brief_data` — PENDENTE
- `topic_cluster_map` — BLOQUEADO POR CREDENCIAL
- `rank_change_attribution` — BLOQUEADO POR CREDENCIAL; requer janelas históricas e controle comparável

### AI / GEO citation (3)
- `ai_citation_readiness` — PENDENTE
- `ai_referral_overview` — BLOQUEADO POR CREDENCIAL
- `ai_citation_track` — BLOQUEADO POR CREDENCIAL e provedores opcionais; nunca tratar amostra única como ranking

### Keyword discovery (3)
- `gsc_keyword_expand` — BLOQUEADO POR CREDENCIAL
- `serp_adjacency_expand` — PENDENTE
- `keyword_universe` — BLOQUEADO POR CREDENCIAL e fornecedor opcional

### Workflow prompts (13)
- `content_workflow` — PENDENTE
- `content_brief` — PENDENTE
- `content_outline` — PENDENTE
- `content_article` — PENDENTE
- `content_performance` — BLOQUEADO POR CREDENCIAL
- `seo_setup_audit` — PENDENTE; só leitura
- `weekly_review` — BLOQUEADO POR CREDENCIAL
- `technical_seo_audit` — PARCIAL; encadeia o motor técnico atual
- `pre_deploy_check` — PENDENTE; deve falhar em CI diante de problemas críticos
- `structured_data_audit` — PARCIAL; parsing implementado, validação semântica pendente
- `content_audit` — BLOQUEADO POR CREDENCIAL
- `post_deploy_verify` — NÃO AUTOMATIZAR writes; verificar só leitura até aprovação
- `migration_check` — PENDENTE

## Acceptance gates

1. Unit tests pass in CI.
2. Public audit report identifies the exact URLs tested and timestamp.
3. Live website audit remains GET/HEAD-only; no writes to Cloudflare, GSC, IndexNow, or CMS.
4. Integrations require explicit, minimum read-only scopes; secrets are never emitted in reports.
5. Every finding includes evidence and a reproducible check; unknown is not silently converted into pass.
6. Before enabling any production gate, compare at least two independent sources where possible and document disagreements.

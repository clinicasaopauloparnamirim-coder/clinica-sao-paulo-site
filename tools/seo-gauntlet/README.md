# Clínica SEO Gauntlet

Ferramenta própria de auditoria técnica de SEO, somente leitura, em Python 3.12+ e sem dependências de terceiros. O código é novo para este projeto; não copia a implementação do SEO Monster.

## Uso local

```bash
python tools/seo-gauntlet/seo_audit.py https://clinicasaopauloparnamirim.com.br/ --crawl --max-pages 30
python tools/seo-gauntlet/advanced_checks.py seo-audit-report.json seo-audit-advanced.json
python tools/seo-gauntlet/crosspage_checks.py seo-audit-report.json seo-audit-crosspage.json
python -m unittest discover -s tools/seo-gauntlet -p "test_*.py" -v
```

O primeiro comando gera relatório JSON e Markdown; o segundo acrescenta verificações de status das URLs do sitemap, variantes HTTP/HTTPS e www, canonical, conteúdo misto e tipos Schema.org em JSON-LD. O modo crawl segue links internos até 30 páginas. Limites, timeout e tamanho máximo de resposta são intencionais para reduzir carga.

A ferramenta não submete sitemaps, não solicita indexação, não altera Cloudflare, não publica deploy e não grava no site auditado.

## Testes cobertos na primeira versão

- Status HTTP, title, meta description, meta robots e idioma do documento.
- Canonical ausente/duplicada e resolução de URLs relativas.
- H1 ausente/múltiplo, imagens sem atributo alt e JSON-LD inválido.
- Leitura de regras robots.txt e extração de URLs do sitemap XML.
- Cadeia de redirecionamento e variantes HTTP/HTTPS e www.
- Status HTTP das URLs listadas no sitemap.
- Recursos HTTP em páginas HTTPS e extração de tipos Schema.org em JSON-LD.
- Relatórios JSON/Markdown e testes unitários em CI.

A pontuação é **heurística interna**, não uma pontuação oficial do Google. Um resultado sem achados significa apenas que os testes implementados não detectaram problemas no escopo executado; não prova que o site inteiro está perfeito nem que o Google o indexou.

## Matriz de paridade — SEO Monster

| Área | Estado do Gauntlet | Próxima etapa |
|---|---|---|
| Metadados / HTML | Parcialmente implementado | Twitter Cards, hreflang e verificação em navegador renderizado |
| Canonical | Presença, duplicidade, host e alvo | Aprofundar normalização e conflitos por página |
| Redirecionamentos | Cadeia por URL e quatro variantes do host | Protocol downgrade, cache e cenários de migração adicionais |
| robots.txt | HTTP, regras básicas e diretiva Sitemap | Grupos, RFC 9309, probes por user-agent e cache-edge |
| Sitemap XML | XML e status das URLs | Sitemap index/gzip/limites, lastmod e amostragem configurável |
| Links internos | Crawl limitado | Grafo, links quebrados, páginas órfãs e profundidade |
| Dados estruturados | JSON-LD, tipos e verificações básicas de nome/endereço | Validação semântica Schema.org / Google Rich Results |
| Performance / CWV | PENDENTE de métricas Lighthouse/CrUX confiáveis | Configurar quota PSI / API key ou ferramenta de auditoria disponível; lab versus field data |
| Search Console | Não implementado | OAuth e leitura de propriedade autorizada |
| GA4 | Não implementado | OAuth/property e auditoria de eventos em modo leitura |
| Cloudflare | Módulo GET-only de zona/DNS/settings/Worker domains; auditoria de headers HTTP em CI | Ampliar cache rules/security settings; API token de leitura em CI é opcional e não foi configurado |
| IndexNow | Não implementado | Auditoria de configuração; nunca enviar sem autorização |
| AI citation / keyword research | Não implementado | Definir fonte, limites e critérios de evidência |
| SEO local / Google Maps | Heartseomap permanece separado | Integrar como fonte de dados local, não criar outro cérebro |

O inventário das 70 ferramentas e 13 prompts está em [PARITY_ROADMAP.md](PARITY_ROADMAP.md), com status por capacidade e regras de segurança.

## GitHub Actions

O workflow `SEO Gauntlet (read-only)` roda testes unitários e uma auditoria pública de leitura (SEO, redirect chain, security headers, sitemap e grafo interno) em pull requests. A auditoria também pode ser executada manualmente via **Actions → SEO Gauntlet (read-only) → Run workflow**, informando URL e opção de crawl. Os relatórios JSON e Markdown são publicados como artefato da execução.

## Segurança e limitações

- Não configure segredos no código nem use credenciais de produção em testes unitários.
- `cloudflare_audit.py` exige um API Token Cloudflare com permissões de leitura mínima (`Zone:Read`, `DNS:Read`, `Zone Settings:Read`, `Workers Scripts:Read`/`Workers Routes:Read` conforme endpoint); não executa writes. Não adicione o token ao repositório nem a artefatos.\n- Integrações autenticadas futuras devem usar permissões somente leitura por padrão; writes devem ficar fora do fluxo normal e exigir aprovação separada.
- O crawler limita-se ao host inicial e a no máximo 30 páginas.
- Sitemap index, JavaScript que injeta metadados depois do carregamento e renderização completa em navegador não são totalmente avaliados nesta versão.
- Resultados variam com CDN, cache, região, user-agent e momento do teste; compare execuções e fontes antes de declarar regressão.

# Clínica SEO Gauntlet

Ferramenta própria de auditoria técnica de SEO, somente leitura, em Python 3.12+ e sem dependências de terceiros. O código é novo para este projeto; não copia a implementação do SEO Monster.

## Uso local

```bash
python tools/seo-gauntlet/seo_audit.py https://clinicasaopauloparnamirim.com.br/
python tools/seo-gauntlet/seo_audit.py https://clinicasaopauloparnamirim.com.br/ --crawl --max-pages 30
python -m unittest discover -s tools/seo-gauntlet -p "test_*.py" -v
```

Gera relatório JSON e Markdown. O modo padrão consulta a página inicial, robots.txt e sitemap.xml; `--crawl` segue links internos até 30 páginas. Limites, timeout e tamanho máximo de resposta são intencionais para reduzir carga. A ferramenta não submete sitemaps, não solicita indexação, não altera Cloudflare, não publica deploy e não grava no site auditado.

## Testes cobertos na primeira versão

- Status HTTP da página e do robots.txt/sitemap.
- Title, meta description, meta robots e idioma do documento.
- Canonical ausente/duplicada e resolução de URLs relativas.
- H1 ausente/múltiplo, imagens sem atributo alt e JSON-LD inválido.
- Leitura de regras robots.txt e extração de URLs do sitemap XML.
- Verificação da cadeia de redirecionamento com limite de saltos.
- Relatórios JSON/Markdown e execução de testes unitários em CI.

A pontuação é **heurística interna**, não uma pontuação oficial do Google. O relatório distingue achados automáticos; revisão humana continua necessária.

## Matriz de paridade — SEO Monster

| Área | Estado do Gauntlet | Próxima etapa |
|---|---|---|
| Metadados / HTML | Implementado | Conferir OG/Twitter, headings e duplicidade no crawl |
| Canonical | Presença, duplicidade e URL resolvida | Verificar canonical cruzada e destino/status |
| Redirecionamentos | Cadeia e status por salto | Comparar variantes HTTP/HTTPS e www/raiz |
| robots.txt | HTTP, regras e diretiva Sitemap | Testar URLs específicas contra regras |
| Sitemap XML | HTTP, parse XML, contagem e URLs | Verificar status de cada URL e lastmod |
| Links internos | Coleta no modo crawl | Checagem 4xx/5xx, loops e profundidade |
| Dados estruturados | JSON-LD parseável | Validação de tipos/campos Schema.org e rich results |
| Performance / CWV | Não implementado nesta versão | PageSpeed Insights / CrUX; separar lab de field data |
| Search Console | Não implementado | OAuth e leitura de propriedade autorizada |
| GA4 | Não implementado | OAuth/property e auditoria de eventos em modo leitura |
| Cloudflare | Não implementado | API token mínimo, leitura de regras/cache/headers; sem writes |
| IndexNow | Não implementado | Auditoria de configuração; nunca enviar sem autorização |
| AI citation / keyword research | Não implementado | Definir fonte, limites e critérios de evidência |
| SEO local / Google Maps | Heartseomap permanece separado | Integrar como fonte de dados local, não criar outro cérebro |

## GitHub Actions

O workflow `SEO Gauntlet (read-only)` roda testes unitários em pull requests. A auditoria pública completa é manual via **Actions → SEO Gauntlet (read-only) → Run workflow**; informe a URL e opcionalmente habilite o crawl. Os relatórios são publicados como artefato da execução.

## Segurança e limitações

- Não configure segredos no código nem use credenciais de produção em testes unitários.
- Não há mutações remotas. Integrações autenticadas futuras devem usar permissões somente leitura por padrão e bloquear operações de escrita.
- O crawler limita-se ao host inicial e a no máximo 30 páginas.
- Sitemap index, JavaScript que injeta metadados depois do carregamento e renderização real de navegador não são totalmente avaliados nesta versão.
- Resultados variam com CDN, cache, região, user-agent e momento do teste; compare várias execuções antes de declarar regressão.

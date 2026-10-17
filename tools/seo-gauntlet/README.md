# Clínica SEO Gauntlet

Motor próprio de auditoria SEO para a clínica, em Python 3.12+ e biblioteca padrão. É uma implementação original baseada no mapa de capacidades do SEO Monster, sem copiar a implementação do repositório externo. Todos os scanners de produção operam em modo somente leitura.

## Uso local

```bash
python tools/seo-gauntlet/seo_audit.py https://clinicasaopauloparnamirim.com.br/ --crawl --max-pages 30
python tools/seo-gauntlet/advanced_checks.py seo-audit-report.json seo-audit-advanced.json
python tools/seo-gauntlet/crosspage_checks.py seo-audit-report.json seo-audit-crosspage.json
python -m unittest discover -s tools/seo-gauntlet -p "test_*.py" -v
```

Módulos opcionais, somente leitura:

```bash
CF_API_TOKEN="$CF_API_TOKEN" python tools/seo-gauntlet/cloudflare_audit.py --domain clinicasaopauloparnamirim.com.br --expected-worker clinica-sao-paulo-site
PSI_API_KEY="$PSI_API_KEY" python tools/seo-gauntlet/pagespeed_audit.py https://clinicasaopauloparnamirim.com.br/ --strategy mobile
```

O módulo de Cloudflare precisa de token com permissões mínimas de leitura e não exporta o token nem conteúdo de registros TXT. O adaptador PageSpeed suporta scores Lighthouse e dados de campo CrUX se a API os fornecer. Quando a API responde com quota excedida, o relatório marca `quota_limited`; ele não inventa scores. Nunca salve tokens no código, nos relatórios ou nos commits.

## Cobertura atual

- Status HTTP; cadeia de redirecionamentos; normalização de HTTP/HTTPS e www.
- Title, meta description, robots meta, HTML lang, H1, canonicals.
- Open Graph, Twitter Cards e hreflang extraído.
- Imagens sem alt, sintaxe JSON-LD, tipos Schema.org e verificações conservadoras por tipo.
- robots.txt: regras básicas e probes por agente/URL.
- Sitemap XML e status das URLs listadas.
- Crawl interno limitado, links internos quebrados, higiene básica do sitemap e conteúdo misto em páginas HTTPS.
- Headers efetivos observados na resposta pública, incluindo HSTS e X-Content-Type-Options.
- Cloudflare: zona, settings, DNS em modo sanitizado, Workers custom domains, inventário de scripts e comparação de ETags/nome esperado.
- PageSpeed: parser de categorias Lighthouse, métricas de laboratório e dados de campo quando disponíveis.

A pontuação é **heurística interna**, não uma pontuação oficial do Google. Ausência de findings significa apenas que os testes implementados não detectaram problemas dentro do escopo executado.

## GitHub Actions

O workflow `SEO Gauntlet (read-only)`:
1. Executa testes unitários em pull requests.
2. Rastreia a página e, em modo crawl, as páginas internas do host até o limite de 30.
3. Executa segunda passagem e cross-page checks.
4. Se o segredo GitHub Actions `CF_API_TOKEN` existir, tenta a auditoria Cloudflare GET-only; caso contrário, publica estado `skipped_no_token`.
5. Se `PSI_API_KEY` existir, tenta PageSpeed; se ausente, publica estado `skipped_no_api_key`. Quotas indisponíveis são registradas no JSON e não são transformadas em notas.
6. Armazena os relatórios como artefato `seo-gauntlet-report`.

Para executar manualmente: **Actions → SEO Gauntlet (read-only) → Run workflow** e informar URL e opção de crawl. No estado atual, a auditoria pública é executada sem credenciais Google. Os módulos autenticados continuam limitados pelos tokens/conexões realmente disponíveis.

## Matriz de paridade — SEO Monster

| Área | Estado do Gauntlet | Próxima etapa |
|---|---|---|
| Metadados / HTML | Implementado para HTML estático | Comparar DOM renderizado pelo navegador e ampliar tags |
| Canonical / redirects | Presença, destino e cadeias de quatro variantes | Expandir cenários de migração e variantes não raiz |
| robots.txt / sitemap | Parsing e probes básicos; 9 URLs testadas publicamente | Cobrir cache-edge, sitemap index/gzip e limites máximos |
| Grafo interno | Crawl limitado e validação de status | Profundidade completa, score de autoridade e validação de órfãs |
| Schema.org | JSON-LD, tipos e campos básicos | Validação semântica contra Google Rich Results |
| Performance / CWV | Adapter PSI com estado de quota explícito | Obter quota/chave e validar lab vs field separadamente |
| Search Console | Propriedades não disponíveis na conexão consultada | Conectar propriedade com permissão de leitura |
| GA4 | Propriedades não disponíveis na conexão consultada | Conectar propriedade e validar relatórios de leitura |
| Cloudflare | Adapter GET-only criado e settings comparados ao HTTP público | Ampliar regras/cache/redirects após permissão mínima disponível |
| IndexNow | Pendente | Auditoria de configuração sem submissão automática |
| Keyword / content intelligence | Pendente de provedores e/ou GSC | Implementar após fonte de dados confirmada |
| AI/GEO citations | Pendente de fontes e dados de referência | Definir avaliação reproduzível e intervalos de incerteza |
| SEO local / Google Maps | Heartseomap continua separado | Integrar como fonte de dados local existente; não criar quarto cérebro |

A lista completa das 70 ferramentas e 13 prompts de referência está em [PARITY_ROADMAP.md](PARITY_ROADMAP.md). Os resultados validados em 17/10/2026 estão em [RESULTS_2026-10-17.md](RESULTS_2026-10-17.md).

## Segurança e limitações

- Nenhuma ferramenta padrão submete sitemap, pede indexação, altera Cloudflare ou publica deploy.
- Writes do SEO Monster não são portados para o fluxo padrão. Qualquer ação mutável futura precisa de aprovação separada e verificação prévia.
- O crawler limita-se ao host inicial e a no máximo 30 páginas; os URLs internos únicos e entradas do sitemap têm limites para reduzir carga.
- Sitemap index, JS que injeta metadados depois do carregamento e renderização completa do navegador ainda não são cobertos por inteiro.
- Comparar resultados ao longo do tempo e tratar discrepâncias como incerteza até confirmar a causa com uma segunda fonte.

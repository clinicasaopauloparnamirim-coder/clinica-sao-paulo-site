# Relatório P1 — Local SEO Heatmap

**Data:** 2026-10-22  
**Estado:** **PARCIAL**  
**Projeto:** `clinicasaopauloparnamirim-coder/local-seo-heatmap` (repositório separado acessível; ausente no repositório principal `clinica-sao-paulo-site`)  
**Worktree:** `/workspace/cot/wt/p1-heatmap`  
**Branch:** `fix/p1-local-seo-heatmap-auth-2026-10-22`  
**Commit:** `e1c08952ad9c4b91b0b562d43f1b8ec586caf3df`

## Localização e estado encontrado

- Busca no repositório principal (`git grep` por `heatmap`, `local-seo`, `ignoreBuildErrors`, `CRUD`, `grid`) não encontrou o aplicativo/rotas; só encontrou referências documentais e artefatos sem o módulo.
- API do GitHub para `clinicasaopauloparnamirim-coder/local-seo-heatmap` retornou `clinicasaopauloparnamirim-coder/local-seo-heatmap` (HTTP 200).
- Stack: Next.js 16.1.6, App Router; rotas em `src/app/api/**/route.ts`.
- Configuração: `next.config.ts`; antes não havia `typescript.ignoreBuildErrors`; o commit explicita `typescript: { ignoreBuildErrors: false }`. `tsconfig.json` usa `strict: false`, mas o build Next executa TypeScript.
- Middleware/boundary existente: `src/proxy.ts`, restringe `/api/*` a host local, mesma origem e Fetch Metadata; não era autenticação de identidade.

## Rotas CRUD de escrita

Todas as operações abaixo passaram a chamar `requireApiToken` antes de executar lógica de negócio. O segredo é `LOCAL_SEO_API_TOKEN`; comparação usa `timingSafeEqual`; ausência retorna 503; cabeçalho `Authorization: Bearer ...` ausente/inválido retorna 401.

| Rota | Métodos de escrita | Antes | Depois |
|---|---|---|---|
| `/api/alerts` | POST, DELETE | sem token explícito | token obrigatório |
| `/api/businesses` | POST, PUT, DELETE | sem token explícito | token obrigatório |
| `/api/logs` | DELETE | sem token explícito | token obrigatório |
| `/api/presets` | POST, DELETE | sem token explícito | token obrigatório |
| `/api/proxies/fetch` | POST | sem token explícito | token obrigatório |
| `/api/proxies` | POST, PUT, PATCH, DELETE | sem token explícito | token obrigatório |
| `/api/reviews/[id]/rerun` | POST | sem token explícito | token obrigatório |
| `/api/reviews/[id]` | DELETE | sem token explícito | token obrigatório |
| `/api/reviews/preview` | POST | sem token explícito | token obrigatório |
| `/api/reviews` | POST | sem token explícito | token obrigatório |
| `/api/scans/[id]/cancel-schedule` | POST | sem token explícito | token obrigatório |
| `/api/scans/[id]/clone` | POST | sem token explícito | token obrigatório |
| `/api/scans/[id]/rerun` | POST | sem token explícito | token obrigatório |
| `/api/scans/[id]` | PATCH, DELETE | sem token explícito | token obrigatório |
| `/api/scans/[id]/stop` | POST | sem token explícito | token obrigatório |
| `/api/scans/estimate` | POST | sem token explícito | token obrigatório |
| `/api/scans/lookup` | POST | sem token explícito | token obrigatório |
| `/api/scans` | POST | sem token explícito | token obrigatório |
| `/api/settings` | POST | sem token explícito | token obrigatório |
| `/api/settings/whitelabel` | PUT | sem token explícito | token obrigatório |
| `/api/system/lookback` | POST | sem token explícito | token obrigatório |
| `/api/system/update` | POST | sem token explícito | token obrigatório |
| `/api/webhooks` | POST, DELETE | sem token explícito | token obrigatório |

Rotas somente de leitura identificadas incluem GET em alerts, businesses, dashboard, geocode, locations/autocomplete, logs, presets, proxies, reviews, scans e subrotas analíticas; não receberam a guarda de escrita.

## Testes e resultados

- Estado pré-correção: `npm run build` não pôde iniciar (`next: not found`, código 127) antes da instalação local das dependências; portanto, não foi possível executar HTTP pré-correção. Não foi enviado request a endpoint real.
- Pós-correção: `npx tsc --noEmit --pretty false` → **código 0**.
- Pós-correção, com servidor local em `127.0.0.1:3102`, `DATABASE_URL` apontando para SQLite sintético e token sintético:
  - `POST /api/scans`, sem Authorization → **401 Unauthorized**, `{"error":"Unauthorized"}`.
  - mesmo request com `Authorization: Bearer synthetic-wrong` → **401 Unauthorized**.
  - mesmo request com `Authorization: Bearer synthetic-p1-token` → **400 Bad Request**, `Keyword is required`; isso confirma que a autenticação passou e a validação da rota foi alcançada, sem criação de registro.
  - com `LOCAL_SEO_API_TOKEN` ausente, `POST /api/scans` → **503 Service Unavailable**, `{"error":"API authentication is not configured"}`.
- Cobertura estática verificou guarda em todos os 32 métodos POST/PUT/PATCH/DELETE enumerados.
- Build Next pós-correção: compilação e TypeScript passam, mas exportação/prerender falha ao acessar o banco local existente: `PrismaClientKnownRequestError`, coluna `main.Scan.shape` não existe em `dev.db`. Com banco sintético migrado, o mesmo tipo de falha ocorre por divergência entre schema atual e banco/migrações (`Scan.shape`); não é erro de TypeScript introduzido pela alteração.

## Push, testes não executados e decisões

- `git push -u origin fix/p1-local-seo-heatmap-auth-2026-10-22` falhou com erro exato: `fatal: could not read Username for 'https://github.com': terminal prompts disabled` (código 128). Nenhum deploy ou merge foi feito.
- Não foi executado teste HTTP sem credencial contra cada uma das 23 rotas; foi executado teste representativo em `/api/scans` e cobertura estática em todas as escritas.
- Não foram testados fluxos autenticados que exigem payload válido/efeito de negócio; o teste válido foi deliberadamente interrompido pela validação 400 para não gravar dados.
- Decisão do dono registrada: autenticação explícita por token de ambiente, fail-closed 503 sem configuração, 401 para token ausente/inválido, comparação em tempo constante e `ignoreBuildErrors: false`; sem produção, deploy ou merge.

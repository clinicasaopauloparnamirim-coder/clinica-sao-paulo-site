# AUDITORIA DE REPOSITORIOS E RUNTIME — 2026-10-07

Método: entender → definir pronto → executar → verificar → criticar → reverificar. Regra de evidência: execução real > teste automatizado > diff > leitura estática. Canva explicitamente fora desta rodada.

## 1. local-seo-heatmap

Repositório: clinicasaopauloparnamirim-coder/local-seo-heatmap
Estado GitHub: acessível, branch main, permissão admin/maintain/push.
Stack declarada: Next.js 16, React 19, Electron, SQLite/Prisma, Playwright.

### Achados
- O README descreve um GBP Rank Tracker/geo-grid com scans, histórico, concorrentes e automação de navegador.
- package.json: versão 1.9.6; TypeScript, Next.js, Prisma, better-sqlite3, Playwright.
- src/app/api/scans/route.ts expõe GET de scans e POST de criação de scan. O código lido não apresenta autenticação/controle de acesso.
- src/app/api/scans/[id]/route.ts expõe GET de resultados, DELETE do scan e PATCH de campos. O código lido não apresenta autenticação/controle de acesso.
- POST cria scans e chama enqueueScan(), que pode iniciar imediatamente até dois navegadores Chromium em paralelo.
- DELETE remove resultados e o scan.
- next.config.ts contém typescript.ignoreBuildErrors=true, portanto erros TypeScript não bloqueiam o build Next.js.

### Classificação
P1 — superfície de execução e destruição sem autenticação aparente. O impacto exato em produção permanece INCONCLUSIVO até confirmar deployment e camada de proteção externa.
P1 — build não bloqueia erros TypeScript.
Não executar nem publicar este serviço como componente do Control Tower antes de validar autenticação, rate limiting, isolamento de tenant e proteção contra abuso de scans.

## 2. scrapling-mcp-clinica

Repositório: clinicasaopauloparnamirim-coder/scrapling-mcp-clinica
Estado GitHub: privado, branch main, permissão admin/maintain/push.
É apenas um scaffold de deployment; não há evidência de deployment público.

### Achados
- Dockerfile usa pyd4vinci/scrapling:latest.
- Expõe porta 8000.
- Comando inicia scrapling-mcp --http --host 0.0.0.0 --port 8000.
- docker-compose publica 8000:8000.
- README exige SCRAPLING_MCP_AUTH_TOKEN, TLS/reverse proxy e recomenda não expor 8000 diretamente.
- O Dockerfile define SCRAPLING_MCP_AUTH_TOKEN vazio por padrão e não passa explicitamente --auth-token.
- Portanto a segurança efetiva depende da versão da imagem e de configuração externa; não há prova de deployment/endpoint operacional.

### Confronto externo
Há registro recente no upstream do Scrapling de mudança para exigir autenticação no transporte HTTP por padrão; também existe problema documentado de incompatibilidade com mcp 2.0.0 em versões afetadas. Portanto usar latest sem pin é risco de reprodutibilidade e compatibilidade.

### Classificação
P1 — imagem latest não pinada.
P1 — autenticação real do deployment não comprovada.
P1 — compatibilidade MCP precisa ser fixada/testada antes de produção.
INCONCLUSIVO — deployment público/Composio Custom MCP não comprovado.

## 3. Decisão operacional

Nenhum dos dois repositórios é promovido para os três cérebros nesta rodada.
- local-seo-heatmap: candidato de ferramenta do Brain 3/SEO local, mas bloqueado até fechar segurança/runtime.
- scrapling-mcp-clinica: candidato de infraestrutura/browser-data, mas bloqueado até provar deployment HTTPS + auth + versão.
- Canva: fora da auditoria por solicitação explícita.

## 4. Próximo alvo da varredura

Reconciliar os demais repositórios históricos com:
1. existência atual no GitHub;
2. código presente;
3. conexão MCP/Composio;
4. execução real;
5. encaixe nos três cérebros;
6. duplicação;
7. riscos P0/P1;
8. somente então considerar ativação.

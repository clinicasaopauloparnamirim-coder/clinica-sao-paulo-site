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


## 5. AgentJev

Repositório: malevrigns/agent-jev
Código-fonte atual confirmado no GitHub. O repositório contém implementação Python, cliente, hook, serviço HTTP e script de teste prático.

### Achados
- O README define o AgentJev como um motor de decisão não autoregressivo: recebe um estado + perguntas tipadas e devolve distribuições/probabilidades, não texto.
- O próprio README limita o papel: usar como gate, route ou score; a prosa permanece com um modelo maior.
- O benchmark publicado não prova sucesso operacional de um agente nem sucesso de execução de tarefas; é um benchmark de concordância com um teacher argmax.
- Há um serviço HTTP no repositório, mas não há conexão operacional JEV descoberta no runtime do Control Tower nesta rodada.

### Classificação
P1 — candidato forte para **Brain 2 / camada de julgamento**, especialmente para decisões binárias/roteamento.
INCONCLUSIVO — execução do modelo JEV dentro do Control Tower não foi comprovada nesta rodada.
Não declarar JEV como “cérebro já funcionando” sem um teste real de inferência ligado ao pipeline.

## 6. LAYA

Repositório: NandhaKishorM/laya
Código-fonte atual confirmado no GitHub.

### Achados
- Laya é um motor de decisão não autoregressivo, com Router, suporte multilíngue e extras para HTTP/MCP/LangChain/CrewAI etc.
- O README documenta instalação via Python e demonstra inferência local com `Router().predict(...)`.
- O projeto publica checkpoints e benchmark próprio; isso comprova existência do motor, não integração do motor com o Control Tower.
- O runtime do Control Tower verificado anteriormente reporta `laya_configured:false`, portanto não há evidência de que LAYA esteja ativo como executor do Control Tower.

### Classificação
P1 — candidato forte para **Brain 2 / decisão rápida**, com vantagem de cobertura multilíngue.
INCONCLUSIVO — MCP/HTTP externo e inferência real dentro do Control Tower ainda não comprovados.
JEV e LAYA não devem ser instalados em paralelo como dois julgadores independentes sem uma política explícita de seleção/fallback.

## 7. Hermes Agent

Repositório: NousResearch/hermes-agent
Código-fonte atual confirmado no GitHub.

### Achados
- O README descreve agente geral com terminal, subagentes, memória, skills, cron e múltiplos canais.
- O pyproject atual fixa muitas dependências diretamente, incluindo `browser-harness==0.1.13`, e restringe Python a >=3.11,<3.15.
- Isso é significativamente mais amplo que um “judge”; Hermes é candidato a **Brain 1 / execução-orquestração**, não a substituto do JEV/LAYA.
- A amplitude de acesso ao terminal e canais aumenta o blast radius; conexão direta ao ambiente de produção exigiria sandbox e permissões mínimas.
- Não há prova nesta rodada de Hermes executando como worker do Control Tower.

### Classificação
P1 — forte capacidade potencial de Brain 1, mas com superfície de privilégio alta.
INCONCLUSIVO — runtime integrado não comprovado.
Não conectar Hermes diretamente ao caminho de mutação do Google Ads.

## 8. Decisão arquitetural atual

- **Brain 1:** Hermes pode ser candidato de execução/orquestração, mas somente em sandbox/escopo mínimo.
- **Brain 2:** JEV ou LAYA podem ocupar a camada de julgamento; ainda falta teste de inferência real para escolher um vencedor.
- **Brain 3:** OpenSEO/OpenGSC são candidatos de dados/SEO; OpenSEO mostra controles de autenticação mais completos, OpenGSC oferece MCP com token + RBAC/custos explícitos.
- **Google Ads:** nenhum desses motores recebeu autorização para mutar Search-2; Search-2 permanece fora de todos os fluxos.
- **Canva:** continua fora.
- Nenhuma alteração foi feita no branch main nesta rodada.

## 9. Estado de evidência

Conexão/execução real continua sendo o gargalo central: repositório existente não equivale a ferramenta conectada; ferramenta conectada não equivale a executor operacional. A próxima etapa deve procurar evidência de runtime para **um único candidato por função**, começando por Brain 2 e pelo caminho seguro de leitura, antes de qualquer ação mutável.

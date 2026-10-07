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


## 10. Ruflo

Repositório: ruvnet/ruflo
Código-fonte atual confirmado no GitHub. O projeto se apresenta como meta-harness/orquestração para Claude Code e Codex, com MCP, agentes especializados, memória e controles.

### Achados
- O README descreve o fluxo User → Ruflo → Router → Swarm → Agents → Memory → LLM providers como arquitetura conceitual, não como rastreio de uma execução real.
- O projeto possui MCP e uma camada explícita de permissões: read/write/manage/full, com ask/auto; rede, gastos e ações destrutivas continuam exigindo confirmação.
- O pacote raiz atual é publicado como `claude-flow` 3.54.0 e inclui componentes de MCP, neural, security e federation.
- Nenhum runtime Ruflo conectado ao Control Tower foi comprovado nesta rodada.

### Classificação
P1 — candidato de **Brain 2 / orquestração e controle**, não um quarto cérebro.
INCONCLUSIVO — execução no ambiente da clínica não comprovada.
Não duplicar o papel de um orquestrador já ativo sem definir qual runtime tem autoridade.

## 11. Superpowers

Repositório: obra/superpowers
Código-fonte e metodologia atuais confirmados no GitHub.

### Achados
- Superpowers é uma metodologia composta por skills/hooks para coding agents, não um motor LLM, MCP backend ou executor independente.
- O fluxo inclui brainstorming, worktrees, planos, subagentes, TDD, code review e finalização de branch.
- O próprio projeto trata o workflow como obrigatório e usa severidade para bloquear avanço quando há problemas críticos.
- Não foi encontrada evidência de um runtime Superpowers autônomo conectado ao Control Tower.

### Classificação
SUPORTE — camada de disciplina/processo que pode reforçar Brain 1 e Brain 2.
Não promover como cérebro, orquestrador ou executor separado.
Antes de instalar hooks/plugins em qualquer harness, revisar o código e validar o alvo exato; instalação em múltiplos harnesses não implica uma integração central.

## 12. Decisão após esta rodada

A arquitetura permanece limitada a três cérebros:
- Brain 1 = automação/execução.
- Brain 2 = orquestração + julgamento/controle, com no máximo um caminho de autoridade por função.
- Brain 3 = marketing/SEO/dados de marketing.

Mapeamento provisório:
- Hermes: candidato de Brain 1, alto privilégio, sandbox obrigatório.
- Ruflo: candidato de Brain 2 para orquestração/controle.
- JEV ou LAYA: candidato de Brain 2 para julgamento rápido; ainda falta escolher por execução/benchmark aplicado ao caso real.
- OpenSEO/OpenGSC: candidatos de Brain 3/dados SEO.
- Superpowers: camada transversal de processo, não cérebro.

Estado: nenhum novo runtime foi ativado; nenhum segredo ou credencial foi alterado; main permanece intocado.

## 13. OpenManus

Repositório: FoundationAgents/OpenManus
Código atual confirmado.

### Achados
- Agente geral com execução via terminal e integração de browser.
- A documentação atual indica Browser Use CLI/MCP como camada padrão de browser e permite modo local/isolado.
- O fluxo multiagente existe, mas a própria documentação o trata como versão instável.
- Não existe evidência nesta rodada de OpenManus conectado ao runtime da clínica.

### Classificação
P1 — capacidade sobreposta com Hermes/Agent Zero/Browser Harness.
INCONCLUSIVO — sem runtime operacional no Control Tower.
Não adicionar enquanto Brain 1 não tiver uma escolha de executor única.

## 14. Agent Zero

Repositório: agent0ai/agent-zero
Código atual confirmado.

### Achados
- Framework de agente com Linux desktop em Docker, browser, terminal, arquivos, memória, plugins e subagentes.
- Pode fazer tarefas de GUI que APIs não cobrem.
- A abrangência de terminal + bridge para máquina host cria superfície de privilégio elevada.
- Não há conexão operacional comprovada com o Control Tower nesta rodada.

### Classificação
P1 — forte, mas altamente sobreposto ao Brain 1 e com blast radius elevado.
INCONCLUSIVO — sem execução integrada.
Não promover nem conectar diretamente à produção.

## 15. MonkeyCode

Repositório: chaitin/MonkeyCode
Código atual confirmado.

### Achados
- Plataforma de desenvolvimento com ambientes remotos, tarefas, múltiplos modelos e revisão automatizada.
- Arquiteturalmente é uma plataforma de desenvolvimento completa, não um componente pequeno do Control Tower.
- A documentação recomenda infraestrutura dedicada para console e hosts de desenvolvimento.
- Não foi comprovada integração operacional com o runtime da clínica.

### Classificação
SUPORTE/ALTERNATIVA — potencial para laboratório de engenharia, não componente necessário do Control Tower.
Adoção criaria outra plataforma de execução e duplicaria Brain 1.

## 16. CommandCode

A organização CommandCodeAI foi localizada, mas o repositório exato command-code não foi resolvido pelo GitHub nesta rodada; portanto não vou inventar sua localização.

O módulo cmd-mod-jev-nudge foi confirmado e documenta uso de Jev para decidir se um agente deve continuar após um ponto de parada. Ele opera como uma modificação do Command Code e usa serviço externo para a inferência.

### Classificação
INCONCLUSIVO — identidade completa do runtime Command Code não resolvida.
O mod Jev é evidência de um padrão útil para o Brain 2 (nudge/continuation), mas não prova integração com nosso Control Tower.
Não instalar nem tratar como componente operacional sem repositório/runtime exato.

## 17. Maestri

O repositório anteriormente referido como open-maestri/maestri / MaestriAI/maestri não foi encontrado pelo GitHub conectado nesta rodada.

### Classificação
INCONCLUSIVO — identidade do repositório não resolvida.
Não promover, instalar ou atribuir função até localizar a fonte exata.

## 18. Decisão desta rodada

- Brain 1 mantém um único executor principal a ser escolhido entre os candidatos já auditados; Hermes é o candidato mais claramente alinhado, mas ainda INCONCLUSIVO em integração.
- OpenManus, Agent Zero e MonkeyCode ficam como alternativas laboratoriais, não adicionadas.
- Brain 2 pode usar JEV/LAYA como julgamento e Ruflo como orquestração, mas a autoridade precisa ser única por função.
- CommandCode/JEV-nudge é candidato de padrão para continuação, não runtime conectado.
- Maestri permanece não resolvido.
- Nenhuma alteração no main; apenas este registro no branch de auditoria.
## 19. SE Ranking SEO Skills

Repositório: seranking/seo-skills
Código e documentação atuais confirmados.

### Achados
- É uma coleção de Agent Skills orientada ao MCP remoto da SE Ranking.
- Entrega briefs, AI search share of voice, auditoria técnica, drift, SXO e análise competitiva.
- Depende de um provedor externo de dados/credenciais; não é um banco de dados SEO próprio.
- Há forte sobreposição funcional com OpenSEO/OpenGSC no Brain 3.

### Classificação
SUPORTE/ALTERNATIVA — útil como skill especializada quando houver necessidade específica de SE Ranking.
Não adicionar por padrão ao núcleo do Brain 3; primeiro demonstrar uma lacuna que OpenSEO/OpenGSC não cobre.

## 20. Open SEO MCP Skills / Ryze

Repositório: Ryze-AI-Adgent/open-seo-mcp-skills
Código e documentação atuais confirmados.

### Achados
- Skills SEO/GEO para um MCP remoto da Ryze, incluindo GSC, GA4, keyword research, rank tracking e SEO-vs-Ads.
- As capacidades se sobrepõem diretamente às conexões Google e às camadas OpenSEO/OpenGSC já auditadas.
- O valor adicional depende de uma conexão externa ao workspace Ryze; essa conexão não foi comprovada no runtime da clínica nesta rodada.

### Classificação
SUPORTE/ALTERNATIVA — não promover ao núcleo sem provar uma capacidade diferencial real.
Não criar uma segunda fonte de verdade para GSC/GA4/Google Ads.

## 21. SkillSpector

Repositório: NVIDIA/SkillSpector
Código e documentação atuais confirmados.

### Achados
- É um scanner de segurança para skills de agentes, com análise estática e opcional semântica, relatórios JSON/Markdown/SARIF e controles de baseline.
- O projeto declara categorias que incluem prompt injection, exfiltração, escalada de privilégio, supply chain, excessive agency e tool/MCP poisoning.
- O scanner possui limites de ingestão para controlar downloads/arquivos grandes e falha fechado ao exceder limites.

### Classificação
SUPORTE FORTE — candidato transversal à cadeia de auditoria antes de instalar skills/plugins.
Não é cérebro nem executor. Deve funcionar como gate de segurança para os candidatos de skills/harness.

## 22. DeepWiki

Repositório: CognitionAI/deepwiki
Código/documentação confirmados.

### Achados
- Oferece um servidor MCP remoto de consulta de documentação de repositórios.
- O servidor remoto descrito pelo README é no-auth e expõe apenas três ferramentas de leitura.
- Pode acelerar compreensão de repositórios, mas não fornece execução ou autoridade operacional.

### Classificação
SUPORTE — ferramenta de compreensão/documentação.
Não é candidato a cérebro nem a caminho de mutação.

## 23. Decisão Brain 3

- OpenSEO permanece candidato principal para inteligência SEO estruturada.
- OpenGSC permanece candidato forte para dados GSC/rank/AEO/SEO local quando houver runtime próprio comprovado.
- SE Ranking e Ryze ficam como alternativas, evitando duplicação de dados.
- SkillSpector ganha prioridade como gate de segurança antes da instalação de qualquer skill/plugin de terceiros.
- DeepWiki fica como ferramenta de leitura/reconhecimento, sem autoridade.
- Nenhuma dessas camadas foi promovida para produção nesta rodada.

## 24. Decisão explícita — OpenGSC fora

O usuário determinou que OpenGSC está fora por custo. Portanto:
- não será promovido ao Brain 3;
- não será usado como fallback pago;
- não será conectado nem instalado como componente da arquitetura;
- futuras comparações devem priorizar alternativas gratuitas/self-hosted.

A partir desta decisão, OpenSEO e alternativas gratuitas/self-hosted passam a ser avaliados sem OpenGSC como referência operacional.

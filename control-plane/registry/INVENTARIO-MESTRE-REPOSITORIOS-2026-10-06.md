# INVENTÁRIO MESTRE — REPOSITÓRIOS TESTADOS/AUDITADOS
Data: 2026-10-06
Escopo: reconciliar nomes citados/testados nas conversas acessíveis + registro do Control Tower + verificações atuais.

## Regra de leitura
- 🟢 OPERACIONAL COM PROVA: execução real verificável.
- 🟡 IDENTIDADE/AUDITORIA CONFIRMADA, MAS NÃO OPERACIONAL: projeto identificado, porém sem prova de execução integrada no runtime atual.
- 🔵 CONECTADO POR CAMADA: a função correspondente está disponível por uma conexão/toolkit real, mas isso não prova que o repositório foi instalado.
- 🔴 NÃO VALIDADO: nome apareceu, mas o repositório/fonte exata ou execução ainda não foi comprovada.
- ⚪ NÃO É REPOSITÓRIO: produto/serviço/agente citado, sem repo específico comprovado.

## REPOSITÓRIOS

### 1. Clínica São Paulo
- Repo: clinicasaopauloparnamirim-coder/clinica-sao-paulo-site
- Papel: site + Control Plane/Control Tower
- Estado: 🟢
- Evidência: GitHub read/write executado; branch de auditoria criada; arquivos de governança e MCP presentes.
- Observação: não confundir "site operacional" com todas as integrações operacionais.

### 2. JEV / AgentJev
- Repo: malevrigns/agent-jev
- Papel: julgamento/gates/decisões System 1
- Estado: 🟡
- Evidência: identidade do repo confirmada e auditada; documentação local do Control Plane referencia JEV para gates.
- Não comprovado: execução do AgentJev dentro do runtime atual ou via Composio.

### 3. LAYA
- Repo principal: NandhaKishorM/laya
- Papel: julgamento local/System 1
- Estado: 🟡
- Evidência: repo atual confirmado; documentação local referencia este projeto.
- Não comprovado: runtime integrado ativo.
- Repo relacionado: vishalmysore/layaAgent (exemplo/agente construído com Laya), também identificado durante a reconciliação.

### 4. MonkeyCode
- Repo: chaitin/MonkeyCode
- Papel: coding agent / desenvolvimento
- Estado: 🟡
- Evidência: repo confirmado; documentação do Control Plane contém integração/uso planejado e tarefa de teste.
- Não comprovado: execução live pelo nosso runtime.

### 5. Command Code
- Repo: CommandCodeAI/command-code
- Papel: coding agent
- Estado: 🟡
- Evidência: repo oficial identificado e auditado como candidato de coding.
- Não comprovado: conexão/execução no Control Tower.

### 6. OpenCode
- Repo canônico atual: anomalyco/opencode
- Papel: coding agent/open-source terminal agent
- Estado: 🟡
- Evidência: projeto identificado durante a avaliação do stack NVIDIA/OpenCode.
- Não comprovado: instalação/execution live no runtime atual.
- Nota: existe repo antigo opencode-ai/opencode arquivado; não usar como fonte canônica atual.

### 7. NVIDIA Nemotron
- Repo: NVIDIA-NeMo/Nemotron
- Papel: modelos/infra de LLM para execução de agentes
- Estado: 🟡
- Evidência: repo oficial confirmado durante a avaliação NVIDIA/OpenCode.
- Não comprovado: Nemotron/NIM executando por uma conexão MCP operacional.

### 8. FreeLLMAPI
- Repo: tashfeenahmed/freellmapi
- Papel: gateway/router de modelos e endpoints gratuitos
- Estado: 🟡
- Evidência: repo identificado e auditado como opção de infraestrutura.
- Não comprovado: runtime conectado/executando como provider.

### 9. OpenSEO
- Repo: every-app/open-seo
- Papel: SEO, keywords, ranking, auditorias, concorrência, AI visibility
- Estado: 🟢/🔵
- Evidência: toolkit custom_openseo está ACTIVE no Composio; chamada real LIST_PROJECTS retornou dois projetos da Clínica.
- Limite: isto prova a camada OpenSEO operacional; não prova que o código do repo foi instalado localmente.

### 10. OpenGSC
- Repo: fenjo26/opengsc
- Papel: Search Console self-hosted + SEO
- Estado: 🟡
- Evidência: repo identificado e auditado como candidato para VPS/SEO.
- Não comprovado: instalação/running na infraestrutura da Clínica.

### 11. Scrapling
- Repo upstream: D4Vinci/Scrapling
- Papel: scraping/crawling/data mining
- Estado: 🟡
- Evidência: projeto identificado durante a auditoria de minerador de dados.
- Não comprovado: instalação/execution dentro do Control Plane.

### 12. Browser Harness
- Repo: browser-use/browser-harness
- Papel: browser automation / CDP / MCP
- Estado: 🟡 + 🔵
- Evidência: repo confirmado; Composio possui browser_tool ACTIVE e pronto para uso.
- Limite: browser_tool ACTIVE não prova que o repo browser-harness está instalado.

### 13. Ruflo
- Repo: ruvnet/ruflo
- Papel: multi-agent orchestration/harness
- Estado: 🟡
- Evidência: repo confirmado e registrado como candidato de orchestration.
- Não comprovado: adoção/execução no runtime principal.

### 14. Superpowers
- Repo: obra/superpowers
- Papel: metodologia/skills/workflow para coding agents
- Estado: 🟡/🔵
- Evidência: repo auditado; o repositório da Clínica também contém uma camada pstack/skills com princípios de verification-first.
- Limite: presença de skills/pstack não prova que o upstream Superpowers está instalado como serviço separado.

### 15. Hermes Agent
- Repo: NousResearch/hermes-agent
- Papel: autonomous agent
- Estado: 🟡
- Evidência: identidade oficial confirmada; installer existe no Control Plane e foi auditado.
- Teste anterior: identidade/instalador foram confirmados, mas o loop conversacional ficou bloqueado sem provider de modelo.
- Não comprovado: Hermes operacional dentro do runtime atual.

### 16. Open-dot
- Repo: composio-community/open-dot
- Papel: personal/open-source agent ligado a OpenAI + Composio
- Estado: 🟡
- Evidência: repo oficial confirmado.
- Não comprovado: ferramentas Open-dot executáveis no runtime.

### 17. Spector
- Repo: spectrayan/spector
- Papel: memória cognitiva para agentes
- Estado: 🟡
- Evidência: repo identificado durante a arquitetura de memória.
- Não comprovado: instância conectada/rodando no stack.

### 18. Codemd
- Repo identificado: dotpyu/codemd
- Papel: transformar codebase em Markdown/contexto para LLM
- Estado: 🔴/🟡
- Evidência: fonte/repo localizado.
- Limite: não há prova de execução no runtime da Clínica nas evidências acessíveis.

### 19. open-maestri
- Repo: zlh-428/open-maestri
- Papel: canvas de orquestração de múltiplos coding agents
- Estado: 🟡
- Evidência: repo localizado durante a reconciliação de "Maestri"; suporta Claude Code/Codex/Gemini CLI/OpenCode.
- Limite: não comprovado instalado/conectado à nossa torre.

### 20. DeepWiki
- Repo oficial identificado: CognitionAI/deepwiki
- Papel: documentação/entendimento de repositórios
- Estado: 🔵/🟡
- Evidência: DeepWiki foi usado/avaliado como camada de leitura de repositórios; repo oficial identificado.
- Limite: não confundir o serviço DeepWiki com um checkout local desse repo.

### 21. free-for-dev
- Repo: ripienaar/free-for-dev
- Papel: catálogo de serviços com free tiers
- Estado: 🟡
- Evidência: repo confirmado durante a auditoria de alternativas gratuitas.
- Não é componente de runtime.

### 22. Awesome
- Repo: sindresorhus/awesome
- Papel: índice de recursos/repositórios
- Estado: 🟡
- Evidência: identificado como fonte de descoberta durante o levantamento de ferramentas.
- Não é componente de runtime.

## NOMES QUE APARECERAM, MAS AINDA NÃO DEVEM SER TRATADOS COMO REPOSITÓRIO VALIDADO

### DSH
Foi citado como parceiro/lab de coding junto do Ruflo, mas o repositório exato não está estabelecido na evidência atual.

### Open Design
Está registrado no documento de orquestração como "Design lab", mas o repo exato não foi recuperado com confiança.

### Archify
Está registrado como ferramenta de docs/mapa, mas o repo exato não foi recuperado com confiança.

### SkillSpector
Está registrado como skill gate, mas o repo/origem exata ainda não foi comprovado.

### "Minerador de dados"
É uma função/objetivo, não um repo único. Scrapling foi um dos candidatos concretos avaliados.

## NÃO SÃO REPOSITÓRIOS, MAS ENTRAM NO MAPA PORQUE FORAM TRABALHADOS

- Codex — agente/produto; não deve ser contado como repo.
- Antigravity — coding-agent/product layer; repo exato não estabelecido.
- Kimi Code — agente de coding; repo oficial atual: MoonshotAI/kimi-code, identificado na pesquisa; não há prova de execução integrada.
- Claude Code — coding agent/produto.
- Gemini — modelo/cliente/integração, não um repo único.
- Composio — plataforma de integração; o serviço está operacional via meta-tools e há conexão ACTIVE para Control Tower/OpenSEO.
- Control Tower — sistema interno do projeto, não um repo separado.
- Google Ads / GA4 / GSC — serviços externos, não repositórios.

## CONEXÕES/EXECUÇÃO COMPROVADAS NO RUNTIME ATUAL

1. GitHub — 🟢 leitura e escrita reais executadas.
2. Composio — 🟢 camada de meta-ferramentas operacional.
3. custom_control_tower — 🟢 conexão ACTIVE; leitura Ads atualmente retorna erro 400 de refresh token.
4. custom_openseo — 🟢 conexão ACTIVE; LIST_PROJECTS executado com sucesso.
5. browser_tool — 🟢 conexão ACTIVE, sem autenticação.
6. Google Search Console — 🟢 conexão ACTIVE com propriedade da Clínica.
7. JEV — 🔴 execução real não comprovada.
8. LAYA — 🔴 execução real não comprovada.
9. Hermes — 🔴 execução conversacional não comprovada.
10. Open-dot — 🔴 ferramentas executáveis não comprovadas.
11. NVIDIA/OpenCode — 🔴 conexão MCP executável não comprovada.

## REGRA PARA A PRÓXIMA FASE

Nenhum item 🟡/🔴 será promovido para "funcionando" só porque existe no GitHub, foi instalado na interface ou aparece conectado. A promoção exige execução + resultado + verificação.

Search-2 continua permanentemente fora de qualquer leitura/mutação de Google Ads, salvo autorização explícita.

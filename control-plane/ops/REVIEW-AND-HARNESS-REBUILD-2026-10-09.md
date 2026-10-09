# Revisão independente do harness e dos cérebros — 2026-10-09

## Natureza desta revisão

Este documento registra uma **revisão técnica baseada em fontes públicas e evidências do repositório/runtime**. Não é uma reunião factual com CEOs, fundadores ou desenvolvedores externos, e não atribui a eles declarações que não fizeram.

## Referenciais públicos confrontados

- Anthropic, *Building effective agents*: preferir padrões simples e composáveis; distinguir workflows prescritos de agentes que dirigem dinamicamente ferramentas; adicionar autonomia apenas quando traz valor mensurável.
  https://www.anthropic.com/engineering/building-effective-agents
- OpenAI Agents SDK: ferramentas, handoffs, guardrails, sessões, handoff humano e tracing são primitivas de runtime — não apenas nomes dentro de um prompt.
  https://openai.github.io/openai-agents-python/
- OpenHands Software Agent SDK: execução real exige ferramentas, workspace/runtime e isolamento; declarações de capacidade no README não substituem execução.
  https://github.com/OpenHands/software-agent-sdk
- NVIDIA NeMo Agent Toolkit: avaliação deve executar workflows e medir acurácia/confiabilidade/latência contra casos definidos.
  https://docs.nvidia.com/nemo/agent-toolkit/latest/improve-workflows/evaluate.html
- GitHub Actions: credenciais e permissões devem seguir least privilege e práticas seguras.
  https://github.com/github/docs/blob/main/content/actions/reference/security/secure-use.md
- Hermes Agent: precisa de runtime hospedeiro e provedor de inferência configurado; a existência do repositório ou do conector Composio não instala o agente.
  https://github.com/NousResearch/hermes-agent

## Crítica central

### 1. O nono cérebro não fazia parte do runtime

O registro NVIDIA já descrevia o Brain 09, mas `BRAINS` em `src/agent-registry.ts` tinha somente oito itens e o smoke test do deploy exigia `brain_count:8`. A nova branch inclui o Brain 09 no mesmo registro utilizado pelo endpoint de arquitetura e altera o smoke test para exigir nove.

### 2. O Commander planejava, mas não executava as ferramentas externas

O endpoint `/orchestrate` recebe uma solicitação, constrói o contexto, pede ao modelo um plano e devolve JSON. Ele não possui, no caminho inspecionado, um dispatcher que execute as chamadas externas descobertas pelo Composio. A especificação foi corrigida para deixar isso explícito, evitando que um plano seja reportado como tarefa executada.

### 3. O registro exagerava estados de implementação

Várias capacidades eram rotuladas como `implemented`, embora a evidência disponível fosse apenas código, configuração ou descrição. A branch substitui esse vocabulário por estados mais honestos: `runtime-verified`, `partial`, `configured-unverified`, `design-only` e `blocked`. Cada cérebro inclui prontidão e motivo observável.

### 4. O julgamento externo não estava ativo

O Worker reportava `jev_configured:false` e `laya_configured:false`. A execução de Jev via Composio também falhou por não haver conexão ativa. O registro externo foi corrigido para não afirmar que Jev está integrado; Laya e NVIDIA ficaram como não comprovados até inferência observada. O endpoint Laya antigo em `api.laya.studio` foi alinhado ao endpoint hospedado documentado `api.laya-ai.com`, sem inventar que a chave esteja configurada.

### 5. A configuração do modelo não prova inferência

O Worker reporta o NVIDIA NIM configurado com `nvidia/nemotron-3.5-lightning-30b-a3b`, mas não temos uma resposta NIM real validada nesta rodada. Status correto: configurado, inferência pendente de teste. O teste `nvidia_test` existe dentro do MCP do Worker, mas a ferramenta ainda não está exposta no wrapper Composio usado nesta conversa.

### 6. As integrações têm estados diferentes por caminho

- Google Ads direto via Composio: uma consulta somente leitura, filtrada pela campanha ativa `24289443969`, retornou a campanha como ENABLED.
- Google Ads dentro do Control Tower: `400 invalid_grant`; o fluxo exige consentimento OAuth humano.
- GSC direto: listou as duas propriedades autorizadas da clínica.
- GA4 direto: listou nove eventos-chave da propriedade.
- GA4 e GSC dentro do Worker: falharam ao renovar o token Google (`502`).
- OpenSEO: `LIST_PROJECTS` funciona e retornou dois projetos para o mesmo domínio. Ambos retornam `ga4_not_connected` nos testes de integração GA4.
- Meta Ads/Instagram: nenhum conector ativo na lista examinada.
- Cloudflare direto: ocorreu falha de formato do cabeçalho `X-Auth-Key`; uma conexão `cloudflare_mcp` separada está ativa, mas isso não valida a conexão direta.
- GitHub Actions: workflows de Control Plane/Deploy recentes terminaram em sucesso; isso valida o pipeline, não todos os agentes.

## Arquitetura-alvo mínima

1. **Control Tower = coordenador e política**, não executor universal implícito.
2. **Um dispatcher explícito** precisa converter uma ação aprovada em tool slug + schema conhecido + conexão ativa + arguments validados. Uma chamada só conta como execução quando o executor retorna resultado.
3. **Ledger por execução**: run ID, objetivo, plano, ferramenta, estado prévio, saída normalizada, verificação posterior, tentativa e decisão.
4. **Executor isolado** para tarefas de código/navegador. Sem acesso irrestrito a secrets ou ao caminho financeiro.
5. **Judge/gates determinísticos** para escopo, confirmação, esquema, limites e idempotência. LLM recomenda; regras de código bloqueiam o que não é permitido.
6. **Red team e verificador são etapas executáveis**, com testes independentes, não apenas entradas no catálogo.
7. **Fallback limitado**: no máximo uma alternativa por etapa; após falha repetida, parar, salvar evidência e reportar o bloqueio. Não criar loops sem critério de término.
8. **Avaliação de cada cérebro**: sucesso observável, taxa de erro, latência, custo, cobertura e regressões a cada mudança relevante.

## Portão de promoção de um cérebro

Promover para verde somente quando todas as condições forem verdadeiras:
- identidade e responsabilidade definidas;
- tools e runtime reais disponíveis;
- teste positivo executado;
- teste negativo demonstra que ação proibida é bloqueada;
- resultado consultado novamente no sistema de origem;
- logs e estado persistente não expõem secrets/PII;
- um segundo verificador confirma a conclusão;
- CI e teste live de fumaça passam.

## Estado da branch

As alterações de código desta revisão estão isoladas na branch `audit/brain-09-marketing-full-funnel-20261009`. Ainda precisam passar build/typecheck e review; **não foram mescladas nem implantadas em produção**. OAuth e conexões externas exigem suas próprias verificações ou consentimento do titular.

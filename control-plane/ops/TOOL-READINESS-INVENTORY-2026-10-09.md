# Inventário Forense de Ferramentas — Anexação e Integração
Data: 2026-10-09
Repositório: clinicasaopauloparnamirim-coder/clinica-sao-paulo-site
Branch: audit/tool-readiness-inventory-2026-10-09
Método: GAUNTLET LOOP — buscar → confrontar → testar/revisar → identificar falhas → cruzar com arquitetura → classificar → registrar decisão → repetir até não surgirem candidatos relevantes.

## Definição de pronto
- READY-ATTACH: identidade/função conhecidas; registrada para anexação, sem alegar runtime.
- READY-READ: conexão ativa e leitura real verificada.
- PARTIAL: parte funciona; faltam dependências, ponte, segurança ou teste ponta a ponta.
- BLOCKED: dependência essencial ausente ou teste falhou.
- CANDIDATE: identidade/adequação não comprovada.
- DEFERRED: custo, risco, redundância ou dependência impede promoção.
- EXCLUDED: decisão explícita de não usar.

Runtime-ready exige chamada real, saída validada, teste de escopo negativo, read-back do estado e evidência registrada. Este inventário não instala software, concede OAuth, publica conteúdo, executa mutações financeiras nem altera produção.

## Resumo baseado em evidência
- O código registra 9 cérebros, 21 capacidades e 20 funções autônomas; isso não comprova execução de cada função.
- Control Tower health respondeu ok=true. Auditorias internas Google Ads, GSC e GA4 responderam nesta rodada. OpenSEO listou projetos e retornou dados de GSC/GA4.
- GitHub/CI está conectado; deploy anterior bem-sucedido não prova agente de engenharia autônomo.
- Composio tem conexões ativas para Control Tower, OpenSEO, Google Ads, GSC, GA4, GitHub, Semrush e outros. Conexão ativa não prova todas as ferramentas individualmente.
- Jev e Laya não estão comprovados como executáveis no Worker. Catálogo Composio não expôs nesta rodada nvidia_test, agent_pair_test e marketing_brief.
- NVIDIA/Nemotron está configurado, mas inferência real validada ainda falta.
- Despacho automático Commander → ferramentas externas continua parcial.
- Não iniciar crawls OpenSEO pagos quando leituras salvas atendem.
- Google Ads: somente leitura neste trabalho. Nenhuma alteração foi feita. Search-2 é permanentemente fora de escopo: não consultar, analisar ou modificar.
- OpenGSC, Canva, Zernio, FreeLLMAPI e o plugin arquivado Hermes-Bot-Mode permanecem excluídos.

## A. Runtime e cérebros
| Componente | Estado | Preparação | Bloqueio/próximo teste |
|---|---|---|---|
| Control Tower Worker / Playwright MCP | READY-READ para health; rotas existem no código | Anexável | Validar despacho externo, auth, logs e state read-back |
| Commander / ControlAgent | PARTIAL; gera planos, não despacha diretamente Composio | Anexável | Bridge real plan→tool runner→result→verify |
| Researcher | PARTIAL | Anexável | Execução multifuente com citações e verificação de contradições |
| Engineer | PARTIAL; GitHub/CI existem, agente autônomo não provado | Anexável | Patch isolado, build, testes, deploy controlado e rollback |
| SEO | PARTIAL; leituras OpenSEO/GSC verificadas | Anexável | Vínculos GA4/GSC e fluxo de oportunidades sem custos novos |
| Ads | READY-READ parcial | Anexável | Só leitura; mutações exigem autorização explícita |
| Red Team | BLOCKED/PARTIAL; gate independente não comprovado | Anexável em sandbox | Teste negativo e findings independentes |
| Judge | PARTIAL; políticas locais existem, Jev/Laya não provados | Anexável | Gate independente real, incluindo bloqueio de ação insegura |
| Marketing/Growth | PARTIAL; brief existe no código, execução via Composio não localizada | Anexável | Teste sintético, validação de schema, sem publicar |
| NVIDIA Ecosystem / Brain 09 | READY-ATTACH para catálogo/roteamento; runtimes individuais gated | Anexável | NIM inference e ferramenta real; projetos isolados |

## B. Conectores e ferramentas operacionais
| Ferramenta/família | Estado | Próximo requisito |
|---|---|---|
| Composio tool bus | READY-READ como ponte manual | Dispatcher automático com schema estrito, allowlist, logs e verificação |
| GitHub MCP | READY-READ | Alterações só em branch/PR, CI verde e revisão antes do merge |
| Google Ads via Composio | READY-READ | Leituras no escopo da campanha ativa; nunca Search-2 |
| Control Tower Ads OAuth | PARTIAL; erro invalid_grant documentado anteriormente | Auth-check atual e auditoria real; não pedir consentimento automaticamente |
| Google Search Console via Composio | READY-READ | Query/page/date/device validado com intervalo explícito |
| Control Tower GSC | READY-READ nesta rodada | Comparar propriedade, datas e saída com conexão nativa |
| GA4 via Composio | READY-READ | Relatório de eventos com intervalo explícito |
| Control Tower GA4 | READY-READ nesta rodada | Comparar eventos com conexão nativa |
| OpenSEO | READY-READ | Resolver vínculos de GSC/GA4 e projetos duplicados sem crawl pago |
| Semrush | READY-READ por conexão ativa | Leitura mínima e registro de limites/custo |
| Ahrefs | PARTIAL; ferramentas limitadas, autenticação ampla não provada | Confirmar entitlement e leitura real |
| Cloudflare MCP | READY-READ/PARTIAL | Confirmar conta e Worker em leitura |
| Cloudflare connector direto | BLOCKED por erro HTTP 400 no formato X-Auth-Key | Corrigir pelo método suportado; não expor nem duplicar credenciais |
| Google Business Profile | PARTIAL | Confirmar permissão e leitura do perfil correto |
| Gmail | Conexão READY-READ; uso operacional não testado nesta rodada | Teste mínimo quando necessário |
| Google Drive | Conexão READY-READ; uso operacional não testado nesta rodada | Teste mínimo quando necessário |
| Google Workspace/Sheets/Calendar | PARTIAL/sem prova recente suficiente | Verificar conexão e schema antes de depender |
| Slack | Conexão READY-READ; uso operacional não testado nesta rodada | Teste mínimo; não enviar mensagens sem pedido |
| Meta Ads | BLOCKED/NOT CONNECTED; sem conta ativa verificada | Autorização do proprietário e teste read-only |
| Instagram | BLOCKED/NOT CONNECTED; sem conta ativa verificada | Autorização do proprietário e teste read-only |
| WhatsApp/CRM/ledger | PARTIAL; ledger/webhook existem no código | Evento sintético, assinatura, persistência e read-back |
| JEV | BLOCKED; Composio sem conta ativa, Worker depende de TYPESAFE_API_KEY | Confirmar endpoint/credencial e teste sintético schema-validado |
| Laya | BLOCKED/INCONCLUSIVE; configuração reportada não prova inferência | Confirmar endpoint/auth e executar chamada sintética |
| NVIDIA NIM / Nemotron | CONFIGURED-UNVERIFIED | HTTP 2xx, conteúdo esperado e latência; nunca expor chave |
| Workers AI fallback | CONFIGURED-UNVERIFIED | Resposta real e teste de fallback |
| Hermes Agent | CANDIDATE / runtime não comprovado | Sandbox read-only; não instalar Hermes-Bot-Mode arquivado |
| Ruflo | CANDIDATE | Comparar com Commander antes de adotar |
| Open-SEO, repo every-app/open-seo | CANDIDATE, distinto do serviço OpenSEO conectado | Confirmar identidade, licença e se é o projeto pretendido |
| Browser Harness | CANDIDATE | Identidade, licença, manutenção e redundância com Playwright MCP |
| Local SEO Heatmap | READY-ATTACH, runtime não provado nesta rodada | Build, API/custo e encaixe com SEO |
| Scrapling MCP Clínica | READY-ATTACH, runtime não provado nesta rodada | Código, permissões e limites de scraping autorizado |
| Marketing Agent OS | CANDIDATE/CORE PROPOSED; inventário anterior citou 238 skills | Fixar repo/commit/licença; selecionar e verificar skills individualmente |
| Alireza/Claude Skills | CANDIDATE | Licença, dependências e compatibilidade; Claude Ads excluído |
| OpenClaudia | CANDIDATE | Confirmar identidade, licença e sobreposição |
| Agent Reach | CANDIDATE | Validar fontes, scraping, privacidade, custo e autorização |
| Local SEO Agent | CANDIDATE | Confirmar repo e comparar com OpenSEO/Heatmap |
| Marketing Skills / SEO Operator | CANDIDATE; inventário anterior citou mais de 170 entradas | Indexar, deduplicar e ativar só skills aprovadas |
| Brag / Brag-Slim | CANDIDATE | Confirmar repo/licença; draft apenas, sem publicação automática |
| Newsjack | CANDIDATE | Confirmar repo e salvaguardas de precisão/brand safety |
| UnifAPI Agents | DEFERRED | Reabrir só com vantagem demonstrada e custo aceitável |
| OpenManus | CANDIDATE/ALTERNATIVE | Comparar com Commander/Hermes antes de adicionar redundância |
| Agent Zero | CANDIDATE/ALTERNATIVE | Comparar licença, sandbox, execução e custo |
| MonkeyCode | CANDIDATE; repo encontrado, equivalência da auditoria não provada | Confirmar repo, licença e segurança |
| FreeLLMAPI | EXCLUDED BY USER | Não retomar sem novo pedido explícito |
| Superpowers | CANDIDATE | Licença, instruções, escopo e sobreposição |
| DeepWiki | CANDIDATE/SUPPORT | Verificar disponibilidade, limites e utilidade |
| SkillSpector | P0 CANDIDATE/GATE | Testar em sandbox como gate de segurança de skills |
| SkillEvaluator | P0 CANDIDATE/GATE | Testar conjunto sintético e critérios de aprovação/rejeição |
| NVIDIA OpenShell | P0 CANDIDATE | Sandbox-only; validar isolamento e cleanup |
| NVIDIA NemoClaw | P0 CANDIDATE | Revisar licença, segurança, dependências e runtime |
| NVIDIA NeMo Agent Toolkit | P0 CANDIDATE | Testar orquestração/observabilidade isolada |
| NVIDIA NeMo Relay | P0 CANDIDATE | Testar eventos, autenticação e telemetria |
| NVIDIA skills | P0 CATALOG | Escanear cada skill antes de usar |
| NVIDIA ToolOrchestra | P0 CANDIDATE | Benchmark contra Commander; não substituir sem resultado |
| NVIDIA NeMo-Retriever | P1 CANDIDATE | Teste pequeno de recuperação e privacidade |
| NVIDIA context-aware-rag | P1 CANDIDATE | Corpus sintético e avaliação de recuperação |
| NVIDIA garak | P1 CANDIDATE | Teste de segurança em ambiente isolado |
| NVIDIA TensorRT-LLM | DEFERRED INSTALL | Avaliar infraestrutura/custo; não assumir compatibilidade com Worker |
| NVIDIA Nemotron | MODEL CANDIDATE | Smoke test NIM e saída verificada |
| NVlabs SoL-Pi | P1 CANDIDATE | Benchmark de contexto/eficiência |
| NVlabs Skill2Env | P1 CANDIDATE | Ambientes sintéticos e isolamento |
| NVlabs UniversalDeepResearch | P2 DEFERRED | Adiar até Researcher básico integrado |
| NVlabs KDA | P2 DEFERRED | Adiar até Engineer runtime comprovado |
| OpenGSC | EXCLUDED | Não usar nem propor fallback |
| Canva | EXCLUDED | Não integrar |
| Zernio | EXCLUDED | Não reintegrar |
| Hermes-Bot-Mode archived plugin | EXCLUDED | Não instalar |

## C. Repositórios identificados
| Repositório | Papel | Estado |
|---|---|---|
| clinicasaopauloparnamirim-coder/clinica-sao-paulo-site | Site e Control Tower | VERIFIED |
| clinicasaopauloparnamirim-coder/local-seo-heatmap | SEO local | Identidade citada; runtime não provado nesta rodada |
| clinicasaopauloparnamirim-coder/scrapling-mcp-clinica | MCP scraping | Identidade citada; runtime não provado nesta rodada |
| malevrigns/agent-jev | JEV candidato | Repo encontrado; correspondência não provada |
| vishalmysore/layaAgent | Laya candidato | Repo encontrado; correspondência não provada |
| chaitin/MonkeyCode | Agente/coding | Candidato |
| tashfeenahmed/freellmapi | API/infra LLM | Excluído pelo usuário |
| every-app/open-seo | SEO candidato | Não confundir com serviço OpenSEO conectado |
| browser-use/browser-harness | Browser agent infrastructure | Candidato |
| ruvnet/ruflo | Orquestração multiagente | Candidato |
| obra/superpowers | Workflow de desenvolvimento | Candidato |
| NousResearch/hermes-agent | Agente autônomo | Identidade verificada; runtime não comprovado |
| ComposioHQ/composio | Tool/auth layer | Identidade verificada; self-host não aprovado |
| composio-community/open-dot | Template OpenAI+Composio | Candidato |

## D. Regras globais de integração
1. Preservar os 3 cérebros macro já decididos; Brain 09 é o catálogo/ecossistema NVIDIA dentro da arquitetura existente, não um Brain 4 macro.
2. Trabalhar em branch e PR; não escrever direto em main sem revisão.
3. Nunca expor tokens, chaves, refresh tokens, PII ou segredos em chat/logs.
4. Nenhuma ferramenta ganha autoridade sobre gastos, orçamento, pagamentos ou mutação de Ads. Mutação financeira/destrutiva exige aprovação explícita.
5. Nunca consultar nem usar Search-2.
6. Não reintroduzir OpenGSC, Canva, Zernio, FreeLLMAPI ou Hermes-Bot-Mode.
7. Priorizar free tier e conexões ativas; evitar crawls/APIs pagas quando leituras salvas bastam.
8. Após duas falhas na mesma rota, marcar BLOCKED com evidência; sem loops.
9. Cada ferramenta anexada declara repo/version/commit, licença, brain dono, entradas/saídas, dependências, scopes, custo/limites, ameaça, sandbox, testes positivo/negativo, evidência e rollback.
10. Não declarar integrada sem chamada real, resposta validada, teste de escopo negativo e read-back.

## E. Ordem de execução
1. Commander/MCP bridge: contrato de despacho real e teste sintético; plano sozinho não conta.
2. NVIDIA/Nemotron: executar nvidia_test pelo endpoint suportado; registrar status HTTP, saída e latência sem revelar chave.
3. JEV+Nemotron e Laya+Nemotron: agent_pair_test com estado sintético, sem dados de pacientes ou mutações Ads.
4. Marketing brief: tratamento genérico, validar schema e published=false.
5. OpenSEO: reconciliar projetos e vínculos GSC/GA4 usando leituras salvas; sem crawl pago.
6. Tool bus: mapear slugs e schemas; separar conectado, executável, não conectado e candidato.
7. NVIDIA P0: licença/segurança e sandbox por projeto.
8. Repositórios candidatos: confirmar identidade, licença, manutenção, custo e redundância antes de incorporar código.
9. Verificação final: read-back, CI/TypeScript, teste negativo e registro de PASS/FAIL/BLOCKED/INCONCLUSIVE.

## F. Limite desta entrega
Este arquivo prepara inventário e plano em branch isolada. Não significa que todos os candidatos foram instalados, que todas as credenciais foram concedidas ou que todas as ferramentas funcionam em runtime. Integrações comprováveis devem ser fechadas uma a uma, sem apagar decisões ou duplicar ferramentas.

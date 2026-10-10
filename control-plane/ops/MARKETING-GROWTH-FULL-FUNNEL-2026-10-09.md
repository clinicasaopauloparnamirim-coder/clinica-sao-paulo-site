# Brain 03 / Marketing-Growth — especificação de funil completo

**Data:** 2026-10-09  
**Estado:** especificação de trabalho; automação end-to-end ainda não comprovada.  
**Objetivo:** o cérebro de marketing deve criar, publicar quando autorizado, medir, aprender e reter — não ser apenas um painel de SEO/Ads.

## 1. Responsabilidade

Transformar demanda local da Clínica São Paulo em pacientes atendidos e tratamentos aceitos, com um circuito rastreável:

**Pesquisa e insight → hipótese → criação → atenção → desejo/confiança → consumo → intenção → clique/conversa → lead qualificado → agendamento → comparecimento → plano aceito → retenção/recall → avaliação/recomendação → aprendizagem.**

O cérebro de marketing não promete resultado clínico, não inventa depoimentos, urgência, preços, disponibilidade ou avaliações e não publica conteúdo ou campanha sem permissões e controles adequados.

## 2. Motores e ferramentas

### Disponíveis por conexão direta, com teste observado
- Google Ads: leitura GAQL da campanha ativa aprovada `24289443969`.
- Google Search Console: propriedades autorizadas da clínica e dados de desempenho.
- GA4: leitura dos eventos-chave configurados.
- OpenSEO: acesso aos projetos e ferramentas de SEO; a integração GA4 dentro dos dois projetos não está conectada.
- GitHub: código, versões e CI/CD.
- Instagram Business: conexão Composio ativa; perfil, publicações, insights por mídia e demografia por cidade foram lidos. Conta oficial: `@clinicasaopauloparnamirim`. Nenhuma publicação ou alteração foi executada.
- Instagram Agent Skill: as 13 skills de criação/auditoria estão versionadas em `.agents/skills/ig-*/` e documentadas em `control-plane/ops/INSTAGRAM-AGENT-INTEGRATION.md`. Elas são instruções e scripts auxiliares, não uma API nem prova de execução no Worker. O carregamento efetivo no runtime MarketingGrowth ainda precisa de teste end-to-end; publicação, comentários e DMs continuam sujeitos à revisão humana.

### Geração de briefing na branch de correção

A branch `audit/brain-09-marketing-full-funnel-20261009` adiciona a ferramenta MCP `marketing_brief`. Ela solicita ao ControlAgent um briefing completo e duas variantes de copy, primeiro via NVIDIA NIM e depois via Workers AI como fallback; a saída passa por validação estrutural de JSON e exige revisão humana. Retorna explicitamente `published: false` e `media_assets_generated: false`. **A ferramenta ainda não foi implantada nem testada em runtime real**: o CI precisa passar e o deploy precisa ser verificado antes de usá-la como operacional.

### Bloqueadas ou não validadas
- Control Tower Ads/GA4/GSC: as chamadas internas falham por OAuth/token Google.
- Meta Ads: ainda sem conexão e leitura de campanha confirmadas.
- Instagram: leitura confirmada; ainda não houve teste de publicação. O snapshot persistente no ControlAgent está em implantação e deve passar por read-back e teste negativo de escopo antes de ser tratado como integrado ao runtime.
- WhatsApp: há um ledger de atribuição no Worker, mas a cadeia de qualificação-agendamento-comparecimento-tratamento ainda precisa de teste ponta a ponta.
- Criação/geração/publicação criativa: não há ainda pipeline automatizado de ponta a ponta validado no runtime.
- Hermes/Jev/Laya/Nemotron: não promover como executores do cérebro de marketing antes de provar inferência/execução.

## 2A. Ponte de dados sociais para o cérebro

A integração usa o tool runner externo do Composio para obter métricas da conta oficial e duas ferramentas MCP no Control Tower:
- `marketing_social_snapshot_write`: valida o username oficial, sanitiza métricas, guarda snapshot persistente no Durable Object do MarketingGrowth e não executa ações no Instagram.
- `marketing_social_snapshot_read`: lê o último snapshot registrado.
- `marketing_brief`: incorpora o snapshot no contexto e indica se está fresco (até 7 dias) ou desatualizado. Isso melhora a decisão com evidência real, mas não cria publicação nem atribuição automática.

A implantação só fica comprovada quando o cliente MCP descobrir as ferramentas, um snapshot válido for gravado e relido, um username fora do escopo for rejeitado e o briefing devolver metadados do snapshot. Sincronização recorrente e Meta Ads continuam separadas.

A camada REST agora expõe também `GET/POST /marketing/social-snapshot` e `POST /marketing/brief`, com bearer auth do Worker, e ambos foram adicionados a `control-plane/docs/openapi-control-tower.yaml`. O deploy de main terminou com typecheck, deploy e smoke tests verdes. Ainda não marcar como integrado em runtime até o Composio importar o OpenAPI atualizado e os testes write/read + escopo + briefing passarem.

## 3. Etapas do funil e trabalho que o cérebro deve realizar

| Etapa | Objetivo | Saídas concretas | Métricas principais |
|---|---|---|---|
| Pesquisa/intenção | Descobrir procura real por tratamento, dúvidas e demanda local | clusters por tratamento/intenção/localidade, mapa concorrencial, dúvidas frequentes | impressões, consultas, share de demanda, posição |
| Atenção | Ganhar os primeiros segundos sem clickbait | hooks, roteiros, primeiros frames, criativos A/B | retenção 3s, tempo de visualização, taxa de conclusão |
| Desejo/confiança | Ajudar o paciente a imaginar benefícios e entender o processo | histórias reais autorizadas, explicação de opções, prova verificável, objeções respondidas | salvamentos, compartilhamentos, visitas qualificadas, perguntas |
| Consumo | Fazer a pessoa consumir informação e seguir para o próximo passo | carrossel educativo, Reels, FAQ, página de tratamento, sequência Stories | conclusão, scroll, interação, retorno à página |
| Intenção/impulso ético | Reduzir fricção para uma ação informada | CTA claro, agendamento simples, oferta real e com termos explícitos | cliques de CTA, conversas iniciadas, abandono |
| Qualificação | Diferenciar curiosidade de lead com intenção real | origem/UTM, necessidade declarada, disponibilidade para consulta, retorno consentido | taxa de qualificação, custo por lead qualificado |
| Agendamento/comparecimento | Transformar conversa em consulta efetiva | status no CRM/ledger, lembretes autorizados, motivo de perda padronizado | taxa de agendamento, no-show, custo por comparecimento |
| Tratamento aceito/venda | Medir resultado de negócio, não só clique | status agregado do orçamento/plano aceito, valor de negócio quando permitido | aceitação, receita atribuída, custo por paciente, ROI |
| Retenção/recall | Ajudar no cuidado contínuo e em retornos apropriados | lembretes consentidos, manutenção/recall, conteúdo pós-consulta educativo | retorno, reativação, recorrência |
| Recomendação | Facilitar feedback honesto | pedido neutro de avaliação, resposta profissional a feedback, indicação voluntária | novas avaliações legítimas, referências |
| Aprendizagem | Promover vencedores com base no resultado final | relatório de hipóteses, criativos vencedores, próximos testes | lead qualificado e paciente atendido, não só CTR |

## 4. Sistema de criação: todo conteúdo deve ter um motivo mensurável

Cada briefing de conteúdo precisa declarar:
- público e tratamento (por exemplo, ortodontia, clareamento, restauração estética);
- estágio (atenção, educação/confiança, intenção, agendamento, retenção);
- insight e objeção que aborda;
- formato e canal;
- hook inicial, desenvolvimento, prova verificável, CTA e variante;
- evento esperado e critério de sucesso;
- revisão clínica/ética e de privacidade exigida antes de publicar.

O pipeline esperado é **brief → 3 ângulos → roteiro/copy → criativo/asset → revisão → aprovação → publicação manual ou API conectada → medição → análise → nova hipótese**. Hoje esse pipeline é um requisito funcional, não uma capacidade já provada no Worker.

## 5. Exemplos iniciais de ângulos para teste

Estes exemplos são rascunhos de hipótese, não conteúdo publicado nem garantia de performance.

### Atenção
- “Seu sorriso está na sua lista há meses? Veja como começar com uma avaliação.”
- “Aparelho fixo ou estético: o que realmente muda na rotina?”
- “Três dúvidas sobre clareamento que vale esclarecer antes de agendar.”

### Desejo e confiança
- “O primeiro passo não é escolher o tratamento: é entender o que faz sentido para você.”
- “Como funciona uma avaliação odontológica e quais dúvidas você pode levar.”
- “O que perguntar antes de iniciar um tratamento ortodôntico.”

### Consumo e intenção
- Carrossel: “5 perguntas para levar à avaliação de aparelho”.
- Reel curto: “O que acontece na primeira avaliação, passo a passo”.
- Stories em sequência: dúvida comum → explicação → bastidores autorizados → pergunta → CTA direto para avaliação.

### Conversão e retenção
- “Quer entender as opções para o seu caso? Agende uma avaliação.”
- “Vai iniciar ou manter aparelho? Veja por que o acompanhamento periódico faz parte do plano.”
- Mensagem de recall apenas para contatos que deram a permissão apropriada, com opção clara de não receber mais mensagens.

Não usar escassez falsa, garantias de resultado, antes/depois sem autorização adequada, depoimentos fabricados ou pressão manipulativa. Revisar normas aplicáveis de publicidade odontológica e privacidade antes de publicar.

## 6. Modelo de medição

### Eventos da jornada
| Evento | Fonte | Observação |
|---|---|---|
| `landing_view` / `page_view` | Site + GA4 | sessão/landing e UTM |
| `clique_whatsapp` | Site/Zaraz + GA4 | já configurado como evento-chave; verificar disparo real |
| `generate_lead` | Form/WhatsApp bridge + GA4 | não deduzir um lead real apenas de visita |
| `qualify_lead` | CRM/WhatsApp ledger | exige critério definido e status real |
| `appointment_booked` | Agenda/CRM | evento downstream que ainda precisa ser integrado |
| `appointment_attended` | CRM | não inferir comparecimento pelo clique |
| `treatment_accepted` | CRM | evento downstream; não enviar detalhes de saúde a plataformas de anúncios |
| `retention_return` | CRM | medir retorno agregado, sem transmitir informação clínica identificável |

### Indicadores de negócio
- Conversão landing → clique WhatsApp;
- conversa → lead qualificado;
- lead qualificado → agendamento;
- agendado → compareceu;
- compareceu → tratamento aceito;
- custo por lead, por lead qualificado e por paciente comparecido;
- receita atribuída/ROI quando a fonte e o consentimento permitirem;
- taxa de retorno/retenção e custo de reativação.

CTR, visualizações e custo por clique são indicadores intermediários. Não devem ser usados sozinhos para declarar um criativo ou uma campanha vencedora.

### Atenção sobre a configuração atual do GA4
A leitura direta mostrou os eventos-chave `close_convert_lead`, `qualify_lead`, `purchase`, `clique_whatsapp`, `generate_lead`, `page_view`, `session_start`, `user_engagement` e `first_visit`. Alguns eventos genéricos como `page_view`, `session_start`, `user_engagement` e `first_visit` aparecem como eventos-chave. Isso merece revisão de instrumentação porque pode misturar engajamento com conversão de negócio. **Não apagar nem alterar eventos automaticamente:** verificar a configuração e o uso atual antes de qualquer mudança.

## 7. Atribuição e privacidade

- Preservar UTM e, onde aplicável e consentido, identificadores de clique do anúncio.
- Ligar etapas downstream por um token interno opaco, deduplicado e com controle de acesso.
- Para GA4 e plataformas publicitárias, enviar eventos de negócio mínimos e não sensíveis; nunca enviar nomes, telefones, diagnósticos, tratamento odontológico ou conteúdo de conversas privadas.
- Validar consentimento, política de retenção, acesso e idempotência do webhook/ledger.
- Só aceitar `appointment_booked`, `appointment_attended` ou `treatment_accepted` quando a fonte de negócio comprovar o estado.
- Auditar discrepância por fonte (Ads x GA4 x ledger) e preservar o estado `unknown` quando não houver vínculo verificável.

## 8. Loop de otimização

1. Registrar a hipótese, audiência, criativo e resultado desejado.
2. Testar poucas variantes alterando uma variável principal de cada vez.
3. Medir atenção/consumo para diagnóstico, mas decidir por lead qualificado/paciente atendido quando houver volume.
4. Arquivar resultados negativos; não repetir o mesmo teste sem nova hipótese.
5. Promover vencedores só depois de qualidade, amostra e atribuição suficientes.
6. Revalidar páginas/CTAs, formulários e tracking após cada publicação.
7. Separar recomendações automáticas de publicação/alterações reais, que exigem integração ativa e controles apropriados.

## 9. Critério de conclusão do cérebro de marketing

O cérebro só poderá ser marcado como operacional após uma execução rastreável que:
- gere um briefing e ao menos duas variantes criativas utilizáveis;
- passe revisão de conteúdo/ética e aprovação;
- publique ou entregue os assets no canal autorizado;
- observe eventos reais de consumo/interação;
- conecte origem a lead qualificado e agendamento usando dados não sensíveis;
- registre comparecimento e resultado do negócio quando disponíveis;
- gere análise comparativa e próxima hipótese;
- demonstre falha segura quando uma ferramenta não estiver conectada.

**Estado em 09/10/2026: parcial.** O documento não afirma que esse ciclo inteiro já está automatizado.

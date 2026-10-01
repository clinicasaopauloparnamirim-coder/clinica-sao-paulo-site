# Hubble — Reunião Interna de Arquitetura do Control Tower
**Data:** 2026-09-30  
**Branch:** `hubble/meta-control-tower-2026-09-30`  
**Escopo:** Control Tower, engenharia de agentes, verificação, CI/CD e governança de mudanças.  
**Fora do escopo:** alteração de Google Ads Search-2, publicação automática em produção e alterações de secrets.

## 1. Participantes / papéis

- **Orchestrator:** define escopo, decomposição e bloqueios.
- **Discovery:** levanta estado real e dependências.
- **Execution:** implementa somente mudanças autorizadas.
- **Verification:** valida o artefato real e o comportamento.
- **Critic:** tenta demonstrar que a conclusão está errada.
- **Reporter:** registra evidências e pontos inconclusivos.

## 2. Fontes auditadas

### Internas
- `AGENTS.md`
- `.agents/skills/clinica-control-tower/SKILL.md`
- `control-plane/playwright-mcp/src/agent-registry.ts`
- `control-plane/playwright-mcp/src/control-agent.ts`
- `control-plane/playwright-mcp/src/mcp-tower.ts`
- workflows de CI/deploy
- documentação Control Tower
- estado do GSC
- PR #16 de SEO semântico

### Externas / benchmarks arquiteturais
- **obra/Superpowers:** metodologia de planejamento, revisão, TDD e finish gate.
- **ruvnet/ruflo:** swarm/harness, MetaHarness, observabilidade, segurança e drift.
- **reticlehq/reticle:** prova runtime por consequência verificável.
- **Jev / AutoJev:** modelo/camada de decisão; não confundir com framework de agentes.

## 3. Diagnóstico brutal

### Crítico
1. **Não existe `CLAUDE.md` no repositório.** Há `AGENTS.md`, mas não existe uma camada explícita de instruções para Claude.
2. **O ControlAgent não é ainda um executor de especialistas.** O endpoint `/orchestrate` usa Workers AI para devolver JSON com especialistas, bloqueios e plano, mas não há nessa função uma segunda etapa que realmente execute os especialistas selecionados.
3. **Não existe finish gate de runtime para o site.** O projeto tem Playwright MCP, porém o caminho de orquestração não transforma uma alteração em uma prova declarativa de consequência.
4. **A CI atual compila/typechecka o Worker e o deploy workflow testa apenas `/health` + OAuth configurado.** Isso não prova navegação, SEO, links, páginas, GSC, Ads ou comportamento do Control Tower.

### Alto
5. **O MCP Tower possui mutações protegidas por `confirm=true`, mas a arquitetura de orquestração ainda não possui uma policy engine central única que converta intenção → plano → execução → read-back.**
6. **O especialista é mais registro/papel do que agente autônomo:** `agent-registry.ts` define missão e modo, porém o runtime não mostra um executor por especialista.
7. **Não há suíte formal de testes de regressão para as regras de segurança do Control Tower.** O package possui `build`, mas não um `test` dedicado.
8. **O deploy de produção é acionado por push em `main`.** Portanto, o nível de confiança exigido antes do merge precisa ser maior que “build passou”.

### Médio
9. A documentação está dispersa entre `AGENTS.md`, skills e vários documentos. Falta um contrato central de execução/verificação.
10. O PR #16 de SEO semântico está separado e deve permanecer separado da evolução arquitetural do Control Tower.

## 4. O que NÃO fazer

- Não instalar Ruflo inteiro dentro do projeto.
- Não instalar Jev/AutoJev como dependência agora.
- Não substituir o Control Tower atual por Superpowers.
- Não duplicar um segundo orquestrador paralelo.
- Não transformar o Hubble em mais uma camada opaca que dependa de “o modelo disse que passou”.
- Não misturar a refatoração arquitetural com o PR #16.

## 5. Decisões propostas

### D1 — Governança
Adicionar `CLAUDE.md` no root e fazer todos os agentes seguirem o mesmo contrato operacional de `AGENTS.md` + Control Tower.

### D2 — Meta-auditoria
Criar uma camada Hubble read-only que avalie a própria arquitetura e exponha findings verificáveis.

### D3 — Verificação
Evoluir de “build/typecheck” para “build + policy checks + runtime smoke + consequência declarada”.

### D4 — Orquestração
Separar claramente:
`intent → plan → authorization → execute specialist → read-back → critic → finish gate`.

### D5 — Dependências externas
Absorver padrões úteis de Superpowers/Ruflo/Reticle sem torná-los dependências obrigatórias.

## 6. Alvo arquitetural

```
User
  ↓
Control Tower Orchestrator
  ↓
Intent / Scope / Done
  ↓
Policy Gate
  ↓
Specialist Executor
  ├─ Ads
  ├─ GSC/SEO
  ├─ GA4
  ├─ GBP
  ├─ Cloudflare
  ├─ GitHub/Deploy
  └─ WhatsApp/Leads
  ↓
Read-back / Runtime Verification
  ↓
Independent Critic
  ↓
Finish Gate
  ├─ DONE
  └─ INCONCLUSIVE
```

Acima disso:

```
HUBBLE
  ├─ harness audit
  ├─ security/policy audit
  ├─ test/verification coverage
  ├─ drift detection
  └─ architecture regression
```

## 7. Passo a passo de implementação

### Fase 0 — documentação e contrato
- [x] criar `CLAUDE.md`
- [x] registrar esta reunião
- [ ] adicionar contrato Hubble legível por máquina

### Fase 1 — meta-auditoria read-only
- [ ] endpoint `/control/hubble-audit`
- [ ] ferramenta MCP `hubble_audit`
- [ ] findings com severidade, evidência e recomendação
- [ ] nenhum side effect

### Fase 2 — policy/finish gate
- [ ] policy central para ações de leitura/escrita
- [ ] bloqueio explícito para campanhas aposentadas/fora do escopo
- [ ] confirmação explícita para ações destrutivas/financeiras
- [ ] read-back obrigatório após mutation
- [ ] estado `INCONCLUSIVE` quando prova faltar

### Fase 3 — verificação runtime
- [ ] integrar um loop estilo Reticle sobre o Playwright MCP já existente
- [ ] declarar `intent`
- [ ] executar ação
- [ ] verificar consequência
- [ ] registrar evidência

### Fase 4 — cobertura de testes
- [ ] criar suíte de regressão das políticas
- [ ] testar auth
- [ ] testar guard de escopo para campanhas aposentadas/fora do escopo
- [ ] testar confirm gate
- [ ] testar read-back contract
- [ ] testar navegação permitida/bloqueada
- [ ] testar schema de resposta do orquestrador

### Fase 5 — CI/CD
- [ ] PR gate para build + testes + Hubble
- [ ] smoke de runtime após deploy
- [ ] SEO/link/canonical sanity checks
- [ ] health check continua obrigatório
- [ ] nenhum deploy automático sem passar pelos gates

### Fase 6 — MetaHarness/drift
- [ ] snapshot do estado arquitetural
- [ ] comparação entre auditorias
- [ ] alerta de regressões
- [ ] relatório de mudanças do próprio Control Tower

### Fase 7 — só depois
- [ ] benchmark de Jev/AutoJev para decisões pontuais
- [ ] somente se houver problema real de roteamento/custo/latência
- [ ] dependência opcional e removível

## 8. Critério de conclusão desta reunião

O Control Tower só poderá ser considerado arquiteturalmente endurecido quando:
1. o próprio harness conseguir auditar sua configuração;
2. toda escrita tiver policy + autorização;
3. toda mutation tiver read-back;
4. mudanças críticas tiverem verificação de consequência;
5. a CI conseguir bloquear regressões conhecidas;
6. a conclusão final puder ser classificada como DONE ou INCONCLUSIVE com evidência.

## 9. Crítica final independente

A maior falha atual não é falta de agentes. É **confundir presença de componentes com capacidade operacional comprovada**.

Temos nomes de especialistas, MCP, browser, Ads, GSC, GA4 e Workers AI. Isso cria uma aparência de sistema mais completo do que o caminho real de execução demonstra.

O objetivo do Hubble é remover essa ilusão.

O sistema precisa provar:
**“eu consigo decidir → executar → observar → verificar → criticar → concluir.”**

Até isso existir, qualquer alegação de autonomia total seria exagerada.


## 10. Documentação legada / drift identificado

A auditoria encontrou documentação que precisa ser reconciliada antes de declarar o novo modelo operacional concluído:

- `control-plane/docs/AGENT-MODE-MONKEY.md` descreve Grok como agente único e trata MonkeyCode/Claude/Codex como fluxos auxiliares.
- `control-plane/docs/MONKEYCODE.md` restringe MonkeyCode ao código e proíbe acesso ao MCP Tower/Ads, o que continua coerente como guardrail, mas a descrição de papéis precisa ser atualizada quando o Hubble estiver consolidado.
- `control-plane/docs/INTEGRACAO-CLAUDE-CHATGPT.md` contém instruções manuais para conectores e ainda presume uma divisão antiga de responsabilidades.
- `control-plane/docs/CLINICA-AGENT-OPERATING-MODE.md` é conceitualmente alinhado ao Hubble, mas deve virar referência única em vez de duplicar regras.

**Crítica:** manter documentos conflitantes é um risco de prompt/config drift. O Hubble deve terminar com uma fonte canônica de verdade e documentos de integração derivados, não com múltiplas versões concorrentes.

## 11. Estado após o primeiro Start

**DONE**
- `CLAUDE.md` criado.
- reunião interna registrada.
- Hubble self-audit criado.
- Hubble adicionado ao CI de PR.

**INCONCLUSIVE / OPEN**
- guard de escopo para campanhas aposentadas/fora do escopo ainda precisa ser implementado e testado.
- executor real de especialistas ainda não existe.
- runtime consequence verification ainda não existe.
- suíte de testes formal ainda não existe.
- workflow Hubble ainda precisa produzir o primeiro resultado de CI para validar a implementação no ambiente GitHub.

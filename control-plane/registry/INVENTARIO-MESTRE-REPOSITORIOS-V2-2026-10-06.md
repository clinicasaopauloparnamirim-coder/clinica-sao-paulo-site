# INVENTÁRIO MESTRE V2 — REPOSITÓRIOS/FERRAMENTAS RECUPERADOS
Data: 2026-10-06
Objetivo: corrigir o inventário anterior, recuperar itens omitidos e separar evidência real de identidade apenas provável.

## Estados
🟢 execução/conexão real comprovada
🟡 identidade/projeto auditado, mas runtime integrado não comprovado
🔵 camada funcional conectada, sem provar instalação do repo
🔴 nome lembrado/testado, identidade exata ainda não comprovada
⚪ produto/serviço/agente, não tratar como repo

## A. REPOSITÓRIOS COM IDENTIDADE EXATA CONFIRMADA

1. Clínica São Paulo — clinicasaopauloparnamirim-coder/clinica-sao-paulo-site — 🟢
2. JEV / AgentJev — malevrigns/agent-jev — 🟡
3. LAYA — NandhaKishorM/laya — 🟡
4. MonkeyCode — chaitin/MonkeyCode — 🟡
5. OpenSEO — every-app/open-seo — 🟢/🔵
6. OpenGSC — fenjo26/opengsc — 🟡
7. Scrapling — D4Vinci/Scrapling — 🟡
8. Browser Harness — browser-use/browser-harness — 🟡
9. Ruflo — ruvnet/ruflo — 🟡
10. Superpowers — obra/superpowers — 🟡
11. Hermes Agent — NousResearch/hermes-agent — 🟡
12. Open-dot — composio-community/open-dot — 🟡
13. FreeLLMAPI — tashfeenahmed/freellmapi — 🟡
14. OpenHands — OpenHands/OpenHands — 🟡
15. NVIDIA SkillSpector — NVIDIA/SkillSpector — 🟡
16. DSH / DeepSeek Harness — repo base identificado como ecossistema DeepSeek Harness; alvo exato do nosso teste precisa ser distinguido de forks/wrappers — 🟡
17. OpenDesign oficial — nexu-io/open-design — 🟡
18. pstack / Poteto workflow — o Control Plane contém a cópia do plugin em .cursor/plugins/pstack; o upstream/fork exato usado na nossa auditoria precisa ser registrado separadamente — 🟡
19. Command Code — CommandCodeAI/command-code — 🟡
20. Codemd — múltiplos repos públicos com esse nome; não há evidência suficiente para cravar qual foi o alvo histórico — 🔴
21. Open-maestri / Maestri — existem múltiplos repos com esse nome; o alvo histórico exato ainda não está fechado — 🔴
22. Archify — existem múltiplos repos; alvo histórico exato ainda não fechado — 🔴

## B. REPOSITÓRIOS/PROJETOS RELACIONADOS QUE PRECISAM FICAR NO MAPA

23. vishalmysore/layaAgent — demo/agente relacionado a LAYA, não substituir o repo principal LAYA — 🟡
24. CommandCodeAI/cmd-mod-jev-nudge — módulo do ecossistema Command Code explicitamente ligado a JEV — 🟡
25. CommandCodeAI/pi-commandcode-provider — provider do ecossistema Command Code — 🟡
26. CommandCodeAI/command-code-examples — exemplos do Command Code — 🟡

## C. ITENS QUE APARECERAM NAS AUDITORIAS, MAS NÃO DEVEM SER INVENTADOS COMO REPO

- Open Design (nome do componente) → o projeto oficial atual é nexu-io/open-design; o vínculo com o alvo histórico do nosso teste deve ser confirmado antes de dizer "foi esse repo".
- Archify → componente de arquitetura/mapa; identidade exata histórica ainda pendente.
- Maestri → componente de orquestração de coding agents; identidade exata histórica ainda pendente.
- DSH → termo usado no contexto DeepSeek Harness; há múltiplos forks/wrappers e o alvo histórico precisa ser identificado.
- Spector → nome apareceu, mas o repo exato não foi provado.
- DSH/DeepSeek coding layer → não confundir com dsh-cc, dshcode ou dsh-agent-sdk sem evidência.
- Claude.md / CLAUDE.md → arquivo/configuração, não repo.
- "Superpowers" → repo separado; os skills pstack existentes no site não provam que superpowers upstream esteja instalado.

## D. AGENTES/MODELOS/PLATAFORMAS TRABALHADOS, MAS NÃO CONTAR COMO REPOSITÓRIO POR PADRÃO

- Codex / Codex CLI
- Claude Code
- Gemini / Gemini CLI
- Qwen
- Manus
- Antigravity
- Kimi Code / Kimi CLI
- Grok
- OpenAI Agents
- NVIDIA NIM / Nemotron
- Composio
- Google Ads
- Google Search Console
- GA4
- Gmail
- Google Drive
- Slack
- Meta Ads
- Cloudflare Workers / Durable Objects / Zaraz
- Canva
- Notion
- Sora
- VEO
- Midjourney
- DALL-E

## E. EXECUÇÃO/CONEXÃO VERIFICADA AGORA

- GitHub MCP: 🟢 leitura e escrita reais no repo da Clínica.
- Composio meta-layer: 🟢 ferramentas de descoberta/execução reais.
- custom_openseo: 🟢 conexão ACTIVE; LIST_PROJECTS executado e retornou 2 projetos da Clínica.
- browser_tool: 🟢 conexão ACTIVE.
- Google Search Console via Composio: 🟢 conexão ACTIVE.
- custom_control_tower: 🟢 conexão ACTIVE, mas Google Ads neste momento falha no refresh token com HTTP 400.
- JEV: 🔴 nenhuma execução do modelo JEV foi provada nesta sessão.
- LAYA: 🔴 nenhuma execução do runtime LAYA foi provada nesta sessão.
- Hermes: 🔴 harness/instalação preparada; loop conversacional não provado.
- Open-dot: 🔴 harness preparado; runtime não provado.
- NVIDIA/OpenCode: 🔴 não há evidência de MCP executável desta combinação.
- OpenHands, Ruflo, MonkeyCode, Command Code, OpenGSC, Scrapling, Archify, Maestri: 🟡 auditados/identificados, mas não declarar "operacionais" sem execução comprovada.

## F. CORREÇÃO DA ARQUITETURA DOS 3 CÉREBROS

Cérebro 1 = AUTOMAÇÃO.
Cérebro 2 = ORQUESTRAÇÃO.
Cérebro 3 = MARKETING.

Este documento é inventário. Não redefine os cérebros.

## G. REGRAS

1. Identidade de repo != instalação.
2. Conexão de toolkit != runtime do repo.
3. Execução != sucesso; é preciso resultado + verificação.
4. Search-2 continua permanentemente fora dos fluxos de Ads, salvo autorização explícita.
5. Zernio permanece fora do inventário conforme decisão anterior.

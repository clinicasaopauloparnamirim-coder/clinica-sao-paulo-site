# INVENTÁRIO MOLECULAR — MEMÓRIA + REPOSITÓRIO + RUNTIME
Data: 2026-10-06
Objetivo: nenhum nome relevante das auditorias recentes ficar perdido.

## 1. ITENS EFETIVAMENTE MENCIONADOS/AUDITADOS NAS CONVERSAS RECUPERÁVEIS

### Automação / browser / execução
- Browser Harness
- Browser Use
- Scrapling
- Laya
- LayaAgent
- Hermes Agent
- OpenHands
- Spector
- JEV
- DSH / DeepSeek Harness

### Orquestração / agentes
- Ruflo
- pstack
- Poteto / poteto-mode
- Maestri / open-maestri
- Command Code
- Command Code JEV Nudge
- Pi Command Code Provider
- Composio
- Open-dot
- Control Tower / Control Plane
- Superpowers

### Marketing / SEO / dados
- OpenSEO
- OpenGSC
- GSC Wizard
- Google Search Console
- GA4
- Google Ads
- Scrapling
- semântica / GAUNTLET SEO
- DeepWiki
- Archify
- Open Design
- SkillSpector

### Engenharia / coding
- MonkeyCode
- Command Code
- Codex
- Claude Code
- OpenCode
- Kimi Code
- Qwen
- Gemini / Gemini CLI
- Antigravity
- OpenHands
- DeepSeek Harness / DSH
- NVIDIA Nemotron / NIM
- FreeLLMAPI

### Descoberta / catálogo / suporte
- free-for-dev
- Awesome
- Notion
- Canva

## 2. REPOSITÓRIOS EXATAMENTE IDENTIFICADOS

- clinicasaopauloparnamirim-coder/clinica-sao-paulo-site
- malevrigns/agent-jev
- NandhaKishorM/laya
- vishalmysore/layaAgent
- chaitin/MonkeyCode
- every-app/open-seo
- fenjo26/opengsc
- D4Vinci/Scrapling
- browser-use/browser-harness
- ruvnet/ruflo
- obra/superpowers
- NousResearch/hermes-agent
- composio-community/open-dot
- tashfeenahmed/freellmapi
- OpenHands/OpenHands
- NVIDIA/SkillSpector
- NVIDIA-NeMo/Nemotron
- CommandCodeAI/command-code
- CommandCodeAI/cmd-mod-jev-nudge
- CommandCodeAI/pi-commandcode-provider
- CommandCodeAI/command-code-examples
- spectrayan/spector
- nexu-io/open-design
- dotpyu/codemd (candidato; não afirmar que foi o alvo histórico)
- pedrotecinf/open-maestri (candidato; não afirmar que foi o alvo histórico)
- essll/archify_IA (candidato atual; não afirmar que foi o alvo histórico)
- alksnd/archify (candidato atual; não afirmar que foi o alvo histórico)
- ripienaar/free-for-dev

## 3. FAMÍLIA BROWSER-USE QUE NÃO DEVE SER PERDIDA

Além de browser-harness, o ecossistema atual tem:
- browser-use/browser-use
- browser-use/browsercode
- browser-use/browser-harness-js
- browser-use/browser-harness-tui
- browser-use/browser-use-pi
- browser-use/video-use
- browser-use/sdk
- browser-use/workflow-use

Esses foram descobertos nesta revisão molecular como projetos relacionados relevantes. Descoberta atual não significa que cada um foi historicamente auditado.

## 4. FAMÍLIA PSTACK/POTETO

O upstream é cursor/plugins com pstack dentro do marketplace, enquanto existem múltiplos mirrors/forks. O nosso site já contém uma cópia em .cursor/plugins/pstack.

Fica proibido tratar qualquer fork como “o pstack que auditamos” sem confirmar a origem histórica.

## 5. FAMÍLIA COMMAND CODE

A organização CommandCodeAI contém pelo menos:
- command-code
- cmd-mod-jev-nudge
- pi-commandcode-provider
- command-code-examples
- docs-images
- vscode fork

O cmd-mod-jev-nudge é especialmente relevante para a arquitetura porque conecta o agente ao julgamento de Jev.

## 6. FAMÍLIA NVIDIA / MODELOS

- NVIDIA/SkillSpector
- NVIDIA-NeMo/Nemotron
- NVIDIA NIM
- integração considerada com OpenCode
- modelos/providers Qwen, GLM, Kimi e similares como dependências, não como repositórios da Clínica.

## 7. FAMÍLIA SEO

- OpenSEO
- OpenGSC
- Search Console
- GA4
- Google Ads
- Scrapling
- DeepWiki
- Archify
- Open Design
- SkillSpector como gate de segurança para skills
- GAUNTLET SEO SEMÂNTICO

OpenSEO está com toolkit ACTIVE e já teve execução real de LIST_PROJECTS nesta revisão. O projeto retornado foi o projeto BR Local SEO da Clínica.

## 8. ESTADOS DE RUNTIME CONFIRMADOS NESTA REVISÃO

🟢 GitHub: execução real.
🟢 Composio meta-layer: execução real.
🟢 custom_openseo: conexão ACTIVE + chamada real bem-sucedida.
🟢 browser_tool: conexão ACTIVE.
🟢 Google Search Console: conexão ACTIVE.
🟡 custom_control_tower: conexão ACTIVE, mas Google Ads falha atualmente no refresh token (HTTP 400).
🔴 JEV runtime: não executado nesta revisão.
🔴 LAYA runtime: não executado nesta revisão.
🔴 Hermes: harness, não runtime comprovado.
🔴 Open-dot: harness, não runtime comprovado.
🔴 NVIDIA/OpenCode via MCP: não comprovado.
🔴 Ruflo/Maestri/MonkeyCode/Command Code/OpenHands/OpenGSC/Scrapling: repo/identidade, sem execução integrada comprovada.

## 9. 3 CÉREBROS — NÃO REDEFINIR

CÉREBRO 1 = AUTOMAÇÃO
CÉREBRO 2 = ORQUESTRAÇÃO
CÉREBRO 3 = MARKETING

Apenas ferramentas e agentes devem ser encaixados nesses três; não criar um quarto ou trocar as definições.

## 10. ITENS QUE NÃO PODEM SER CONFUNDIDOS

- Browser Tool != Browser Harness repo.
- OpenSEO toolkit != prova de instalação do repo OpenSEO.
- Open-dot != Composio.
- NVIDIA NIM != MCP server.
- Codex/Claude/Gemini/Antigravity/Kimi são agentes/produtos; não contar automaticamente como repos.
- CLAUDE.md / claude.md é arquivo/configuração, não repo.
- DSH é uma família/termo que exige identificação do repo exato.
- Maestri e Archify têm múltiplos candidatos; exige reconciliação histórica.
- Zernio está deliberadamente fora.

## 11. REGRA DE VERDADE

Só marcar “FUNCIONANDO” com: identidade correta; conexão ou instalação real; execução; resultado; verificação independente.
Conectado na UI, instalado ou citado = insuficiente.
# Control Tower Labs — Agent Harness

Sandbox para testar candidatos auditados (Hermes, OpenAI/Dot, Composio, GitHub)
sem mutar produção nem expor secrets.

## Componentes

| Camada | Status | Como ativar |
|--------|--------|-------------|
| GitHub MCP | **LIVE** (conectado) | Tools `github___*` no Grok/MCP |
| Hermes Agent | Harness pronto | `scripts/install-hermes.sh` + model key / `hermes setup --portal` |
| Open-dot (OpenAI+Composio) | Harness pronto | `scripts/setup-opendot.md` + OPENAI_API_KEY + COMPOSIO_API_KEY |
| Composio tool layer | Identity verified | SDK + COMPOSIO_API_KEY |
| Judgment (JEV/Laya) | Documentado | `control-plane/ops/judgment/` |

## Loop obrigatório

understand → define done → plan → execute → verify → critique → report evidence

## Guardrails

- Search-2 fora de escopo
- Sem secrets em commits
- Sandbox first; `approved: false` até gate passar
- Não conectar contas de produção Ads

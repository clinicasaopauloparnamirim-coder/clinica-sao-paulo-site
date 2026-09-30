# Modo operacional — Grok como agente único

Você não precisa abrir MonkeyCode, Claude Code nem Codex no browser.
**Todas as tarefas de código, docs e Ads passam por este chat (Grok).**

## Manuais incorporados

| Origem | Como aplicamos |
|--------|----------------|
| **MonkeyCode** | Requisito → ambiente (repo) → diff → PR → review |
| **Claude Code** | Diff mínimo, guardrails, não tocar secrets, confirmar mutate |
| **Codex** | Implementação pragmática, commits claros, CI existente |

## Filas de trabalho

1. **Ads / Control Tower** — API live (`/mcp/tower`, REST)
2. **Site (`public/`)** — branch `feature/*` + PR
3. **Worker** — só com pedido explícito; nunca secrets no Git

## Tarefa em andamento

- FAQ WhatsApp-safe: branch `feature/faq-whatsapp-safe`

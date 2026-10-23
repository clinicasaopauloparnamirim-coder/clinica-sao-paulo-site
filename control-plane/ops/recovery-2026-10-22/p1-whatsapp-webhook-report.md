# Relatório P1 — webhook WhatsApp

**Data:** 2026-10-22  
**Estado:** **PARCIAL**  
**Branch:** `fix/p1-whatsapp-webhook-fail-closed-2026-10-22`  
**Commit:** `6370fbf` (`fix(p1): webhook WhatsApp fail-closed com validação de assinatura`)

## Rotas e inspeção

- `control-plane/playwright-mcp/src/index.ts:1099-1139`: rota `/webhooks/whatsapp`.
- GET de verificação: linhas **1100-1110**; exige `WHATSAPP_VERIFY_TOKEN`, confere `hub.mode`, `hub.verify_token` e `hub.challenge`, e responde 503 se o token não estiver configurado ou 403 se inválido.
- POST de eventos: linhas **1111-1136**; exige `WHATSAPP_APP_SECRET` antes de ler/processar o evento (503), lê o corpo bruto, valida `X-Hub-Signature-256` HMAC-SHA256, e só depois faz JSON parse, encaminha ao Durable Object e dispara atribuição GA4.
- A correção em `validMetaSignature` (linhas **580-598**) rejeita segredo vazio, exige formato hexadecimal exato `sha256=` + 64 caracteres e compara os bytes em loop de tempo constante. O runtime Cloudflare Workers usa Web Crypto; não foi introduzido `crypto.timingSafeEqual` de Node, incompatível com o alvo Worker.
- Assinatura ausente ou inválida retorna 403 sem processar nem registrar o corpo. O corpo não é incluído em respostas/logs.

## Casos sintéticos (sem rede)

Corpo sintético JSON e segredo fixo `test-app-secret-synthetic-0000` (nenhum segredo real foi lido ou escrito).

| Caso | Antes | Depois |
|---|---|---|
| Assinatura correta | aceito | aceito |
| Assinatura errada | rejeitado | rejeitado |
| Assinatura ausente | rejeitado | rejeitado |
| Segredo ausente/vazio | rejeitado | rejeitado |

O estado anterior já era fail-closed na rota (503 sem segredo, 403 sem assinatura/assinatura inválida); a correção reforça a validação também dentro do helper e torna explícito o formato e a comparação byte a byte em tempo constante.

## Comandos e resultados resumidos

- `git fetch origin`: passou; worktree criada a partir de `origin/main`.
- `node --input-type=module` com HMAC sintético, antes: quatro resultados esperados (correta aceita; demais rejeitados).
- Mesmo teste após a correção: passou; correta aceita e errada/ausente/segredo ausente rejeitados.
- `node scripts/test-whatsapp-attribution.mjs`: **passou** (`whatsapp attribution VM tests: passed`).
- `git diff --check`: passou.
- `npx tsc --noEmit`: **não executado**; `node_modules` não estava instalado e não foi feita instalação de rede.
- `git push -u origin fix/p1-whatsapp-webhook-fail-closed-2026-10-22`: falhou exatamente com `fatal: could not read Username for 'https://github.com': terminal prompts disabl` (remoto exigiu autenticação não disponível).
- Não houve deploy, chamada à API WhatsApp/Meta, envio de mensagem ou teste de staging real.

## Decisões exclusivas do dono

1. Confirmar que `WHATSAPP_APP_SECRET` real existe no Worker de produção, verificando apenas presença/ausência e sem ler o valor.
2. Aprovar revisão, merge e deploy da branch; não foram feitos neste ciclo.
3. Se houver staging, aprovar teste real com evento assinado pelo provedor, sem envio de mensagem real.

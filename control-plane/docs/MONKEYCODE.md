# MonkeyCode + Clínica São Paulo

## Papel

| Ferramenta | Uso |
|------------|-----|
| **Grok / Control Tower** | Google Ads, GA4, GSC, mutates |
| **MonkeyCode** | Código do site, docs, PR no GitHub |
| Claude / Gemini / ChatGPT (celular) | Texto e planejamento (sem API live) |

MonkeyCode **não** substitui o Control Tower.

## Setup (1x no seu login)

1. Conta: https://monkeycode-ai.com
2. Configurações → vincular **GitHub App**
3. Autorizar **somente** o repo:
   `clinicasaopauloparnamirim-coder/clinica-sao-paulo-site`
4. Criar tarefa tipo **Desenvolvimento** com o repo selecionado

## Regras obrigatórias em toda tarefa

```
Repo: clinica-sao-paulo-site
Branch: feature/* (PR para main; não force push em main)

PROIBIDO:
- Secrets (MCP_AUTH_TOKEN, GOOGLE_CLIENT_SECRET, tokens)
- Chamar /mcp/tower ou /google/ads/mutate
- Reativar Search-2 ou alterar campanhas Ads
- Remover tracking WhatsApp / Zaraz

PERMITIDO:
- public/ (HTML, CSS, copy, CTA)
- control-plane/docs/
- README e melhorias de UI

Deploy: só via GitHub Actions após merge.
```

## Tarefa teste (copiar no MonkeyCode)

```
Objetivo: melhorar a seção FAQ do site da Clínica São Paulo (Parnamirim/RN)
sem quebrar WhatsApp nem tracking.

Repo: clinicasaopauloparnamirim-coder/clinica-sao-paulo-site
Arquivo principal: public/index.html

Fazer:
1. Revisar FAQs existentes
2. Garantir 4–6 perguntas úteis (horário, endereço/bairro, WhatsApp,
   aparelho/ortodontia, clareamento, forma de agendar)
3. Manter todos os links wa.me/5584998947669 e classes whatsapp-track
4. Não remover script Zaraz / trackWhatsApp
5. Manter mobile-first e tom profissional em português do Brasil
6. Abrir PR na branch feature/faq-whatsapp-safe

NÃO tocar em control-plane/playwright-mcp secrets nem campanhas Ads.
```

## Control Tower (referência — NÃO colar token no MonkeyCode)

- MCP Tower: `/mcp/tower` (Bearer só no Grok / Desktop MCP)
- Docs: `control-plane/docs/MCP-INTEGRACAO.md`

## Checklist

- [ ] GitHub App só no repo da clínica
- [ ] Primeira tarefa = FAQ (texto acima)
- [ ] Revisar PR antes do merge
- [ ] Ads continua só no Grok

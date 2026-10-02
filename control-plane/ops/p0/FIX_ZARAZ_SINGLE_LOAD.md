# Fix P0 — Zaraz single-load (causa raiz confirmada)

**Data auditoria live:** 2026-10-02  
**Status:** BLOQUEADOR do money-path

## Causa raiz

No HTML da home o Zaraz entra **duas vezes**:

1. **Script cedo no head** — `src="/cdn-cgi/zaraz/s.js?z=..."`
2. **Bootstrap Cloudflare** no final — define `window.zaraz` e injeta **outro** `s.js`

O bootstrap contém `if (zaraz) console.error("zaraz is loaded twice")`.

## Correção (Opção A — preferida)

1. Cloudflare → zona → **Zaraz** enabled
2. Remover do código-fonte qualquer snippet/manual `s.js` duplicado
3. Purge cache CF + hard refresh
4. Console **sem** `zaraz is loaded twice`

## Depois

1. Tool GA4: event `clique_whatsapp`, ID `G-EGTYJM0REP`
2. Clique WA teste → **Zaraz Monitoring**
3. GA4 Tempo real → Ads conversão ALTA INTENÇÃO `24289443969`

## Já OK no site

- CTAs `whatsapp-track` + `zaraz.track('clique_whatsapp')`
- Tags GTM/AW/GA4 no pageview

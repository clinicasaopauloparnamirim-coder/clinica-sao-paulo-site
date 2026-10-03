# P0 Status — 2026-10-03

| Camada | Status |
|--------|--------|
| Repo `public/index.html` | **OK** — sem dual inject; `clique_whatsapp` presente |
| Live `clinicasaopauloparnamirim.com.br` | **BLOQUEADO** — `cf-cache-status: HIT` ainda serve HTML antigo (2× Zaraz) |
| CF Purge API | **401** — token sem permissão `Cache Purge` |

## Ação humana obrigatória (1 min)

1. Cloudflare Dashboard → zona `clinicasaopauloparnamirim.com.br`
2. **Caching** → **Configuration** → **Purge Everything**
3. Hard refresh (Ctrl+Shift+R)
4. Console: **não** deve aparecer `zaraz is loaded twice`
5. Clique WA → **Zaraz → Monitoring** → evento `clique_whatsapp`

## Depois do purge

- GA4 `G-EGTYJM0REP` Tempo real
- Ads conversão ALTA INTENÇÃO `24289443969`
- Só então JUDGMENT_REQUIRED em mutates live

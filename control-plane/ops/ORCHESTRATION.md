# Clínica São Paulo — Orquestração mestra (stack auditado)

**Status:** ACTIVE  
**Princípio:** money-path primeiro; labs isolados; julgamento tipado; skill gate obrigatório.

---

## 0. Circuito de ouro (produção)

```
Visitante → Site live (CF)
  → clique WhatsApp (whatsapp-track)
  → zaraz.track('clique_whatsapp')
  → Zaraz Monitoring → GA4 (G-EGTYJM0REP)
  → conversão Ads → campanha ALTA INTENÇÃO (24289443969)
  → lead / agendamento
```

**P0 DoD:** single-load Zaraz · evento no Monitoring · GA4 · Ads · Search-2 fora.

---

## 1. Mapa de caixas

```
Design lab     → Open Design (LP/visual)
Docs / mapa    → Archify
Coding lab     → Ruflo/DSH (isolado)
Skill gate     → SkillSpector
Judgment bus   → Laya (local) + Jev (cloud)
Money-path     → site + P0 + CT
Disciplina     → Superpowers + Karpathy rules
```

## 2. Inventário

| Peça | Papel | Money-path? |
|------|--------|-------------|
| Site + Zaraz + GA4 + Ads | Receita | Sim |
| Control Tower | Audit/mutate ALTA INTENÇÃO | Sim (gated) |
| Open Design | LP/mock | Não |
| Archify | Diagrama funil/CT | Não |
| SkillSpector | Gate install skills | Não |
| **Jev** | Judgment cloud | Gates |
| **Laya** | Judgment local | Gates |
| Ruflo/DSH | Coding lab | Não |
| Spector | Memory lab | Não |

## 3. Judgment flow

```
Pedido → state mínimo → Laya preferida (ou Jev) → threshold no código → allow|confirm|block
```

## 4. Bootstrap

1. P0 medição  2. ALTA INTENÇÃO  3. SkillSpector  4. Judgment  5. Design/docs  6. Coding lab

Ver: `ops/judgment/` · `ops/CONSTITUTION.md`

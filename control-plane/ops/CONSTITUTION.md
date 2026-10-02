# Clínica São Paulo — Agent & Tool Constitution

**Status:** ACTIVE  
**Escopo:** money-path de captação (site + Ads + GA4)  
**Campanha no escopo:** somente **ALTA INTENÇÃO** (`24289443969`)  
**Fora de escopo:** Search-2 e qualquer campanha aposentada  

---

## 1. Money-path (único caminho de produção)

```
Site live (clinicasaopauloparnamirim.com.br)
  → clique WhatsApp (wa.me/5584998947669)
  → evento canônico clique_whatsapp
  → Zaraz → GA4 (G-EGTYJM0REP)
  → conversão Google Ads (conta 4603647788)
  → lead / agendamento
```

- **Site canônico:** https://clinicasaopauloparnamirim.com.br/  
- **Repo live:** clinicasaopauloparnamirim-coder/clinica-sao-paulo-site  
- **Control Tower:** Worker/MCP de audit e (com gate) mutate — nunca lab agents  

Nenhuma otimização de lance, criativo ou landing de anúncio sem este circuito **verde**.

---

## 2. Mapa de caixas (aprovado)

| Caixa | Ferramentas | Pode tocar money-path? |
|-------|-------------|------------------------|
| **Money-path** | Site live · P0 medição · CT (Ads+GA4) | **Sim** (com regras) |
| **Design lab** | Open Design (padrão) · claude-prototype (opcional one-shot) | **Não** — só promove via PR |
| **Docs / mapa** | Archify (diagramas verificáveis HTML) | **Não** — só documentação |
| **Skill gate** | SkillSpector (scan antes de instalar skill) | **Não** — governança de lab |
| **Judgment** | Jev (fase 2, pós-P0) | Só **gates**; código aplica threshold |
| **Coding lab** | Ruflo ≥ 3.16.3 · DeepSeek Harness | **Não** — host sem secrets clínica |
| **Memory lab** | Spector (spectrayan) — opcional, pós-P0 | **Não** — sem PII/leads |

```
Design lab     → Open Design (LP/visual)
Docs / mapa    → Archify (arquitetura CT, funil, Zaraz)
Coding lab     → Ruflo/DSH
Skill gate     → SkillSpector
Money-path     → site + P0 + CT
Judgment       → Jev (fase 2)
```

**Regra de skill nova:** nenhuma skill entra no lab sem `skillspector scan <alvo> --no-llm` (score ≥ 51 = não instalar).

---

## 3. Proibido no money-path

- Ruflo, DeepSeek Harness, Open Design agent **com shell** no mesmo host/sessão dos tokens Ads/GA4/MCP  
- Mutate Ads **sem** `validateOnly` (ou equivalente) **e** confirmação humana  
- Incluir Search-2 em relatórios, otimização ou budget  
- Publicar LP de lab como URL final de anúncio sem tracking P0  
- Segunda carga Zaraz / double-count GTM+Zaraz no mesmo evento de conversão  

---

## 4. Secrets boundary

| Secret | Permitido | Proibido |
|--------|-----------|----------|
| Google Ads OAuth / customer | CT Worker, CI restrito, Ads UI | OD, Ruflo, DSH, laptop de design |
| MCP_AUTH_TOKEN | CT apenas | Qualquer lab |
| GA4 admin | CT + GA UI | Coding lab |
| TYPESAFE_API_KEY | Serviço de gates (fase 2) | Site público, docker-compose Ruflo |
| Conteúdo de paciente (PII) | Mínimo necessário no state Jev | Logs de swarm / AgentDB público |

---

## 5. P0 Medição — Definition of Done

P0 = **DONE** somente se **todos** forem verdadeiros:

1. Console do site **sem** `zaraz is loaded twice`  
2. Clique WA de teste gera `clique_whatsapp` no **Zaraz Monitoring**  
3. Mesmo evento visível no **GA4** Tempo real/DebugView (`G-EGTYJM0REP`)  
4. Conversão Ads da **ALTA INTENÇÃO** alimentada por esse sinal  
5. Fonte canônica documentada: `Zaraz → GA4 → Ads`  
6. Search-2 **ausente** do relatório de fechamento  

**Bloqueio:** até P0 DONE, não há lab novo no path de Ads nem mutate de campanha.

---

## 6. Promoção lab → live

Artefato de Open Design / prototype só entra em produção se:

1. Review humano (copy, NAP, CTA WhatsApp)  
2. P0 verde no domínio canônico  
3. PR no repo do site (não deploy manual solto)  
4. URLs finais batem com anúncios ALTA INTENÇÃO  

---

## 7. Control Tower — regras de mutate (quando habilitado)

1. `ads_auth_check` OK  
2. Escopo = ALTA INTENÇÃO only  
3. Simulação / validateOnly primeiro  
4. Human confirm explícito  
5. (Fase 2) Gate Jev `allow|confirm|block` com threshold no **código**  

---

## 8. Coding lab — locked-down

- **Ruflo:** versão ≥ 3.16.3 · MCP bind `127.0.0.1` · sem compose público sem `MCP_AUTH_TOKEN`  
- **DSH:** `workspace-write` + approval `ask` · nunca `danger-full-access` com secrets  
- Workspace **sem** `.env` da clínica  

---

## 9. Ordem de bootstrap (não inverter)

1. Fechar **P0 medição**  
2. Operar e reportar **ALTA INTENÇÃO** com dados reais  
3. Design system + mocks no Open Design  
4. Jev gates em mutates  
5. Ruflo/DSH só em caixa isolada para código  

---

## 10. Donos (preencher na reunião)

| Área | Dono | Backup |
|------|------|--------|
| P0 medição | ________ | ________ |
| Ads ALTA INTENÇÃO | ________ | ________ |
| Site / PR live | ________ | ________ |
| Design lab | ________ | ________ |
| Constitution (este arquivo) | ________ | ________ |

**Próximo checkpoint P0:** ________ (data, máx. 7 dias)

---

*Qualquer exceção a esta constitution exige registro escrito (issue/PR) e não pode ser “só no chat”.*

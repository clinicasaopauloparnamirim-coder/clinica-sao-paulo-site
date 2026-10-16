# Fases 5 e 6 — evidências, ações e bloqueios de SEO local
**Data:** 2026-10-16  
**Domínio:** https://clinicasaopauloparnamirim.com.br/  
**Método:** GAUNTLET LOOP; leitura independente de site publicado, Search Console, GA4 Admin/Reports, GitHub CI e configuração Zaraz.  
**Modo:** alterações públicas não executadas; código do Heartseomap em branch/PR, aguardando revisão.

## Resumo executivo
- **Fase 5 — parcial:** os sinais técnicos básicos foram verificados. A medição e o envio de eventos ainda têm uma regra antiga no Zaraz, cuja edição falhou por autenticação/bloqueio de segurança.
- **Fase 6 — parcial:** existe conteúdo local e páginas de serviço. Faltam a verificação direta do perfil oficial, medição geográfica de ranking e uma auditoria comprovada de avaliações/citações locais.
- **Heartseomap:** já existem código para GeoGrid, heatmap, comparação, concorrentes, histórico e exportações XLSX/PDF. CSV/JSON foram adicionados em [PR #2](https://github.com/clinicasaopauloparnamirim-coder/local-seo-heatmap/pull/2); o CI do commit mais recente concluiu com sucesso. O aplicativo é desktop/local e ainda não tem integração de runtime comprovada com o cérebro SEO.

## Fase 5 — SEO técnico e mensuração

### Evidências aprovadas
1. O sitemap público retornou 9 URLs canônicas sem `www`; o `robots.txt` permite rastreamento e aponta para o sitemap.
2. A homepage publicada usa canonical próprio, NAP (Rua Edgar Dantas, 106, 1º andar, sala 7, Centro, Parnamirim/RN, CEP 59140-290), link oficial de Maps e dados estruturados de clínica/profissional. O acesso à versão `www` foi observado redirecionando ao host canônico sem `www`.
3. Os workflows GitHub recentes do site foram concluídos com sucesso: [Semantic SEO Quality Gate](https://github.com/clinicasaopauloparnamirim-coder/clinica-sao-paulo-site/actions/workflows/semantic-seo-quality-gate.yml) e publicação de produção (run #17 consultado). Isso não prova indexação ou ranking.
4. Search Console está conectado como `siteOwner` à propriedade `sc-domain:clinicasaopauloparnamirim.com.br`.
5. Lista administrativa de key events do GA4 (`properties/552216899`) contém `close_convert_lead`, `qualify_lead`, `purchase` e `clique_whatsapp`. A lista administrativa não continha `generate_lead` no momento da consulta. Não inferir status de key event apenas pelo volume histórico.
6. Relatório de eventos de 2026-09-18 a 2026-10-15 registrou `page_view` 710, `session_start` 482, `first_visit` 387, `user_engagement` 265, `clique_whatsapp` 38, `scroll` 35, `click` 29 e `generate_lead` 25. Volume histórico não equivale a leads reais.

### Bloqueio de mensuração confirmado
A configuração Zaraz da zona retornou versão 64:
- ação GA4 `INQv`, nome “Lead WhatsApp”, envia `generate_lead` com `conversion=true` no gatilho antigo `MxOq`;
- `MxOq` usa seletor CSS `.whatsapp-track`; páginas inspecionadas usam classe `.whatsapp-cta`, portanto o trigger parece legado/inativo para a marcação atual;
- existe ação legada do Google Ads `aAki` ligada ao mesmo gatilho;
- a ação GA4 `AllTracks` está com `conversion=true`, risco de classificar eventos genéricos como conversões.
- A implementação de `public/attribution.js` já envia atribuição first-party e os eventos `whatsapp_click`/ `clique_whatsapp`.

**Resultado da tentativa de correção:** a escrita em Zaraz não foi aplicada (erro de autenticação e depois bloqueio do ambiente). Não afirmar corrigido. Não tentar contornar o bloqueio.

### Procedimento seguro quando a sessão de escrita for regularizada
1. Exportar/salvar o estado e o histórico atual do Zaraz.
2. Em preview, remover `INQv` e avaliar remoção de `aAki` somente após reconciliar a conversão do Google Ads enviada por `attribution.js`.
3. Rever a marcação `conversion=true` de `AllTracks` para não marcar eventos genéricos como conversões.
4. Publicar só após inspeção de diff e rollback pronto.
5. Testar um clique real de CTA autorizado: evento único de clique WhatsApp, parâmetros UTM presentes, sem `generate_lead` disparado apenas por clique. Confirmar via GA4 DebugView/relatório, Zaraz read-back e ledger first-party. Não enviar mensagem ao destinatário para teste sem consentimento.
6. Comparar `clique_whatsapp` com conversas/leads reais do CRM/ledger antes de reclassificar key events; mudanças de key event exigem UI administrativa GA4.

## Fase 6 — autoridade local, conteúdo e grade de calor

### Estado verificado
- As páginas existentes cobrem dentista, clínica odontológica, aparelho, clareamento, limpeza, facetas, restauração estética e tratamento de canal; mantêm canonical, FAQ visível/Schema, NAP e CTA conforme o quality gate.
- O perfil Google Business Profile proprietário e o CID/Place ID não foram confirmados com leitura uniforme nesta execução. Portanto, não registrar a ficha como auditada ou verificada e não declarar gap exato de avaliações.
- A execução da grade OpenSEO foi bloqueada por saldo insuficiente. Nenhum heatmap ou posição em grade foi gerado; não repetir crawl pago sem saldo/necessidade.
- Nenhum review, citação ou cadastro em diretório foi criado artificialmente.

### Próxima execução local sem páginas artificiais
1. Identificar por CID/Place ID a ficha oficial da Clínica São Paulo e confirmar propriedade, categoria principal/secundárias, telefone, NAP, horário, website, serviços, fotos, link/rota oficial e área atendida.
2. Comparar nota, número e atualidade de avaliações apenas depois de confirmar a ficha correta e o conjunto concorrente no mesmo método.
3. Pedir avaliações de forma neutra a pacientes reais após atendimento, sem incentivo, sem condicionar o pedido a satisfação e sem filtrar a quem se solicita.
4. Responder às avaliações sem expor dados clínicos. Manter uma planilha de diretórios reais, URL, NAP, estado de cadastro, última validação e divergências antes de submeter qualquer informação.
5. Não criar páginas genéricas para bairros. Melhorar páginas existentes apenas com experiências/serviços/localização factuais e conteúdo específico, mantendo a política do projeto de aprovação visual por página.

### Protocolo Heartseomap
Quando o aplicativo local estiver disponível num equipamento autorizado, ou quando OpenSEO tiver créditos:
- rodar no celular/geografia a consulta `dentista`, `dentista em Parnamirim`, `clínica odontológica`, `aparelho ortodôntico`, `clareamento dental`;
- definir grade distribuída por até 5 km da clínica, guardar cada ponto e data, e comparar novamente com a mesma geometria;
- capturar ranking da clínica e do concorrente #1 por ponto, presença em Top 3/10/20, nota/avaliações apenas como contexto, e Share of Voice;
- exportar CSV para análise tabular e JSON versionado para futura integração de consumo pelo cérebro SEO; o botão/exportação, isoladamente, não prova que a integração automática exista;
- enviar ao cérebro SEO a grade, a pergunta, a janela e os dados brutos para priorizar ações por zona, registrar a correção aplicada e repetir a grade após o recrawl.

## Critérios de aceite para marcar “concluído”
- [ ] Zaraz atualizado em ambiente autorizado, versão lida de volta e evento legado ausente.
- [ ] Teste de clique WhatsApp sem evento de lead falso ou conversão duplicada.
- [ ] Key events GA4 conferidos com dados de CRM/ledger.
- [ ] Heartseomap integrado ao cérebro SEO por fluxo de importação/exportação validado, não apenas por projeto GitHub existente.
- [ ] Heatmap real executado em grade de até 5 km e baseline salvo.
- [ ] Perfil GBP correto auditado, avaliações e citações verificadas e plano de autoridade registrado.

**Conclusão:** base técnica está consistente e o CI do site passa; Fase 5 permanece parcialmente bloqueada pela escrita Zaraz e Fase 6 pela falta da grade real e confirmação de perfil/autoridade local. Não prometer Top 3 até medir os pontos e repetir as consultas.

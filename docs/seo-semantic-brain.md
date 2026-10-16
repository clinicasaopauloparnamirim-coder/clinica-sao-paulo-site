# Cérebro de SEO semântico — mapa operacional

## Estado confirmado

- O registro do agente semantic-seo está no bundle do Control Plane e descreve o mapeamento de entidades, intenção de busca, clusters, SERPs, lacunas semânticas, links internos e canibalização. A configuração depende de ferramentas externas; um registro no catálogo, sozinho, não prova execução ponta a ponta.
- OpenSEO, projeto brasileiro em português: https://app.openseo.so/p/54cab15b-b930-426a-b58c-a8e60585ce26
- Google Search Console: propriedade sc-domain:clinicasaopauloparnamirim.com.br.
- GA4: propriedade properties/552216899.
- Repositório do site: https://github.com/clinicasaopauloparnamirim-coder/clinica-sao-paulo-site
- Quality gate: scripts/semantic-seo-audit.mjs, executado em push/PR pelo workflow Semantic SEO Quality Gate.

## Verificações automáticas

- title, meta description, canonical e Open Graph;
- um H1 e hierarquia de headings;
- JSON-LD válido e entidade clínica com Organization, Dentist, MedicalClinic, telefone/endereço e sameAs do Google Maps;
- Service, BreadcrumbList e FAQPage nas páginas de serviço;
- CTAs WhatsApp, rota oficial e instrução de interfone;
- sitemap/robots coerentes com as nove páginas esperadas;
- classificação first-party de referências de assistentes de IA.

## Limites conhecidos

- Sitemap enviado não garante indexação imediata; o Google decide quando indexar.
- Na auditoria OpenSEO mais recente, 9/9 páginas foram rastreadas sem issues de rastreamento, mas só 1 de 6 medições Lighthouse concluiu; isso não prova CWV verdes em todas as páginas.
- Semrush e Ahrefs não forneceram dados nesta sessão por limite de plano/unidades; backlinks e autoridade continuam sem auditoria.
- O Worker jev-control-tower no Cloudflare está com código Hello World e não deve ser considerado o executor ativo do cérebro. Não o substituir sem reconciliar origem e publicação.

## Rotina GAUNTLET LOOP

1. Buscar em OpenSEO, Search Console, GA4 e GitHub.
2. Confrontar canonicals, sitemap, conteúdo, schema e métricas.
3. Testar correções no quality gate e depois no site publicado.
4. Registrar bloqueios que dependem de plano ou credenciais.
5. Repetir após recrawl do Google e nova auditoria técnica.


## Auditoria operacional e continuidade — 2026-10-16

Registro de evidências e bloqueios da execução das Fases 5 e 6: [SEO-PHASE-5-6-ACTION-2026-10-16.md](../control-plane/ops/SEO-PHASE-5-6-ACTION-2026-10-16.md).

Não marcar as duas fases como concluídas enquanto:
- a configuração Zaraz obsoleta não for corrigida com acesso de escrita autenticado e confirmação por read-back;
- o teste de clique WhatsApp não demonstrar um evento-chave coerente e não duplicado;
- a grade GeoGrid não for executada com dados reais no equipamento Heartseomap ou créditos OpenSEO disponíveis;
- o Perfil da Empresa correto, as avaliações e a consistência de citações locais não forem comparados de modo direto.

O código e o CI do site aprovados não demonstram, por si só, posição no Local Pack nem melhoria de ranking. Para a implementação CSV/JSON do Heartseomap, acompanhar o [PR #2](https://github.com/clinicasaopauloparnamirim-coder/local-seo-heatmap/pull/2); não considerar integrado ao cérebro local até existir importação/leitura automática validada.

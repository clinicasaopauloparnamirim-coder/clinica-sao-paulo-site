# Rollout de Impeccable + Taste Skill — Clínica São Paulo

## Objetivo
Aplicar direção de arte deliberada e revisão de interface às páginas públicas da Clínica São Paulo, preservando fatos clínicos, NAP, SEO, instrumentação de conversão e identidade reconhecível. Este documento é um plano de execução e aceite; não declara que as skills foram executadas no navegador.

## Ferramentas e papéis
- Taste Skill (Leonxlnx/taste-skill): direção de arte e construção/revisão de páginas públicas de marketing.
- Impeccable (pbakaus/impeccable): crítica UX, auditoria de responsividade/acessibilidade, refinamento e hardening.
- Aplicação em sequência: primeiro inventariar e escolher uma direção por página; depois construir; então auditar e corrigir; finalmente validar visualmente em mobile/tablet/desktop e verificar conversões.
- Não executar as duas ferramentas em paralelo sobre os mesmos arquivos.
- Referências oficiais: https://github.com/Leonxlnx/taste-skill e https://github.com/pbakaus/impeccable

## Páginas sob escopo
- / (página inicial)
- /dentista-parnamirim/
- /clinica-odontologica-parnamirim/
- /aparelho-ortodontico-parnamirim/
- /clareamento-dental-parnamirim/
- /limpeza-dental-parnamirim/
- /facetas-de-resina-parnamirim/
- /restauracao-estetica-parnamirim/
- /tratamento-de-canal-parnamirim/

## Execução atual — branch `feat/impeccable-taste-site-ads`

### Alterações reais feitas
- Criado `public/design-refinements.css` com direção de arte por serviço, variações discretas de composição, crops e fundos dentro da identidade verde-floresta/dourado da clínica.
- Reordenado o hero em mobile: mensagem e CTA vêm antes da imagem. O H1 da home foi reduzido para “Dentista em Parnamirim”; a página de dentista usa “Um dentista que ouve você.” com a localização mantida no texto.
- Ajustada a escala tipográfica em mobile, aumentados textos funcionais pequenos, melhorado o contraste de elementos e trocada a família de texto para Source Sans 3 com `display=swap`.
- Removidos rótulos em caixa alta acima dos títulos, numeração decorativa 01/02/03 e sombras decorativas. Preservados canonical, JSON-LD, NAP, links de WhatsApp, UTM e `attribution.js`.
- Adicionadas fotos ilustrativas específicas por serviço, com links de crédito/licença; as fotos não representam pacientes nem resultados da Clínica São Paulo:
  - Dentista: Shvets Production / Pexels (foto gratuita).
  - Clínica odontológica: Harrison Keely / Wikimedia Commons, CC BY 4.0.
  - Ortodontia: Dr-Taher / Wikimedia Commons, domínio público.
  - Clareamento: Kindel Media / Pexels (foto gratuita).
  - Limpeza: Wsiegmund / Wikimedia Commons, CC BY 2.5.
  - Facetas: Shiny Diamond / Pexels (foto gratuita).
  - Restauração: JoeyC773 / Pexels (foto gratuita).
  - Canal: Pearson Scott Foresman / Wikimedia Commons, domínio público.
  - Home: ativo local existente `/hero-ortho.webp`.
- As oito URLs de imagem externas foram verificadas com resposta HTTP 200; as páginas de origem Pexels também responderam 200 e são listadas como fotos gratuitas.

### Evidência de navegador e testes
- Auditoria real do site publicado em 390 × 844 px antes da alteração: H1 da home em 4 linhas, hero com cerca de 697 px e CTA primário próximo de y=619 px.
- Criado `scripts/design-viewport-audit.mjs`, que abre as nove rotas em Chromium a 390, 768 e 1440 px, mede linhas do H1, posição do CTA, overflow, carregamento das imagens e stylesheet, e captura screenshots para artefato do CI.
- Taste Skill lint oficial: **0 findings** nos nove HTMLs e no novo CSS. Impeccable detector: **0 findings**.
- Regressão Playwright concluída com sucesso: 9 rotas × 3 viewports (390, 768 e 1440 px), 27 combinações. Nenhum overflow horizontal; todas as imagens hero carregaram; todos os H1s ficaram em até 2 linhas; os CTAs WhatsApp têm destino válido e aparecem no primeiro viewport mobile; heroes desktop abaixo de 700 px. Screenshots e métricas foram salvos no artefato `clinic-design-viewport-audit`.
- A captura via Cloudflare Browser Rendering falhou por autenticação; o teste Playwright no GitHub Actions validou a branch. Em paralelo, os checks automáticos de Cloudflare Workers Builds continuam falhando antes de executar o código porque os triggers da branch estão configurados com `npx wrangler preview`, comando inexistente no Wrangler 4. O conector Cloudflare disponível só tem permissões de leitura, então não consegui corrigir essa configuração externa. Isso não alterou produção; a publicação oficial continua no workflow GitHub `publish-production-website.yml`, que executa build, gate SEO e verificações pós-deploy.

A produção não foi alterada: as mudanças estão somente na branch/PR.

## Direção de design e critérios
1. Manter o tom acessível, profissional e acolhedor da clínica; evitar aparência genérica de template e estética artificialmente luxuosa.
2. Cada página de serviço deve responder acima da dobra: qual serviço, onde, qual próximo passo e CTA WhatsApp.
3. Preservar o conteúdo clínico responsável; nenhuma promessa de resultado, urgência artificial, preço ou alegação clínica sem fonte aprovada.
4. CTA primário claro, toque confortável em mobile, foco visível, contraste suficiente e sem elementos fixos cobrindo conteúdo.
5. Não apagar, renomear ou duplicar canonical, JSON-LD, NAP, sitemap, attribution.js, parâmetros UTM ou instrumentação de WhatsApp.
6. Cada serviço precisa de direção e texto visualmente próprios, mas com componentes consistentes e navegação reconhecível.
7. Evitar alterações a tracking/GA4/Zaraz nesta missão de design; medir antes/depois separadamente.

## Aceite antes de publicar
- Comparar screenshots antes/depois em 390px, tablet e desktop.
- Verificar links internos, links WhatsApp, navegação por teclado, foco, contraste e ausência de overflow horizontal.
- Rodar build/testes existentes e revisar o diff.
- Validar no ambiente de preview; produção só depois de evidência de teste.
- Registrar URLs, commit, screenshots e resultados de regressão no relatório final.

## Bloqueios atuais
- A conexão HYPD continua sem conta Ads e os recursos de auditoria de landing page estão bloqueados pelo plano Free. A conexão Google Ads via Composio permitiu leitura, mas o ambiente restringiu explicitamente as ferramentas de mutação de anúncios. Nenhum anúncio, orçamento, lance, palavra-chave ou tracking foi alterado.
- A auditoria Google Ads identificou oito anúncios ativos da campanha `SEARCH | PARNAMIRIM | ALTA INTENÇÃO` apontando para a homepage, inclusive Ortodontia e Serviços. O grupo Hiperlocal usa `Dentista em Nova Parnamirim` apesar de o endereço cadastrado ficar no Centro. Nenhuma mutação de anúncios foi feita porque a ferramenta de escrita está restringida pelo ambiente.
- Os checks de Cloudflare Workers Builds na branch usam o comando inválido `npx wrangler preview`; o token Cloudflare disponível não tem permissão de escrita para corrigir os triggers. Isso não impediu o deploy oficial via GitHub Actions.
- Publicação concluída: PR #84 mesclada no commit `fcf25ff45ba90979141774368eebe28c646c2742`. O workflow `Publish Production Website` (run 39004981440) passou build/typecheck, gate SEO/AEO, deploy, verificação das nove páginas, `/health`, rota protegida e redirect `www` → domínio canônico. O `Control Plane Deploy V2` (run 39004981519) também passou typecheck, deploy, smoke test e verificação das rotas protegidas.

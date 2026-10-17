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

Aplicado um primeiro passe de Impeccable nas nove páginas HTML públicas: link para pular ao conteúdo, destino `#main-content`, foco visível consistente, estados hover discretos, melhorias de toque/mobile, menu rolável em telas pequenas e respeito a `prefers-reduced-motion`. A alteração é aditiva e não remove conteúdo, JSON-LD, canonical, NAP, CTAs WhatsApp nem `attribution.js`.

Validação estática no momento do commit: os nove arquivos contêm o skip link, o `main` nomeado e a regra de movimento reduzido. O workflow `Semantic SEO Quality Gate` foi iniciado e estava `queued` na última leitura; ainda não há resultado final de CI. A captura visual via Cloudflare Browser Rendering falhou com erro de autenticação da API; por isso, não alego aprovação visual real em viewport. O site de produção não foi alterado; as mudanças estão somente na branch/PR.

## Primeira constatação de código
As páginas públicas são HTML estático e usam `/hero-ortho.webp` como imagem principal compartilhada. O repositório só contém esse arquivo visual e o favicon na pasta public. Portanto, não trocar a imagem por uma foto clínica inventada ou por um ativo inexistente; planejar um conjunto de imagens próprias e autorizadas antes de diferenciar os heróis visualmente.

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
- A conexão HYPD continua sem conta Ads e os recursos de auditoria de landing page estão bloqueados pelo plano Free. Uma conexão Google Ads separada via Composio está ativa e permitiu leitura de campanha, anúncios e termos.
- Os recursos de mutação de anúncios do Google Ads foram explicitamente marcados como restritos no ambiente Composio; não é permitido contornar essa restrição. Por isso, nenhum anúncio foi publicado ou editado.
- A API Cloudflare Browser Rendering respondeu erro 10000 de autenticação para screenshot; falta uma captura visual automatizada válida antes de afirmar aprovação de layout.
- Próximo gate: concluir CI, validar preview visual real em 390px/tablet/desktop e só então decidir publicação. Nenhum deploy/merge foi feito.

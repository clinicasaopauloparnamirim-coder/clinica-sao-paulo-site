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
- A conexão HYPD disponível nesta sessão retorna plano Free sem acesso aos recursos de auditoria de landing page e não lista nenhuma conta Google Ads.
- Assim, a campanha e os dados de conversão não podem ser editados/verificados por essa conexão nesta execução.
- Não alterar campanha, orçamento, lances, palavras-chave, anúncios ativos ou tracking sem acesso funcional à conta.

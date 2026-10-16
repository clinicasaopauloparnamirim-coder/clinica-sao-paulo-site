# Auditoria SEO semântico, AEO, GEO, concorrência e GMN — 16/10/2026

## Resumo executivo

A base on-page está bem construída. O site tem 9 URLs canônicas no sitemap (home + 8 páginas de serviço), páginas indexáveis, títulos/descrições únicos, um H1 por página, conteúdo específico por tratamento e dados estruturados para a entidade local, serviços e FAQs. O maior risco encontrado não é a ausência de SEO básico: é a autoridade local comparativa, a confirmação de acesso administrativo à ficha do Google e a falta de uma medição de posições do Google Maps por coordenada.

**Estado da execução:** a correção do callback OAuth foi preparada nesta branch e precisa passar pelos testes e pelo fluxo de publicação antes da autorização Google poder ser concluída. A ficha pública já foi identificada. Nenhum dado do Perfil da Empresa foi alterado.

## 1. Identidade da ficha GMN confirmada

- Nome público: **Clínica São Paulo | Odontologia e Dentista em Parnamirim**
- Endereço exibido no Google Maps: Rua Edgar Dantas, 106, 1º andar, sala 7, Centro, Parnamirim/RN, CEP 59140-290
- Telefone: +55 84 99894-7669
- Site: https://clinicasaopauloparnamirim.com.br/
- CID do Google Maps: `0xd96446b8c60c6731` (decimal `15664723163312056113`)
- Contagem pública visível no Maps na consulta: 29 avaliações. A nota da própria clínica não foi validada nesta consulta.

Ficha: https://www.google.com/maps/place/Cl%C3%ADnica+S%C3%A3o+Paulo+%7C+Odontologia+e+Dentista+em+Parnamirim/@-5.9181363,-35.2625308,17z/data=!3m1!4b1!4m6!3m5!1s0x7b25708f013ec19:0xd96446b8c60c6731!8m2!3d-5.9181363!4d-35.2625308!16s%2Fg%2F11bzrphhgh

### Bloqueio de integração e correção preparada

A função `googleOAuthCallback` já existia em `control-plane/playwright-mcp/src/google-ga4.ts`, com verificação de state de uso único e expiração, conferência da conta Google esperada e validação de acesso à propriedade GA4. Porém, a rota `/google/oauth/callback` não estava registrada no roteador principal `src/index.ts`, embora `/google/oauth/start` gerasse esse endereço como URI de retorno. Isso impede completar o fluxo por aquele caminho.

Nesta branch:
1. A rota de callback foi registrada, reaproveitando a validação existente; resposta de callback recebe `X-Robots-Tag: noindex, nofollow, noarchive`, `Cache-Control: no-store` e `Referrer-Policy: no-referrer`.
2. A auditoria do perfil agora normaliza acentos no título e pontuação no telefone antes de fazer o match; isso evita perder a ficha por “Clínica” versus “Clinica” ou pelo formato do número.
3. Os testes e o build precisam passar antes de publicar. Esta alteração ainda **não foi implantada em produção**.

Após publicação e autorização humana, validar: (a) retorno OAuth bem-sucedido com a conta autorizada, (b) leitura de contas e locais da Business Profile API, (c) correspondência do local por site/telefone/título e (d) métricas do Perfil da Empresa. Consentimento de conta Google não pode ser substituído pela identificação pública do Maps.

## 2. SEO técnico e rastreabilidade

| Item | Evidência | Avaliação |
|---|---|---|
| Sitemap | 9 URLs canônicas: home e 8 páginas de intenção comercial; `lastmod` de 13/10/2026 | Bom |
| Robots.txt | `User-agent: * / Allow: /` e referência explícita ao sitemap | Bom |
| Canonical | Uma URL canônica não-www e com barra final em cada página de conteúdo verificada | Bom |
| Meta robots | `index,follow,max-image-preview:large` nas páginas HTML verificadas | Bom |
| Title/description | Valores próprios por página, com termos de serviço/localização | Bom |
| H1 | Um H1 por página de conteúdo examinada | Bom |
| Hieraquia de headings | H2/H3 com intenção e FAQs; algumas seções genéricas repetidas | Bom, com oportunidade editorial |
| URLs técnicas | O mapa de URLs revelou `/health`, `/analytics-config`, `/attribution.js` e `/hero-photo.js` fora do sitemap | Aplicar `X-Robots-Tag: noindex` às respostas técnicas apropriadas e confirmar que essas rotas não entram no índice |
| Variações de URL | O mapa encontrou versões www/não-www e slugs com/sem barra final | Canonical está correto na fonte; validar respostas HTTP 301/308 e links internos sempre apontando à forma canônica |

### Inventário HTML examinado

| Página | Palavras visíveis aproximadas | FAQs em JSON-LD | Notas |
|---|---:|---:|---|
| Home | 832 | 7 | Organization/Dentist/MedicalClinic, WebPage, WebSite e FAQPage |
| Dentista em Parnamirim | 681 | 7 | Service, BreadcrumbList e FAQPage |
| Clínica odontológica em Parnamirim | 672 | 7 | Service, BreadcrumbList e FAQPage |
| Aparelho ortodôntico | 735 | 7 | Opções convencional, estética e autoligada; FAQ de preço/manutenção |
| Clareamento dental | 700 | 7 | Avaliação, sensibilidade e expectativas |
| Limpeza dental | 669 | 7 | Frequência, tártaro, gengiva e manutenção |
| Facetas de resina | 705 | 7 | Indicação, manutenção e alternativas |
| Restauração estética | 701 | 7 | Forma, função, reparo e diferença para faceta |
| Tratamento de canal | 715 | 7 | Sintomas, sessões, recuperação e sinais de urgência |

As contagens de palavras são estimativas feitas a partir do HTML do repositório principal, e não substituem uma auditoria de renderização completa de cada URL em produção.

## 3. SEO semântico e entidades

**Pontos fortes encontrados**
- A entidade central é marcada como `Organization`, `Dentist` e `MedicalClinic`; as páginas de serviço também incluem `WebPage`, `Service`, `BreadcrumbList` e `FAQPage`.
- NAP coerente: nome, endereço e telefone são repetidos nas páginas.
- `areaServed` representa Parnamirim e bairros locais; a página de serviço descreve a intenção correspondente.
- Os 8 clusters comerciais cobrem dentista, clínica odontológica, aparelho, clareamento, limpeza, facetas, restauração estética e canal.
- Há CTAs para WhatsApp e links internos para outros cuidados e visita à clínica.

**Lacunas**
- Quatro seções editoriais se repetem em muitas páginas (“Você traz as dúvidas…”, “Antes de agendar”, “Conheça outros cuidados”, “Planeje sua visita”). Manter a arquitetura, mas aumentar a proporção de conteúdo realmente exclusivo de cada serviço.
- O schema não cria uma entidade `Person` própria e completa para o dentista. Adicionar apenas após confirmar o nome profissional, CRO/RN, credenciais e URLs oficiais que possam ser publicamente citadas; não inventar formação ou especialidades.
- A relação `sameAs` é limitada. Expandir somente com perfis oficiais e diretórios confiáveis que correspondam à mesma entidade; evitar múltiplos perfis inconsistentes.
- Não gerar páginas por bairro em massa apenas para repetir texto. Melhor consolidar evidência local, fotos originais, perguntas reais e informações de acesso/atendimento.

## 4. AEO — prontidão para respostas

**Sinais positivos:** FAQs visíveis e em JSON-LD, títulos interrogativos, uma página dedicada por serviço e respostas ligadas à intenção do paciente. Isso favorece extração de respostas e contexto por mecanismos de resposta.

**Próxima melhoria:** para cada FAQ, iniciar a resposta com uma resposta direta e autossuficiente, seguida de nuance clínica; manter linguagem prudente, sem promessas de resultado ou diagnósticos à distância. Adicionar sinais explícitos e verificáveis de autoria/revisão profissional quando houver comprovação. O schema melhora a legibilidade, mas não garante destaque ou menção em respostas de IA.

**Limite da medição:** não foi obtida uma taxa quantitativa de menções/citações em ChatGPT, Gemini, Perplexity ou Google AI Overviews nesta execução. Esses valores ficam “não medidos”, e não zero.

## 5. GEO — descoberta por IA e consistência externa

A arquitetura local ajuda: entidade estruturada, site, telefone/endereço, serviços e FAQs. O principal gap é corroborar essa entidade em fontes externas consistentes e mensurar se motores de resposta a citam. Publicar/atualizar perfis legítimos e coerentes em diretórios locais e de saúde, com a mesma forma de nome, telefone, endereço, site e categorias, sem criar listagens artificiais.

Fontes públicas de descoberta local relevantes:
- DentMap — diretório de dentistas em Parnamirim: https://dentmap.com.br/dentistas/parnamirim
- DentMap — aparelho ortodôntico em Parnamirim: https://dentmap.com.br/aparelho-ortodontico/parnamirim
- Sorridents — unidade Parnamirim: https://sorridents.com.br/unidade/parnamirim

## 6. Concorrentes locais — snapshot público de 16/10/2026

Dados obtidos em resultados públicos do Google Maps/local search. Ratings e contagem de avaliações podem mudar; estes são indicadores de reputação/volume, **não posições de ranking para “dentista”**.

| Clínica | Nota pública | Avaliações | Localização pública |
|---|---:|---:|---|
| Queiroz Odontologia | 5,0 | 402 | Av. Prof. Clementino Câmara, Cohabinal |
| Clínica Dra. Odailma Lima | 5,0 | 301 | Rua Anita Alves Maciel, Bela Parnamirim |
| Borges Odontologia | 4,9 | 243 | Rua Edgar Dantas, Santos Reis |
| Viva Odontologia | 5,0 | 187 | Av. Abel Cabral, Nova Parnamirim |
| Parnamirim Odontologia | 4,8 | 176 | Av. Brigadeiro Everaldo Breves, Centro |
| Clínica Dentale | 4,7 | 181 | Av. Brigadeiro Everaldo Breves, Centro |
| Sorridents Centro Parnamirim | 4,9 | 141 | Rua Ten. Ferreira Maldos, Centro |
| Sorria Odontologia e Face | 5,0 | 98 | Av. Sen. João Câmara, Centro |
| Dr. Sergio Yunes / Dra. Alessandra Bassanesi | 5,0 | 73 | Av. Brigadeiro Everaldo Breves, Centro |

O perfil da Clínica São Paulo mostrou 29 avaliações na consulta. Assim, o concorrente Queiroz apresenta aproximadamente 13,9 vezes esse volume; Odailma, 10,4 vezes; Borges, 8,4 vezes; Parnamirim Odontologia, 6,1 vezes; e Sorridents, 4,9 vezes. O volume não comprova superioridade clínica, mas aumenta o sinal de popularidade local. A resposta apropriada é gerar avaliações genuínas de pacientes reais, seguindo as regras do Google, sem comprar avaliações, oferecer incentivos ou filtrar solicitações apenas para pacientes satisfeitos.

## 7. Google Search Console — desempenho recente

Janela aproximada de 28 dias, de 16/09 a 13/10/2026, fornecida pela auditoria conectada do Search Console:
- `dentista parnamirim`: 4 impressões, média aproximada de posição 12,75.
- `dentista em parnamirim`: 6 impressões, posição média aproximada 13,67.
- `clínica odontológica parnamirim`: 1 impressão, posição média 37.
- Home não-www: 5 cliques / 137 impressões / posição média aproximada 5,87.
- Home www: 2 cliques / 70 impressões / posição média 10.

As amostras de consulta têm poucas impressões, então a posição média oscila e não deve ser tratada como tendência estável. O relatório contém variantes www e não-www; validar consolidação por redirecionamento e os links canônicos, sem concluir que há duplicação indexada somente por isso.

## 8. Mapa de calor e posições do Google Maps

**Não concluído; nenhum rank foi inventado.**
- A chamada 3×3 de GeoGrid do OpenSEO falhou porque a organização não tem créditos suficientes.
- A alternativa via DataForSEO foi bloqueada pelo executor com erro de “no active connection” para `dataforseo`. A tabela de preços retornada para Google Maps SERP indicava aproximadamente US$ 0,006 por 10 SERPs padrão, mas a grade não foi executada.
- A lista de concorrentes acima e o mapa de endereços são evidência de concorrência local, não um mapa de calor de posições.

Depois de restaurar créditos OpenSEO ou estabelecer uma conexão autorizada de DataForSEO, executar um grid móvel 3×3 centrado em -5.9181363, -35.2625308, espaçamento de 2 km, para os termos “dentista” e “clínica odontológica”. Comparar os ranks da ficha identificada pelo CID; salvar coordenadas, horário de coleta, ranking/local #1 e cobertura. Um teste único não estabelece tendência; repetir semanalmente somente com orçamento aprovado.

## 9. Scores de auditoria (avaliação qualitativa interna)

Os scores abaixo avaliam prontidão observável no site e nos sinais públicos, não são notas oficiais do Google nem promessa de ranking.

| Dimensão | Nota | Justificativa |
|---|---:|---|
| Base técnica on-page | 8,5/10 | Sitemap, robots, canonicals, titles/descriptions, H1 e schema presentes |
| SEO semântico | 8,0/10 | Clusters de serviço e sinais locais bem definidos; páginas ainda compartilham blocos de template |
| AEO — prontidão de resposta | 7,5/10 | FAQ e hierarquia semântica presentes; falta provar citação/menção real em engines e enriquecer autoria/credenciais |
| GEO — entidade/corroboration | 6,0/10 | Entidade local estruturada e perfis de descoberta; precisa mais citações consistentes e medição de menções por IA |
| SEO local/GMN | 5,5/10 | Ficha pública identificada, mas acesso administrativo/API ainda não validado; perfil tem 29 avaliações versus concorrentes com 73–402 |
| Ranking Google Maps por geogrid | Não pontuado | GeoGrid não executou; falta dado de posição por coordenada |

## 10. Ordem de execução

1. Passar build/CI e publicar a correção do callback OAuth em janela aprovada.
2. Gerar o link OAuth pelo Control Tower, concluir o consentimento na conta Google correta e executar auditoria de leitura da ficha/contas/locais e métricas.
3. Completar o GeoGrid 3×3 com provedor autorizado e salvar o snapshot como baseline.
4. Verificar redirecionamentos de host e slash, colocar `X-Robots-Tag: noindex` nas respostas técnicas públicas onde aplicável e confirmar que endpoints operacionais não são candidatos a indexação.
5. Melhorar distintividade das páginas de serviço, autoria/credenciais verificadas, citações externas coerentes e pedido ético de avaliações genuínas.
6. Medir, e não presumir, a evolução: GSC por consulta/página, chamadas/cliques do GMN, avaliações, menções/citações em engines de resposta e posições por geogrid.

## Evidências e limites

A análise técnica foi feita sobre HTML/sitemap/robots do repositório principal, correspondência com URLs descobertas no site público, Search Console já conectado e dados públicos da ficha e de concorrentes consultados em 16/10/2026. A nova auditoria assíncrona do OpenSEO foi iniciada, mas a leitura dos seus resultados não foi concluída nesta sessão. Não houve edição de dados públicos do Perfil da Empresa, publicação de posts, resposta a avaliações ou criação de avaliações/listagens.

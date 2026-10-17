# Google Ads — brief de melhoria criativa com Taste Skill + Impeccable

## Estado
Leitura real da conta concluída via conexão Google Ads/Composio; mudanças em anúncios não executadas. A ferramenta de mutação de anúncios foi explicitamente restringida pelo ambiente e não pode ser contornada. Nenhum orçamento, lance, palavra-chave, anúncio ou conversão foi alterado.

## Snapshot de desempenho (últimos 30 dias, consulta feita em 17/10/2026)
- Conta: `4603647788`.
- Campanha ativa: `SEARCH | PARNAMIRIM | ALTA INTENÇÃO` (`24289443969`), status `ENABLED`, orçamento nominal consultado: R$ 17/dia.
- Impressões: 1.199; cliques: 92; CTR: 7,67%; gasto: R$ 173,59; conversões reportadas pelo Google Ads: 7; CPA aritmético: R$ 24,80; CPC médio aproximado: R$ 1,89.
- `Search-2` (`24146336625`) está `PAUSED`; janela consultada: 943 impressões, 51 cliques, R$ 88,18 de gasto e 5 conversões históricas reportadas. Não foi reativada.
- A campanha ativa tem vários anúncios habilitados; dois anúncios retornados na leitura foram `826284999581` (36 cliques, 4 conversões, R$ 65,04 de custo, 421 impressões) e `826284997430` (32 cliques, 2 conversões, R$ 59,35 de custo, 394 impressões). Esses números são por anúncio e não devem ser somados como se fossem a campanha inteira.
- A leitura de termos de pesquisa retornou resultados paginados/limitados; os exemplos visíveis incluem consultas locais de alta intenção. Não concluir desperdício de gasto nem adicionar negativas sem consolidar a lista completa e verificar conversões qualificadas.

**Limite da evidência:** conversões são as reportadas pelo Google Ads; esta consulta, sozinha, não comprova que todas sejam leads reais do WhatsApp. O snapshot é uma janela de 30 dias e não representa necessariamente o dia atual.

## Campanha de referência
SEARCH | PARNAMIRIM | ALTA INTENÇÃO (ID `24289443969`). O estado atual foi lido em 17/10/2026. O acesso de leitura está funcionando, mas a mutação de anúncios está bloqueada pelo ambiente Composio. Preservar orçamento, segmentação, palavras-chave, lances, negativas e anúncios existentes até a ferramenta de escrita permitida estar disponível e a mensuração de leads ser validada.

## Princípios para anúncios de pesquisa
- Responder à intenção da consulta; evitar slogans vagos.
- Incluir Parnamirim quando relevante e manter coerência entre consulta, anúncio e landing page.
- Não anunciar resultados garantidos, preços desatualizados, disponibilidade não confirmada ou atributos clínicos não comprovados.
- Usar extensões/recursos de chamada e local somente quando os dados da conta forem verificados.
- Separar grupos de intenção por serviço e direcionar cada anúncio para a landing page correspondente, se a estrutura atual permitir.

## Rascunhos de ativos responsivos — revisar limites e políticas antes de carregar

### Tema: dentista / clínica odontológica
Títulos candidatos:
- Dentista em Parnamirim
- Clínica Odontológica no Centro
- Agende uma Avaliação
- Clínica São Paulo
- Tire Suas Dúvidas pelo WhatsApp
- Atendimento em Parnamirim, RN
- Conheça as Opções de Tratamento
- Converse com a Nossa Equipe

Descrições candidatas:
- Converse com a Clínica São Paulo, no Centro de Parnamirim, e solicite uma avaliação pelo WhatsApp.
- Entenda as opções de cuidado odontológico e tire suas dúvidas antes de decidir o próximo passo.

### Tema: aparelho ortodôntico
Títulos candidatos:
- Aparelho Ortodôntico em Parnamirim
- Conheça as Opções de Aparelho
- Avaliação Ortodôntica
- Clínica São Paulo em Parnamirim
- Tire Dúvidas pelo WhatsApp

Descrições candidatas:
- Conheça as opções convencional, estética e autoligada. A indicação depende da avaliação odontológica.
- Fale com a Clínica São Paulo, no Centro de Parnamirim, e consulte horários para avaliação.

### Tema: clareamento dental
Títulos candidatos:
- Clareamento Dental em Parnamirim
- Avaliação para Clareamento
- Orientação Odontológica
- Clínica São Paulo
- Consulte pelo WhatsApp

Descrições candidatas:
- A avaliação considera tonalidade, saúde bucal e sensibilidade para orientar as opções adequadas.
- Converse com a Clínica São Paulo, no Centro de Parnamirim, e solicite um horário pelo WhatsApp.

## Teste controlado
1. Exportar anúncios ativos, palavras-chave, termos de pesquisa, destinos e métricas dos últimos 30 dias.
2. Preservar a versão atual como controle e registrar IDs dos anúncios.
3. Validar correspondência entre intenção, texto e página de destino; confirmar políticas e limites atuais do Google Ads.
4. Criar novos anúncios como teste sem pausar o controle, se a estrutura e o orçamento permitirem.
5. Comparar CTR, taxa de conversão e custo por lead qualificado; não declarar vencedor com volume insuficiente.
6. Confirmar que conversões representam leads reais, e não apenas cliques no botão de WhatsApp.

## Diagnóstico da estrutura ativa

A campanha tem quatro grupos de anúncios habilitados no período consultado:

| Grupo | Impressões | Cliques | Custo | Conversões reportadas | Leitura inicial |
|---|---:|---:|---:|---:|---|
| Clínica | 815 | 68 | R$ 124,39 | 6 | Maior volume e principal fonte de conversões no snapshot |
| Hiperlocal | 295 | 18 | R$ 36,87 | 1 | 18 cliques; revisar consultas e correspondência de destino antes de mexer |
| Ortodontia | 87 | 6 | R$ 12,33 | 0 | Volume pequeno; não declarar fracasso nem pausar com essa amostra |
| Serviços | 2 | 0 | R$ 0,00 | 0 | Quase sem entrega no período |

Os **oito anúncios responsivos habilitados** auditados levam à homepage (`https://www.clinicasaopauloparnamirim.com.br/`), inclusive os grupos Ortodontia e Serviços. Esse é o principal desalinhamento consulta → anúncio → landing page encontrado.

| Grupo | ID do anúncio | Impressões | Cliques | Custo | Conversões reportadas |
|---|---:|---:|---:|---:|---:|
| Clínica | 826284999581 | 421 | 36 | R$ 65,04 | 4 |
| Clínica | 826284997430 | 394 | 32 | R$ 59,35 | 2 |
| Hiperlocal | 826285004051 | 175 | 12 | R$ 24,73 | 1 |
| Hiperlocal | 826284987788 | 120 | 6 | R$ 12,14 | 0 |
| Ortodontia | 826285007243 | 34 | 3 | R$ 6,24 | 0 |
| Ortodontia | 826284999779 | 53 | 3 | R$ 6,09 | 0 |
| Serviços | 826284999785 | 0 | 0 | R$ 0,00 | 0 |
| Serviços | 826285007270 | 2 | 0 | R$ 0,00 | 0 |

O anúncio `826284999581` tem CPA aritmético de R$ 16,26 (4 conversões em R$ 65,04) e o `826284997430` de R$ 29,68 (2 em R$ 59,35). A diferença é uma pista, não motivo suficiente para pausar o controle: ambos têm amostras pequenas e devem ser comparados com leads qualificados, não apenas conversões reportadas.

**Risco de clareza local:** os anúncios do grupo Hiperlocal usam os títulos “Dentista em Nova Parnamirim” e “Nova Parnamirim”, enquanto o endereço cadastrado da clínica fica no Centro. Recomenda-se trocar por uma formulação como “Atendimento em Parnamirim” para não sugerir uma unidade física no bairro; nenhuma alteração foi publicada.

Os grupos Ortodontia e Serviços também precisam de destinos coerentes: testar `/aparelho-ortodontico-parnamirim/` para Ortodontia e, para Serviços, dividir por intenção ou direcionar cada anúncio à página específica (clareamento, limpeza, facetas ou restauração). Isso é uma hipótese de melhoria de relevância; não prova, por si só, que a landing page seja a causa do CPA.

### Próxima versão de criativos e destino sugerido
- **Clínica / intenção geral:** testar destino /clinica-odontologica-parnamirim/ contra a homepage, mantendo uma versão controle e medindo leads qualificados.
- **Hiperlocal / dentista por bairro:** testar /dentista-parnamirim/; manter localização, endereço e CTA consistentes com a consulta.
- **Ortodontia:** direcionar o anúncio específico para /aparelho-ortodontico-parnamirim/; a consulta de 30 dias tem apenas 6 cliques, então primeiro acumular amostra suficiente.
- **Serviços:** as palavras-chave de clareamento, limpeza, facetas e restauração têm entrega muito baixa no snapshot. Não concluir falta de demanda sem conferir cobertura de impressões, orçamento, elegibilidade, termos e lances; mapear cada intenção à sua página antes de ampliar.

**Regra de publicação:** criar teste com novos IDs e controle preservado, validar destino/UTM e confirmar que a conversão principal é lead qualificado antes de comparar CTR ou CPA. Nenhuma dessas alterações foi publicada nesta execução.

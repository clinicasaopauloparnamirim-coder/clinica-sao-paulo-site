# Instagram Agent Skill — integração no MarketingGrowth

**Status:** skills importadas em branch isolada; execução integrada e publicação continuam pendentes de validação.

## Objetivo

Disponibilizar as 13 skills do repositório upstream ao cérebro MarketingGrowth sem criar um segundo cérebro, sem duplicar conectores e sem alterar o caminho de Google Ads.

## Componentes e responsabilidades

- **GitHub:** versiona as definições e scripts em `.agents/skills/ig-*/`.
- **MarketingGrowth:** seleciona e carrega a skill relevante como instrução de trabalho.
- **Control Tower:** governa e verifica; não é o executor criativo.
- **Composio:** continua sendo a camada de conectores. As skills não são, por si, ferramentas Composio nem APIs.
- **Cloudflare:** pode hospedar um adaptador HTTP/JS quando implementado e testado; não executa diretamente os scripts Python importados.

## Regra operacional

- Todas as saídas de Instagram são rascunhos até revisão humana.
- Não publicar posts, Stories, comentários, DMs ou alterar configurações da conta automaticamente.
- Não presumir que uma conexão ativa significa que os endpoints Instagram/Meta necessários estejam autorizados ou testados.
- Não alterar Google Ads Search-2.
- Não copiar segredos, tokens, dados de pacientes ou PII para as skills, prompts, commits ou logs.

## Conteúdo importado

As 13 definições `SKILL.md` e seus arquivos auxiliares foram importados do repositório oficial:
https://github.com/Jakeschincariol/instagram-agent-skill

A licença MIT foi preservada em `.agents/skills/instagram-agent/LICENSE`; o template de voz está em `.agents/skills/instagram-agent/templates/voice.md`.

## O que ainda precisa ser comprovado

1. Verificar o diff e os arquivos na branch.
2. Validar sintaxe dos JSON e compilar os scripts Python.
3. Executar os testes locais de `ig-caption`, `ig-human`, `ig-reel` e `ig-viral` em ambiente Python isolado.
4. Integrar o carregamento dessas skills ao runtime efetivo do MarketingGrowth e provar uma chamada de ponta a ponta.
5. Somente depois disso classificar como runtime operacional. Nenhuma publicação real é parte deste teste.

## Referência

- Upstream: https://github.com/Jakeschincariol/instagram-agent-skill
- Branch de integração: `integrate/instagram-agent-skill-20261010`

# Integração Paperclip + Hermes + Control Tower

Estado: **preparada em documentação; integração em execução ainda bloqueada pela ausência de uma instância Paperclip acessível e de um endpoint Hermes Gateway verificável.**

Atualizado: 2026-10-13.

## Decisão de arquitetura

- **Paperclip** será a camada de gestão operacional: organização de agentes, quadro de tarefas, responsáveis, prioridades, aprovações, orçamento e registro dos resultados.
- **Hermes** será um executor gerenciado pelo Paperclip. Preferir `hermes_gateway` quando Hermes rodar no host próprio/Termux e Paperclip em outro host. Usar `hermes_local` apenas quando Paperclip puder chamar o CLI Hermes na mesma máquina.
- **Control Tower** continua sendo o plano de ferramentas e verificação do projeto Clínica São Paulo: GitHub/CI, Cloudflare, auditoria SEO, marketing e atribuição. Hermes acessa capacidades específicas por MCP/HTTP com autenticação; Paperclip não deve duplicar as funções de SEO ou o plano de controle.
- Ações com impacto de produção, finanças, credenciais, contatos de pacientes ou envio de mensagens precisam manter gates de permissão e aprovação. Não guardar chaves em Git, prompts, comentários ou documentação.

## Evidências atuais

- A documentação oficial do Paperclip lista os tipos embutidos `hermes_local` e `hermes_gateway`; não é necessário instalar um plugin de terceiros para o uso comum.
- O repositório desta clínica já registra Hermes como `requires-host-runtime`, pois a execução externa não foi comprovada no runtime da Cloudflare.
- A descoberta de projetos via conexão Vercel retornou zero projetos. A listagem de scripts da Cloudflare encontrou Workers do site/Control Tower, mas nenhum serviço Paperclip.
- Não há URL de instância Paperclip ou URL pública/privada de Hermes Gateway registrada no projeto. Portanto, nenhuma tarefa ou agente foi criada no Paperclip; isso seria falso afirmar neste ponto.

## Configuração alvo — não contém credenciais reais

Ao existir uma instância Paperclip acessível, criar um agente com esta estrutura e preencher os valores somente pela interface segura/secret store:

```json
{
  "name": "Hermes — Executor Control Tower",
  "adapterType": "hermes_gateway",
  "adapterConfig": {
    "apiBaseUrl": "https://HERMES_GATEWAY_HOST",
    "apiKey": {
      "type": "secret_ref",
      "secretId": "hermes-api-key",
      "version": "latest"
    },
    "sessionKeyStrategy": "issue",
    "timeoutSec": 600,
    "paperclipApiUrl": "https://PAPERCLIP_HOST",
    "instructions": "Execute somente tarefas atribuídas. Consulte as ferramentas da Control Tower por conexões autenticadas. Registre evidências e resultados no Paperclip. Não faça mutações de produção, financeiras ou de mensagens sem a aprovação exigida."
  }
}
```

Os campos e os valores de exemplo precisam ser conferidos contra a versão instalada do Paperclip antes da criação do agente. Não publicar este exemplo diretamente como agente ativo.

## Implantação do Paperclip

Paperclip é um servidor persistente, não um script para o Worker Cloudflare. Implantar em host/container compatível com Docker e armazenamento persistente (com PostgreSQL conforme a implantação escolhida). Definir URL HTTPS canônica, autenticação privada, segredo de autenticação forte e política de backups antes de expor a aplicação.

Referência de início: `https://github.com/paperclipai/paperclip` e `https://github.com/paperclipai/paperclip/blob/master/docs/deploy/docker.md`.

## Configuração Hermes Gateway

No host Hermes, ativar o servidor API seguindo a documentação da versão instalada, gerar uma chave única de API e restringir a rede de acesso ao Paperclip. Não publicar o gateway sem autenticação. O servidor gateway não substitui o adaptador: Paperclip precisa usar `hermes_gateway` e a URL base compatível com o gateway configurado.

Referência de adaptador: `https://github.com/paperclipai/paperclip/blob/master/packages/adapters/hermes/README.md`.

## Critérios de aceite — não marcar DONE até passar todos

1. Paperclip responde no URL HTTPS canônico e mantém estado após restart.
2. Hermes Gateway retorna health-check autenticado e o Paperclip consegue iniciar uma execução de teste.
3. Uma tarefa de teste atribuída ao Hermes é executada e seu status, resultado e log aparecem no Paperclip.
4. Hermes consegue chamar apenas uma ferramenta read-only autorizada da Control Tower e devolve evidência citável.
5. Tentativa não autenticada é recusada; credenciais não aparecem nos logs.
6. Regressões, execução duplicada, timeout e retry são testados; orçamento, limites e permissões são definidos.
7. Uma leitura independente confirma o estado final nos dois serviços.

## Bloqueio que falta resolver

É necessário descobrir/definir o endereço do Paperclip e o host/endereço do Hermes Gateway. Nenhuma credencial deve ser enviada em texto aberto no chat. Se Paperclip ainda não existir, escolher um host persistente compatível com Docker antes de iniciar a implantação; não colocar o servidor Paperclip no Worker do site.

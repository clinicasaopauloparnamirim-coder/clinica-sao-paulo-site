# Control Tower — Clínica São Paulo

## Objetivo

Centralizar governança, auditorias, evidências, agentes, integrações e testes do ecossistema digital da Clínica São Paulo sem duplicar o código de produção.

## Operating Loop

**understand → define done → plan → execute → verify → critique → re-verify → report evidence**

Nenhuma mutação é considerada concluída sem leitura/verificação do estado real quando tecnicamente possível.

## Escopo inicial

- Auditoria e registro de repositórios e agentes.
- Evidências verificáveis.
- Integrações MCP e ferramentas externas.
- Testes de agentes em modo read-only antes de qualquer escrita.
- Registro de decisões e mudanças.
- Governança de permissões.

## Guardrails

- Não expor segredos, tokens ou credenciais.
- Não alterar infraestrutura de produção sem escopo explícito.
- Search-2 permanece fora de escopo.
- Não registrar como confirmado aquilo que não possui evidência.
- Itens sem identidade exata devem ser marcados como `unverified`.
- Hermes/Composio são candidatos de infraestrutura; não são considerados instalados ou operacionais sem teste verificável.

## Fonte de verdade

Este repositório continua sendo o repositório de produção do site. A pasta `control-plane/` é a camada de governança e operação; ela não substitui o código do site nem deve receber cópias desnecessárias de outros projetos.

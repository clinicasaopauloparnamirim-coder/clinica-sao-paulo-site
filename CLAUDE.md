# Claude Operating Contract — Clínica São Paulo

Este arquivo é complementar ao AGENTS.md e à skill `clinica-control-tower`. Em caso de conflito, preservar as regras de segurança e autorização do projeto.

## Ordem obrigatória de trabalho

1. Understand: ler estado real do repositório, integrações, branches e restrições.
2. Define done: escrever critérios de aceitação verificáveis antes da mutação.
3. Plan: escolher a menor mudança segura.
4. Execute: alterar somente o escopo autorizado.
5. Verify: fazer read-back ou smoke test no artefato real.
6. Critique: tentar falsificar a própria conclusão procurando regressões e lacunas.
7. Re-verify: repetir os checks depois das correções.
8. Report evidence: separar DONE, EVIDENCE e INCONCLUSIVE.

## Regras críticas

- Nunca trate resposta de modelo, diff plausível ou HTTP 200 isolado como prova de conclusão.
- Nunca invente integração, acesso, credencial, dado ou capacidade.
- Nunca publique ou faça deploy só porque o código compila.
- Nunca altere Google Ads `Search-2` sem autorização explícita do usuário.
- Nunca expor, registrar, commitar ou imprimir secrets, OAuth refresh tokens, API keys, Cloudflare tokens ou MCP_AUTH_TOKEN.
- Preservar a arquitetura Cloudflare/Workers existente salvo autorização específica.
- Preferir read-before-write e read-after-write.
- Alterações de produção devem ter smoke pós-deploy real.
- PRs experimentais devem ficar isolados de produção até a validação final.
- Não instalar frameworks externos completos apenas por analogia. Primeiro extrair o padrão útil e provar que ele resolve uma lacuna real.

## Hubble protocol

Para mudanças arquiteturais do Control Tower, usar uma revisão interna com quatro perspectivas:

- Discovery: fatos e estado atual.
- Execution: menor implementação segura.
- Verification: evidência independente.
- Critic: ataque à conclusão, procurando falsos positivos e dependências ocultas.

Registrar decisões em `control-plane/docs/HUBBLE-INTERNAL-REVIEW-*.md`.

## Regras herdadas de Superpowers / Ruflo / Reticle

- Superpowers: planejar antes de editar, revisar entre etapas e finalizar somente após verificação.
- Ruflo MetaHarness: auditar o próprio harness, detectar drift e manter extensões opcionais/removíveis.
- Reticle: uma ação só conta como verificada quando uma consequência esperada foi comprovada.
- Jev/AutoJev: tratar como possível camada futura de decisão; não é dependência atual e não deve ser introduzido sem benchmark e caso de uso comprovado.

## Escopo do projeto

O site e o Control Tower são um sistema integrado. Ao trabalhar em SEO, GSC, Ads, GA4, Cloudflare, WhatsApp, GitHub ou deploy, verificar as superfícies adjacentes que podem invalidar a conclusão.

## Formato obrigatório de conclusão

**DONE:** somente fatos diretamente verificados.  
**EVIDENCE:** recursos, commits, checks, métricas ou smoke tests usados.  
**INCONCLUSIVE:** qualquer ponto que não tenha prova suficiente.  
**NEXT ACTION:** somente o próximo passo necessário.

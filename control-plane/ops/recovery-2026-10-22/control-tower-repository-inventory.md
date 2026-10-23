# Inventário de repositórios — Control Tower

**Data da coleta:** 2026-10-22

## Resumo
Foram consultados somente os endpoints públicos do GitHub para os 11 alvos solicitados, além das duas buscas alternativas exigidas; 10 alvos têm resposta de repositório acessível e um (`clinicasaopauloparnamirim-coder/open-seo-mcp-skills`) retorna 404. O registro local confirma diretamente a identidade do site de produção, mantém Open-SEO, Ruflo e Superpowers como `candidate`, e marca Hermes como `verified-identity` (não `verified`); os demais alvos não constam do registro. A lista contém 103 branches, predominantemente `fix` (36), e as branches recentes concentram mudanças de Control Tower, Google Ads/OAuth e segurança. O Worker foi documentado apenas a partir de `wrangler.jsonc` e `worker.js`, sem consulta à Cloudflare.

## Repositórios

A tabela tem 14 linhas: os 11 alvos solicitados e três resultados representativos das buscas alternativas (marcados como descoberta de busca), para preservar a evidência de fallback sem atribuir identidade indevida.

| Repositório | Existe | Visibilidade | Branch padrão | Último push | Licença | Arquivado | Descrição | Estado no registro | Estado observado | Evidência |
|---|---|---|---|---|---|---|---|---|---|---|
| `clinicasaopauloparnamirim-coder/clinica-sao-paulo-site` | sim | pública | `main` | 2026-10-22T12:07:39Z | não detectada | não | não informada | `verified`, approved=true | confirmado | `gh api repos/...` retornou `200`; campos da API |
| `every-app/open-seo` | sim | pública | `main` | 2026-10-23T00:44:11Z | MIT | não | Open source alternative to Semrush and Ahrefs | `candidate`, approved=false | existe, mas registro ainda é candidate | endpoint `repos/every-app/open-seo` |
| `clinicasaopauloparnamirim-coder/local-seo-heatmap` | sim | pública | `main` | 2026-10-16T03:53:37Z | não detectada | não | open source, google maps serp checking tool | não listado | encontrado e acessível | endpoint `repos/.../local-seo-heatmap` |
| `seranking/seo-skills` | sim | pública | `main` | 2026-06-25T14:18:13Z | MIT | não | Claude SEO Skills — production Claude Agent Skills for the SE Ranking MCP server. | não listado | encontrado e acessível | endpoint `repos/seranking/seo-skills` |
| `clinicasaopauloparnamirim-coder/open-seo-mcp-skills` | não | — | — | — | — | — | — | não listado | inacessível | resposta exata: `{"message":"Not Found","documentation_url":"https://docs.github.com/rest/repos/repos#get-a-repository","status":"404"}` e `gh: Not Found (HTTP 404)` |
| `NVIDIA/SkillSpector` | sim | pública | `main` | 2026-10-22T16:34:41Z | Apache-2.0 | não | Security scanner for AI agent skills; detects vulnerabilities, malicious patterns, prompt injection, data exfiltration and supply-chain risks. | não listado | encontrado e acessível | endpoint `repos/NVIDIA/SkillSpector` |
| `obra/superpowers` | sim | pública | `main` | 2026-10-22T23:26:42Z | MIT | não | An agentic skills framework & software development methodology that works. | `candidate`, approved=false | existe, mas registro ainda é candidate | endpoint `repos/obra/superpowers` |
| `ruvnet/ruflo` | sim | pública | `main` | 2026-10-23T02:35:16Z | MIT | não | The original agent harness; multi-player swarms, autonomous workflows, memory, federation and vector RAG. | `candidate`, approved=false | existe, mas registro ainda é candidate | endpoint `repos/ruvnet/ruflo` |
| `NousResearch/hermes-agent` | sim | pública | `main` | 2026-10-23T02:25:22Z | MIT | não | The agent that grows with you | `verified-identity`, approved=false | identidade observada; registro não usa literal `verified` e continua não aprovado | endpoint `repos/NousResearch/hermes-agent` |
| `FoundationAgents/[repositório solicitado]` | sim | pública | `main` | 2026-09-30T08:37:25Z | MIT | não | No fortress, purely open ground. Projeto de código aberto. | não listado | encontrado e acessível | endpoint do alvo FoundationAgents |
| `agent0ai/agent-zero` | sim | pública | `main` | 2026-10-22T20:29:21Z | `NOASSERTION` (Other) | não | Agent Zero AI framework | não listado | encontrado e acessível | endpoint `repos/agent0ai/agent-zero` |
| `tylergargula/local-seo-results-heatmap` | sim (busca) | pública | não retornado na busca | 2026-09-18T23:18:53Z | não retornada | não retornado | não retornada | não listado | candidato de busca; não validado por `repos/OWNER/NOME` | `gh search repos local-seo-heatmap --limit 10` |
| `nelsonlondonodev/local-seo-heatmap` | sim (busca) | pública | não retornado na busca | 2026-05-29T10:25:28Z | não retornada | não retornado | Modern SaaS platform for Local SEO tracking with geographic heatmap | não listado | candidato de busca; não validado por endpoint de repo | `gh search repos local-seo-heatmap --limit 10` |
| `Ryze-AI-Adgent/open-seo-mcp-skills` | sim (busca) | pública | não retornado na busca | 2026-10-23T01:48:08Z | não retornada | não retornado | Free SEO MCP server + open-source SEO and GEO skills for Claude | não listado | candidato de busca; não validado por endpoint de repo | `gh search repos open-seo-mcp-skills --limit 10` |

**Divergência principal:** o registro usa `candidate` para quatro identidades que a API confirma como existentes (Open-SEO, Ruflo e Superpowers; Hermes consta como `verified-identity`), portanto existência na API não equivale ao estado aprovado/verified do registro. Para os demais existentes, a API confirma o repositório, mas não há entrada correspondente no registro.

## Branches

Foram analisadas as 103 linhas de `/workspace/cot/branches.txt`. Agrupamento pelo texto antes da primeira `/` (ou “sem prefixo”):

| Grupo | Quantidade |
|---|---:|
| `fix` | 36 |
| sem prefixo | 20 |
| `feat` | 13 |
| `feature` | 9 |
| `audit` | 4 |
| `recovery` | 4 |
| `integration` | 3 |
| `security` | 3 |
| `chore` | 2 |
| `control-tower` | 2 |
| `docs`, `draft`, `gauntlet`, `growth-os`, `hubble`, `integrate`, `test` | 1 cada |

### Branches relevantes
- **Control Tower:** `control-tower/bootstrap`, `control-tower/openmontage-integration`, `control-tower-deploy-2026-09-26`, `control-tower-ga4-hardening-2026-09-26`, `control-tower-prep-2026-09-27`, `feat/control-tower-browser-harness-gauntlet`, `feat/control-tower-gauntlet-core`, `feat/control-tower-gauntlet-unified`, `feature/cloudflare-agent-control-tower`, `feature/control-tower-zernio-codex-2026-09-27`, `feature/google-ads-control-tower`, `feature/9-brains-20-agents-control-tower-crm`, `fix/control-tower-google-sso`, `fix/control-tower-mobile-persistent-session`, `fix/control-tower-security-three-brains-2026-10-12`.
- **NVIDIA:** `feat/brain-09-nvidia-ecosystem`, `feat/brain-09-nvidia-ready`, `feat/nvidia-gauntlet-evidence`, `fix/nvidia-test-reasoning-model-tokens`, `integration/openexecutive-nvidia-gateway`, `security/delete-nvidia-secret-via-secrets-api-2026-10-12`, `security/remove-old-nvidia-secret-binding-2026-10-12`, `recovery/three-brains-openai-nvidia-marketing-2026-10-12`.
- **Google Ads/OAuth:** `feature/google-ads-control-tower`, `feature/google-ads-mutation-control`, `feature/google-ads-mutation-control-v2`, `fix/ads-guard-2026-10-07`, `fix/gemini-ads-policy-guard`, `fix/google-ads-label-case-20261016b`, `fix/google-ads-mobile-oauth`, `fix/googleads-datamanager-oauth-scope`, `security/google-ads-guard-main`, `feature/gemini-composio-ads-bridge`.
- **WhatsApp:** `feat/whatsapp-attribution-p0`, `feature/faq-whatsapp-safe`, `fix/ctwa-attribution-v2`, `fix/ctwa-referral-attribution`, `fix/zaraz-whatsapp-conversion-safe`, `cleanup-ga4-zaraz-workflow-20261015`.
- **SEO:** `aeo-patient-intent-20261014`, `docs/seo-phase-5-6-audit-2026-10-16`, `feat/seo-audit-gauntlet`, `fix/gmn-oauth-callback-seo-aeo-geo-audit-2026-10-16`, `gauntlet/semantic-seo-2026-09-30`, `seo-semantic-quality-gate`, `scope-marketing-claim-validator-2026-10-10`.

### Amostra explícita de datas (15 branches)
Usei `gh api repos/clinicasaopauloparnamirim-coder/clinica-sao-paulo-site/branches/NOME --jq .commit.commit.committer.date`: as 10 mais recentes por data retornada, mais 5 adicionais de segurança/OAuth. (Datas UTC.)

| Data do último commit | Branch |
|---|---|
| 2026-10-22T12:07:38Z | `main` |
| 2026-10-22T12:02:12Z | `fix/gemini-ads-policy-guard` |
| 2026-10-22T11:40:35Z | `feature/gemini-composio-ads-bridge` |
| 2026-10-18T23:18:48Z | `fix/control-tower-google-sso` |
| 2026-10-18T23:17:41Z | `fix/control-tower-mobile-persistent-session` |
| 2026-10-18T22:53:23Z | `feat/confirmed-sale-data-manager` |
| 2026-10-18T21:35:41Z | `fix/verify-data-manager-with-worker-token` |
| 2026-10-18T20:26:16Z | `fix/google-oauth-state-expiry-window` |
| 2026-10-18T20:08:49Z | `fix/google-ads-mobile-oauth` |
| 2026-10-18T17:13:18Z | `fix/ctwa-attribution-v2` |
| 2026-10-18T17:03:54Z | `fix/googleads-datamanager-oauth-scope` |
| 2026-10-16T05:12:46Z | `fix/google-oauth-callback-gmn-2026-10-16` |
| 2026-10-16T04:44:59Z | `fix/gmn-oauth-callback-seo-aeo-geo-audit-2026-10-16` |
| 2026-10-15T04:53:10Z | `fix/ga4-oauth-consent-link-20261015` |
| 2026-10-12T18:55:39Z | `security/delete-nvidia-secret-via-secrets-api-2026-10-12` |

## Bindings do Worker (nomes apenas)

Fonte documental: `/workspace/cot/repo/wrangler.jsonc` e `/workspace/cot/repo/worker.js`. O nome do Worker é **`clinica-sao-paulo-site`**. Bindings nomeados: **`AI`**, **`BROWSER`**, **`ASSETS`**, **`WHATSAPP_LEDGER`**, **`MCP_OBJECT`**, **`CONTROL_AGENT`**, **`GOOGLE_OAUTH_STORE`**. O código de `worker.js` usa `ASSETS`; nenhum valor de variável ou binding é reproduzido aqui.

## Não verificado

- Atualização às 23:42: a API da Cloudflare, lida pelo conector MCP, confirmou o Worker `clinica-sao-paulo-site`, com 100% do tráfego na versão 546 (existe também a 547). Não foi verificada a saúde do Worker em runtime.
- Divergência de configuração: a produção tem bindings que não aparecem no `wrangler.jsonc` do repositório, como `NVIDIA_API_KEY`, `COMPOSIO_API_KEY`, `GOOGLE_CLIENT_SECRET` e `control_tower`. Provavelmente foram configurados pelo painel ou pela API. Isso indica deriva entre código e produção e precisa ser confirmado pelo dono.
- Não foram validados por endpoint individual os repositórios apenas retornados pelas buscas alternativas.
- Não foram consultadas as datas dos commits de todas as 103 branches; a amostra explícita foi de 15.
- “Licença não detectada” significa `license: null` na resposta da API, não uma conclusão jurídica sobre o código.
- Alguns `pushed_at` retornados pela API são posteriores à data declarada da coleta (2026-10-22); foram preservados exatamente como observados.

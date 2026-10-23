# Relatório P0 — NVIDIA/NIM — 2026-10-22

## Estado
**AUTORIZAÇÃO AUSENTE** — não há chave NVIDIA aprovada disponível para inferência. O HEAD atual não contém valor `nvapi-*` em texto simples em `wrangler.jsonc` ou `worker.js`; portanto não foi feita alteração de código nem deploy.

## Testar → Hipotetizar → Branch → Corrigir → Testar → Relatar
- **Branch:** `fix/p0-nvidia-key-removal-2026-10-22`, baseada em `origin/main`, HEAD `d37ff5c`.
- **Inspeção atual:** `wrangler.jsonc` linhas 7–10 contém apenas vars não-NVIDIA; bindings declarados: `AI`, `BROWSER`, `ASSETS` e Durable Objects `WHATSAPP_LEDGER`, `MCP_OBJECT`, `CONTROL_AGENT`, `GOOGLE_OAUTH_STORE`. Não existe binding `N`, `vars.N` ou declaração `secret_text` no arquivo. `worker.js` não contém ocorrência de chave NVIDIA.
- **Histórico afetado:** `6a93b463f5cd5fe871b91054130eb072d9af9f38` (2026-10-12) e `ac9ba9ea74ff109245346ea8fc98e479e52bdfb6` (2026-10-12) introduziram/registraram a remediação do binding NVIDIA inseguro; o histórico contém referências ao formato `nvapi-*`, sem reproduzir valores. O workflow `.github/workflows/control-plane-deploy-v2.yml` contém a lógica de remoção/verificação (linha 57 no HEAD). O histórico do git é tratado como comprometido.
- **Correção:** nenhuma necessária no HEAD atual; não houve commit de correção, push, merge ou deploy. Não foi alterado Worker em produção.

## API Cloudflare (somente leitura)
A chamada `GET https://api.cloudflare.com/client/v4/accounts` falhou com HTTP 403 e erro `9109 Invalid access token`. Por isso não foi possível obter nome/ID da conta, listar Workers, consultar `settings`, `versions` (inclusive confirmar v344), bindings ativos ou listar `secrets`/`secrets_store`. Nenhum token foi impresso.

## Testes
- Busca mascarada em todos os arquivos e no histórico: sem valor de chave no HEAD; referências de código/documentação foram apenas classificadas por caminho/linha.
- Conectividade pública `GET https://integrate.api.nvidia.com/v1/models` sem credencial: **HTTP 200**.
- Inferência NIM: **AUTORIZAÇÃO AUSENTE**; não foi executada chamada autenticada nem usada chave histórica.

## Ações somente do dono
1. Revogar/rotacionar a chave NVIDIA exposta no painel da NVIDIA.
2. Cadastrar a nova chave como segredo do Worker (binding `NVIDIA_API_KEY`, e somente após aprovação configurar a flag de rotação), sem colocar valor no repositório.
3. Aprovar o merge da correção/remediação.

> **chave em histórico do git é considerada comprometida mesmo após remoção do arquivo**.

Caveat: corrigir/revalidar o token Cloudflare e repetir as consultas somente leitura para confirmar versão, bindings e inventário de segredos; não executar deploy durante esta remediação.

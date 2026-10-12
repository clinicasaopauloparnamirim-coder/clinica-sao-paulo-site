# Runtime de agentes — arquitetura consolidada em três cérebros

O runtime tem exatamente três cérebros de responsabilidade:

1. **Control Tower** — orquestração, pesquisa, JEV/Laya/Nemotron, julgamento, Red Team, memória, política e GAUNTLET LOOP.
2. **Marketing Growth** — SEO, Perfil da Empresa, Google Ads, GA4, Search Console, Instagram, WhatsApp, atribuição e CRO.
3. **Engenharia e Segurança** — código, GitHub, Cloudflare Workers, webhooks, segredos, CI/CD, testes e recuperação.

As 21 capacidades e 20 funções autônomas são subfunções desses três cérebros, não cérebros independentes. Os rótulos antigos de nove cérebros são legado documental e não devem ser usados para medir a arquitetura atual.

**Segurança P0:** as chamadas NVIDIA NIM ficam desabilitadas enquanto `NVIDIA_KEY_ROTATED` não for exatamente `true`. A chave potencialmente exposta precisa ser revogada no provedor e substituída antes de habilitar novamente o NIM. O pipeline remove o binding inseguro de texto simples `N` e verifica a remoção antes dos smoke tests.

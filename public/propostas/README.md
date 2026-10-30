# Estúdio de Propostas — Clínica São Paulo

Ferramenta interna para montar propostas de tratamento odontológico com apresentação responsiva, impressão/salvamento em PDF e compartilhamento de resumo pelo WhatsApp.

## Uso
- Abra `/propostas/` no navegador.
- Preencha o nome do paciente, a data e os procedimentos.
- Revise todos os valores e o texto clínico.
- Use **Imprimir / salvar PDF** e escolha “Salvar como PDF”.
- Use **Compartilhar no WhatsApp** para abrir o WhatsApp com um resumo pronto. Anexe o PDF manualmente à conversa.

## Privacidade e limites desta primeira versão
- A ferramenta é client-side: os campos são processados na memória da aba do navegador.
- Não há API, banco de dados, analytics, cookies ou persistência de dados de pacientes nesta versão.
- Ao fechar/recarregar a aba, os dados digitados são perdidos.
- Não insira imagens, exames, diagnósticos ou dados clínicos sensíveis nesta versão.
- O sistema não diagnostica, não recomenda tratamento e não inventa prognóstico. O profissional deve inserir e revisar o plano clínico e os valores.
- Os valores pré-preenchidos nos modelos de ortodontia são apenas referências editáveis; confirme a tabela comercial vigente antes de compartilhar.

## Referência de implementação
A interface foi desenhada de forma independente a partir do fluxo público anunciado pelo Nexo: descrição do caso/orçamento → apresentação compreensível → compartilhamento. Não utiliza código, endpoints privados, credenciais ou dados do Nexo.

## Próximas etapas para produção
1. Habilitar autenticação para equipe da clínica.
2. Adicionar banco de dados com controle de acesso, retenção e trilha de auditoria.
3. Implementar links privados com expiração e revogação.
4. Adicionar rastreamento de abertura com transparência e base legal.
5. Integrar IA somente após provisionar um segredo de API e estabelecer validação clínica humana.
6. Fazer revisão de segurança e LGPD antes de armazenar qualquer dado de saúde.

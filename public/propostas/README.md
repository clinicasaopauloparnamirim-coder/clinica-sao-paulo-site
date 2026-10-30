# Estúdio de Propostas — Clínica São Paulo

Aplicativo interno para montar propostas odontológicas personalizadas, com capa editorial, pré-visualização, impressão em PDF e resumo para WhatsApp.

## Publicação isolada
- Cloudflare Worker: `clinic-proposal-studio`
- Endereço: https://clinic-proposal-studio.clinicasaopauloparnamirim.workers.dev/
- Configuração: `wrangler-proposals.jsonc`
- O Worker é separado do site institucional e do Control Tower.

## Fluxo de uso
1. Informe o nome do paciente e, se necessário, o contato.
2. Registre o objetivo relatado pelo paciente e o resumo do plano explicado pelo dentista.
3. Adicione os procedimentos, detalhes e valores.
4. Informe desconto, entrada, parcelamento e eventuais valores recorrentes.
5. Preencha expressamente o que está incluído e o que não está incluído.
6. Revise validade, condições comerciais, perguntas frequentes e profissional responsável.
7. Use **Imprimir / salvar PDF** para gerar a apresentação ou **Compartilhar resumo** para abrir o WhatsApp.

## Transparência e segurança
- Valores de modelos são apenas referências editáveis. Confirme a tabela vigente antes de entregar.
- A manutenção recorrente é exibida separadamente do total dos itens descritos.
- Alterações de escopo e valores devem ser previamente explicadas e autorizadas.
- Não há garantia de resultado clínico ou de fechamento comercial.
- A proposta não substitui prontuário, contrato específico ou Termo de Consentimento Livre e Esclarecido.
- Os campos são processados na memória da aba: não são enviados a API, banco, cookies ou analytics. Fechar ou atualizar a aba descarta os dados.
- Não inserir exames, imagens ou dados clínicos sensíveis nesta versão.

## Qualidade
A validação interativa foi executada com dados fictícios, incluindo cálculo de procedimentos, desconto, recorrência separada, dados do paciente, escopo e FAQ.

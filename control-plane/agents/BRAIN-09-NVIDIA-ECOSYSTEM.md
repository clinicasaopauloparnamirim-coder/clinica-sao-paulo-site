# NVIDIA Nemotron — capacidade do Control Tower (não é um quarto cérebro)

**Estado de segurança: bloqueado até rotação da chave.**

O NVIDIA NIM/Nemotron é um provedor de análise subordinado ao cérebro Control Tower, não um cérebro independente. A arquitetura oficial permanece em três cérebros: Control Tower, Marketing Growth, e Engenharia e Segurança.

A auditoria anterior encontrou um binding de Worker `N` em texto simples com formato de chave NVIDIA. O pipeline agora remove esse binding; o código não usa Nemotron até `NVIDIA_KEY_ROTATED=true` confirmar que a credencial foi rotacionada. Remover o binding não revoga a chave no fornecedor. **É obrigatório revogar a chave antiga na NVIDIA e criar uma nova antes de marcar a rotação como concluída.**

Depois da rotação, validar uma inferência de teste com resposta, verificar fallback em falha e ler novamente o estado publicado. Nenhum resultado é considerado PASS apenas porque o segredo está configurado.

# Modelo conceitual

Resumo simples das entidades e relacionamentos usados no aplicativo.

| Entidade | Dados principais |
| --- | --- |
| Setor | identificacao, descricao e sigla |
| Cargo | codigo, descricao, salario e ultimo ajuste |
| Funcionario | matricula, nome, sexo, endereco, telefones e nascimento |
| Projeto | identificacao, descricao, orcamento, inicio e tipo |
| Participacao | funcionario, projeto, entrada e saida |
| Tipo de Falha | codigo, descricao e nivel |
| Teste | projeto financeiro, funcionario, data e falhas |
| Dependente | identificacao, nome, nascimento e parentesco |
| Cartao | codigo, ultima progressao e categoria |

## Relacionamentos

- Um setor possui varios funcionarios.
- Um cargo pode ser ocupado por varios funcionarios.
- Um funcionario pode ter um gerente.
- Funcionarios podem participar de varios projetos.
- Projetos podem possuir varios funcionarios.
- Um projeto financeiro possui patrocinador.
- Um projeto administrativo possui verba limite.
- Funcionarios podem testar projetos financeiros.
- Funcionarios efetivos podem possuir dependentes.
- Cada funcionario possui somente um cartao de progressao.

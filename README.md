# Sistema para Fabrica de Software

Aplicativo desenvolvido como projeto da disciplina de React Native.

O sistema tem como objetivo auxiliar no controle das atividades de uma fabrica
de software. Por meio dele, e possivel organizar os funcionarios, setores,
cargos, projetos desenvolvidos e testes realizados.

## Funcionalidades

O aplicativo permite realizar o cadastro, a consulta, a edicao e a exclusao de:

- setores da fabrica;
- cargos e salarios;
- funcionarios;
- projetos financeiros e administrativos;
- participacoes dos funcionarios nos projetos;
- tipos de falhas;
- testes realizados nos projetos financeiros;
- dependentes dos funcionarios efetivos;
- cartoes de progressao funcional.

O sistema tambem apresenta um painel com informacoes gerais e uma area que
mostra os principais relacionamentos existentes entre os dados.

## Regras do sistema

- Cada funcionario pertence a um setor e ocupa um cargo.
- Um funcionario pode possuir um gerente.
- Um projeto financeiro possui um patrocinador.
- Um projeto administrativo possui uma verba limite.
- Um funcionario pode participar de varios projetos.
- Os testes sao realizados somente em projetos financeiros.
- Funcionarios efetivos podem possuir dependentes.
- Cada funcionario possui somente um cartao de progressao funcional.

## Tecnologias utilizadas

- React Native
- Expo
- TypeScript
- AsyncStorage

O AsyncStorage e utilizado para manter os dados cadastrados salvos localmente
no aparelho ou navegador.

## Estrutura do aplicativo

- **Painel:** apresenta um resumo das informacoes cadastradas.
- **Cadastros:** permite gerenciar os registros do sistema.
- **Projetos:** apresenta os projetos e suas equipes.
- **Testes:** apresenta os testes e as falhas encontradas.
- **Modelo:** apresenta os relacionamentos utilizados no sistema.

## Execucao do projeto

```bash
npm install
npm start
```

O aplicativo pode ser executado em um celular utilizando o Expo Go ou no
navegador utilizando a opcao web do Expo.

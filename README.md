# Netlify Visual Editor Next.js + Markdown Files Starter

**ℹ️ Este repositório é baseado no [nosso tutorial de Introdução](https://docs.netlify.com/) em seu estado finalizado.**

Existem duas maneiras de começar a usar este projeto: importando via interface ou desenvolvendo localmente.

## Criando um Projeto Netlify Visual Editor via Interface

Para criar um projeto Netlify Visual Editor baseado em nuvem a partir deste repositório.

Um novo repositório GitHub com este código será criado para você. Você pode transferir a propriedade do repositório duplicado através das Configurações do Projeto.

Uma versão de produção do site no Netlify é provisionada automaticamente.

## Desenvolvendo Localmente

### Clone este repositório

Clone este repositório e execute `npm install` em seu diretório raiz.

### Execute o Site

Execute o servidor de desenvolvimento Next.js:

    npm run dev

Visite [localhost:3000](http://localhost:3000).

### Execute o Netlify Visual Editor no Modo de Desenvolvimento Local

Mantenha o servidor de desenvolvimento Next.js rodando e abra uma nova janela de linha de comando no mesmo diretório.

Instale as ferramentas CLI do Netlify Visual Editor (uma vez):
    
    npm i -g @netlify/visual-editor-cli@latest

Execute o CLI:

    netlify-visual-editor dev

Clique no link exibido para [localhost:8090/_visual-editor](http://localhost:8090/_visual-editor) e o editor visual será aberto.

### Crie um Projeto Netlify Visual Editor Baseado em Nuvem

Para implantar um projeto Netlify Visual Editor baseado em nuvem conectado ao seu repositório:

1. Envie seu código para um repositório GitHub
2. Abra e escolha *Usar meu repositório*.


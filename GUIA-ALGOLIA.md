# Guia de Indexação e Busca com Algolia

Este guia explica como funciona a integração com Algolia para busca de conteúdo no projeto.

## 1. Configuração

### 1.1 Credenciais

Configure suas credenciais do Algolia em um arquivo `.env.local` na raiz do projeto:

```
NEXT_PUBLIC_ALGOLIA_APP_ID=
ALGOLIA_ADMIN_API_KEY=
NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY=
NEXT_PUBLIC_ALGOLIA_INDEX_NAME=mcpx_index
```

A chave de API de administrador (ALGOLIA_ADMIN_API_KEY) deve ser mantida em segredo e usada apenas para indexação. A chave de API de busca (NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY) é pública e pode ser exposta no frontend.

### 1.2 Índices

O projeto utiliza os seguintes índices:
- `development_posts` - Índice para ambiente de desenvolvimento (configuração padrão)
- `production_posts` - Índice para ambiente de produção
- `mcpx_index` - Índice usado para os posts específicos de MCPX

## 2. Indexação de Conteúdo

### 2.1 Scripts de Indexação

O projeto inclui vários scripts para indexação:

- `npm run index-databutton-post` - Indexa apenas o post sobre DataButton
- `npm run index-all-posts` - Indexa todos os posts do diretório `content/pages/Post/`
- `npm run index-algolia` - Script legado para indexação genérica
- `npm run index-content` - Script para indexação de outros conteúdos

### 2.2 Estrutura de Dados

Cada documento indexado no Algolia possui a seguinte estrutura:

```json
{
  "objectID": "post_slug-do-post",
  "post_id": "slug-do-post",
  "post_title": "Título do Post",
  "post_date": 1676332800,
  "post_date_formatted": "14 de fevereiro de 2023",
  "author_name": "Nome do Autor",
  "permalink": "/mcpx/slug-do-post",
  "categories": ["Categoria1", "Categoria2"],
  "time_to_read": 5,
  "content": "Conteúdo completo do post...",
  "excerpt": "Resumo do post",
  "image": "/images/imagem-do-post.svg"
}
```

## 3. Componentes de Busca

### 3.1 Página Principal de Busca

A página principal de busca está em `/mcpx` e utiliza o componente `ContentSearch.jsx`.

### 3.2 Página de Post Individual

A página individual de post está em `/mcpx/[slug]` e é renderizada pelo arquivo `src/pages/mcpx/[slug].jsx`. Esta página busca os dados do post diretamente no Algolia usando o `post_id`.

### 3.3 Como Funciona o Redirecionamento

O fluxo completo funciona da seguinte forma:

1. O usuário acessa a página de busca em `/mcpx`
2. Os resultados são exibidos com links para `/mcpx/[slug]` de cada post
3. Ao clicar em um resultado, o componente dinâmico busca os detalhes do post no Algolia
4. O conteúdo Markdown é renderizado como HTML para exibição

## 4. Personalização da Busca

### 4.1 Configuração do Índice

O índice Algolia é configurado com as seguintes propriedades:

```js
{
  searchableAttributes: [
    'post_title',
    'excerpt',
    'content',
    'author_name',
    'categories'
  ],
  attributesForFaceting: [
    'searchable(categories)',
    'searchable(author_name)'
  ],
  customRanking: ['desc(post_date)']
}
```

### 4.2 Filtros e Facetas

Os usuários podem filtrar os resultados de busca por:
- Categorias
- Autor

## 5. Solução de Problemas

### 5.1 Erros Comuns

- **Post não encontrado**: Verifique se o post foi corretamente indexado no Algolia
- **Erro de credenciais**: Confirme se as variáveis de ambiente estão corretamente configuradas
- **Falha na indexação**: Verifique se a chave de API de admin tem permissões suficientes

### 5.2 Verificação da Indexação

Para verificar se um post foi corretamente indexado:

1. Execute o script de indexação específico
2. Acesse o dashboard do Algolia em https://www.algolia.com/apps/
3. Navegue até o índice correto e verifique se o documento está listado
4. Teste a busca através da interface de busca do Algolia

## 6. Desenvolvimento e Manutenção

### 6.1 Adicionar Novos Campos de Busca

Para adicionar novos campos de busca:

1. Modifique o script de indexação para incluir o novo campo
2. Atualize a configuração do índice para incluir o novo campo em `searchableAttributes`
3. Modifique os componentes de exibição para mostrar o novo campo

### 6.2 Personalizar a Interface de Busca

Para personalizar a interface de busca:

1. Edite o componente `ContentSearch.jsx` para modificar a exibição dos resultados
2. Edite o componente `[slug].jsx` para modificar a exibição do post individual

## 7. Recursos Adicionais

- [Documentação do Algolia](https://www.algolia.com/doc/)
- [React InstantSearch](https://www.algolia.com/doc/guides/building-search-ui/what-is-instantsearch/react/)
- [API Client do Algolia](https://www.algolia.com/doc/api-client/getting-started/install/javascript/) 
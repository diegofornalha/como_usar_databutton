# Sistema de Indexação e Busca com Algolia

Este projeto implementa um sistema de busca avançado usando o [Algolia](https://www.algolia.com/) para indexar e pesquisar conteúdos de posts em Markdown.

## Instruções Rápidas

1. Configure suas credenciais criando um arquivo `.env.local` na raiz do projeto:

```
NEXT_PUBLIC_ALGOLIA_APP_ID=
ALGOLIA_ADMIN_API_KEY=
NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY=b3
```

2. Indexe os conteúdos:

```
npm run index-databutton-post   # Indexa apenas o post do DataButton
npm run index-all-posts         # Indexa todos os posts
```

3. Acesse a interface de busca:

```
http://localhost:3000/mcpx      # Página principal de busca
http://localhost:3000/mcpx/como-funciona-databutton   # Página de post específico
```

## Funcionalidades Implementadas

- ✅ Indexação automática de posts em Markdown
- ✅ Interface de busca com filtros e facetas
- ✅ Página dinâmica para exibição de post individual
- ✅ Marcação de texto nos resultados de busca
- ✅ Formatação de conteúdo Markdown para HTML

## Estrutura do Sistema

### Componentes Principais

- `ContentSearch.jsx`: Componente de busca principal
- `pages/mcpx/[slug].jsx`: Página dinâmica para exibição de post
- `scripts/index-all-posts.js`: Script para indexação de todos os posts
- `scripts/index-databutton-post.js`: Script para indexação do post do DataButton

### Fluxo de Dados

1. **Indexação**: Os scripts leem os arquivos Markdown, extraem os dados e enviam para o Algolia
2. **Busca**: O componente `ContentSearch` utiliza a API do Algolia para buscar conteúdos
3. **Exibição**: Ao clicar em um resultado, o usuário é redirecionado para a página dinâmica que busca os detalhes do post

## Troubleshooting

### A indexação falha com erro de credenciais

Verifique se você configurou corretamente o arquivo `.env.local` com sua chave de API admin do Algolia.

### A página do post não carrega os dados

1. Verifique se o post foi corretamente indexado no Algolia
2. Confira se o servidor Next.js está rodando
3. Certifique-se de que a rota está correta (/mcpx/[slug])

### Os resultados de busca não aparecem

1. Verifique se existem posts indexados no Algolia
2. Confira se as chaves de API estão corretas
3. Verifique o console do navegador para possíveis erros

## Melhorias Futuras

- [ ] Implementar paginação na página de resultados
- [ ] Adicionar destacamento de termos de busca no conteúdo
- [ ] Melhorar o layout responsivo
- [ ] Implementar cache dos resultados
- [ ] Adicionar analytics de busca

## Recursos Adicionais

- [Guia Completo de Indexação](GUIA-ALGOLIA.md)
- [Documentação do Algolia](https://www.algolia.com/doc/)
- [React InstantSearch](https://www.algolia.com/doc/guides/building-search-ui/what-is-instantsearch/react/) 
import algoliasearch from 'algoliasearch/lite';

// Inicializa o cliente Algolia
export const searchClient = algoliasearch(
  '42TZWHW8UP',  // App ID do Algolia
  'd0cb55ec8f07832bc5f57da0bd25c535'  // Chave de API pública do Algolia
);

// Índice principal
export const searchIndex = searchClient.initIndex('movies_index');

// Você pode adicionar mais índices se necessário
export const postsIndex = searchClient.initIndex('development_posts'); 
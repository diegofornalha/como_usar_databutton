import React, { useState } from 'react';
import algoliasearch from 'algoliasearch/lite';
import {
  InstantSearch,
  SearchBox,
  Hits,
  Configure,
  Pagination
} from 'react-instantsearch-dom';
import Link from 'next/link';
import styles from './SearchStyles.module.css'; // Importação correta do CSS Module

// Inicializa o cliente Algolia
const searchClient = algoliasearch(
  '42TZWHW8UP',
  'b32edbeb383fc3d1279658e7c3661843'
);

// Componente para renderizar cada resultado de busca de conteúdo
const ContentHit = ({ hit }) => {
  const [imageError, setImageError] = useState(false);

  // Ajustar a URL da imagem - esta função pode ser adaptada conforme necessário
  const getImageUrl = () => {
    if (imageError || !hit.image) {
      return 'https://via.placeholder.com/300x200?text=Sem+Imagem';
    }
    return hit.image;
  };

  // Formatar data para exibição
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    // Se já for uma string formatada, retornar como está
    if (typeof timestamp === 'string' && timestamp.includes(' ')) {
      return timestamp;
    }
    
    // Converter timestamp para data formatada
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Formatar URL para o post
  const getPostUrl = () => {
    if (!hit.post_id) return '#';
    return `/mcpx/${hit.post_id}`;
  };

  return (
    <div className={`${styles.contentCard} p-4 border rounded-lg shadow-md hover:shadow-lg transition-shadow`}>
      <div className="flex flex-col sm:flex-row gap-4">
        {hit.image && (
          <div className="content-thumbnail flex-shrink-0">
            <Link href={getPostUrl()}>
              <img
                src={getImageUrl()}
                alt={hit.post_title || 'Conteúdo'}
                className="w-full sm:w-24 md:w-32 h-auto object-cover rounded"
                onError={() => setImageError(true)}
              />
            </Link>
          </div>
        )}
        
        <div className="content-details flex-grow">
          <h3 className="text-xl font-bold">
            <Link href={getPostUrl()} className="text-blue-600 hover:underline">
              {hit.post_title}
            </Link>
          </h3>
          
          <div className="post-meta flex flex-wrap items-center mt-2 text-sm text-gray-600">
            {hit.author_image_url && (
              <img 
                src={hit.author_image_url} 
                alt={hit.author_name || 'Autor'} 
                className="w-6 h-6 rounded-full mr-2"
              />
            )}
            {hit.author_name && <span className="mr-3">{hit.author_name}</span>}
            {hit.post_date && <span className="mr-3">{formatDate(hit.post_date)}</span>}
            {hit.time_to_read && <span>{hit.time_to_read} min de leitura</span>}
          </div>
          
          {hit.categories && hit.categories.length > 0 && (
            <div className="categories my-2 flex flex-wrap gap-1">
              {hit.categories.map((category, index) => (
                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {category}
                </span>
              ))}
            </div>
          )}
          
          {hit.excerpt ? (
            <p className="content-excerpt text-sm text-gray-700 line-clamp-3 mt-2">
              {hit.excerpt}
            </p>
          ) : hit.content ? (
            <p className="content-excerpt text-sm text-gray-700 line-clamp-3 mt-2">
              {hit.content.substring(0, 150)}...
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const ContentSearch = () => {
  return (
    <div className={`algolia-instant-search mx-auto px-2 sm:px-4 max-w-7xl ${styles.algoliaStyles}`}>
      <h1 className="text-2xl sm:text-3xl font-bold text-center mb-4 sm:mb-8">Busca de Conteúdos</h1>
      
      <InstantSearch
        searchClient={searchClient}
        indexName="mcpx_index"
      >
        {/* Configuração de busca */}
        <Configure 
          hitsPerPage={10}
          distinct={true}
        />
        
        {/* Barra de pesquisa */}
        <div className={styles.searchBoxContainer}>
          <SearchBox
            className="custom-search-box"
            translations={{
              placeholder: 'Buscar conteúdos...',
              submitTitle: 'Enviar busca',
              resetTitle: 'Limpar busca',
            }}
          />
        </div>
        
        {/* Resultados da pesquisa */}
        <div className="search-results w-full">
          <Hits hitComponent={({ hit }) => <ContentHit hit={hit} />} />
          
          {/* Paginação */}
          <div className="pagination-container mt-8 flex justify-center">
            <Pagination 
              showFirst={true}
              showPrevious={true}
              showNext={true}
              showLast={true}
              padding={1}
              translations={{
                previous: '‹',
                next: '›',
                first: '«',
                last: '»',
                aria: {
                  previous: 'Página anterior',
                  next: 'Próxima página',
                  first: 'Primeira página',
                  last: 'Última página',
                }
              }}
            />
          </div>
        </div>
      </InstantSearch>
    </div>
  );
};

export default ContentSearch; 
import React, { useState } from 'react';
import algoliasearch from 'algoliasearch/lite';
import {
  InstantSearch,
  SearchBox,
  Hits,
  Configure,
  Pagination,
  RefinementList,
  ClearRefinements
} from 'react-instantsearch-dom';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import '../styles/instantsearch.css';

// Inicializa o cliente Algolia
const searchClient = algoliasearch(
  '42TZWHW8UP',
  'b32edbeb383fc3d1279658e7c3661843'
);

// Componente para renderizar cada resultado de busca
const HitComponent = ({ hit }) => {
  const [imageError, setImageError] = useState(false);

  // Função para renderizar as estrelas de avaliação
  const renderRating = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    // Adiciona estrelas cheias
    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={`full-${i}`} className="text-yellow-400" />);
    }
    
    // Adiciona meia estrela se necessário
    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half" className="text-yellow-400" />);
    }
    
    // Adiciona estrelas vazias
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaRegStar key={`empty-${i}`} className="text-yellow-400" />);
    }
    
    return stars;
  };

  // Ajustar a URL da imagem - esta função pode ser adaptada conforme necessário
  const getImageUrl = () => {
    if (imageError || !hit.image) {
      return 'https://via.placeholder.com/300x450?text=Sem+Imagem';
    }
    return hit.image;
  };

  return (
    <div className="movie-card p-4 border rounded-lg shadow-md hover:shadow-lg transition-shadow">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="movie-poster flex-shrink-0">
          <img
            src={getImageUrl()}
            alt={hit.title || 'Filme'}
            className="w-full md:w-32 h-auto object-cover rounded"
            onError={() => setImageError(true)}
          />
        </div>
        
        <div className="movie-details flex-grow">
          <h3 className="text-xl font-bold">
            {hit.title} 
            {hit.year && <span className="ml-2 text-gray-500">({hit.year})</span>}
          </h3>
          
          {hit.rating && (
            <div className="rating flex items-center my-2">
              <div className="flex mr-2">
                {renderRating(hit.rating)}
              </div>
              <span className="text-sm text-gray-600">({hit.rating.toFixed(1)})</span>
            </div>
          )}
          
          {hit.genre && hit.genre.length > 0 && (
            <div className="genres my-2 flex flex-wrap gap-1">
              {hit.genre.map((genre, index) => (
                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {genre}
                </span>
              ))}
            </div>
          )}
          
          {hit.plot && (
            <p className="plot text-sm text-gray-700 line-clamp-3 mt-2">
              {hit.plot}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const AlgoliaInstantSearch = () => {
  return (
    <div className="algolia-instant-search mx-auto px-4 max-w-7xl">
      <h1 className="text-3xl font-bold text-center mb-8">Busca de Filmes</h1>
      
      <InstantSearch
        searchClient={searchClient}
        indexName="movies_index"
      >
        {/* Configuração de busca */}
        <Configure 
          hitsPerPage={10}
          distinct={true}
        />
        
        {/* Barra de pesquisa */}
        <SearchBox
          className="mb-6"
          translations={{
            placeholder: 'Buscar filmes...',
            submitTitle: 'Enviar busca',
            resetTitle: 'Limpar busca',
          }}
        />
        
        <div className="search-container grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Filtros (coluna lateral) */}
          <div className="filters col-span-1">
            <div className="filter-section mb-6">
              <h3 className="text-lg font-semibold mb-2">Filtros</h3>
              <ClearRefinements
                translations={{
                  reset: 'Limpar filtros',
                }}
              />
            </div>
            
            <div className="filter-section mb-6">
              <h4 className="font-medium mb-2">Gêneros</h4>
              <RefinementList
                attribute="genre"
                limit={10}
                showMore={true}
                showMoreLimit={20}
                translations={{
                  showMore: 'Mostrar mais',
                  showLess: 'Mostrar menos',
                }}
              />
            </div>
            
            <div className="filter-section mb-6">
              <h4 className="font-medium mb-2">Ano</h4>
              <RefinementList
                attribute="year"
                limit={10}
                showMore={true}
                showMoreLimit={20}
                translations={{
                  showMore: 'Mostrar mais',
                  showLess: 'Mostrar menos',
                }}
              />
            </div>
          </div>
          
          {/* Resultados da pesquisa */}
          <div className="search-results col-span-1 md:col-span-3">
            <Hits hitComponent={({ hit }) => <HitComponent hit={hit} />} />
            
            {/* Paginação */}
            <div className="pagination-container mt-8 flex justify-center">
              <Pagination 
                showFirst={true}
                showPrevious={true}
                showNext={true}
                showLast={true}
                padding={2}
                translations={{
                  previous: '‹ Anterior',
                  next: 'Próximo ›',
                  first: '« Primeira',
                  last: 'Última »',
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
        </div>
      </InstantSearch>
      
      <style jsx global>{`
        /* Estilos para os componentes do InstantSearch */
        .ais-SearchBox {
          margin-bottom: 1.5rem;
        }
        
        .ais-SearchBox-form {
          display: flex;
          align-items: center;
          border: 1px solid #e2e8f0;
          border-radius: 0.375rem;
          overflow: hidden;
        }
        
        .ais-SearchBox-input {
          flex: 1;
          padding: 0.75rem;
          border: none;
          outline: none;
          font-size: 1rem;
        }
        
        .ais-SearchBox-submit, 
        .ais-SearchBox-reset {
          padding: 0.75rem;
          background: none;
          border: none;
          cursor: pointer;
        }
        
        .ais-Pagination-list {
          display: flex;
          list-style: none;
          padding: 0;
          margin: 0;
          justify-content: center;
        }
        
        .ais-Pagination-item {
          margin: 0 0.25rem;
        }
        
        .ais-Pagination-link {
          display: block;
          padding: 0.5rem 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.25rem;
          color: #4a5568;
          text-decoration: none;
        }
        
        .ais-Pagination-item--selected .ais-Pagination-link {
          background-color: #3182ce;
          border-color: #3182ce;
          color: white;
        }
        
        .ais-Pagination-item--disabled .ais-Pagination-link {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .ais-RefinementList-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .ais-RefinementList-item {
          margin-bottom: 0.5rem;
        }
        
        .ais-RefinementList-label {
          display: flex;
          align-items: center;
        }
        
        .ais-RefinementList-checkbox {
          margin-right: 0.5rem;
        }
        
        .ais-RefinementList-count {
          margin-left: 0.5rem;
          background-color: #e2e8f0;
          padding: 0.125rem 0.375rem;
          border-radius: 9999px;
          font-size: 0.75rem;
        }
        
        .ais-ClearRefinements {
          margin-bottom: 1rem;
        }
        
        .ais-ClearRefinements-button {
          padding: 0.5rem 0.75rem;
          background-color: #f7fafc;
          border: 1px solid #e2e8f0;
          border-radius: 0.25rem;
          font-size: 0.875rem;
          cursor: pointer;
        }
        
        .ais-ClearRefinements-button--disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        /* Utility classes */
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default AlgoliaInstantSearch; 
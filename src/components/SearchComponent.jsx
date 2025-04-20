import React, { useState } from 'react';
import algoliasearch from 'algoliasearch/lite';
import { InstantSearch, SearchBox, Hits, Highlight, Configure } from 'react-instantsearch-dom';
import Link from 'next/link';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';

// Configurar dayjs para português do Brasil
dayjs.locale('pt-br');

// Inicializar cliente Algolia
const searchClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID,
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY
);

// Nome do índice Algolia
const indexName = process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME;

// Componente que renderiza cada resultado de pesquisa
const Hit = ({ hit }) => {
  return (
    <article className="search-result-card">
      <Link href={hit.permalink} passHref>
        <div className="search-result-content">
          {hit.featuredImage && (
            <div className="search-result-image">
              <img 
                src={hit.featuredImage} 
                alt={hit.title}
                className="w-full h-32 object-cover rounded-t"
              />
            </div>
          )}
          
          <div className="search-result-text">
            <h2 className="search-result-title">
              <Highlight attribute="title" hit={hit} tagName="mark" />
            </h2>
            
            <div className="search-result-meta">
              {hit.date && (
                <span className="search-date">
                  {dayjs(hit.date).format('DD [de] MMMM [de] YYYY')}
                </span>
              )}
              {hit.timeToRead && (
                <span className="search-time-to-read">
                  {hit.timeToRead} min de leitura
                </span>
              )}
            </div>
            
            {hit.categories && hit.categories.length > 0 && (
              <div className="search-result-categories">
                {hit.categories.map((category, index) => (
                  <span key={index} className="category-tag">
                    {category}
                  </span>
                ))}
              </div>
            )}
            
            <div className="search-result-excerpt">
              <Highlight attribute="excerpt" hit={hit} tagName="mark" />
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
};

// Componente principal de busca
const SearchComponent = () => {
  const [searchState, setSearchState] = useState({});
  
  return (
    <div className="search-container">
      <InstantSearch
        searchClient={searchClient}
        indexName={indexName}
        searchState={searchState}
        onSearchStateChange={setSearchState}
      >
        <div className="search-panel">
          <SearchBox
            className="searchbox"
            translations={{
              placeholder: 'Buscar conteúdo...',
              submitTitle: 'Enviar sua busca',
              resetTitle: 'Limpar sua busca',
            }}
          />
          
          <Configure hitsPerPage={5} />
          
          <div className="search-results">
            <Hits hitComponent={Hit} />
          </div>
        </div>
      </InstantSearch>
      
      <style jsx global>{`
        .search-container {
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .search-panel {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .searchbox {
          margin-bottom: 20px;
        }
        
        .searchbox form {
          display: flex;
          align-items: center;
        }
        
        .searchbox input {
          width: 100%;
          padding: 12px 16px;
          font-size: 1rem;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }
        
        .search-results {
          margin-top: 20px;
        }
        
        .search-result-card {
          margin-bottom: 20px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .search-result-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .search-result-content {
          display: flex;
          flex-direction: column;
        }
        
        .search-result-text {
          padding: 20px;
        }
        
        .search-result-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1a202c;
          margin-bottom: 10px;
        }
        
        .search-result-meta {
          display: flex;
          gap: 15px;
          font-size: 0.875rem;
          color: #64748b;
          margin-bottom: 10px;
        }
        
        .search-result-categories {
          display: flex;
          gap: 8px;
          margin-bottom: 10px;
        }
        
        .category-tag {
          padding: 4px 8px;
          background-color: #e2e8f0;
          color: #4a5568;
          border-radius: 4px;
          font-size: 0.75rem;
        }
        
        .search-result-excerpt {
          font-size: 0.875rem;
          color: #4a5568;
          line-height: 1.5;
        }
        
        mark {
          background-color: #fef3c7;
          color: inherit;
          padding: 0 2px;
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
};

export default SearchComponent; 
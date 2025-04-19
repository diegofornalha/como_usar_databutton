import React from 'react';
import Head from 'next/head';
import AlgoliaInstantSearch from '../components/AlgoliaInstantSearch';

export default function InstantSearchDemo() {
  return (
    <>
      <Head>
        <title>Demo de Busca com Algolia InstantSearch.js</title>
        <meta name="description" content="Demonstração de busca avançada com Algolia InstantSearch.js" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-2">
          Busca de Filmes com InstantSearch.js
        </h1>
        
        <p className="text-center mb-8 text-gray-600">
          Esta demonstração utiliza os widgets pré-construídos do Algolia InstantSearch.js para criar uma experiência de busca rica e interativa.
        </p>

        <div className="max-w-5xl mx-auto">
          <AlgoliaInstantSearch />
        </div>

        <footer className="mt-12 text-center text-sm text-gray-500">
          <p>
            Dados de filmes indexados no Algolia com o índice 'movies_index'.
            <br />
            Usando o InstantSearch.js para criar componentes de busca interativos.
          </p>
          <p className="mt-2">
            <a 
              href="https://www.algolia.com/doc/guides/building-search-ui/what-is-instantsearch/js/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Saiba mais sobre InstantSearch.js
            </a>
          </p>
        </footer>
      </div>
    </>
  );
} 
import React from 'react';
import Head from 'next/head';
import MovieSearch from '../components/MovieSearch';

export default function DemoAlgolia() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Head>
        <title>Demo de Busca com Algolia</title>
        <meta name="description" content="Demonstração de busca com Algolia" />
      </Head>

      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Demonstração de Busca com Algolia</h1>
        <p className="mb-8 text-gray-600">
          Esta página demonstra como usar o Algolia para criar uma busca avançada em um catálogo de filmes.
          Você pode buscar por título, diretor, atores ou enredo, e filtrar por gênero ou ano.
        </p>
        
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <MovieSearch />
        </div>
        
        <div className="mt-10 text-center text-sm text-gray-500">
          <p>Os dados de filmes foram indexados no Algolia usando algoliasearch.</p>
          <p className="mt-2">
            Saiba mais sobre o Algolia em{' '}
            <a 
              href="https://www.algolia.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              algolia.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
} 
import React from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';

// Importação dinâmica do SearchComponent para evitar erros de SSR
const SearchComponent = dynamic(
  () => import('../../components/SearchComponent'),
  { ssr: false }
);

const MCPXPage = () => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Head>
        <title>Busca de Conteúdo - MCPX</title>
        <meta name="description" content="Busque conteúdos usando Algolia" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      
      <main>
        <h1 className="text-3xl font-bold text-center mb-8">
          Busca de Conteúdo MCPX
        </h1>
        
        <div className="max-w-4xl mx-auto">
          <SearchComponent />
        </div>
      </main>
    </div>
  );
};

export default MCPXPage; 
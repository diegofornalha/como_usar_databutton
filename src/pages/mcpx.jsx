import React from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';

// Importação dinâmica do componente ContentSearch
// Isso evita erros de renderização SSR relacionados ao InstantSearch
const ContentSearch = dynamic(
  () => import('../components/ContentSearch'),
  { ssr: false }
);

const MCPXPage = () => {
  return (
    <div className="container">
      <Head>
        <title>MCPX - Busca de Conteúdos</title>
        <meta name="description" content="Busque conteúdos no MCPX usando Algolia" />
      </Head>
      
      <main className="py-8">
        <ContentSearch />
      </main>
      
      <footer className="py-6 border-t border-gray-200 mt-8">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <p className="text-gray-600">Powered by Algolia</p>
          <a 
            href="https://www.algolia.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center"
          >
            <img 
              src="https://res.cloudinary.com/hilnmyskv/image/upload/v1580296417/logo-algolia-blue-35c5.svg" 
              alt="Algolia Logo" 
              height="24" 
              width="120"
            />
          </a>
        </div>
      </footer>
    </div>
  );
};

export default MCPXPage; 
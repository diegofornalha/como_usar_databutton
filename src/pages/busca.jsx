import React from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';

// Importação dinâmica do componente AlgoliaInstantSearch
// Isso evita erros de renderização SSR relacionados ao InstantSearch
const AlgoliaInstantSearch = dynamic(
  () => import('../components/AlgoliaInstantSearch'),
  { ssr: false }
);

const BuscaPage = () => {
  return (
    <div className="container">
      <Head>
        <title>Busca de Filmes | Databutton Algolia</title>
        <meta name="description" content="Busque filmes usando o Algolia InstantSearch" />
      </Head>
      
      <main>
        <AlgoliaInstantSearch />
      </main>
      
      <footer>
        <p>Powered by Algolia</p>
        <a 
          href="https://www.algolia.com" 
          target="_blank" 
          rel="noopener noreferrer"
        >
          <img 
            src="https://res.cloudinary.com/hilnmyskv/image/upload/v1580296417/logo-algolia-blue-35c5.svg" 
            alt="Algolia Logo" 
            height="24" 
          />
        </a>
      </footer>
      
      <style jsx>{`
        .container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        
        main {
          flex: 1;
          padding: 2rem 0;
        }
        
        footer {
          padding: 1rem 0;
          border-top: 1px solid #eaeaea;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1rem;
        }
      `}</style>
    </div>
  );
};

export default BuscaPage; 
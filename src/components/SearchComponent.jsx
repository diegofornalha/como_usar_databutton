import React, { useState } from 'react';
import { searchIndex } from '../utils/algolia';

const SearchComponent = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!query.trim()) return;
    
    setIsLoading(true);
    
    try {
      // Executa a busca no Algolia
      const { hits } = await searchIndex.search(query);
      setResults(hits);
    } catch (error) {
      console.error('Erro na busca:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="search-container">
      <form onSubmit={handleSearch}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar..."
          className="search-input"
        />
        <button type="submit" className="search-button" disabled={isLoading}>
          {isLoading ? 'Buscando...' : 'Buscar'}
        </button>
      </form>

      {results.length > 0 && (
        <div className="search-results">
          <h2>Resultados:</h2>
          <ul>
            {results.map((item) => (
              <li key={item.objectID}>
                {/* Ajuste conforme a estrutura dos seus dados */}
                <h3>{item.title || item.name}</h3>
                {item.description && <p>{item.description}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchComponent; 
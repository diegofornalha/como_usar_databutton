import React, { useState } from 'react';
import { searchIndex } from '../utils/algolia';

const MovieSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);

  const genres = ["Drama", "Crime", "Ação", "Aventura", "Fantasia", "Biografia", "História", "Faroeste"];
  const years = ["1957", "1966", "1972", "1974", "1993", "1994", "2001", "2003", "2008"];

  const handleSearch = async (e) => {
    e.preventDefault();
    performSearch();
  };

  const performSearch = async () => {
    setIsLoading(true);
    
    try {
      const filters = [];
      
      if (selectedGenres.length > 0) {
        const genreFilter = selectedGenres.map(genre => `genre:"${genre}"`).join(' OR ');
        filters.push(`(${genreFilter})`);
      }
      
      if (selectedYears.length > 0) {
        const yearFilter = selectedYears.map(year => `year:${year}`).join(' OR ');
        filters.push(`(${yearFilter})`);
      }
      
      const filterStr = filters.length > 0 ? filters.join(' AND ') : '';
      
      // Executa a busca no Algolia
      const { hits } = await searchIndex.search(query, {
        filters: filterStr,
        hitsPerPage: 20
      });
      
      setResults(hits);
    } catch (error) {
      console.error('Erro na busca:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleGenre = (genre) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre) 
        : [...prev, genre]
    );
  };

  const toggleYear = (year) => {
    setSelectedYears(prev => 
      prev.includes(year) 
        ? prev.filter(y => y !== year) 
        : [...prev, year]
    );
  };

  // Executa busca quando filtros mudam
  React.useEffect(() => {
    if (selectedGenres.length > 0 || selectedYears.length > 0) {
      performSearch();
    }
  }, [selectedGenres, selectedYears]);

  return (
    <div className="movie-search-container">
      <h2 className="text-2xl font-bold mb-4">Busca de Filmes</h2>
      
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar filmes..."
            className="flex-1 p-2 border border-gray-300 rounded-l"
          />
          <button 
            type="submit" 
            className="bg-blue-600 text-white px-4 py-2 rounded-r"
            disabled={isLoading}
          >
            {isLoading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
      </form>
      
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <h3 className="font-semibold mb-2">Gêneros:</h3>
          <div className="flex flex-wrap gap-2">
            {genres.map(genre => (
              <button
                key={genre}
                onClick={() => toggleGenre(genre)}
                className={`px-3 py-1 text-sm rounded ${
                  selectedGenres.includes(genre) 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <h3 className="font-semibold mb-2">Anos:</h3>
          <div className="flex flex-wrap gap-2">
            {years.map(year => (
              <button
                key={year}
                onClick={() => toggleYear(year)}
                className={`px-3 py-1 text-sm rounded ${
                  selectedYears.includes(year) 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>
      </div>

      {results.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((movie) => (
            <div key={movie.objectID} className="border rounded-lg overflow-hidden shadow-lg">
              {movie.poster && (
                <img 
                  src={movie.poster} 
                  alt={movie.title} 
                  className="w-full h-64 object-cover"
                />
              )}
              <div className="p-4">
                <h3 className="text-xl font-bold">{movie.title}</h3>
                <div className="flex items-center mt-2">
                  <span className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded text-xs font-bold">
                    {movie.rating.toFixed(1)}
                  </span>
                  <span className="text-gray-600 ml-2">
                    {movie.year}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-2">{movie.director}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {movie.genre && movie.genre.map(g => (
                    <span key={g} className="bg-gray-200 px-2 py-0.5 rounded-full text-xs">
                      {g}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-sm line-clamp-3">{movie.plot}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        query && !isLoading && <p className="text-center text-gray-600">Nenhum resultado encontrado</p>
      )}
      
      {!query && !isLoading && results.length === 0 && (
        <p className="text-center text-gray-600">Digite algo para buscar filmes</p>
      )}
      
      {isLoading && (
        <div className="text-center py-4">
          <p>Carregando resultados...</p>
        </div>
      )}
    </div>
  );
};

export default MovieSearch; 
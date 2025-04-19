import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import algoliasearch from 'algoliasearch/lite';
import Head from 'next/head';
import Link from 'next/link';
import { marked } from 'marked';

// Inicializa o cliente Algolia com chave pública (somente leitura)
const searchClient = algoliasearch(
  '42TZWHW8UP',
  'b32edbeb383fc3d1279658e7c3661843'
);

// Índice do Algolia para busca de conteúdos
const contentIndex = searchClient.initIndex('mcpx_index');

export default function PostPage() {
  const router = useRouter();
  const { slug } = router.query;
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Carrega os dados do post quando o slug estiver disponível
    if (slug) {
      setLoading(true);
      
      // Busca o post pelo slug no Algolia
      contentIndex.search('', {
        filters: `post_id:${slug}`,
        hitsPerPage: 1
      })
        .then(({ hits }) => {
          if (hits && hits.length > 0) {
            setPost(hits[0]);
          } else {
            setError('Post não encontrado');
          }
        })
        .catch(err => {
          console.error('Erro ao buscar post:', err);
          setError('Ocorreu um erro ao carregar o conteúdo');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [slug]);

  // Função para renderizar o conteúdo Markdown
  const renderContent = (content) => {
    if (!content) return null;
    
    const htmlContent = marked(content);
    return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-3xl text-center">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4 w-3/4 mx-auto"></div>
          <div className="h-4 bg-gray-200 rounded mb-2.5 w-1/2 mx-auto"></div>
          <div className="h-24 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2.5"></div>
          <div className="h-4 bg-gray-200 rounded mb-2.5"></div>
          <div className="h-4 bg-gray-200 rounded mb-2.5"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-3xl text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Erro</h1>
        <p className="mb-6">{error}</p>
        <Link href="/mcpx" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Voltar para a busca
        </Link>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-3xl text-center">
        <h1 className="text-2xl font-bold mb-4">Post não encontrado</h1>
        <p className="mb-6">O conteúdo que você está procurando não existe ou pode ter sido removido.</p>
        <Link href="/mcpx" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Voltar para a busca
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Head>
        <title>{post.post_title || 'Post'} - MCPX</title>
        <meta name="description" content={post.excerpt || 'Conteúdo MCPX'} />
      </Head>

      <Link href="/mcpx" className="text-blue-500 hover:underline mb-6 inline-block">
        &larr; Voltar para a busca
      </Link>

      <article className="bg-white rounded-lg shadow-md overflow-hidden">
        {post.image && (
          <div className="w-full h-64 relative">
            <img 
              src={post.image} 
              alt={post.post_title} 
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-6">
          <h1 className="text-3xl font-bold mb-4">{post.post_title}</h1>
          
          <div className="post-meta flex items-center mb-6 text-gray-600">
            {post.author_name && (
              <span className="mr-3">{post.author_name}</span>
            )}
            {post.post_date_formatted && (
              <span className="mr-3">{post.post_date_formatted}</span>
            )}
            {post.time_to_read && (
              <span>{post.time_to_read} min de leitura</span>
            )}
          </div>

          {post.categories && post.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {post.categories.map((category, index) => (
                <span 
                  key={index} 
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {category}
                </span>
              ))}
            </div>
          )}

          {post.excerpt && (
            <div className="mb-6 text-lg font-medium text-gray-700 italic">
              {post.excerpt}
            </div>
          )}

          <div className="prose prose-lg max-w-none">
            {renderContent(post.content)}
          </div>
        </div>
      </article>
    </div>
  );
} 
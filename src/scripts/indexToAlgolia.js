// Script para indexar posts no Algolia
import algoliasearch from 'algoliasearch';
import { allContent } from '../utils/local-content';
import { buildIndexName } from '../utils/indexer/consts';

// Configure aqui suas credenciais do Algolia (ou use variáveis de ambiente)
const ALGOLIA_APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || '42TZWHW8UP';
const ALGOLIA_ADMIN_API_KEY = process.env.ALGOLIA_ADMIN_API_KEY || 'SUA_CHAVE_ADMIN';
const indexName = buildIndexName() || 'development_posts';

// Inicializa o cliente Algolia com credenciais de administrador
const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_API_KEY);
const index = client.initIndex(indexName);

async function indexPosts() {
  try {
    console.log(`Iniciando indexação para ${indexName}...`);
    
    // Filtra apenas os posts do conteúdo
    const posts = allContent.filter(item => 
      item.__metadata?.modelName === 'PostLayout' || 
      item.__metadata?.modelType === 'post'
    );
    
    if (posts.length === 0) {
      console.log('Nenhum post encontrado para indexar.');
      return;
    }
    
    // Formata os posts para o Algolia
    const records = posts.map(post => {
      // Extrai e formata as informações relevantes do post
      return {
        objectID: post.__metadata?.id || post.slug,
        title: post.title,
        excerpt: post.excerpt || '',
        date: post.date || '',
        author: post.author?.name || '',
        url: `/conteudo/${post.slug}`, // Ajustado para o novo caminho
        content: post.content || '',
        categories: post.categories || [],
        featuredImage: post.featuredImage?.url || ''
      };
    });
    
    console.log(`Indexando ${records.length} posts...`);
    
    // Envia os registros para o Algolia
    const result = await index.saveObjects(records);
    console.log(`Indexação concluída! ${result.objectIDs.length} objetos indexados.`);
    
    return result;
  } catch (error) {
    console.error('Erro durante a indexação:', error);
    throw error;
  }
}

// Executa a indexação apenas se este arquivo for executado diretamente
if (require.main === module) {
  indexPosts()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
} else {
  // Exporta a função para uso em outros arquivos
  module.exports = { indexPosts };
} 
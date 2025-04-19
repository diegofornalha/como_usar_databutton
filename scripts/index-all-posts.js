// Script para indexar todos os posts do diretório content/pages/Post/
require('dotenv').config();
const algoliasearch = require('algoliasearch');
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const matter = require('front-matter');

// Credenciais do Algolia
const ALGOLIA_APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || '42TZWHW8UP';
const ALGOLIA_ADMIN_API_KEY = process.env.ALGOLIA_ADMIN_API_KEY || '';
const INDEX_NAME = 'mcpx_index';

// Verificar se a API Key está disponível
if (!ALGOLIA_ADMIN_API_KEY) {
  console.error('Erro: ALGOLIA_ADMIN_API_KEY não está definida no .env.local');
  console.error('Para indexar, crie um arquivo .env.local com sua chave de API admin do Algolia');
  process.exit(1);
}

// Inicializar cliente Algolia
const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_API_KEY);
const index = client.initIndex(INDEX_NAME);

// Diretório base dos posts
const postsDir = path.join(process.cwd(), 'content/pages/Post');

// Função para processar e indexar os posts
async function indexAllPosts() {
  try {
    console.log('Iniciando indexação de todos os posts...');
    
    // Buscar todos os arquivos markdown
    const postFiles = glob.sync(`${postsDir}/**/*.md`);
    
    if (postFiles.length === 0) {
      console.log('Nenhum arquivo de post encontrado.');
      return;
    }
    
    console.log(`Encontrados ${postFiles.length} posts para indexar.`);
    
    // Array para armazenar objetos a serem indexados
    const postsToIndex = [];
    
    // Processar cada arquivo
    for (const filePath of postFiles) {
      console.log(`Processando: ${path.basename(filePath)}`);
      
      // Ler o conteúdo do arquivo
      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      // Analisar o front matter e o conteúdo
      const { attributes, body } = matter(fileContent);
      
      // Extrair slug do nome do arquivo se não estiver no frontmatter
      const fileName = path.basename(filePath, '.md');
      const slug = attributes.slug || fileName;
      
      // Extrair data do post e converter para timestamp se necessário
      let postDate;
      if (attributes.date) {
        postDate = new Date(attributes.date).getTime() / 1000;
      } else {
        postDate = Math.floor(Date.now() / 1000);
      }
      
      // Criar objeto para indexação
      const postObject = {
        objectID: `post_${slug}`,
        post_id: slug,
        post_title: attributes.title || path.basename(filePath, '.md'),
        post_date: postDate,
        post_date_formatted: attributes.date 
          ? new Date(attributes.date).toLocaleDateString('pt-BR', {
              year: 'numeric', 
              month: 'long', 
              day: 'numeric'
            })
          : new Date().toLocaleDateString('pt-BR'),
        author_name: attributes.author ? attributes.author.split('/').pop().replace('.json', '') : 'Autor Desconhecido',
        permalink: `/mcpx/${slug}`,
        categories: attributes.tags || [],
        time_to_read: Math.ceil(body.split(' ').length / 200), // Estimativa baseada em 200 palavras por minuto
        content: body.trim(),
        excerpt: attributes.excerpt || '',
        image: attributes.featuredImage?.url || '/images/abstract-feature1.svg'
      };
      
      postsToIndex.push(postObject);
    }
    
    // Indexar posts no Algolia
    if (postsToIndex.length > 0) {
      console.log(`Enviando ${postsToIndex.length} posts para o Algolia...`);
      const result = await index.saveObjects(postsToIndex);
      console.log(`Posts indexados com sucesso! ObjectIDs: ${result.objectIDs.length}`);
    }
    
    console.log('Configurando índice...');
    // Configurar índice para pesquisa
    await index.setSettings({
      searchableAttributes: [
        'post_title',
        'excerpt',
        'content',
        'author_name',
        'categories'
      ],
      attributesForFaceting: [
        'searchable(categories)',
        'searchable(author_name)'
      ],
      customRanking: ['desc(post_date)']
    });
    
    console.log(`Indexação completa! Você pode conferir na busca acessando: http://localhost:3000/mcpx`);
    return postsToIndex.length;
  } catch (error) {
    console.error('Erro ao indexar posts:', error);
    throw error;
  }
}

// Executar indexação
indexAllPosts()
  .then((count) => console.log(`Processo de indexação concluído. ${count} posts indexados.`))
  .catch(error => {
    console.error('Falha no processo de indexação:', error);
    process.exit(1);
  })
  .finally(() => process.exit(0)); 
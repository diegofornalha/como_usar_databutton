// Script para indexar o post "What is a Design System" do arquivo Markdown
require('dotenv').config();
const algoliasearch = require('algoliasearch');
const fs = require('fs');
const path = require('path');
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

// Caminho para o arquivo Markdown
const postPath = path.join(process.cwd(), 'content/pages/Post/what-is-a-design-system.md');

// Função para processar e indexar o post
async function indexDesignSystemPost() {
  try {
    console.log(`Lendo o arquivo: ${postPath}`);
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(postPath)) {
      console.error(`Erro: O arquivo ${postPath} não foi encontrado.`);
      process.exit(1);
    }
    
    // Ler o conteúdo do arquivo
    const fileContent = fs.readFileSync(postPath, 'utf8');
    
    // Analisar o front matter e o conteúdo
    const { attributes, body } = matter(fileContent);
    
    // Extrair a data do post e converter para timestamp se necessário
    let postDate;
    if (attributes.date) {
      postDate = new Date(attributes.date).getTime() / 1000;
    } else {
      postDate = Math.floor(Date.now() / 1000);
    }
    
    // Criar objeto para indexação
    const postObject = {
      objectID: `post_${attributes.slug || 'design-system'}`,
      post_id: attributes.slug || 'design-system',
      post_title: attributes.title || 'What is a Design System',
      post_date: postDate,
      post_date_formatted: attributes.date 
        ? new Date(attributes.date).toLocaleDateString('en-US', {
            year: 'numeric', 
            month: 'long', 
            day: 'numeric'
          })
        : new Date().toLocaleDateString('en-US'),
      author_name: attributes.author ? attributes.author.split('/').pop().replace('.json', '') : 'Design Team',
      permalink: `/blog/${attributes.slug || 'what-is-a-design-system'}`,
      categories: attributes.tags || ["Design", "UI/UX", "Development"],
      time_to_read: Math.ceil(body.split(' ').length / 200), // Estimativa baseada em 200 palavras por minuto
      content: body.trim(),
      excerpt: attributes.excerpt || '',
      image: attributes.featuredImage?.url || '/images/abstract-feature3.svg'
    };
    
    console.log(`Indexando post "${postObject.post_title}" no índice ${INDEX_NAME}...`);
    console.log('Dados processados:', JSON.stringify(postObject, null, 2));
    
    // Enviar para o Algolia
    const result = await index.saveObject(postObject);
    
    console.log(`Post indexado com sucesso! ObjectID: ${result.objectID}`);
    console.log(`Você pode conferir na busca acessando: http://localhost:3000/mcpx`);
    return result;
  } catch (error) {
    console.error('Erro ao indexar o post:', error);
    throw error;
  }
}

// Executar indexação
indexDesignSystemPost()
  .then(() => console.log('Processo de indexação concluído.'))
  .catch(error => {
    console.error('Falha no processo de indexação:', error);
    process.exit(1);
  })
  .finally(() => process.exit(0)); 
// Script para indexar o post "What is a Design System" no Algolia
require('dotenv').config();
const algoliasearch = require('algoliasearch');

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

// Dados do post
const designSystemPost = {
  objectID: 'post_design_system',
  post_id: 8001,
  post_title: "What is a Design System",
  post_date: Math.floor(Date.now() / 1000), // Timestamp atual
  post_date_formatted: new Date().toLocaleDateString('en-US', {
    year: 'numeric', 
    month: 'long', 
    day: 'numeric'
  }),
  author_name: "Design Team",
  author_image_url: "https://secure.gravatar.com/avatar/design123?s=40&d=mm&r=g",
  permalink: "/blog/what-is-design-system",
  categories: ["Design", "UI/UX", "Development"],
  image: "https://example.com/images/design-system-cover.jpg",
  time_to_read: 8,
  content: `A design system is a collection of reusable components, guided by clear standards,
  that can be assembled to build any number of applications. Design systems help teams build
  better products faster by making design reusable, creating a shared language, and reducing 
  design and technical debt. They allow designers and developers to create consistent user
  experiences across different platforms and products.
  
  Key components of a design system include:
  - Design tokens (colors, typography, spacing)
  - UI components and patterns
  - Documentation and usage guidelines
  - Design principles and best practices
  
  Famous examples include Google's Material Design, IBM's Carbon, and Salesforce's Lightning.`
};

// Função para indexar o post
async function indexDesignSystemPost() {
  try {
    console.log(`Indexando post "What is a Design System" no índice ${INDEX_NAME}...`);
    
    // Enviar para o Algolia
    const result = await index.saveObject(designSystemPost);
    
    console.log(`Post indexado com sucesso! ObjectID: ${result.objectID}`);
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
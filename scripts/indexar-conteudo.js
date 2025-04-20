require('dotenv').config();
const algoliasearch = require('algoliasearch');
const fs = require('fs');
const path = require('path');
const matter = require('front-matter');

// Inicializar cliente Algolia
const client = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID,
  process.env.ALGOLIA_ADMIN_API_KEY
);

const indexName = 'development_mcpx_content';
const index = client.initIndex(indexName);

async function indexarConteudo() {
  try {
    // Configurar os atributos pesquisáveis e filtráveis
    await index.setSettings({
      searchableAttributes: [
        'title',
        'content',
        'excerpt',
        'categories'
      ],
      attributesForFaceting: [
        'categories'
      ],
      customRanking: [
        'desc(date)'
      ]
    });

    // Diretório onde estão os arquivos MCPX
    const mcpxDir = path.join(process.cwd(), 'content', 'pages', 'mcpx');
    
    // Array para armazenar os objetos a serem indexados
    const objects = [];

    // Ler arquivos diretamente da pasta mcpx
    const files = fs.readdirSync(mcpxDir);
    
    files.forEach(file => {
      // Ignorar o index.md
      if (file === 'index.md') {
        return;
      }

      const filePath = path.join(mcpxDir, file);
      const stat = fs.statSync(filePath);

      if (!stat.isDirectory() && file.endsWith('.md')) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const { attributes, body } = matter(content);
        
        // Gerar slug a partir do nome do arquivo
        const slug = path.basename(file, '.md');
        
        // Criar permalink no formato correto /mcpx/[slug]
        const permalink = `/mcpx/${slug}`;

        // Criar objeto para indexação
        const object = {
          objectID: `mcpx_${slug}`,
          title: attributes.title || '',
          content: body,
          excerpt: attributes.excerpt || body.substring(0, 160) + '...',
          date: attributes.date ? new Date(attributes.date).getTime() : null,
          categories: attributes.categories || [],
          permalink: permalink,
          featuredImage: attributes.featuredImage?.url || null,
          author: attributes.author || null,
          timeToRead: Math.ceil(body.split(/\s+/).length / 200) // Estimativa de tempo de leitura
        };

        objects.push(object);
      }
    });

    // Indexar os objetos no Algolia
    if (objects.length > 0) {
      const { objectIDs } = await index.saveObjects(objects);
      console.log(`✅ Indexados ${objectIDs.length} documentos no Algolia`);
      console.log('📄 Documentos indexados:');
      objects.forEach(obj => {
        console.log(`- ${obj.title}`);
        console.log(`  URL: ${obj.permalink}`);
        console.log('---');
      });
    } else {
      console.log('⚠️ Nenhum conteúdo encontrado para indexar na pasta mcpx');
    }

  } catch (error) {
    console.error('❌ Erro ao indexar conteúdo:', error);
    console.error('Detalhes do erro:', error.message);
  }
}

// Executar a indexação
indexarConteudo(); 
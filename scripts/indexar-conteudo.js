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

const index = client.initIndex(process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME);

// Diretório base para conteúdo
const CONTENT_BASE_DIR = 'content/pages';

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
        'categories',
        'type'
      ],
      customRanking: [
        'desc(date)'
      ]
    });

    const objects = [];
    const baseDirPath = path.join(process.cwd(), CONTENT_BASE_DIR);

    if (!fs.existsSync(baseDirPath)) {
      console.log(`❌ Diretório base ${CONTENT_BASE_DIR} não encontrado`);
      return;
    }

    // Listar todos os diretórios dentro de pages
    const directories = fs.readdirSync(baseDirPath)
      .filter(item => {
        const itemPath = path.join(baseDirPath, item);
        return fs.statSync(itemPath).isDirectory();
      });

    console.log(`📁 Diretórios encontrados: ${directories.join(', ')}`);

    // Processar cada diretório
    for (const dir of directories) {
      const dirPath = path.join(baseDirPath, dir);
      const files = fs.readdirSync(dirPath);

      files.forEach(file => {
        // Ignorar arquivos index.md
        if (file === 'index.md') {
          return;
        }

        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);

        if (!stat.isDirectory() && file.endsWith('.md')) {
          const content = fs.readFileSync(filePath, 'utf-8');
          const { attributes, body } = matter(content);
          
          // Gerar slug e permalink
          const slug = attributes.slug || path.basename(file, '.md');
          const permalink = `/content/${dir}/${slug}`;

          // Criar objeto para indexação
          const object = {
            objectID: `${dir}_${slug}`,
            title: attributes.title || '',
            content: body,
            excerpt: attributes.excerpt || body.substring(0, 160) + '...',
            date: attributes.date ? new Date(attributes.date).getTime() : null,
            categories: attributes.categories || [],
            type: dir, // Usar o nome do diretório como tipo
            permalink: permalink,
            featuredImage: attributes.featuredImage?.url || attributes.media?.url || null,
            author: attributes.author || null,
            timeToRead: Math.ceil(body.split(/\s+/).length / 200)
          };

          objects.push(object);
        }
      });
    }

    // Indexar os objetos no Algolia
    if (objects.length > 0) {
      const { objectIDs } = await index.saveObjects(objects);
      console.log(`✅ Indexados ${objectIDs.length} documentos no Algolia`);
      console.log('📄 Documentos indexados:');
      objects.forEach(obj => {
        console.log(`- [${obj.type}] ${obj.title}`);
        console.log(`  URL: ${obj.permalink}`);
        console.log('---');
      });
    } else {
      console.log('⚠️ Nenhum conteúdo encontrado para indexar');
    }

  } catch (error) {
    console.error('❌ Erro ao indexar conteúdo:', error);
    console.error('Detalhes do erro:', error.message);
  }
}

// Executar a indexação
indexarConteudo(); 
// Função Netlify para reindexação manual do Algolia
require('dotenv').config();
const algoliasearch = require('algoliasearch');
const fs = require('fs');
const path = require('path');
const matter = require('front-matter');

// Importar a função buildIndexName para garantir consistência com o componente de busca
const { buildIndexName } = require('../../src/utils/indexer/consts');

// Configuração para controle de acesso à função
const WEBHOOK_SECRET = process.env.ALGOLIA_WEBHOOK_SECRET;

// Função principal para indexação do conteúdo
async function indexarConteudo() {
  // Log das variáveis de ambiente (apenas para debug)
  console.log('Variáveis de ambiente:');
  console.log('NEXT_PUBLIC_ALGOLIA_APP_ID:', process.env.NEXT_PUBLIC_ALGOLIA_APP_ID);
  console.log('ALGOLIA_ADMIN_API_KEY:', process.env.ALGOLIA_ADMIN_API_KEY);

  // Verificar se as variáveis de ambiente necessárias estão definidas
  if (!process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || !process.env.ALGOLIA_ADMIN_API_KEY) {
    throw new Error('Variáveis de ambiente do Algolia não encontradas. Defina NEXT_PUBLIC_ALGOLIA_APP_ID e ALGOLIA_ADMIN_API_KEY.');
  }

  // Inicializar cliente Algolia
  const client = algoliasearch(
    process.env.NEXT_PUBLIC_ALGOLIA_APP_ID,
    process.env.ALGOLIA_ADMIN_API_KEY
  );

  // Usar a função buildIndexName 
  const indexName = buildIndexName();
  console.log(`🔍 Usando índice Algolia: ${indexName}`);
  const index = client.initIndex(indexName);

  // Diretório base para conteúdo
  const CONTENT_BASE_DIR = 'content/pages';
  // Diretório específico para artigos
  const MCPX_DIR = 'mcpx';

  try {
    // Configurar os atributos do índice
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

    const objects = [];
    const baseDirPath = path.join(process.cwd(), CONTENT_BASE_DIR);
    const mcpxDirPath = path.join(baseDirPath, MCPX_DIR);

    if (!fs.existsSync(mcpxDirPath)) {
      throw new Error(`Diretório MCPX ${MCPX_DIR} não encontrado em ${CONTENT_BASE_DIR}`);
    }

    console.log(`📁 Indexando artigos do diretório: ${MCPX_DIR}`);

    // Processar os arquivos da pasta mcpx
    const files = fs.readdirSync(mcpxDirPath);
    
    // Implementação de indexação existente
    files.forEach(file => {
      // Ignorar arquivos index.md
      if (file === 'index.md') {
        return;
      }

      const filePath = path.join(mcpxDirPath, file);
      const stat = fs.statSync(filePath);

      if (!stat.isDirectory() && file.endsWith('.md')) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const { attributes, body } = matter(content);
        
        // Gerar slug e permalink
        const slug = attributes.slug || path.basename(file, '.md');
        
        // Usar o caminho sem o prefixo /content/ para mcpx
        const permalink = `/${MCPX_DIR}/${slug}`;

        // Criar objeto para indexação
        const object = {
          objectID: `${MCPX_DIR}_${slug}`,
          title: attributes.title || '',
          content: body,
          excerpt: attributes.excerpt || body.substring(0, 160) + '...',
          date: attributes.date ? new Date(attributes.date).getTime() : null,
          categories: attributes.categories || [],
          permalink: permalink,
          fullPath: permalink,
          featuredImage: attributes.featuredImage?.url || attributes.media?.url || null,
          author: attributes.author || null,
          timeToRead: Math.ceil(body.split(/\s+/).length / 200)
        };

        objects.push(object);
      }
      // Processar subdiretórios
      else if (stat.isDirectory()) {
        const subdir = file;
        const subdirPath = path.join(mcpxDirPath, subdir);
        const subdirFiles = fs.readdirSync(subdirPath);
        
        console.log(`📁 Processando subdiretório: ${subdir}`);
        
        subdirFiles.forEach(subdirFile => {
          if (subdirFile === 'index.md') return;
          
          const subdirFilePath = path.join(subdirPath, subdirFile);
          if (fs.statSync(subdirFilePath).isFile() && subdirFile.endsWith('.md')) {
            const content = fs.readFileSync(subdirFilePath, 'utf-8');
            const { attributes, body } = matter(content);
            
            // Gerar slug e permalink para arquivos em subdiretórios
            const slug = attributes.slug || path.basename(subdirFile, '.md');
            
            // Usar o caminho sem o prefixo /content/ para mcpx
            const permalink = `/${MCPX_DIR}/${subdir}/${slug}`;
            
            const object = {
              objectID: `${MCPX_DIR}_${subdir}_${slug}`,
              title: attributes.title || '',
              content: body,
              excerpt: attributes.excerpt || body.substring(0, 160) + '...',
              date: attributes.date ? new Date(attributes.date).getTime() : null,
              categories: attributes.categories || [],
              permalink: permalink,
              fullPath: permalink,
              subdirectory: subdir,
              featuredImage: attributes.featuredImage?.url || attributes.media?.url || null,
              author: attributes.author || null,
              timeToRead: Math.ceil(body.split(/\s+/).length / 200)
            };
            
            objects.push(object);
          }
        });
      }
    });

    // Indexar os objetos no Algolia
    if (objects.length > 0) {
      const { objectIDs } = await index.saveObjects(objects);
      console.log(`✅ Indexados ${objectIDs.length} documentos no Algolia`);
      
      // Retornar detalhes para logging e debug
      return {
        success: true,
        indexedCount: objectIDs.length,
        indexName: indexName,
        timestamp: new Date().toISOString()
      };
    } else {
      console.log('⚠️ Nenhum conteúdo encontrado para indexar');
      return {
        success: false,
        error: 'Nenhum conteúdo encontrado para indexar',
        timestamp: new Date().toISOString()
      };
    }

  } catch (error) {
    console.error('❌ Erro ao indexar conteúdo:', error);
    console.error('Detalhes do erro:', error.message);
    
    // Retornar erro para logging
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// Função handler para Netlify Function
exports.handler = async (event, context) => {
  // Verificar método HTTP
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método não permitido' })
    };
  }
  
  // Verificar autenticação/autorização
  // Você pode implementar diferentes níveis de verificação:
  // 1. Token simples no header
  // 2. Integração com Netlify Identity
  // 3. Verificação do referer para permitir apenas acesso da interface do Netlify
  
  const authHeader = event.headers.authorization || '';
  if (WEBHOOK_SECRET && (!authHeader.startsWith('Bearer ') || authHeader.replace('Bearer ', '') !== WEBHOOK_SECRET)) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Não autorizado' })
    };
  }
  
  try {
    // Executar a indexação
    console.log('🔄 Iniciando reindexação manual do Algolia...');
    const resultado = await indexarConteudo();
    
    // Registrar resultado da indexação (poderia ser salvo em um arquivo ou banco de dados)
    console.log('✅ Reindexação concluída:', JSON.stringify(resultado));
    
    // Responder com sucesso
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Indexação concluída com sucesso',
        ...resultado
      })
    };
  } catch (error) {
    console.error('❌ Erro na função de reindexação:', error);
    
    // Responder com erro
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Falha na indexação',
        message: error.message || 'Erro desconhecido'
      })
    };
  }
}; 
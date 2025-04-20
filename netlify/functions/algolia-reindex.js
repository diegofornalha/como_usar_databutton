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

// Função para obter todos os IDs de objetos atualmente no Algolia
async function obterIdsObjetosExistentes(index) {
  try {
    console.log('🔍 Obtendo lista de objetos existentes no Algolia...');
    
    const idsExistentes = [];
    
    // Buscar todos os objetos do índice - usando método mais compatível
    let page = 0;
    let hits = [];
    
    do {
      const { hits: resultados, nbPages } = await index.search('', {
        page: page,
        hitsPerPage: 1000, // Obter o máximo de resultados por página
      });
      
      hits = resultados;
      hits.forEach(hit => {
        idsExistentes.push(hit.objectID);
      });
      
      page++;
      
      // Sair do loop quando chegarmos à última página
      if (page >= nbPages) break;
      
    } while (hits.length > 0);
    
    console.log(`✅ Encontrados ${idsExistentes.length} objetos no índice Algolia`);
    return idsExistentes;
  } catch (error) {
    console.error('❌ Erro ao obter objetos existentes:', error.message);
    return [];
  }
}

// Função para identificar objetos a serem removidos (existem no Algolia mas não mais nos arquivos)
function identificarObjetosParaRemover(idsExistentes, idsAtuais) {
  // Filtrar IDs que existem no Algolia mas não estão mais na lista atual
  const idsParaRemover = idsExistentes.filter(id => !idsAtuais.includes(id));
  
  if (idsParaRemover.length > 0) {
    console.log(`🗑️ Encontrados ${idsParaRemover.length} objetos para remover do Algolia`);
  } else {
    console.log('✅ Nenhum objeto para remover do Algolia');
  }
  
  return idsParaRemover;
}

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

    // 1. Obter lista de objetos existentes no Algolia
    const idsExistentes = await obterIdsObjetosExistentes(index);
    
    // 2. Processar arquivos para obter objetos e IDs
    const objects = [];
    const objectIDs = []; // Lista de IDs dos objetos atuais
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

        // Gerar objectID consistente
        const objectID = `${MCPX_DIR}_${slug}`;
        
        // Adicionar à lista de IDs atuais
        objectIDs.push(objectID);

        // Criar objeto para indexação
        const object = {
          objectID,
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
            
            // Gerar objectID consistente
            const objectID = `${MCPX_DIR}_${subdir}_${slug}`;
            
            // Adicionar à lista de IDs atuais
            objectIDs.push(objectID);
            
            const object = {
              objectID,
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

    // 3. Identificar objetos a serem removidos
    const idsParaRemover = identificarObjetosParaRemover(idsExistentes, objectIDs);
    
    // 4. Remover objetos que não existem mais no sistema de arquivos
    if (idsParaRemover.length > 0) {
      console.log(`🗑️ Removendo ${idsParaRemover.length} objetos do Algolia...`);
      await index.deleteObjects(idsParaRemover);
    }

    // 5. Indexar os objetos no Algolia
    if (objects.length > 0) {
      const { objectIDs: addedObjectIDs } = await index.saveObjects(objects);
      console.log(`✅ Indexados ${addedObjectIDs.length} documentos no Algolia`);
      
      // Retornar detalhes para logging e debug
      return {
        success: true,
        indexedCount: addedObjectIDs.length,
        removedCount: idsParaRemover.length,
        indexName: indexName,
        timestamp: new Date().toISOString()
      };
    } else {
      console.log('⚠️ Nenhum conteúdo encontrado para indexar');
      return {
        success: true,
        indexedCount: 0,
        removedCount: idsParaRemover.length,
        message: 'Nenhum conteúdo encontrado para indexar',
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
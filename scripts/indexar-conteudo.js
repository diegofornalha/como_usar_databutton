require('dotenv').config();
const algoliasearch = require('algoliasearch');
const fs = require('fs');
const path = require('path');
const matter = require('front-matter');

// Importar a função buildIndexName para garantir consistência com o componente de busca
const { buildIndexName } = require('../src/utils/indexer/consts');

// Configurações
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

// Log das variáveis de ambiente
console.log('Variáveis de ambiente:');
console.log('NEXT_PUBLIC_ALGOLIA_APP_ID:', process.env.NEXT_PUBLIC_ALGOLIA_APP_ID);
console.log('ALGOLIA_ADMIN_API_KEY:', process.env.ALGOLIA_ADMIN_API_KEY ? '✓ Definida' : '✗ Não definida');

// Inicializar cliente Algolia
const client = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID,
  process.env.ALGOLIA_ADMIN_API_KEY
);

// Usar a função buildIndexName que agora sempre retorna "development_mcpx_content"
const indexName = buildIndexName();
console.log(`🔍 Usando índice Algolia: ${indexName}`);
const index = client.initIndex(indexName);

// Diretório base para conteúdo
const CONTENT_BASE_DIR = 'content/pages';
// Diretório específico para artigos MCPX conforme regra 06
const MCPX_DIR = 'mcpx';

// Função de espera
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Função para obter todos os IDs de objetos atualmente no Algolia
async function obterIdsObjetosExistentes() {
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

// Função para extrair objetos de documentos para indexação
async function extrairObjetosParaIndexacao() {
  const objects = [];
  const objectIDs = []; // Armazenar IDs de objetos extraídos
  const baseDirPath = path.join(process.cwd(), CONTENT_BASE_DIR);
  const mcpxDirPath = path.join(baseDirPath, MCPX_DIR);

  if (!fs.existsSync(mcpxDirPath)) {
    console.log(`❌ Diretório MCPX ${MCPX_DIR} não encontrado em ${CONTENT_BASE_DIR}`);
    return { objects: [], objectIDs: [] };
  }

  console.log(`📁 Lendo artigos do diretório: ${MCPX_DIR}`);

  // Processar apenas os arquivos da pasta mcpx
  const files = fs.readdirSync(mcpxDirPath);

  files.forEach(file => {
    // Ignorar arquivos index.md
    if (file === 'index.md') {
      return;
    }

    const filePath = path.join(mcpxDirPath, file);
    const stat = fs.statSync(filePath);

    if (!stat.isDirectory() && file.endsWith('.md')) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const { attributes, body } = matter(content);
        
        // Gerar slug e permalink
        const slug = attributes.slug || path.basename(file, '.md');
        
        // Usar o caminho sem o prefixo /content/ para mcpx
        const permalink = `/${MCPX_DIR}/${slug}`;

        // Gerar ID único para o objeto
        const objectID = `${MCPX_DIR}_${slug}`;
        
        // Adicionar o ID à lista de IDs ativos
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
        console.log(`📄 Processado: ${file}`);
      } catch (error) {
        console.error(`❌ Erro ao processar arquivo ${file}:`, error.message);
      }
    }
    // Verificar e processar diretórios (subpastas dentro de mcpx)
    else if (stat.isDirectory()) {
      const subdir = file;
      const subdirPath = path.join(mcpxDirPath, subdir);
      const subdirFiles = fs.readdirSync(subdirPath);
      
      console.log(`📁 Processando subdiretório: ${subdir}`);
      
      subdirFiles.forEach(subdirFile => {
        if (subdirFile === 'index.md') return;
        
        const subdirFilePath = path.join(subdirPath, subdirFile);
        try {
          if (fs.statSync(subdirFilePath).isFile() && subdirFile.endsWith('.md')) {
            const content = fs.readFileSync(subdirFilePath, 'utf-8');
            const { attributes, body } = matter(content);
            
            // Gerar slug e permalink para arquivos em subdiretórios
            const slug = attributes.slug || path.basename(subdirFile, '.md');
            
            // Usar o caminho sem o prefixo /content/ para mcpx
            const permalink = `/${MCPX_DIR}/${subdir}/${slug}`;
            
            // Gerar ID único para o objeto
            const objectID = `${MCPX_DIR}_${subdir}_${slug}`;
            
            // Adicionar o ID à lista de IDs ativos
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
            console.log(`📄 Processado: ${subdir}/${subdirFile}`);
          }
        } catch (error) {
          console.error(`❌ Erro ao processar arquivo ${subdir}/${subdirFile}:`, error.message);
        }
      });
    }
  });

  return { objects, objectIDs };
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

// Função para salvar objetos no Algolia com retry
async function salvarNoAlgoliaComRetry(objects) {
  let tentativa = 0;
  let ultimoErro = null;

  while (tentativa < MAX_RETRIES) {
    try {
      tentativa++;
      console.log(`🔄 Tentativa ${tentativa} de indexação no Algolia...`);

      const { objectIDs } = await index.saveObjects(objects);
      
      console.log(`\n✅ Indexados ${objectIDs.length} documentos no Algolia`);
      console.log('📄 Documentos indexados:');
      
      // Imprimir resumo dos documentos indexados
      objects.forEach(obj => {
        console.log(`- ${obj.title}`);
        console.log(`  URL: ${obj.permalink}`);
        console.log(`  Categorias: ${obj.categories.join(', ')}`);
        console.log('---');
      });
      
      return true;
    } catch (error) {
      ultimoErro = error;
      console.error(`❌ Erro na tentativa ${tentativa}:`, error.message);
      
      if (tentativa < MAX_RETRIES) {
        console.log(`⏳ Aguardando ${RETRY_DELAY/1000} segundos antes de tentar novamente...`);
        await sleep(RETRY_DELAY);
      }
    }
  }
  
  // Se chegou aqui, todas as tentativas falharam
  console.error(`❌ Falha após ${MAX_RETRIES} tentativas. Último erro:`, ultimoErro.message);
  return false;
}

// Função para remover objetos do Algolia com retry
async function removerDoAlgoliaComRetry(objectIDs) {
  if (objectIDs.length === 0) return true;
  
  let tentativa = 0;
  let ultimoErro = null;

  while (tentativa < MAX_RETRIES) {
    try {
      tentativa++;
      console.log(`🔄 Tentativa ${tentativa} de remoção no Algolia...`);

      await index.deleteObjects(objectIDs);
      
      console.log(`\n✅ Removidos ${objectIDs.length} documentos do Algolia`);
      console.log('🗑️ IDs removidos:', objectIDs);
      
      return true;
    } catch (error) {
      ultimoErro = error;
      console.error(`❌ Erro na tentativa ${tentativa} de remoção:`, error.message);
      
      if (tentativa < MAX_RETRIES) {
        console.log(`⏳ Aguardando ${RETRY_DELAY/1000} segundos antes de tentar novamente...`);
        await sleep(RETRY_DELAY);
      }
    }
  }
  
  // Se chegou aqui, todas as tentativas falharam
  console.error(`❌ Falha após ${MAX_RETRIES} tentativas de remoção. Último erro:`, ultimoErro.message);
  return false;
}

// Função para salvar registro de indexação (pode ser expandida para salvar em arquivo/BD)
function salvarRegistroDeIndexacao(registro) {
  try {
    const registroDir = path.join(process.cwd(), '.algolia');
    if (!fs.existsSync(registroDir)) {
      fs.mkdirSync(registroDir, { recursive: true });
    }
    
    const registroPath = path.join(registroDir, 'last-index.json');
    fs.writeFileSync(registroPath, JSON.stringify(registro, null, 2));
    console.log(`📝 Registro de indexação salvo em ${registroPath}`);
  } catch (error) {
    console.error('❌ Erro ao salvar registro de indexação:', error.message);
  }
}

// Função principal de indexação
async function indexarConteudo() {
  try {
    // Verificar se as variáveis de ambiente necessárias estão definidas
    if (!process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || !process.env.ALGOLIA_ADMIN_API_KEY) {
      console.warn('⚠️ Variáveis de ambiente do Algolia não encontradas. Pulando indexação.');
      console.warn('Defina NEXT_PUBLIC_ALGOLIA_APP_ID e ALGOLIA_ADMIN_API_KEY para habilitar a indexação.');
      
      // Salvar registro de erro de configuração
      salvarRegistroDeIndexacao({
        success: false,
        error: 'Variáveis de ambiente do Algolia não configuradas',
        timestamp: new Date().toISOString()
      });
      
      return; // Sai da função sem falhar o build
    }

    // Configurar os atributos conforme especificado na regra 06-algolia
    await index.setSettings({
      // Atributos pesquisáveis conforme regra 06
      searchableAttributes: [
        'title',
        'content',
        'excerpt',
        'categories'
      ],
      // Atributos para faceting conforme regra 06
      attributesForFaceting: [
        'categories'
      ],
      // Ordenação personalizada conforme regra 06
      customRanking: [
        'desc(date)'
      ]
    });

    // 1. Obter lista de objetos existentes no Algolia
    const idsExistentes = await obterIdsObjetosExistentes();
    
    // 2. Extrair objetos dos arquivos Markdown
    const { objects, objectIDs } = await extrairObjetosParaIndexacao();
    
    // 3. Identificar objetos a serem removidos
    const idsParaRemover = identificarObjetosParaRemover(idsExistentes, objectIDs);
    
    let sucessoRemocao = true;
    let sucessoIndexacao = true;
    
    // 4. Remover objetos que não existem mais
    if (idsParaRemover.length > 0) {
      sucessoRemocao = await removerDoAlgoliaComRetry(idsParaRemover);
    }

    // 5. Indexar os objetos atuais no Algolia com retry
    if (objects.length > 0) {
      sucessoIndexacao = await salvarNoAlgoliaComRetry(objects);
    } else {
      console.log('⚠️ Nenhum conteúdo encontrado para indexar');
    }
    
    // 6. Salvar registro do processo de sincronização
    salvarRegistroDeIndexacao({
      success: sucessoIndexacao && sucessoRemocao,
      adicionados: objects.length,
      removidos: idsParaRemover.length,
      total: idsExistentes.length - idsParaRemover.length + objects.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao indexar conteúdo:', error);
    console.error('Detalhes do erro:', error.message);
    
    // Salvar registro de erro
    salvarRegistroDeIndexacao({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
    
    // Adicionado: não falha o processo com código de erro
    console.warn('⚠️ A indexação falhou, mas o build continuará. Por favor, verifique os logs e execute a indexação manualmente se necessário.');
  }
}

// Executar a indexação
console.log('🚀 Iniciando processo de indexação no Algolia...');
indexarConteudo(); 
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

// Função para extrair objetos de documentos para indexação
async function extrairObjetosParaIndexacao() {
  const objects = [];
  const baseDirPath = path.join(process.cwd(), CONTENT_BASE_DIR);
  const mcpxDirPath = path.join(baseDirPath, MCPX_DIR);

  if (!fs.existsSync(mcpxDirPath)) {
    console.log(`❌ Diretório MCPX ${MCPX_DIR} não encontrado em ${CONTENT_BASE_DIR}`);
    return [];
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
            console.log(`📄 Processado: ${subdir}/${subdirFile}`);
          }
        } catch (error) {
          console.error(`❌ Erro ao processar arquivo ${subdir}/${subdirFile}:`, error.message);
        }
      });
    }
  });

  return objects;
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
      
      // Salvar registro de indexação bem-sucedida (pode ser usado para verificação posterior)
      salvarRegistroDeIndexacao({
        success: true,
        count: objectIDs.length,
        timestamp: new Date().toISOString()
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
  
  // Salvar registro de falha
  salvarRegistroDeIndexacao({
    success: false,
    error: ultimoErro.message,
    timestamp: new Date().toISOString()
  });
  
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

    // Extrair objetos para indexação
    const objects = await extrairObjetosParaIndexacao();

    // Indexar os objetos no Algolia com retry
    if (objects.length > 0) {
      await salvarNoAlgoliaComRetry(objects);
    } else {
      console.log('⚠️ Nenhum conteúdo encontrado para indexar');
      
      // Salvar registro de nenhum conteúdo
      salvarRegistroDeIndexacao({
        success: true,
        count: 0,
        message: 'Nenhum conteúdo encontrado para indexar',
        timestamp: new Date().toISOString()
      });
    }

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
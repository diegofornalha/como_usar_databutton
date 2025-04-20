// Função Netlify para verificar o status da indexação no Algolia
require('dotenv').config();
const algoliasearch = require('algoliasearch');
const { buildIndexName } = require('../../src/utils/indexer/consts');

// Token de acesso para proteção da API
const WEBHOOK_SECRET = process.env.ALGOLIA_WEBHOOK_SECRET;

// Função para verificar status do índice
async function verificarStatusIndice() {
  try {
    // Verificar se as variáveis de ambiente necessárias estão definidas
    if (!process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || !process.env.ALGOLIA_ADMIN_API_KEY) {
      throw new Error('Variáveis de ambiente do Algolia não encontradas');
    }

    // Inicializar cliente Algolia
    const client = algoliasearch(
      process.env.NEXT_PUBLIC_ALGOLIA_APP_ID,
      process.env.ALGOLIA_ADMIN_API_KEY
    );

    // Obter nome do índice
    const indexName = buildIndexName();
    const index = client.initIndex(indexName);
    
    // Obter estatísticas do índice
    const stats = await index.getStats();
    
    return {
      success: true,
      indexName: indexName,
      stats: {
        numberOfRecords: stats.numberOfRecords,
        dataSize: stats.dataSize,
        lastBuildTimeUtc: stats.lastBuildTimeUTC
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Erro ao verificar índice Algolia:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// Handler da função Netlify
exports.handler = async (event, context) => {
  // Verificar método HTTP
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método não permitido' })
    };
  }
  
  // Verificação de autorização simples
  const authHeader = event.headers.authorization || '';
  if (WEBHOOK_SECRET && (!authHeader.startsWith('Bearer ') || authHeader.replace('Bearer ', '') !== WEBHOOK_SECRET)) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Não autorizado' })
    };
  }
  
  try {
    // Obter status do índice
    const status = await verificarStatusIndice();
    
    // Responder com o status
    return {
      statusCode: 200,
      body: JSON.stringify(status)
    };
  } catch (error) {
    console.error('Erro na função de status:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Falha ao verificar status',
        message: error.message
      })
    };
  }
}; 
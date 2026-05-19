import { getChatClient } from './src/infra/chatwoot/chatwoot.client';
import { logger } from './src/shared/utils/logger';

async function nuclearClear() {
  const client = getChatClient();
  logger.info('☢️ Iniciando limpeza total (resolvendo tudo o que estiver aberto)...');

  try {
    let hasMore = true;
    let total = 0;

    while (hasMore) {
      const conversations = await client.listConversations({ status: 'open' });
      
      if (!conversations || conversations.length === 0) {
        hasMore = false;
        break;
      }

      logger.info(`🧹 Resolvendo lote de ${conversations.length} conversas...`);
      for (const conv of conversations) {
        await client.toggleStatus(conv.id, 'resolved');
        total++;
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    logger.info(`✅ Limpeza concluída! ${total} conversas foram resolvidas.`);
  } catch (error: any) {
    logger.error('❌ Erro na limpeza total:', error.message);
  }
}

nuclearClear();

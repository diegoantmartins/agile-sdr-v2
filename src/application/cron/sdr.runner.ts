// src/application/cron/sdr.runner.ts
// Processa mensagens outbound pendentes (criadas pela IA) e as envia via UAZAPI
// Usa os modelos reais do schema: Message + ActiveLead

import { PrismaClient, SyncStatus } from '@prisma/client';
import { logger } from '../../shared/utils/logger';
import { getUAZAPIClient } from '../../infra/uazapi/uazapi.client';

const prisma = new PrismaClient();

export class SdrRunner {
  /**
   * Varre mensagens outgoing geradas pela IA que ainda não foram enviadas (syncStatus = PENDING)
   * e as dispara via UAZAPI.
   * Deve ser chamado periodicamente (ex.: a cada 5 min via Agenda/cron).
   */
  async processOutboundQueue(): Promise<void> {
    try {
      logger.info('[SdrRunner] Varrendo fila de mensagens pendentes...');

      // Mensagens de saída geradas pela IA que ainda não foram enviadas
      const pending = await prisma.message.findMany({
        where: {
          type: 'outgoing',
          isAiGenerated: true,
          syncStatus: SyncStatus.PENDING
        },
        take: 20, // Respeitando rate limit do WhatsApp
        include: { lead: true },
        orderBy: { createdAt: 'asc' }
      });

      if (pending.length === 0) {
        logger.debug('[SdrRunner] Nenhuma mensagem pendente.');
        return;
      }

      logger.info(`[SdrRunner] ${pending.length} mensagem(ns) para enviar.`);
      const uazapi = getUAZAPIClient();

      for (const msg of pending) {
        try {
          if (!msg.lead) {
            logger.warn(`[SdrRunner] Mensagem ${msg.id} sem lead associado, pulando.`);
            continue;
          }

          await uazapi.sendMessage({
            phone: msg.lead.phone,
            message: msg.content
          });

          await prisma.message.update({
            where: { id: msg.id },
            data: { syncStatus: SyncStatus.SYNCED }
          });

          logger.info(`[SdrRunner] ✅ Mensagem ${msg.id} enviada para ${msg.lead.phone}`);
        } catch (sendError) {
          logger.error(`[SdrRunner] ❌ Erro ao enviar mensagem ${msg.id}:`, sendError);
          await prisma.message.update({
            where: { id: msg.id },
            data: { syncStatus: SyncStatus.FAILED, syncError: String(sendError) }
          });
        }
      }
    } catch (error) {
      logger.error('[SdrRunner] Erro fatal no runner Outbound:', error);
    }
  }
}

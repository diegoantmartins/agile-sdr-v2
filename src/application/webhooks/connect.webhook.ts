// src/application/webhooks/connect.webhook.ts
// Recebe payload do Chatwoot, normaliza e espelha no banco local usando modelos reais do schema

import { PrismaClient } from '@prisma/client';
import { logger } from '../../shared/utils/logger';

const prisma = new PrismaClient();

export class ConnectWebhookService {
  /**
   * Recebe o payload do Chatwoot (Connect), normaliza os dados
   * e espelha no banco local usando os modelos reais:
   *   - contact    → ActiveLead
   *   - chatwootMessage → Message
   *   - event      → GovernanceAudit
   */
  async handleChatwootWebhook(tenantId: string, payload: any): Promise<{ success: boolean; leadId?: string } | undefined> {
    // Filtra apenas eventos de criação de mensagem
    if (payload.event !== 'message_created') {
      logger.debug(`[ConnectWebhook] Evento ignorado: ${payload.event}`);
      return undefined;
    }

    try {
      const { message, conversation, contact } = payload;

      const msgId = String(message?.id || payload.id);
      const content = message?.content || message?.text || payload?.content || '';
      const msgType: 'incoming' | 'outgoing' = message?.message_type === 1 ? 'outgoing' : 'incoming';

      const phone: string | undefined =
        contact?.phone_number || conversation?.meta?.sender?.phone_number;
      const name: string =
        contact?.name || conversation?.meta?.sender?.name || 'Sem nome';

      // 1. Upsert do Lead (substitui Contact)
      let lead = phone
        ? await prisma.activeLead.findFirst({ where: { tenantId, phone: String(phone) } })
        : null;

      if (!lead && phone) {
        lead = await prisma.activeLead.create({
          data: {
            tenantId,
            phone: String(phone),
            name,
            chatwootContactId: contact?.id ? String(contact.id) : undefined,
            chatwootConvId: conversation?.id ? String(conversation.id) : undefined,
            source: 'chatwoot'
          }
        });
        logger.info(`[ConnectWebhook] Lead criado via chatwoot: ${phone}`);
      } else if (lead && contact?.id) {
        // Atualiza metadados do Chatwoot se necessário
        await prisma.activeLead.update({
          where: { id: lead.id },
          data: {
            chatwootContactId: String(contact.id),
            chatwootConvId: conversation?.id ? String(conversation.id) : undefined
          }
        });
      }

      // 2. Persiste a mensagem (substitui ChatwootMessage)
      if (lead) {
        await prisma.message.upsert({
          where: { chatwootMessageId: msgId },
          update: {},
          create: {
            tenantId,
            leadId: lead.id,
            content,
            type: msgType,
            chatwootMessageId: msgId,
            isAiGenerated: false
          }
        }).catch((err: any) => {
          // P2002 = uniqueness violation (duplicata) – seguro ignorar
          if (!(err.code === 'P2002')) throw err;
        });
      }

      // 3. Auditoria (substitui Event)
      await prisma.governanceAudit.create({
        data: {
          tenantId,
          action: 'webhook_chatwoot_mirror',
          actor: 'chatwoot',
          success: true,
          metadata: {
            chatwootMessageId: msgId,
            phone: phone ?? null,
            messageType: msgType
          }
        }
      });

      logger.info(`[ConnectWebhook] ✅ Mensagem ${msgId} espelhada com sucesso.`);
      return { success: true, leadId: lead?.id };
    } catch (error) {
      logger.error('[ConnectWebhook] ❌ Erro ao espelhar webhook:', error);

      // Registra falha na auditoria
      await prisma.governanceAudit.create({
        data: {
          tenantId,
          action: 'webhook_chatwoot_mirror_failed',
          actor: 'chatwoot',
          success: false,
          metadata: { error: String(error) }
        }
      });

      throw error;
    }
  }
}

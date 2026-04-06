import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../shared/logger';
import { prisma } from '../../shared/db';
import { intentDetector } from '../intents/intent-detector';
import { whatsappProvider } from './whatsapp.provider';
import { extractOutgoingMessageData, isOutgoingChatwootEvent } from './chatwoot-webhook';

export class WebhookHandler {
  async handleUazapi(request: FastifyRequest, reply: FastifyReply) {
    const { phone, message, messageId } = request.body as any;
    
    if (!phone || !message) {
      return reply.code(400).send({ error: 'Invalid payload' });
    }

    const logTag = `[Webhook:Uazapi] ${phone}`;
    logger.info({ phone, message }, `${logTag} Received message`);

    try {
      // Find active opportunity for this contact
      const contact = await prisma.contact.findUnique({
        where: { phone: this.normalizePhone(phone) },
        include: {
          opportunities: {
            where: { stage: { in: ['contacted', 'replied'] } },
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      });

      if (!contact || contact.opportunities.length === 0) {
        logger.debug(`${logTag} No active opportunity found, ignoring.`);
        return reply.code(200).send();
      }

      const opportunity = contact.opportunities[0];
      const intent = intentDetector.detect(message);

      logger.info({ intent, opportunityId: opportunity.id }, `${logTag} Intent detected`);

      // Update opportunity
      await prisma.$transaction([
        prisma.opportunity.update({
          where: { id: opportunity.id },
          data: {
            stage: 'replied',
            lastResponseAt: new Date()
          }
        }),
        prisma.message.create({
          data: {
            opportunityId: opportunity.id,
            direction: 'incoming',
            content: message,
            intentDetected: intent,
            rawPayload: request.body as any
          }
        })
      ]);

      // Handle high intent (Handoff to human)
      if (intentDetector.isHighCommercialIntent(intent)) {
        logger.info(`${logTag} High intent detected, triggering handoff.`);
        
        await prisma.opportunity.update({
          where: { id: opportunity.id },
          data: { stage: 'human_handoff', temperature: 'hot' }
        });

        // In a real scenario, we'd need a Conversation ID from Chatwoot/Connect
        // For now, we simulate the logic of posting a note
        if (env.CHATWOOT_URL) {
            // Placeholder: await chatwootService.createPrivateNote(...)
        }
      }

      return reply.code(200).send();
    } catch (error) {
      logger.error({ error, phone }, `${logTag} Failed to handle webhook`);
      return reply.code(500).send();
    }
  }



  async handleChatwoot(request: FastifyRequest, reply: FastifyReply) {
    const payload = request.body as any;

    if (!isOutgoingChatwootEvent(payload)) {
      return reply.code(200).send({ ignored: true });
    }

    const data = extractOutgoingMessageData(payload);
    if (!data) {
      return reply.code(400).send({ error: 'Invalid chatwoot payload' });
    }

    try {
      await whatsappProvider.sendText(data.phone, data.content);
      logger.info({ phone: data.phone }, '[Webhook:Chatwoot] Outgoing message forwarded to UAZAPI');
      return reply.code(200).send({ success: true });
    } catch (error) {
      logger.error({ error }, '[Webhook:Chatwoot] Failed to forward outgoing message');
      return reply.code(500).send({ error: 'Failed to forward message' });
    }
  }

  private normalizePhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (!cleaned.startsWith('55')) return `55${cleaned}`;
    return cleaned;
  }
}

import { env } from '../../config/env';
export const webhookHandler = new WebhookHandler();

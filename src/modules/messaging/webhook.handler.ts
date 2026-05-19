import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../shared/logger';
import { prisma } from '../../shared/db';
import { intentDetector } from '../intents/intent-detector';
import { whatsappProvider } from './whatsapp.provider';
import { extractOutgoingMessageData, isOutgoingChatwootEvent } from './chatwoot-webhook';
import { AgentOrchestrator } from '../../application/orchestrator/agent.orchestrator';
import { chatService } from '../../services/chatwootService';

const agentOrchestrator = new AgentOrchestrator();

export class WebhookHandler {
  async handleUazapi(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as any;
    
    // Debug: log the full body to understand the format
    logger.info({ body: JSON.stringify(body) }, '[Webhook:Uazapi] Raw payload');
    
    // UAZAPI format: body.data.key.remoteJid or body.data.message?.conversation
    // Or real format: body.message.content, body.chat.phone, body.message.senderName
    const phoneRaw = body.phone || 
                     body.chat?.phone?.replace(/\D/g, '') ||  // Remove all non-digits from "+55 46 8828-4253"
                     body.key?.remoteJid?.replace('@s.whatsapp.net', '') || 
                     body.key?.remoteJid?.replace('@g.us', '') || 
                     body.from;
    
    const message = body.message?.conversation || 
                    body.message?.extendedTextMessage?.text || 
                    body.message?.content ||
                    body.message?.text || 
                    body.message ||
                    body.text || 
                    body.data?.message?.conversation || 
                    body.data?.body;
                    
    const messageId = body.messageId || body.message?.messageid || body.key?.id;
    const name = body.pushName || body.notifyName || body.message?.senderName || body.chat?.wa_contactName || body.data?.sender?.pushname;
    
    logger.info({ phoneRaw, message, name }, '[Webhook:Uazapi] Parsed fields');
    
    if (!phoneRaw || !message || typeof message !== 'string') {
      logger.warn({ body: JSON.stringify(body) }, '[Webhook:Uazapi] Invalid payload - no phone or message');
      return reply.code(400).send({ error: 'Invalid payload' });
    }

    const normalizedPhone = this.normalizePhone(phoneRaw);
    const logTag = `[Webhook:Uazapi] ${phoneRaw}`;
    
    // Ignorar mensagens enviadas pelo próprio número (fromMe: true)
    const fromMe = body.message?.fromMe;
    if (fromMe === true) {
      logger.info({ phoneRaw }, `${logTag} Ignoring outbound message from self`);
      return reply.code(200).send({ ignored: true, reason: 'self-sent' });
    }
    
    logger.info({ phone: phoneRaw, message }, `${logTag} Received message`);

    try {
      // Resolve tenant from header or use default
      const tenantId = (request.headers['x-tenant-id'] as string)?.trim() || 'synapsea';
      
      // Try to find existing ActiveLead
      let lead = await prisma.activeLead.findFirst({
        where: { tenantId, phone: normalizedPhone }
      });

      // If no lead exists, create one
      if (!lead) {
        lead = await prisma.activeLead.create({
          data: {
            tenantId,
            phone: normalizedPhone,
            name: name || 'Lead WhatsApp',
            source: 'whatsapp',
            status: 'TRIAGE',
            score: 0
          }
        });
        logger.info({ phone: phoneRaw, leadId: lead.id }, `${logTag} Created new lead`);
      }

      // Save incoming message
      await prisma.message.create({
        data: {
          leadId: lead.id,
          tenantId,
          direction: 'incoming',
          content: message,
          channel: 'whatsapp',
          rawPayload: body
        }
      });

      // Sync incoming message to Chatwoot
      try {
        await chatService.syncMessage({
          phone: normalizedPhone,
          name: lead.name || 'Lead',
          message: message,
          messageType: 'incoming',
          leadId: lead.id
        });
        logger.info(`${logTag} Incoming message synced to Chatwoot`);
      } catch (chatError) {
        logger.error({ error: chatError }, `${logTag} Failed to sync incoming to Chatwoot`);
      }

      // Update lead message count
      await prisma.activeLead.update({
        where: { id: lead.id },
        data: {
          messageCount: { increment: 1 },
          lastMessageAt: new Date()
        }
      });

      // Check if auto-reply is enabled
      const autoReplyEnabled = process.env.AGENT_AUTO_REPLY_ENABLED === 'true';
      logger.info(`${logTag} Auto-reply enabled: ${autoReplyEnabled}`);
      
      if (autoReplyEnabled) {
        logger.info(`${logTag} Processing incoming message...`);
        
        try {
          let response: string | null = null;
          const n8nUrl = process.env.N8N_WEBHOOK_URL;
          
          if (n8nUrl) {
            logger.info(`${logTag} Forwarding to n8n Webhook: ${n8nUrl}`);
            const fetchResponse = await fetch(n8nUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                tenantId,
                phone: normalizedPhone,
                message,
                leadName: lead.name,
                leadStatus: lead.status
              })
            });
            
            if (!fetchResponse.ok) {
              logger.error(`${logTag} n8n webhook returned status ${fetchResponse.status}`);
            } else {
              const responseData = await fetchResponse.json();
              // Try to extract 'reply' or 'output' from JSON, or use it directly if it's a plain string
              response = responseData?.reply || responseData?.output || (typeof responseData === 'string' ? responseData : null);
              logger.info(`${logTag} n8n response received`);
            }
          } else {
            logger.warn(`${logTag} N8N_WEBHOOK_URL missing. Falling back to local AgentOrchestrator.`);
            response = (await agentOrchestrator.processIncomingMessage(
              tenantId,
              normalizedPhone,
              message
            )) || null;
            logger.info(`${logTag} Local Orchestrator response generated`);
          }

          if (response && typeof response === 'string') {
            await this.sendAndSaveResponse(normalizedPhone, response, lead.id, tenantId, lead.name, logTag);
          }
        } catch (orchError) {
          logger.error({ error: orchError }, `${logTag} Orchestrator/n8n error`);
        }
      }

      return reply.code(200).send({ success: true });
    } catch (error) {
      logger.error({ error, phone: phoneRaw }, `${logTag} Failed to handle webhook`);
      return reply.code(500).send();
    }
  }

  private async sendAndSaveResponse(phone: string, response: string, leadId: string, tenantId: string, leadName: string | null, logTag: string) {
    // Send response via WhatsApp
    await whatsappProvider.sendText(phone, response);
    logger.info({ phone, response }, `${logTag} Sent auto-reply`);
    
    // Save outgoing message
    await prisma.message.create({
      data: {
        leadId,
        tenantId,
        direction: 'outgoing',
        content: response,
        channel: 'whatsapp',
        isAiGenerated: true
      }
    });

    // Sync with Chatwoot
    try {
      await chatService.syncMessage({
        phone,
        name: leadName || 'Lead',
        message: response,
        messageType: 'outgoing',
        leadId
      });
      logger.info(`${logTag} Synced to Chatwoot`);
    } catch (chatError) {
      logger.error({ error: chatError }, `${logTag} Failed to sync to Chatwoot`);
    }
  }



  async handleChatwoot(request: FastifyRequest, reply: FastifyReply) {
    const payload = request.body as any;

    if (!isOutgoingChatwootEvent(payload)) {
      return reply.code(200).send({ ignored: true });
    }

    const data = extractOutgoingMessageData(payload);
    if (!data) {
      logger.warn({ payload }, '[Webhook:Chatwoot] Could not extract data from payload');
      return reply.code(400).send({ error: 'Invalid chatwoot payload' });
    }

    try {
      // 1. Forward to WhatsApp (UAZAPI)
      await whatsappProvider.sendText(data.phone, data.content);
      logger.info({ phone: data.phone }, '[Webhook:Chatwoot] Outgoing message forwarded to UAZAPI');

      // 2. Persist in Database for AI Context
      const tenantId = (request.headers['x-tenant-id'] as string)?.trim() || 'synapsea';
      
      const lead = await prisma.activeLead.findFirst({
        where: { tenantId, phone: data.phone }
      });

      if (lead) {
        // Save outgoing message
        await prisma.message.create({
          data: {
            leadId: lead.id,
            tenantId,
            direction: 'outgoing',
            content: data.content,
            channel: 'whatsapp',
            isAiGenerated: false, // It's a human agent
            rawPayload: payload
          }
        });

        // Update lead: Set status to HUMAN_REQUIRED and update timestamp
        // This ensures the AI agent stays silent while a human is interacting
        await prisma.activeLead.update({
          where: { id: lead.id },
          data: {
            status: 'HUMAN_REQUIRED',
            lastMessageAt: new Date(),
            messageCount: { increment: 1 }
          }
        });

        logger.info({ phone: data.phone, leadId: lead.id }, '[Webhook:Chatwoot] Persisted human response and updated lead status');
      } else {
        logger.warn({ phone: data.phone }, '[Webhook:Chatwoot] Lead not found in DB for persistence');
      }

      return reply.code(200).send({ success: true });
    } catch (error: any) {
      logger.error({ error: error.message, phone: data?.phone }, '[Webhook:Chatwoot] Failed to handle outgoing message');
      return reply.code(500).send({ error: 'Failed to process chatwoot webhook' });
    }
  }

  private normalizePhone(phone: string): string {
    if (!phone) return '';
    // Remove +55, spaces, dashes, parentheses
    const cleaned = phone.replace(/\D/g, '');
    if (!cleaned.startsWith('55') && cleaned.length === 11) {
      return `55${cleaned}`;
    }
    return cleaned.startsWith('55') ? cleaned : `55${cleaned}`;
  }
}

import { env } from '../../config/env';
export const webhookHandler = new WebhookHandler();

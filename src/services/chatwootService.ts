// src/services/chatwootService.ts

import { getChatClient } from '../infra/chatwoot/chatwoot.client';
import { logger } from '../shared/utils/logger';
import { env } from '../config/env';

export interface SyncMessagePayload {
  phone: string;
  name?: string;
  message: string;
  messageType?: 'incoming' | 'outgoing';
  leadId?: string;
}

export class ChatwootService {
  private chatClient = getChatClient();

  /**
   * Sincronizar mensagem com Chatwoot
   */
  async syncMessage(payload: SyncMessagePayload): Promise<{
    success: boolean;
    conversationId?: number;
    messageId?: number;
    error?: string;
  }> {
    if (!env.CHATWOOT_ENABLED) {
      logger.info('[ChatwootService] Integração desativada. Ignorando sincronização.');
      return { success: true };
    }

    try {
      const { phone, name, message, messageType = 'incoming', leadId } = payload;
      const { prisma } = await import('../shared/db');

      logger.debug('[ChatwootService] Sincronizando mensagem', { phone, messageType, leadId });

      let contactId: number | undefined;
      let conversationId: number | undefined;

      // 1. Tentar obter IDs do banco de dados primeiro
      if (leadId) {
        const lead = await prisma.activeLead.findUnique({ where: { id: leadId } });
        if (lead?.chatwootContactId) contactId = parseInt(lead.chatwootContactId);
        if (lead?.chatwootConvId) conversationId = parseInt(lead.chatwootConvId);
      }

      // 2. Obter ou criar contato se necessário
      if (!contactId) {
        const contact = await this.chatClient.getOrCreateContact(phone, name);
        contactId = contact.id;
        
        if (leadId) {
          await prisma.activeLead.update({
            where: { id: leadId },
            data: { chatwootContactId: String(contactId) }
          });
        }
      }

      // 3. Obter ou criar conversa se necessário
      if (!conversationId) {
        const conversation = await this.chatClient.getOrCreateConversation(contactId);
        conversationId = conversation.id;

        if (leadId) {
          await prisma.activeLead.update({
            where: { id: leadId },
            data: { chatwootConvId: String(conversationId) }
          });
        }
      }

      // 4. Enviar mensagem
      const messageResponse = await this.chatClient.sendMessage(
        conversationId!,
        message,
        messageType
      );

      logger.info('[ChatwootService] Mensagem sincronizada com sucesso', {
        phone,
        conversationId,
        messageId: messageResponse.id
      });

      return {
        success: true,
        conversationId,
        messageId: messageResponse.id
      };
    } catch (error: any) {
      logger.error('[ChatwootService] Erro ao sincronizar mensagem:', {
        phone: payload.phone,
        error: error.message
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Adicionar etiquetas em uma conversa via telefone
   */
  async addLabels(phone: string, labels: string[]): Promise<boolean> {
    if (!env.CHATWOOT_ENABLED) return true;
    try {
      logger.debug('[ChatwootService] Adicionando etiquetas', { phone, labels });
      
      const contact = await this.chatClient.getOrCreateContact(phone);
      const conversation = await this.chatClient.getOrCreateConversation(contact.id);
      
      await this.chatClient.addLabels(conversation.id, labels);
      return true;
    } catch (error: any) {
      logger.error('[ChatwootService] Erro ao adicionar etiquetas:', { phone, error: error.message });
      return false;
    }
  }

  /**
   * Abrir conversa no Chatwoot (mudar status para 'open')
   */
  async openConversation(phone: string): Promise<boolean> {
    if (!env.CHATWOOT_ENABLED) return true;
    try {
      const contact = await this.chatClient.getOrCreateContact(phone);
      const conversation = await this.chatClient.getOrCreateConversation(contact.id);
      await this.chatClient.toggleStatus(conversation.id, 'open');
      return true;
    } catch (error: any) {
      logger.error('[ChatwootService] Erro ao abrir conversa:', { phone, error: error.message });
      return false;
    }
  }

  /**
   * Atribuir conversa via telefone
   */
  async assignConversation(phone: string, assigneeId?: number, teamId?: number): Promise<boolean> {
    if (!env.CHATWOOT_ENABLED) return true;
    try {
      const contact = await this.chatClient.getOrCreateContact(phone);
      const conversation = await this.chatClient.getOrCreateConversation(contact.id);
      await this.chatClient.assignConversation(conversation.id, assigneeId, teamId);
      return true;
    } catch (error: any) {
      logger.error('[ChatwootService] Erro ao atribuir conversa:', { phone, error: error.message });
      return false;
    }
  }

  /**
   * Adicionar nota privada para a equipe no Chatwoot
   */
  async addPrivateNote(phone: string, content: string): Promise<boolean> {
    if (!env.CHATWOOT_ENABLED) return true;
    try {
      const contact = await this.chatClient.getOrCreateContact(phone);
      const conversation = await this.chatClient.getOrCreateConversation(contact.id);
      await this.chatClient.sendPrivateNote(conversation.id, content);
      return true;
    } catch (error: any) {
      logger.error('[ChatwootService] Erro ao adicionar nota privada:', { phone, error: error.message });
      return false;
    }
  }

  /**
   * Testar conexão com Chatwoot
   */
  async testConnection(): Promise<boolean> {
    if (!env.CHATWOOT_ENABLED) return false;
    try {
      return await this.chatClient.healthCheck();
    } catch (error: any) {
      logger.error('[ChatwootService] Erro ao testar conexão:', error.message);
      return false;
    }
  }

  /**
   * Inicializar etiquetas padrão no Chatwoot
   */
  async initializeDefaultLabels(): Promise<void> {
    const defaultLabels = [
      { title: 'Atendimento Humano 🙋‍♂️', color: '#FF0000' },
      { title: 'Em Análise 💬', color: '#3B82F6' },
      { title: 'Fechado Concorrente 🚫', color: '#9CA3AF' },
      { title: 'Sem Frente de Trabalho ⏳', color: '#FCD34D' },
      { title: 'Licitação Perdida 📉', color: '#64748B' },
      { title: 'Triagem 📋', color: '#10B981' },
      { title: 'Oportunidade Real 💰', color: '#10B981' },
      { title: 'Pivotagem Necessária 🔄', color: '#8B5CF6' },
      { title: 'atendimento-humano', color: '#FF0000' },
      { title: 'urgente', color: '#FF0000' }
    ];

    logger.info('[ChatwootService] Inicializando etiquetas padrão...');
    
    for (const label of defaultLabels) {
      try {
        await this.chatClient.createAccountLabel(label.title, label.color);
      } catch (err) {
        // Ignorar erros individuais
      }
    }
    
    logger.info('[ChatwootService] Etiquetas inicializadas.');
  }
}

export const chatService = new ChatwootService();

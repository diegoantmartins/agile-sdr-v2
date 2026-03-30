import axios, { AxiosInstance } from 'axios';
import { env } from '../../config/env';
import { logger } from '../../shared/logger';

export class ChatwootService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: env.CHATWOOT_URL,
      headers: {
        'api_access_token': env.CHATWOOT_API_TOKEN,
        'Content-Type': 'application/json',
      },
    });
  }

  async createPrivateNote(conversationId: string, content: string) {
    try {
      await this.client.post(
        `/api/v1/accounts/${env.CHATWOOT_ACCOUNT_ID}/conversations/${conversationId}/messages`,
        {
          content,
          message_type: 'outgoing', // In some versions notes are 'outgoing' with private=true
          private: true,
        }
      );
      logger.info({ conversationId }, '[Chatwoot] Private note created');
    } catch (error) {
      logger.error({ error, conversationId }, '[Chatwoot] Failed to create private note');
    }
  }

  async findOrCreateContact(name: string, phone: string) {
    // Basic implementation for handoff
    try {
      const response = await this.client.post(
        `/api/v1/accounts/${env.CHATWOOT_ACCOUNT_ID}/contacts`,
        { name, phone_number: phone }
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 422) {
         // Contact might already exist
         return null; 
      }
      throw error;
    }
  }
}

export const chatwootService = new ChatwootService();

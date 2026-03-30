import axios, { AxiosInstance } from 'axios';
import { env } from '../../config/env';
import { logger } from '../../shared/logger';

export interface WhatsAppProvider {
  sendText(phone: string, content: string): Promise<void>;
}

export class UazapiProvider implements WhatsAppProvider {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: env.UAZAPI_URL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.UAZAPI_KEY}`
      }
    });
  }

  async sendText(phone: string, content: string): Promise<void> {
    const normalizedPhone = this.normalizePhone(phone);
    
    try {
      logger.info({ phone: normalizedPhone }, '[WhatsApp] Sending message');
      
      const response = await this.client.post('/send-message', {
        phone: normalizedPhone,
        message: content
      });

      if (response.status !== 200 && response.status !== 201) {
        throw new Error(`Uazapi responded with status ${response.status}`);
      }

      logger.info({ phone: normalizedPhone, messageId: response.data?.messageId }, '[WhatsApp] Message sent');
    } catch (error) {
      logger.error({ error, phone: normalizedPhone }, '[WhatsApp] Failed to send message');
      throw error;
    }
  }

  private normalizePhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (!cleaned.startsWith('55')) {
      return `55${cleaned}`;
    }
    return cleaned;
  }
}

export const whatsappProvider = new UazapiProvider();

import { describe, expect, it } from 'vitest';
import { extractOutgoingMessageData, isOutgoingChatwootEvent } from '../../src/modules/messaging/chatwoot-webhook';

describe('chatwoot webhook mapper', () => {
  it('reconhece mensagem outgoing com message_type numérico', () => {
    expect(isOutgoingChatwootEvent({ event: 'message_created', message_type: 1 })).toBe(true);
  });

  it('ignora eventos que não são message_created', () => {
    expect(isOutgoingChatwootEvent({ event: 'conversation_created', message_type: 'outgoing' })).toBe(false);
  });

  it('extrai phone/content de payload padrão do Chatwoot', () => {
    const data = extractOutgoingMessageData({
      content: 'Olá! Podemos falar agora?',
      conversation: {
        contact_inbox: {
          source_id: '(11) 99999-0000'
        }
      }
    });

    expect(data).toEqual({
      phone: '5511999990000',
      content: 'Olá! Podemos falar agora?'
    });
  });

  it('retorna null quando faltar telefone ou conteúdo', () => {
    expect(extractOutgoingMessageData({ content: 'oi' })).toBeNull();
    expect(extractOutgoingMessageData({ contact: { phone_number: '5511999' } })).toBeNull();
  });
});

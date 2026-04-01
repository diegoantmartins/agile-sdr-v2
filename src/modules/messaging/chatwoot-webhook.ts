export interface OutgoingMessageData {
  phone: string;
  content: string;
}

function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (!cleaned.startsWith('55')) return `55${cleaned}`;
  return cleaned;
}

function readMessageType(payload: any): string {
  const raw = payload?.message_type ?? payload?.message?.message_type;

  if (typeof raw === 'number') {
    return raw === 1 ? 'outgoing' : raw === 0 ? 'incoming' : String(raw);
  }

  return String(raw || '').toLowerCase();
}

export function isOutgoingChatwootEvent(payload: any): boolean {
  const event = String(payload?.event || '').toLowerCase();
  const messageType = readMessageType(payload);

  if (event && event !== 'message_created') return false;
  return messageType === 'outgoing' || messageType === '1';
}

export function extractOutgoingMessageData(payload: any): OutgoingMessageData | null {
  const content = String(payload?.content ?? payload?.message?.content ?? '').trim();

  const candidatePhone =
    payload?.conversation?.contact_inbox?.source_id ||
    payload?.contact?.phone_number ||
    payload?.sender?.phone_number ||
    payload?.meta?.sender?.phone_number;

  if (!candidatePhone || !content) return null;

  return {
    phone: normalizePhone(String(candidatePhone)),
    content,
  };
}

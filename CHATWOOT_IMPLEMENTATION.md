# 🔧 PLANO DETALHADO - Completar Integração Chatwoot
**Data:** 23 de abril de 2026  
**Escopo:** Implementar fluxo bidirecional Chatwoot ↔ UAZAPI  
**Tempo estimado:** 4-6 horas  

---

## 📊 Estado Atual vs. Desejado

### Estado Atual (70%)
```
UAZAPI Webhook → app.ts → LeadService
     ↓
Mensagem recebida, score atualizado
     ↓
[OPCIONAL] Sync para Chatwoot
```

### Estado Desejado (100%)
```
UAZAPI ←———————————→ Chatwoot
  ↓                    ↓
  └──→ app.ts ←───┘
       ↓
    Database
    ↓
  JobLog (auditoria)
```

---

## 🎯 Tarefas Específicas

### **TAREFA 1: Validação de Webhook Secret (1h)**

**Arquivo:** `src/application/webhooks/webhook-auth.ts`  
**Status:** Já existe, mas não está completo

**O que fazer:**

1. Verificar implementação atual:
```typescript
export function isWebhookAuthorized(
  headers: Record<string, unknown>,
  options: { expectedSecret?: string }
): boolean {
  // Implementar validação com hash
  const signature = headers['x-chatwoot-signature'];
  const body = headers['x-chatwoot-body']; // Falta extrair do request body
  
  if (!options.expectedSecret) return true; // Se não configurado, permite
  
  // SHA256(body + secret) == signature
  // Implementar essa validação
}
```

2. Adicionar aos imports do `app.ts`:
```typescript
const CHATWOOT_WEBHOOK_SECRET = env.CHATWOOT_WEBHOOK_SECRET;
```

3. Validar na rota:
```typescript
app.post('/webhooks/chatwoot/message-created', async (request, reply) => {
  const authorized = isWebhookAuthorized(request.headers, {
    expectedSecret: CHATWOOT_WEBHOOK_SECRET
  });
  if (!authorized) {
    return reply.status(401).send({ error: 'Invalid webhook signature' });
  }
  // Continuar...
});
```

---

### **TAREFA 2: Implementar Webhook Inverso (2h)**

**Arquivo:** `src/app.ts` - expandir rota existente

**Endpoint:**
```
POST /webhooks/chatwoot/message-created
```

**Implementação completa:**

```typescript
app.post('/webhooks/chatwoot/message-created', async (request, reply) => {
  const authorized = isWebhookAuthorized(request.headers, {
    expectedSecret: env.CHATWOOT_WEBHOOK_SECRET
  });

  if (!authorized) {
    return reply.status(401).send({ error: 'Unauthorized webhook' });
  }

  try {
    const payload = request.body as any;
    
    // 1. Extrair dados do evento Chatwoot
    const {
      conversation: { contact: { phone_number, name }, id: conversationId },
      message: { content, message_type, id: messageId, sender }
    } = payload;

    // 2. Normalizar telefone
    const normalizedPhone = normalizePhone(phone_number);

    // 3. Se for mensagem do agente humano (private_message === false)
    if (message_type === 'outgoing' && sender.role !== 'bot') {
      
      // 4. Encontrar lead
      const tenantId = 'synapsea'; // Extrair de headers se multi-tenant
      const lead = await leadService.getLead(tenantId, normalizedPhone);
      
      if (!lead) {
        logger.warn(`[Chatwoot] Lead ${normalizedPhone} não encontrado`);
        return reply.status(404).send({ error: 'Lead not found' });
      }

      // 5. Enviar mensagem via UAZAPI
      try {
        const response = await uazapiClient.sendMessage({
          phone: normalizedPhone,
          message: content
        });

        // 6. Registrar na DB
        await prisma.message.create({
          data: {
            leadId: lead.id,
            content,
            direction: 'outgoing',
            messageId: response.messageId,
            chatwootMessageId: messageId,
            isAiGenerated: false, // Humano
            metadata: {
              source: 'chatwoot',
              sender: sender.name,
              conversationId
            }
          }
        });

        // 7. Log de auditoria
        logger.info({
          phone: normalizedPhone,
          messageId: response.messageId,
          source: 'chatwoot'
        }, '[Chatwoot] Mensagem enviada via UAZAPI');

        return reply.status(200).send({ 
          success: true, 
          messageId: response.messageId 
        });

      } catch (uazError: any) {
        logger.error({ uazError }, '[Chatwoot] Erro ao enviar via UAZAPI');
        return reply.status(503).send({ 
          error: 'Failed to send message via WhatsApp',
          details: uazError.message 
        });
      }
    }

    return reply.status(200).send({ processed: true });

  } catch (error: any) {
    logger.error({ error }, '[Chatwoot] Erro ao processar webhook');
    return reply.status(500).send({ error: error.message });
  }
});

// Helper function
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, ''); // Remove caracteres não-numéricos
}
```

---

### **TAREFA 3: Adicionar Rastreamento de Conversa (0.5h)**

**Arquivo:** `src/modules/messaging/webhook.handler.ts`

Adicionar método para mapear lead ↔ conversation_id:

```typescript
private async mapLeadToConversation(
  phone: string, 
  conversationId: string
): Promise<void> {
  await prisma.activeLead.update({
    where: { phone },
    data: {
      metadata: {
        ...((await this.getLead(phone))?.metadata || {}),
        chatwootConversationId: conversationId
      }
    }
  });
}
```

---

### **TAREFA 4: Tratamento de Erro 401 Chatwoot (0.5h)**

**Problema:** Token Chatwoot expirando  
**Solução:** Adicionar retry com token refresh

**Arquivo:** `src/infra/chatwoot/chatwoot.client.ts`

```typescript
private async request<T>(
  method: string,
  path: string,
  data?: Record<string, unknown>
): Promise<T> {
  try {
    const response = await this.client({
      method,
      url: path,
      data,
      headers: {
        'api_access_token': this.apiToken
      }
    });
    return response.data as T;
  } catch (error: any) {
    
    // Se 401, tentar uma vez mais com token refresh
    if (error.response?.status === 401) {
      logger.warn('[ChatwootClient] Token expirou, revalidando...');
      // Aqui você precisaria implementar refresh token
      // ou tentar regenerar o token via API
      throw new Error('Chatwoot token expired - regenerate in console');
    }
    
    throw new ExternalApiError(
      `Chatwoot ${method} ${path} failed`,
      error.response?.status || 500,
      error.response?.data
    );
  }
}
```

---

### **TAREFA 5: Testes E2E (1.5h)**

**Arquivo:** `tests/integration/chatwoot-webhook.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../../src/app';

describe('Chatwoot Webhook Integration', () => {
  
  it('deve processar mensagem incoming corretamente', async () => {
    const payload = {
      conversation: {
        id: 'conv-123',
        contact: {
          phone_number: '+55 11 99999-9999',
          name: 'João Silva'
        }
      },
      message: {
        id: 'msg-456',
        content: 'Olá, preciso de orçamento',
        message_type: 'incoming',
        sender: { role: 'customer', name: 'João' }
      }
    };

    const response = await app.inject({
      method: 'POST',
      url: '/webhooks/chatwoot/message-created',
      payload,
      headers: {
        'x-chatwoot-signature': generateSignature(payload)
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().processed).toBe(true);
  });

  it('deve enviar para UAZAPI quando for outgoing', async () => {
    // Mock UAZAPI
    // Verificar que sendMessage foi chamado
    // Validar que DB foi atualizado
  });

  it('deve rejeitar webhook inválido', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/webhooks/chatwoot/message-created',
      payload: { /* qualquer payload */ },
      headers: {
        'x-chatwoot-signature': 'invalid-signature'
      }
    });

    expect(response.statusCode).toBe(401);
  });
});
```

---

### **TAREFA 6: Atualizar Env Variables (0.5h)**

**Arquivo:** `.env` (criar do `.env.example`)

```env
# Chatwoot Integration
CHATWOOT_API_URL=https://seu-chatwoot.com/api/v1
CHATWOOT_API_TOKEN=your_actual_api_token_here    # ← Regenerar no console
CHATWOOT_ACCOUNT_ID=1
CHATWOOT_INBOX_ID=1
CHATWOOT_WEBHOOK_SECRET=your_random_secret_here  # ← Gerar novo

# Validação de chave
# Para gerar webhook secret:
# openssl rand -hex 32
```

---

## 📋 Checklist de Implementação

### Before Implementation
- [ ] Criar branch: `git checkout -b feat/chatwoot-bidirectional`
- [ ] Backup do estado atual

### Implementation
- [ ] ✅ TAREFA 1: Webhook auth validation (1h)
- [ ] ✅ TAREFA 2: Webhook inverso (2h)  
- [ ] ✅ TAREFA 3: Rastreamento conversa (0.5h)
- [ ] ✅ TAREFA 4: Error handling 401 (0.5h)
- [ ] ✅ TAREFA 5: E2E tests (1.5h)
- [ ] ✅ TAREFA 6: Env vars (0.5h)

### Testing
- [ ] Unit tests passando
- [ ] Integration tests passando
- [ ] Manual testing com Chatwoot staging
- [ ] Load testing (simular 100+ mensagens/min)

### Deployment
- [ ] Code review
- [ ] Deploy staging
- [ ] Full E2E test
- [ ] Deploy production
- [ ] Monitorar logs por 24h

---

## 🚨 Antes de começar

**1. Regenerar Chatwoot API Token:**
```
1. Acessar Chatwoot Console
2. Settings → API → Create Token
3. Copiar novo token para .env
```

**2. Definir Webhook Secret:**
```bash
# Gerar chave aleatória
openssl rand -hex 32
# Copiar para .env: CHATWOOT_WEBHOOK_SECRET
```

**3. Verificar Chatwoot Webhook Settings:**
```
1. Chatwoot → Settings → Integrations → Webhooks
2. URL: https://seu-dominio.com/webhooks/chatwoot/message-created
3. Events: message.created
4. Secret: o gerado acima
```

---

## ⏱️ Timeline Sugerida

```
Dia 1 - Manhã   (2h): TAREFAS 1-3 (validação, webhook, rastreamento)
Dia 1 - Tarde   (2h): TAREFAS 4-6 (error handling, testes, env)
Dia 2 - Manhã   (2h): Testing + manual validation
Dia 2 - Tarde   (1h): Staging deployment
Dia 3          (1h): Production deployment + monitoring
```

**Total: 8-10 horas** (dentro do timeboxed para FASE 1)

---

## 📞 Se Tiver Problemas

| Erro | Solução |
|------|---------|
| 401 Unauthorized | Regenerar CHATWOOT_API_TOKEN |
| Webhook não recebe | Verificar CHATWOOT_WEBHOOK_SECRET |
| Mensagem não envia | Validar UAZAPI_KEY ativo |
| Duplicação de msgs | Adicionar idempotency key |
| Performance lenta | Implementar rate limiting |

---

## ✅ Success Criteria

Quando implementado com sucesso:

1. ✅ Mensagem entra no Chatwoot → envia via UAZAPI → lead recebe
2. ✅ Lead responde via WhatsApp → recebido em Chatwoot → score atualizado
3. ✅ Agente humano responde no Chatwoot → entrega automática via WhatsApp
4. ✅ Todos os logs em JobLog para auditoria
5. ✅ Zero 401 errors por >24h
6. ✅ E2E tests todos passando
7. ✅ Load test: 1000+ msg/min sem erros

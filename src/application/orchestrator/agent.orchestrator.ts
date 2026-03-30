// src/application/orchestrator/agent.orchestrator.ts
// Orquestrador de agente – usa modelos reais do schema Prisma

import { PrismaClient } from '@prisma/client';
import { logger } from '../../shared/utils/logger';
import { IntentClassifier } from '../../domain/intent/intent.classifier';
import { ResponseGenerator } from '../../domain/agent/response.generator';
import { AgentConfigStore } from '../../domain/agent/agent-config.store';
import { config } from '../../config/env';

const prisma = new PrismaClient();

export class AgentOrchestrator {
  private intentClassifier: IntentClassifier;
  private responseGenerator?: ResponseGenerator; // inicializado sob demanda
  private agentConfigStore: AgentConfigStore;

  constructor() {
    this.intentClassifier = new IntentClassifier(config.OPENAI_API_KEY, config.OPENAI_MODEL);

    this.agentConfigStore = new AgentConfigStore(config.AGENT_CONFIG_PATH, {
      autoReplyEnabled: true,
      companyName: config.AGENT_COMPANY_NAME,
      objective: config.AGENT_OBJECTIVE,
      tone: config.AGENT_TONE,
      language: config.AGENT_LANGUAGE,
      maxReplyChars: config.AGENT_MAX_REPLY_CHARS,
      businessNiche: 'Locação de Andaimes e Estruturas Metálicas',
      salesType: 'consultiva',
      primaryCTA: 'Posso pedir para um dos nossos técnicos calcular o orçamento exato para sua obra?',
      qualificationQuestions: [
        'Qual o tamanho aproximado da obra?',
        'Vocês já têm um projeto estrutural definido?',
        'Para quando precisam dos equipamentos na obra?'
      ],
      customPrompt: '',
      fallbackMessage: 'Entendido. Quer que eu encaminhe isso para o especialista técnico agora?',
      emojisEnabled: true,
      handoffEnabled: true,
      sendToChatwoot: true,
      sendToSlack: false,
      disallowedTerms: []
    });
  }

  /**
   * Processa mensagem recebida via ActiveLead (phone = identificador único no tenant).
   * @param tenantId  Tenant/empresa
   * @param phone     Telefone do lead (normalizado)
   * @param messageContent  Texto da mensagem
   */
  async processIncomingMessage(
    tenantId: string,
    phone: string,
    messageContent: string
  ): Promise<string | undefined> {
    logger.info(`[AgentOrchestrator] Processando mensagem do lead ${phone} (tenant=${tenantId})`);
    await this.agentConfigStore.init();

    const lead = await prisma.activeLead.findFirst({
      where: { tenantId, phone }
    });

    if (!lead) {
      logger.warn(`[AgentOrchestrator] Lead ${phone} não encontrado no tenant ${tenantId}`);
      return undefined;
    }

    try {
      // 1. Classificação de Intenção
      const intentResult = await this.intentClassifier.classify(messageContent);

      // 2. Auditoria via GovernanceAudit (substitui agentAction)
      await prisma.governanceAudit.create({
        data: {
          tenantId,
          action: 'agent_triage',
          actor: 'ai-agent',
          success: true,
          metadata: {
            phone,
            intent: intentResult.intent,
            confidence: intentResult.confidence,
            reasoning: intentResult.reasoning
          }
        }
      });

      // 3. Atualizar score e status do lead conforme intenção (substitui opportunity)
      let scoreIncrement = 0;
      if (intentResult.intent === 'BUY_NOW') {
        scoreIncrement = 30;
        const newScore = Math.min(100, lead.score + scoreIncrement);
        await prisma.activeLead.update({
          where: { id: lead.id },
          data: {
            intentClassified: intentResult.intent,
            score: newScore,
            status: newScore > 80 ? 'HOT' : lead.status,
            conversionStage: 'decision'
          }
        });
        logger.info(`[AgentOrchestrator] 💰 Lead ${phone} avançou para HOT/decision`);
      } else if (intentResult.intent === 'SUPPORT') {
        scoreIncrement = 10;
        await prisma.activeLead.update({
          where: { id: lead.id },
          data: {
            intentClassified: intentResult.intent,
            score: Math.min(100, lead.score + scoreIncrement),
            conversionStage: 'consideration'
          }
        });
      }

      // 4. Gerar Resposta (se auto-reply habilitado)
      const agentConfig = this.agentConfigStore.getConfig();
      if (!agentConfig.autoReplyEnabled) {
        logger.info('[AgentOrchestrator] Auto-reply desabilitado. Fim do fluxo.');
        return undefined;
      }

      // Instanciar ResponseGenerator com config fresca
      this.responseGenerator = new ResponseGenerator(
        config.OPENAI_API_KEY,
        config.OPENAI_MODEL,
        agentConfig
      );

      const replyStr = await this.responseGenerator.generateReply({
        leadName: lead.name || 'cliente',
        incomingMessage: messageContent,
        intent: intentResult.intent,
        score: lead.score + scoreIncrement,
        conversationStage: lead.conversionStage ?? undefined
      });

      // 5. Registrar mensagem outbound (substitui messageOutbound)
      await prisma.message.create({
        data: {
          tenantId,
          leadId: lead.id,
          content: replyStr,
          type: 'outgoing',
          isAiGenerated: true,
          intentDetected: intentResult.intent
        }
      });

      // 6. Registrar nota de resumo da conversa (substitui conversationSummary)
      await prisma.note.create({
        data: {
          leadId: lead.id,
          content: `Lead: "${messageContent.slice(0, 60)}..." → IA: "${replyStr.slice(0, 60)}..." (intent=${intentResult.intent})`,
          type: 'summary'
        }
      });

      logger.info(`[AgentOrchestrator] ✅ Resposta gerada para ${phone}`);
      return replyStr;
    } catch (error) {
      logger.error('[AgentOrchestrator] ❌ Erro ao processar:', error);
      throw error;
    }
  }
}

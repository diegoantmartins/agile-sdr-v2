// src/application/orchestrator/agent.orchestrator.ts
// Orquestrador de agente – usa modelos reais do schema Prisma

import { PrismaClient } from '@prisma/client';
import { logger } from '../../shared/utils/logger';
import { IntentClassifier } from '../../domain/intent/intent.classifier';
import { ResponseGenerator } from '../../domain/agent/response.generator';
import { AgentConfigStore } from '../../domain/agent/agent-config.store';
import { config } from '../../config/env';
import { getPhoneInfo } from '../../shared/utils/phone-utils';
import { chatService } from '../../services/chatwootService';
import { AgileIntent } from '../../domain/intent/agile-intent.types';

const prisma = new PrismaClient();

interface QualificationState {
  questionIndex: number;
  answers: Record<string, string>;
}

export class AgentOrchestrator {
  private intentClassifier: IntentClassifier;
  private responseGenerator?: ResponseGenerator;
  private agentConfigStore: AgentConfigStore;

  constructor() {
    this.intentClassifier = new IntentClassifier(config.OPENAI_API_KEY || '', config.OPENAI_MODEL);

    this.agentConfigStore = new AgentConfigStore(config.AGENT_CONFIG_PATH, {
      autoReplyEnabled: true,
      companyName: 'Léo Assistente',
      objective: 'Qualificar leads e avançar para reunião ou proposta.',
      tone: 'consultivo e cordial',
      language: 'português do Brasil',
      maxReplyChars: 420,
      businessNiche: 'SaaS B2B',
      salesType: 'consultiva',
      primaryCTA: 'Posso te mostrar o próximo passo ideal para o seu cenário?',
      qualificationQuestions: [
        'Qual seu principal desafio hoje?',
        'Qual prazo você tem para implementar?',
        'Quem participa da decisão?'
      ],
      customPrompt: '',
      fallbackMessage: 'Entendido. Quer que eu peça para um consultor da nossa equipe te ligar?',
      emojisEnabled: true,
      handoffEnabled: true,
      sendToChatwoot: true,
      sendToSlack: false,
      disallowedTerms: [],
      // Agile Specifics
      handoffLabels: ['agile-handoff', 'urgente'],
      handoffTargetName: 'Daisy',
      pivotProducts: ['pisos vinílicos', 'forro acústico', 'steel frame'],
      primaryProduct: 'Drywall',
      enableDdiLanguageDetection: true
    });
  }

  private parseQualificationState(metadata: any): QualificationState {
    if (!metadata?.qualificationState) {
      return { questionIndex: 0, answers: {} };
    }
    try {
      return JSON.parse(metadata.qualificationState);
    } catch {
      return { questionIndex: 0, answers: {} };
    }
  }

  private isAnswerToQuestion(message: string, question: string): boolean {
    const normalizedMsg = message.toLowerCase();
    
    if (question.includes('tamanho') || question.includes('metros')) {
      return /\d+\s*(m²|m2|metros?|m)\b/i.test(normalizedMsg) || /\d+/.test(normalizedMsg);
    }
    if (question.includes('projeto') || question.includes('definido')) {
      return /sim|não|temos|já|ainda|não temos|definindo/i.test(normalizedMsg);
    }
    if (question.includes('quando') || question.includes('precisam')) {
      return /já|ainda|mes|ano|semana|pronto|imediato|urgente|flexível/i.test(normalizedMsg);
    }
    return false;
  }

  private async getConversationContext(leadId: string): Promise<{lastQuestion: string | null, lastAnswer: string | null}> {
    const messages = await prisma.message.findMany({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { content: true, direction: true }
    });

    let lastQuestion: string | null = null;
    let lastAnswer: string | null = null;

    for (const msg of messages) {
      if (msg.direction === 'outgoing' && msg.content?.includes('?')) {
        lastQuestion = msg.content;
      } else if (msg.direction === 'incoming' && !lastAnswer) {
        lastAnswer = msg.content;
      }
    }

    return { lastQuestion, lastAnswer };
  }

  private generateFollowUp(currentAnswer: string, questionIndex: number, questions: string[]): string {
    const followUps: Record<number, string[]> = {
      0: [
        'Perfeito! E qual o tipo de estrutura? Andaime tubular, fachadeiro, ou outro?',
        'Entendi! A obra é residential, comercial ou industrial?',
        'Ótimo! E qual a altura aproximada?'
      ],
      1: [
        'Perfeito! Precisa de algum serviço adicional como escoramento ou forma?',
        'Entendi! Tem alguma preferência de material ou Norma a seguir?',
        'Ótimo! Já definiu o prazo de locação?'
      ],
      2: [
        'Perfeito! Posso te passar o orçamento agora. Qual seu email para envio?',
        'Entendi! Quer que eu encaminhe para um técnico especializados?',
        'Ótimo! Posso agendar uma visita técnica para avaliar in loco?'
      ]
    };

    const options = followUps[questionIndex] || followUps[0];
    return options[Math.floor(Math.random() * options.length)];
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

    const agentConfig = this.agentConfigStore.getConfig();

    const lead = await prisma.activeLead.findFirst({
      where: { tenantId, phone }
    });

    if (!lead) {
      logger.warn(`[AgentOrchestrator] Lead ${phone} não encontrado no tenant ${tenantId}`);
      return undefined;
    }

    // 0. Bloqueio de Handoff: Se o lead já está com humano, silenciar IA
    if (lead.status === 'HUMAN_REQUIRED') {
      logger.info(`[AgentOrchestrator] Lead ${phone} em modo HUMAN_REQUIRED. Silenciando IA.`);
      return undefined;
    }

    try {
      // 1. Obter contexto da conversa (última pergunta e resposta)
      const { lastQuestion, lastAnswer } = await this.getConversationContext(lead.id);

      // 2. Detectar DDI e Idioma (se habilitado)
      let language = agentConfig.language;
      if (agentConfig.enableDdiLanguageDetection) {
        const phoneInfo = getPhoneInfo(phone);
        language = phoneInfo.language === 'pt-PT' ? 'português de Portugal' : 'português do Brasil';
      }
      
      // Criar uma cópia da config com o idioma detectado
      const currentPromptConfig = {
        ...agentConfig,
        language
      };

      // 3. Classificação de Intenção (Agile)
      const agileIntentResult = await this.intentClassifier.classifyAgile(messageContent);
      const intent = agileIntentResult.intent;

      // 4. Aplicar Etiquetas (Labels) no Chatwoot
      if (agentConfig.sendToChatwoot) {
        const labels: string[] = [`agile-intent-${intent.toLowerCase()}`];
        
        // Mapeamento extra de criticidade e etiquetas configuradas
        if (intent === 'HANDOFF_HUMANO') {
          labels.push(...agentConfig.handoffLabels);
        }
        if (intent === 'SERVICO_FECHADO') {
          labels.push('agile-pivot');
        }
        if (intent === 'BUY_NOW' as any) labels.push('agile-oportunidade');
        
        // Detecção dinâmica de produtos baseada na config
        const msgLower = messageContent.toLowerCase();
        
        // Produto principal
        if (msgLower.includes(agentConfig.primaryProduct.toLowerCase())) {
          labels.push(`produto-${agentConfig.primaryProduct.toLowerCase().replace(/\s+/g, '-')}`);
        }
        
        // Produtos de pivotagem
        for (const product of agentConfig.pivotProducts) {
          if (msgLower.includes(product.toLowerCase())) {
            labels.push(`produto-${product.toLowerCase().replace(/\s+/g, '-')}`);
          }
        }
        
        // Disparar atualização de labels de forma assíncrona (não bloquear resposta)
        chatService.addLabels(phone, labels).catch(err => 
          logger.warn(`[AgentOrchestrator] Falha ao sincronizar labels: ${err.message}`)
        );
      }

      // 5. Se intenção for HANDOFF_HUMANO, podemos decidir parar aqui ou gerar resposta de transbordo
      // Para Agile Steel, o ResponseGenerator já tem regras de transbordo no prompt.
      
      // 6. Gerar resposta via LLM
      this.responseGenerator = new ResponseGenerator(
        config.OPENAI_API_KEY || '',
        config.OPENAI_MODEL,
        currentPromptConfig
      );

      // Mapping Agile intents to Generator intents
      let genIntent: 'BUY_NOW' | 'SUPPORT' | 'TRIAGE' = 'TRIAGE';
      if (intent === 'HANDOFF_HUMANO') genIntent = 'BUY_NOW';
      else if (intent === 'SERVICO_FECHADO' || intent === 'FOLLOW_UP_NORMAL') genIntent = 'SUPPORT';

      const replyStr = await this.responseGenerator.generateReply({
        leadName: lead.name || 'cliente',
        phone: lead.phone,
        incomingMessage: messageContent,
        intent: genIntent,
        score: lead.score,
        conversationStage: lead.conversionStage ?? undefined
      });

      // 4. Auditoria via GovernanceAudit
      await prisma.governanceAudit.create({
        data: {
          tenantId,
          action: 'agent_triage',
          actor: 'ai-agent',
          success: true,
          metadata: {
            phone,
            intent: intent,
            confidence: agileIntentResult.confidence,
            reasoning: agileIntentResult.reasoning
          }
        }
      });

      // 5. Atualizar score e status do lead conforme intenção
      let scoreIncrement = 0;
      if (intent === 'HANDOFF_HUMANO') {
        scoreIncrement = 30;
        const newScore = Math.min(100, lead.score + scoreIncrement);
        await prisma.activeLead.update({
          where: { id: lead.id },
          data: {
            intentClassified: intent,
            score: newScore,
            status: 'HUMAN_REQUIRED', // Transbordo imediato para humano
            conversionStage: 'decision'
          }
        });
        
        // Notificar equipe no Chatwoot
        if (agentConfig.sendToChatwoot) {
          try {
            await chatService.openConversation(phone);
            await chatService.addPrivateNote(phone, `🚀 [HANDOFF] Lead ${lead.name} atingiu maturidade de venda. IA encerrou qualificação.`);
            logger.info(`[AgentOrchestrator] 💰 Lead ${phone} transbordado para humano no Chatwoot`);
          } catch (chatError) {
            logger.error(`[AgentOrchestrator] Erro ao notificar Chatwoot sobre o handoff: ${chatError}`);
          }
        }
      } else if (intent === 'FOLLOW_UP_NORMAL') {
        scoreIncrement = 10;
        await prisma.activeLead.update({
          where: { id: lead.id },
          data: {
            intentClassified: intent,
            score: Math.min(100, lead.score + scoreIncrement),
            conversionStage: 'consideration'
          }
        });
      } else {
        // TRIAGE, PIVOT, etc.
        scoreIncrement = 5;
        await prisma.activeLead.update({
          where: { id: lead.id },
          data: {
            intentClassified: intent,
            score: Math.min(100, lead.score + scoreIncrement),
            conversionStage: intent === 'SERVICO_FECHADO' ? 'consideration' : 'qualification'
          }
        });
      }

      // 6. Registrar mensagem outbound
      await prisma.message.create({
        data: {
          tenantId,
          leadId: lead.id,
          content: replyStr,
          type: 'outgoing',
          isAiGenerated: true,
          intentDetected: intent
        }
      });

      // 7. Registrar nota de resumo da conversa
      await prisma.note.create({
        data: {
          leadId: lead.id,
          content: `Lead: "${messageContent.slice(0, 60)}..." → IA: "${replyStr.slice(0, 60)}..." (intent=${intent})`,
          type: 'summary'
        }
      });

      logger.info(`[AgentOrchestrator] ✅ Resposta gerada para ${phone}: ${replyStr}`);
      return replyStr;
    } catch (error) {
      logger.error('[AgentOrchestrator] ❌ Erro ao processar:', error);
      throw error;
    }
  }
}

// src/domain/intent/intent.classifier.ts

import OpenAI from 'openai';
import { logger } from '../../shared/utils/logger';
import { retryAsync } from '../../shared/utils/retry';
import type { AgileIntent, AgileClassificationResult } from './agile-intent.types';

type IntentType = 'BUY_NOW' | 'SUPPORT' | 'TRIAGE';

export interface ClassificationResult {
  intent: IntentType;
  confidence: number;
  reasoning: string;
  triggeredKeywords?: string[];
}

// ─── Generic keywords (legacy/backwards-compatible) ──────────────────────────

const INTENT_KEYWORDS = {
  BUY_NOW: [
    'quero contratar', 'qual o preço', 'gostaria de fechar', 'quer começar agora',
    'como posso comprar', 'aceito a proposta', 'vamos contratar', 'fazer agora',
    'começar hoje', 'contrate já', 'valor do', 'custo', 'investimento'
  ],
  SUPPORT: [
    'não entendo', 'como usar', 'como funciona', 'qual o benefício',
    'quais as vantagens', 'diferença entre', 'pode explicar', 'dúvida',
    'é possível', 'funciona para'
  ]
};

// ─── Agile Steel — Keywords por Intent ───────────────────────────────────────

const AGILE_INTENT_KEYWORDS: Record<AgileIntent, string[]> = {
  HANDOFF_HUMANO: [
    'fechei a obra', 'fechamos a obra', 'obra fechada',
    'vai começar agora', 'vai começar essa semana', 'vai começar esse mês',
    'vai iniciar essa semana', 'vai iniciar esse mês', 'vai iniciar agora',
    'começa essa semana', 'começa esse mês', 'começa agora',
    'já está começando', 'execução começa', 'vamos iniciar',
    'assinamos o contrato', 'contrato assinado', 'ordem de serviço', 'o.s. emitida',
    'qual perfil metálico', 'qual espessura', 'caderno técnico', 'laudo técnico',
    'memória de cálculo', 'norma técnica', 'perfil de pvc', 'perfil metálico',
    'perfil de aço', 'especificação técnica', 'ficha técnica', 'inicio já', 'início já'
  ],
  LICITACAO_PERDIDA: [
    'não ganhamos', 'perdemos a licitação', 'não ganhei', 'perdeu a licitação',
    'outra empresa ganhou', 'outra construtora ganhou', 'não fomos selecionados',
    'não levamos', 'fui eliminado', 'fomos eliminados', 'não ficamos com a obra',
    'não fechamos a obra', 'outra empreiteira', 'licitação perdida',
    'não ficamos', 'perderam para', 'ganhou outro', 'ficou com outra'
  ],
  OBRA_SEM_FRENTE: [
    'não tem frente', 'sem frente', 'não está na hora', 'ainda não',
    'não começou', 'juntando verba', 'sem verba', 'sem recurso', 'sem budget',
    'sem orçamento aprovado', 'não liberou', 'obra parada', 'obra travada',
    'prazo indefinido', 'não tem previsão', 'sem previsão', 'mais para frente',
    'ainda não sabemos', 'ainda não definimos',
    'falta liberação', 'ainda não foi aprovado', 'sem data definida'
  ],
  SERVICO_FECHADO: [
    'já fechei', 'já contratei', 'já foi contratado', 'já contratamos',
    'já está fechado', 'já definimos fornecedor', 'já tem fornecedor', 'já escolhemos',
    'já tem quem faça', 'já tem quem execute', 'não precisamos mais', 'não preciso mais',
    'já resolvi', 'já foi resolvido', 'outra empresa faz', 'outro fornecedor',
    'fechou com outro', 'fechamos com outro', 'usando outra empresa', 'outro já faz'
  ],
  FOLLOW_UP_NORMAL: [
    'ainda em análise', 'em avaliação', 'aguardando definição', 'estamos avaliando',
    'ainda não decidiram', 'ainda não decidi', 'pendente de aprovação',
    'aguardando aprovação', 'aguardando liberação',
    'preciso conversar com', 'vou consultar', 'próximas semanas', 'próximos meses',
    'proposta recebida', 'vimos a proposta', 'analisamos a proposta', 'gostamos da proposta'
  ],
  TRIAGE: []
};

// ─── IntentClassifier ─────────────────────────────────────────────────────────

export class IntentClassifier {
  private openai?: OpenAI;

  constructor(apiKey: string, private model: string = 'gpt-4o-mini') {
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  // ── Generic classify (backwards compatible) ──────────────────────────────────

  async classify(message: string): Promise<ClassificationResult> {
    const normalizedMsg = message.toLowerCase().trim();

    const patternResult = this.matchPatterns(normalizedMsg);
    if (patternResult.confidence > 0.8) {
      logger.debug(`[IntentClassifier] Pattern match: ${patternResult.intent}`);
      return patternResult;
    }

    if (!this.openai) {
      logger.warn('[IntentClassifier] OpenAI não configurado, usando TRIAGE fallback');
      return { intent: 'TRIAGE', confidence: 0.4, reasoning: 'OpenAI API key ausente, usando fallback' };
    }

    try {
      return await retryAsync(() => this.classifyWithLLM(message), { maxAttempts: 2, delayMs: 500 });
    } catch (error) {
      logger.warn('[IntentClassifier] LLM error, using TRIAGE fallback:', error);
      return { intent: 'TRIAGE', confidence: 0.5, reasoning: 'LLM classification failed, using fallback' };
    }
  }

  private matchPatterns(message: string): ClassificationResult {
    for (const keyword of INTENT_KEYWORDS.BUY_NOW) {
      if (message.includes(keyword)) {
        return { intent: 'BUY_NOW', confidence: 0.95, reasoning: `Detected keyword: "${keyword}"`, triggeredKeywords: [keyword] };
      }
    }
    for (const keyword of INTENT_KEYWORDS.SUPPORT) {
      if (message.includes(keyword)) {
        return { intent: 'SUPPORT', confidence: 0.85, reasoning: `Detected support keyword: "${keyword}"`, triggeredKeywords: [keyword] };
      }
    }
    return { intent: 'TRIAGE', confidence: 0.3, reasoning: 'No pattern match' };
  }

  private async classifyWithLLM(message: string): Promise<ClassificationResult> {
    if (!this.openai) throw new Error('OpenAI client não configurado');

    const completion = await this.openai.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content: `Você é um classificador de intenção de lead para uma plataforma de consultoria.

Classifique a mensagem do usuário em uma destas categorias:
- BUY_NOW: Usuário quer comprar/contratar agora
- SUPPORT: Usuário quer entender melhor, faz perguntas
- TRIAGE: Qualquer outra coisa

Responda APENAS em JSON:
{
  "intent": "BUY_NOW" | "SUPPORT" | "TRIAGE",
  "confidence": 0.0-1.0,
  "reasoning": "Explicação breve"
}`
        },
        { role: 'user', content: message }
      ],
      temperature: 0.3,
      max_tokens: 150
    });

    const responseText = completion.choices[0]?.message?.content || '';
    const parsed = JSON.parse(responseText);
    return {
      intent: (parsed.intent || 'TRIAGE') as IntentType,
      confidence: parsed.confidence || 0.5,
      reasoning: parsed.reasoning || 'LLM classification'
    };
  }

  generateHandoffSummary(intent: IntentType, message: string, leadName: string): string {
    const summaries: Record<IntentType, string> = {
      BUY_NOW: `🔥 *${leadName} quer contratar agora!*\n"${message}"\n⏰ URGENTE`,
      SUPPORT: `❓ ${leadName} tem dúvidas\n"${message}"\n💡 Pode ser oportunidade`,
      TRIAGE: `📋 Triagem em andamento\n"${message}"`
    };
    return summaries[intent] || summaries.TRIAGE;
  }

  // ── Agile Steel classify ─────────────────────────────────────────────────────

  /**
   * Classifica a mensagem no contexto do playbook de follow-up da Agile Steel.
   * Ordem de prioridade (criticidade):
   *   1. HANDOFF_HUMANO  → obra começa / pergunta técnica  (ação imediata)
   *   2. LICITACAO_PERDIDA → oportunidade de repasse
   *   3. OBRA_SEM_FRENTE → reagendar retorno
   *   4. SERVICO_FECHADO → pivot de produto
   *   5. FOLLOW_UP_NORMAL → qualificar cronograma
   *   6. TRIAGE → fallback
   */
  async classifyAgile(message: string): Promise<AgileClassificationResult> {
    const normalizedMsg = message.toLowerCase().trim();

    const priorityOrder: AgileIntent[] = [
      'HANDOFF_HUMANO',
      'LICITACAO_PERDIDA',
      'OBRA_SEM_FRENTE',
      'SERVICO_FECHADO',
      'FOLLOW_UP_NORMAL'
    ];

    for (const intent of priorityOrder) {
      const keywords = AGILE_INTENT_KEYWORDS[intent];
      for (const keyword of keywords) {
        if (normalizedMsg.includes(keyword)) {
          logger.debug(`[IntentClassifier:Agile] Pattern match: ${intent} (keyword: "${keyword}")`);
          return {
            intent,
            confidence: 0.92,
            reasoning: `Keyword detectada: "${keyword}"`,
            triggeredKeywords: [keyword]
          };
        }
      }
    }

    if (this.openai) {
      try {
        return await retryAsync(() => this.classifyAgileWithLLM(message), { maxAttempts: 2, delayMs: 500 });
      } catch (error) {
        logger.warn('[IntentClassifier:Agile] LLM error, usando TRIAGE fallback:', error);
      }
    }

    return { intent: 'TRIAGE', confidence: 0.3, reasoning: 'Nenhum padrão Agile detectado, requer triagem' };
  }

  private async classifyAgileWithLLM(message: string): Promise<AgileClassificationResult> {
    if (!this.openai) throw new Error('OpenAI client não configurado');

    const completion = await this.openai.chat.completions.create({
      model: this.model,
      temperature: 0.2,
      max_tokens: 200,
      messages: [
        {
          role: 'system',
          content: `Você é um classificador de intenções para um agente de follow-up comercial da Agile Steel (drywall, steel frame, pisos vinílicos, forro acústico, piso elevado).

Classifique a mensagem em exatamente uma categoria:
- HANDOFF_HUMANO: obra começa agora, contrato assinado, ou pergunta técnica (espessura, perfil, laudo, norma)
- LICITACAO_PERDIDA: construtora não ganhou a licitação
- OBRA_SEM_FRENTE: obra sem frente, sem previsão, sem verba
- SERVICO_FECHADO: fechou com outro fornecedor/concorrente
- FOLLOW_UP_NORMAL: proposta em análise, aguardando decisão
- TRIAGE: não se encaixa em nenhuma categoria acima

Responda APENAS em JSON:
{
  "intent": "HANDOFF_HUMANO" | "LICITACAO_PERDIDA" | "OBRA_SEM_FRENTE" | "SERVICO_FECHADO" | "FOLLOW_UP_NORMAL" | "TRIAGE",
  "confidence": 0.0-1.0,
  "reasoning": "Explicação breve em português"
}`
        },
        { role: 'user', content: message }
      ]
    });

    const responseText = completion.choices[0]?.message?.content || '';
    const parsed = JSON.parse(responseText);
    return {
      intent: (parsed.intent || 'TRIAGE') as AgileIntent,
      confidence: parsed.confidence || 0.5,
      reasoning: parsed.reasoning || 'LLM Agile classification'
    };
  }

  /**
   * Gera resumo de handoff para o comercial (Agile Steel).
   */
  generateAgileHandoffSummary(
    intent: AgileIntent,
    message: string,
    leadName: string,
    targetName: string = 'Daisy',
    proposalNumber?: string
  ): string {
    const proposal = proposalNumber ? ` | Proposta: ${proposalNumber}` : '';
    const summaries: Record<AgileIntent, string> = {
      HANDOFF_HUMANO: `🔥 *${leadName} está PRONTO para execução!*${proposal}\n"${message}"\n⏰ URGENTE — Encaminhar para ${targetName}/Equipe de Orçamentos agora.`,
      LICITACAO_PERDIDA: `⚠️ *${leadName} — Licitação perdida*${proposal}\n"${message}"\n🎯 Ação: ${targetName} deve descobrir a construtora vencedora para repasse.`,
      OBRA_SEM_FRENTE: `📅 *${leadName} — Obra sem frente*${proposal}\n"${message}"\n🔄 Ação: Agendar retorno no CRM.`,
      SERVICO_FECHADO: `🔄 *${leadName} — Serviço fechado com concorrente*${proposal}\n"${message}"\n💡 Ação: Pivot de produto sugerido pela IA.`,
      FOLLOW_UP_NORMAL: `📋 *${leadName} — Follow-up normal*${proposal}\n"${message}"\n⏳ Proposta em análise.`,
      TRIAGE: `❓ *${leadName} — Mensagem sem classificação clara*${proposal}\n"${message}"`
    };
    return summaries[intent];
  }
}

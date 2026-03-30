// src/domain/agent/agile-response.generator.ts
// Gerador de respostas especializado no playbook da Agile Steel.
// Responsável por: first message, cenários OBRA_SEM_FRENTE / LICITACAO_PERDIDA /
// SERVICO_FECHADO / FOLLOW_UP_NORMAL e handoff para a Daisy.

import OpenAI from 'openai';
import { logger } from '../../shared/utils/logger';
import type { AgileIntent, AgileProduct } from '../intent/agile-intent.types';
import {
  detectLanguageFromDDI,
  buildFirstMessage,
  choosePivotProduct,
  buildPivotMessage,
  AGILE_SCENARIO_MESSAGES
} from '../commercial/agile-followup.playbook';

export interface AgileReplyInput {
  /** Nome do contato (engenheiro / arquiteto / comprador) */
  contactName: string;
  /** Número da proposta/orçamento enviado */
  proposalNumber: string;
  /** Telefone com DDI — usado para detectar idioma */
  phone: string;
  /** Mensagem recebida do cliente (undefined = primeira mensagem de abertura) */
  incomingMessage?: string;
  /** Intent classificado pelo IntentClassifier.classifyAgile() */
  intent?: AgileIntent;
  /** Produto principal da proposta que o cliente já fechou com outro (para pivot) */
  lostProduct?: string;
  /** Produtos já oferecidos em pivotagens anteriores (evita repetição) */
  offeredProducts?: AgileProduct[];
  /** Nome do agente humano para handoff */
  handoffAgentName?: string;
}

export interface AgileReplyOutput {
  message: string;
  language: 'PT-BR' | 'PT-PT';
  intent: AgileIntent | 'FIRST_MESSAGE';
  triggerHandoff: boolean;
  pivotProduct?: AgileProduct;
  scheduleFollowUpDays?: number;
}

export class AgileResponseGenerator {
  private openai?: OpenAI;

  constructor(
    apiKey: string,
    private model: string = 'gpt-4o-mini'
  ) {
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  /**
   * Gera a resposta adequada para cada cenário do playbook.
   * Se `incomingMessage` não for fornecida, gera a primeira mensagem de abertura.
   */
  async generateReply(input: AgileReplyInput): Promise<AgileReplyOutput> {
    const language = detectLanguageFromDDI(input.phone);

    // ── Primeira mensagem de abertura ─────────────────────────────────────────
    if (!input.incomingMessage || !input.intent) {
      return {
        message: buildFirstMessage({
          contactName: input.contactName,
          proposalNumber: input.proposalNumber,
          language
        }),
        language,
        intent: 'FIRST_MESSAGE',
        triggerHandoff: false
      };
    }

    const intent = input.intent;

    // ── HANDOFF_HUMANO → Daisy ────────────────────────────────────────────────
    if (intent === 'HANDOFF_HUMANO') {
      return {
        message: AGILE_SCENARIO_MESSAGES.handoffHumano(language, input.handoffAgentName),
        language,
        intent,
        triggerHandoff: true
      };
    }

    // ── OBRA_SEM_FRENTE → Perguntar prazo → agendar retorno ──────────────────
    if (intent === 'OBRA_SEM_FRENTE') {
      return {
        message: AGILE_SCENARIO_MESSAGES.obraSemFrente(language),
        language,
        intent,
        triggerHandoff: false,
        scheduleFollowUpDays: 60
      };
    }

    // ── LICITACAO_PERDIDA → Pedir nome da construtora vencedora ──────────────
    if (intent === 'LICITACAO_PERDIDA') {
      return {
        message: AGILE_SCENARIO_MESSAGES.licitacaoPerdida(language),
        language,
        intent,
        triggerHandoff: false
      };
    }

    // ── SERVICO_FECHADO → Pivot para produto alternativo ──────────────────────
    if (intent === 'SERVICO_FECHADO') {
      const lostProduct = input.lostProduct || 'drywall';
      const pivot = choosePivotProduct(lostProduct, input.offeredProducts ?? []);

      if (!pivot) {
        // Todos os produtos foram oferecidos — entregar para humano
        logger.info('[AgileResponseGenerator] Todos os produtos já foram oferecidos. Handoff para Daisy.');
        return {
          message: AGILE_SCENARIO_MESSAGES.handoffHumano(language, input.handoffAgentName),
          language,
          intent,
          triggerHandoff: true
        };
      }

      return {
        message: buildPivotMessage(pivot, language),
        language,
        intent,
        triggerHandoff: false,
        pivotProduct: pivot
      };
    }

    // ── FOLLOW_UP_NORMAL → Qualificar cronograma ─────────────────────────────
    if (intent === 'FOLLOW_UP_NORMAL') {
      return {
        message: AGILE_SCENARIO_MESSAGES.followUpNormal(language),
        language,
        intent,
        triggerHandoff: false
      };
    }

    // ── TRIAGE → Fallback: perguntar aberta via LLM ──────────────────────────
    const fallback = await this.generateTriageFallback(input, language);
    return {
      message: fallback,
      language,
      intent,
      triggerHandoff: false
    };
  }

  /**
   * Para mensagens de TRIAGE: usa o LLM para gerar uma pergunta aberta contextual.
   * Mantém o personagem da Agile Steel e o foco no cronograma da obra.
   */
  private async generateTriageFallback(
    input: AgileReplyInput,
    language: 'PT-BR' | 'PT-PT'
  ): Promise<string> {
    if (!this.openai || !input.incomingMessage) {
      return language === 'PT-PT'
        ? `Olá, ${input.contactName}! Conseguiu ver a proposta ${input.proposalNumber}? Como é que está a avançar?`
        : `Oi, ${input.contactName}! Conseguiu ver a proposta ${input.proposalNumber}? Como que está o andamento?`;
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        temperature: 0.5,
        max_tokens: 200,
        messages: [
          {
            role: 'system',
            content: `Você é um assistente virtual comercial da Agile Steel, empresa de drywall, steel frame, pisos vinílicos, forro acústico e piso elevado.
Você está fazendo follow-up de uma proposta com ${input.contactName} (proposta ${input.proposalNumber}).

Regras:
- Tom: amigável, rápido e objetivo. Nunca force venda.
- Foco exclusivo: descobrir o cronograma da obra e quando ela terá frente de trabalho.
- Responda em ${language === 'PT-PT' ? 'Português de Portugal' : 'Português do Brasil'}.
- Máximo 2 frases curtas. Apenas 1 pergunta por mensagem.
- Não mencione que é IA.
- Não envie listas de produtos.

Responda apenas com o texto da mensagem para o cliente.`
          },
          {
            role: 'user',
            content: `Mensagem do cliente: "${input.incomingMessage}"`
          }
        ]
      });

      const reply = completion.choices[0]?.message?.content?.trim();
      if (reply) return reply;
    } catch (error) {
      logger.warn('[AgileResponseGenerator] LLM fallback error:', error);
    }

    // Fallback estático
    return language === 'PT-PT'
      ? `Olá, ${input.contactName}! E qual é o cronograma previsto para a obra avançar?`
      : `Oi, ${input.contactName}! E qual é o cronograma previsto pra obra avançar?`;
  }
}

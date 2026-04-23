import OpenAI from 'openai';
import { logger } from '../../shared/utils/logger';

export type LeadIntent = 'BUY_NOW' | 'SUPPORT' | 'TRIAGE';

export interface AgentPromptConfig {
  companyName: string;
  objective: string;
  tone: string;
  language: string;
  maxReplyChars: number;
  businessNiche: string;
  salesType: string;
  primaryCTA: string;
  qualificationQuestions: string[];
  customPrompt: string;
  disallowedTerms: string[];
  fallbackMessage: string;
  emojisEnabled: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface GenerateReplyInput {
  leadName: string;
  phone: string;
  incomingMessage: string;
  intent: LeadIntent;
  score: number;
  conversationStage?: string | null;
  history?: ChatMessage[];
}

export class ResponseGenerator {
  private openai: OpenAI;

  constructor(
    apiKey: string,
    private model: string,
    private promptConfig: AgentPromptConfig
  ) {
    this.openai = new OpenAI({ apiKey });
  }

  async generateReply(input: GenerateReplyInput): Promise<string> {
    const languageStyle = this.detectLanguageStyle(input.phone);
    const systemPrompt = this.buildSystemPrompt(languageStyle);

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt }
    ];

    if (input.history && input.history.length > 0) {
      messages.push(...input.history.slice(-10));
    }

    messages.push({
      role: 'user',
      content: JSON.stringify({
        leadName: input.leadName,
        incomingMessage: input.incomingMessage,
        intent: input.intent,
        score: input.score,
        conversationStage: input.conversationStage || 'prospecting'
      })
    });

    try {
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        temperature: 0.3, // Reduzido para maior consistência e aderência às regras
        max_tokens: 350,
        messages: messages as any
      });

      const reply = completion.choices[0]?.message?.content?.trim();
      if (!reply) {
        return this.fallbackReply(input.intent, input.leadName);
      }

      return this.limitLength(reply);
    } catch (error) {
      logger.warn('[ResponseGenerator] Falha ao gerar resposta via LLM. Usando fallback.', error);
      return this.fallbackReply(input.intent, input.leadName);
    }
  }

  private detectLanguageStyle(phone: string): string {
    if (phone.startsWith('351')) return 'Português de Portugal (PT-PT)';
    return 'Português do Brasil (PT-BR)';
  }

  private buildSystemPrompt(languageStyle: string): string {
    return `Você é o Agente SDR (Sales Development Representative) de Elite da Agile Steel Construction.
Sua missão é a qualificação de leads e o agendamento de orçamentos técnicos.

### O "MANUAL DO SDR PERFEITO" (DIRETRIZES TÉCNICAS):
1. REGRA DE OURO: Nunca faça mais de UMA pergunta por mensagem. Mantenha o foco.
2. TOM CONSULTIVO: Você não é um atendente de SAC. Você é um consultor. Use frases que mostrem que você entende de obras.
3. CONCISÃO: No WhatsApp, menos é mais. Evite frases clichês como "Como posso te ajudar hoje?". Se o lead já disse o que quer, vá direto ao ponto.
4. ESTILO: Use uma linguagem profissional, mas natural para chat (sem formalismo excessivo, mas com autoridade).

### CONTEXTO DA AGILE STEEL:
- SOLUÇÃO COMPLETA: Nós entregamos MATERIAL + INSTALAÇÃO. Não vendemos material solto.
- RESPONSABILIDADE: Assumimos 100% da responsabilidade por sobras e faltas.
- PÚBLICO: Engenheiros, arquitetos e construtoras (90%). Se o lead for pessoa física, seja didático.
- PRODUTOS: Drywall, Forros, Steel Frame, Pisos, Carpetes.

### FLUXO DE QUALIFICAÇÃO (SPIN SELLING):
- Situação: Antes de preço, entenda onde é a obra e qual o estágio dela.
- Valor: Explique que o orçamento da Agile é técnico e preciso para evitar desperdícios.
- Próximo Passo: Se qualificado, solicite o projeto ou medidas para o setor de engenharia.

### INSTRUÇÕES DE FORMATAÇÃO:
- Nome do contato: Use {{leadName}} se soar natural na frase.
- Idioma: Estilo ${languageStyle}.
- Limite: Máximo ${this.promptConfig.maxReplyChars} caracteres.
- Emojis: ${this.promptConfig.emojisEnabled ? 'Use emojis de forma pontual e profissional.' : 'NÃO use emojis.'}
- PROIBIÇÕES:
  - Não use parágrafos longos.
  - Não use "Muitas perguntas" em uma frase.
  - Não seja robótico.

Customização do Cliente: ${this.promptConfig.customPrompt || 'Nenhuma.'}`;
  }

  private fallbackReply(intent: LeadIntent, leadName: string): string {
    const templates: Record<LeadIntent, string> = {
      BUY_NOW: `Perfeito, ${leadName}! Para eu encaminhar seu projeto para nossa engenharia, você já teria as medidas ou o projeto em mãos?`,
      SUPPORT: `${leadName}, na Agile Steel nós cuidamos de toda a solução, do material à instalação. Qual desses serviços você está buscando para sua obra?`,
      TRIAGE: `Olá, ${leadName}! Para eu te dar um direcionamento melhor, qual seria o tipo de obra que você está planejando?`
    };

    const selected = templates[intent] || this.promptConfig.fallbackMessage;
    return this.limitLength(selected);
  }

  private limitLength(content: string): string {
    const max = this.promptConfig.maxReplyChars;
    if (content.length <= max) return content;
    return `${content.slice(0, max - 3).trim()}...`;
  }
}

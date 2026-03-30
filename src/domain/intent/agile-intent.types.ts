// src/domain/intent/agile-intent.types.ts
// Tipos de intenção específicos do playbook comercial da Agile Steel.

/**
 * Intenções mapeadas ao playbook de follow-up de propostas/orçamentos.
 *
 * OBRA_SEM_FRENTE    → Cliente diz que obra ainda não tem frente de trabalho
 *                       Ação: perguntar prazo → agendar retorno (ex: 60 dias)
 *
 * LICITACAO_PERDIDA  → Construtora não ganhou a licitação / era só orçamentista
 *                       Ação: perguntar qual construtora ganhou (oportunidade de repassar proposta)
 *
 * SERVICO_FECHADO    → Cliente fechou o serviço principal com concorrente
 *                       Ação: pivot para um produto diferente (1 por vez, por perfil de obra)
 *
 * HANDOFF_HUMANO     → Obra vai começar agora OU cliente faz pergunta técnica específica
 *                       Ação: encerrar automação, transferir para Daisy (humano comercial)
 *
 * FOLLOW_UP_NORMAL   → Cliente responde de forma neutra, proposta em análise
 *                       Ação: qualificar cronograma suavemente, manter contato
 *
 * TRIAGE             → Mensagem não classificada ou ambígua
 *                       Ação: fazer uma pergunta aberta para entender contexto
 */
export type AgileIntent =
  | 'OBRA_SEM_FRENTE'
  | 'LICITACAO_PERDIDA'
  | 'SERVICO_FECHADO'
  | 'HANDOFF_HUMANO'
  | 'FOLLOW_UP_NORMAL'
  | 'TRIAGE';

export interface AgileClassificationResult {
  intent: AgileIntent;
  confidence: number;
  reasoning: string;
  triggeredKeywords?: string[];
  /** Produto alternativo sugerido para pivotagem (apenas quando intent = SERVICO_FECHADO) */
  pivotProduct?: string;
  /** Idioma detectado pelo DDI do número */
  language?: 'PT-BR' | 'PT-PT';
}

/**
 * Produtos da Agile Steel disponíveis para pivotagem.
 * Ordenados por estratégia: do mais complementar ao mais independente.
 */
export const AGILE_PRODUCTS = [
  'drywall',
  'pisos vinílicos',
  'forro acústico',
  'steel frame',
  'piso elevado'
] as const;

export type AgileProduct = typeof AGILE_PRODUCTS[number];

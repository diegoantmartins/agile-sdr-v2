// src/domain/commercial/agile-followup.playbook.ts
// Playbook comercial de follow-up da Agile Steel.
// Define templates, detecção de idioma, produtos para pivotagem e regras de ação.

import { AgileIntent, AgileProduct, AGILE_PRODUCTS } from '../intent/agile-intent.types';

// ─── Detecção de Idioma por DDI ──────────────────────────────────────────────

/**
 * Detecta o idioma com base no DDI (código do país) do número de telefone.
 * Suporta PT-BR (Brasil, DDI 55) e PT-PT (Portugal, DDI 351).
 * Default: PT-BR.
 */
export function detectLanguageFromDDI(phone: string): 'PT-BR' | 'PT-PT' {
  // Normaliza: remove espaços, traços, parênteses
  const clean = phone.replace(/[\s\-\(\)]/g, '');

  // Portugal: +351 ou 00351
  if (clean.startsWith('+351') || clean.startsWith('00351') || clean.startsWith('351')) {
    return 'PT-PT';
  }

  // Brasil: +55 ou 0055 ou apenas 55
  return 'PT-BR';
}

// ─── Template da Primeira Mensagem (Abordagem Inicial) ───────────────────────

export interface FirstMessageParams {
  contactName: string;
  proposalNumber: string;
  language: 'PT-BR' | 'PT-PT';
}

/**
 * Gera a primeira mensagem de follow-up conforme o playbook da Agile Steel.
 * Estrutura: "Oi, {{Nome}}, bem? Como você está? Então a proposta {{Número}}, como que está o andamento dela?"
 * Adapta pronomes e vocabulário para PT-BR ou PT-PT.
 */
export function buildFirstMessage(params: FirstMessageParams): string {
  const { contactName, proposalNumber, language } = params;

  if (language === 'PT-PT') {
    return `Olá, ${contactName}, tudo bem? Como está? Então a proposta ${proposalNumber}, como é que está a decorrer?`;
  }

  return `Oi, ${contactName}, bem? Como você está? Então a proposta ${proposalNumber}, como que está o andamento dela?`;
}

// ─── Mapa de Produtos para Pivotagem ────────────────────────────────────────

/**
 * Escolhe o produto alternativo a oferecer quando o cliente fechou o produto principal
 * com um concorrente. A lógica prioriza produtos complementares ao que foi perdido.
 *
 * Regra estrita: oferecer apenas 1 produto por vez, escolhido por perfil de obra.
 */
export function choosePivotProduct(
  lostProduct: string,
  alreadyOfferedProducts: AgileProduct[] = []
): AgileProduct | null {
  // Mapa de complementaridade: o que oferecer quando X foi perdido
  const complementMap: Record<string, AgileProduct[]> = {
    drywall: ['pisos vinílicos', 'forro acústico', 'piso elevado', 'steel frame'],
    'steel frame': ['drywall', 'pisos vinílicos', 'forro acústico', 'piso elevado'],
    'pisos vinílicos': ['forro acústico', 'drywall', 'piso elevado', 'steel frame'],
    'forro acústico': ['pisos vinílicos', 'drywall', 'piso elevado', 'steel frame'],
    'piso elevado': ['pisos vinílicos', 'forro acústico', 'drywall', 'steel frame']
  };

  const normalizedLost = lostProduct.toLowerCase().trim();
  const candidates = complementMap[normalizedLost] ?? [...AGILE_PRODUCTS];

  // Filtra produtos já oferecidos (sem repetir)
  const remaining = candidates.filter(p => !alreadyOfferedProducts.includes(p));
  return remaining[0] ?? null;
}

/**
 * Gera a mensagem de pivotagem para um produto alternativo.
 * Tom: introdução natural, uma pergunta sobre o perfil da obra.
 */
export function buildPivotMessage(product: AgileProduct, language: 'PT-BR' | 'PT-PT'): string {
  const pivotCopies: Record<AgileProduct, { brPT: string; ptPT: string }> = {
    'pisos vinílicos': {
      brPT: `Entendido! Você sabia que a gente trabalha com pisos vinílicos também? Fica incrível em obras corporativas e hospitalares. Qual o perfil da obra no geral?`,
      ptPT: `Percebido! Sabia que também trabalhamos com pisos vinílicos? Ficam fantásticos em obras corporativas e hospitalares. Qual é o perfil geral da obra?`
    },
    'forro acústico': {
      brPT: `Entendido! Por sinal, a gente também tem soluções em forro acústico que complementam muito bem o projeto. Tem área de escritório ou sala de reunião na obra?`,
      ptPT: `Percebido! Aliás, também temos soluções em teto acústico que complementam muito bem o projeto. Existe área de escritório ou sala de reunião na obra?`
    },
    'steel frame': {
      brPT: `Entendido! A proposta teve foco no drywall, mas a gente também executa em steel frame. Você já pensou nessa solução para essa obra?`,
      ptPT: `Percebido! A proposta focou no drywall, mas também executamos em steel frame. Já considerou essa solução para a obra?`
    },
    'piso elevado': {
      brPT: `Entendido! Por sinal, a Agile também fornece piso elevado — muito utilizado em data centers e ambientes técnicos. A obra tem algum espaço desse tipo?`,
      ptPT: `Percebido! A Agile também fornece piso elevado — muito utilizado em data centers e ambientes técnicos. A obra inclui algum espaço desse tipo?`
    },
    drywall: {
      brPT: `Entendido! Mas sabia que a gente também executa drywall em diferentes espessuras e perfis? Dependendo do escopo ainda dá pra comparar alternativas.`,
      ptPT: `Percebido! Mas sabia que também executamos drywall em diferentes espessuras e perfis? Dependendo do âmbito ainda é possível comparar alternativas.`
    }
  };

  const copy = pivotCopies[product];
  return language === 'PT-PT' ? copy.ptPT : copy.brPT;
}

// ─── Mensagens de Cenário ────────────────────────────────────────────────────

export interface ScenarioMessages {
  obraSemFrente: (language: 'PT-BR' | 'PT-PT') => string;
  licitacaoPerdida: (language: 'PT-BR' | 'PT-PT') => string;
  handoffHumano: (language: 'PT-BR' | 'PT-PT', agentName?: string) => string;
  followUpNormal: (language: 'PT-BR' | 'PT-PT') => string;
}

export const AGILE_SCENARIO_MESSAGES: ScenarioMessages = {
  obraSemFrente: (lang) =>
    lang === 'PT-PT'
      ? `Percebo, sem problema! Aproximadamente daqui a quanto tempo estimam ter frente de trabalho para avançar? Assim consigo agendar um contacto mais oportuno. 😊`
      : `Entendo, sem problema! Aproximadamente daqui a quanto tempo vocês estimam ter frente de trabalho pra avançar? Assim já agendo um retorno no momento certo. 😊`,

  licitacaoPerdida: (lang) =>
    lang === 'PT-PT'
      ? `Que pena! Pode dizer-me qual foi a construtora que ganhou a licitação? A nossa equipa pode verificar se consegue ajudá-los directamente.`
      : `Que pena! Você sabe me dizer qual construtora ganhou a licitação? Nossa equipe pode tentar alcançar eles com o orçamento já pronto.`,

  handoffHumano: (lang, agentName = 'Daisy') =>
    lang === 'PT-PT'
      ? `Ótimo, que bom que avançou! Vou passar a conversa para a ${agentName}, que é quem nos acompanha nesta fase. Ela entrará brevemente em contacto. 🤝`
      : `Ótimo, que bom que avançou! Vou passar essa conversa pra ${agentName}, que é quem cuida dessa etapa aqui. Ela já entra em contato com você em breve. 🤝`,

  followUpNormal: (lang) =>
    lang === 'PT-PT'
      ? `Tudo bem! E qual é o cronograma previsto para a obra avançar? Assim consigo alinhar melhor os próximos passos.`
      : `Tudo certo! E qual é o cronograma previsto pra obra avançar? Assim já consigo alinhar melhor os próximos passos.`
};

// ─── Alias de Ações por Intent ──────────────────────────────────────────────

/**
 * Descreve a ação recomendada para cada intent classificado.
 * Usada pelo ResponseGenerator para decidir qual mensagem construir.
 */
export const AGILE_INTENT_ACTIONS: Record<AgileIntent, string> = {
  OBRA_SEM_FRENTE: 'Perguntar prazo estimado de frente de trabalho e agendar retorno',
  LICITACAO_PERDIDA: 'Perguntar o nome da construtora que ganhou a licitação',
  SERVICO_FECHADO: 'Oferecer um produto alternativo da Agile Steel (pivot, 1 por vez)',
  HANDOFF_HUMANO: 'Encerrar automação e transferir para atendimento humano (Daisy)',
  FOLLOW_UP_NORMAL: 'Qualificar cronograma suavemente e manter presença',
  TRIAGE: 'Fazer uma pergunta aberta para entender o contexto da obra'
};

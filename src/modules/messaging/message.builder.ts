export class MessageBuilder {
  /**
   * Primeiro contato para reativação de base (Agile Steel)
   */
  buildFirstTouch(input: {
    name?: string | null;
    projectName?: string | null;
  }): string {
    const firstName = input.name ? input.name.split(' ')[0] : 'tudo bem';
    const namePlaceholder = input.name ? firstName : 'amigo(a)';

    return `Oi, ${namePlaceholder}, tudo bem? Aqui é da Agile Steel. Faz um tempo que não nos falamos, você está com alguma obra em andamento agora?`;
  }

  /**
   * Follow-up de propostas já existentes (Segundo Agente)
   */
  buildProposalFollowUp(input: {
    name?: string | null;
    proposalNumber: string;
  }): string {
    const firstName = input.name ? input.name.split(' ')[0] : 'como você está';
    const namePlaceholder = input.name ? firstName : 'tudo bem';

    return `Oi, ${namePlaceholder}, bem? Como você está? Então a proposta ${input.proposalNumber}, como que está o andamento dela?`;
  }

  buildHandoffNote(intent: string): string {
    return `Lead reativado automaticamente.\nIntenção detectada: ${intent}\nFavor assumir o atendimento no Chatwoot (equipe Daisy).`;
  }
}

export const messageBuilder = new MessageBuilder();

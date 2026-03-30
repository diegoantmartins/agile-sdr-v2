export class MessageBuilder {
  buildFirstTouch(input: {
    name?: string | null;
    productName: string;
    projectName?: string | null;
  }): string {
    const firstName = input.name ? input.name.split(' ')[0] : 'Olá';
    const projectChunk = input.projectName
      ? ` sobre o projeto "${input.projectName}"`
      : "";

    return `Olá, ${firstName}. Tudo bem?

Estou retomando o contato${projectChunk} referente ao orçamento de ${input.productName}.

Queria entender se essa demanda ainda está em andamento ou se ficou para mais à frente.`;
  }

  buildHandoffNote(intent: string): string {
    return `Lead reativado automaticamente.\nIntenção detectada: ${intent}\nFavor assumir o atendimento.`;
  }
}

export const messageBuilder = new MessageBuilder();

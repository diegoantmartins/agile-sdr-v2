export type Intent = 
  | 'INTERESTED_NOW'
  | 'LATER'
  | 'NO_INTEREST'
  | 'NEEDS_NEW_QUOTE'
  | 'WANTS_HUMAN'
  | 'INVALID_CONTACT'
  | 'UNCLASSIFIED';

export class IntentDetector {
  detect(message: string): Intent {
    const text = message.toLowerCase();

    if (
      text.includes("novo orçamento") ||
      text.includes("preciso de outro") ||
      text.includes("manda novamente") ||
      text.includes("atualizar")
    ) return "NEEDS_NEW_QUOTE";

    if (
      text.includes("pode me ligar") ||
      text.includes("quero falar") ||
      text.includes("me chama") ||
      text.includes("contato humano")
    ) return "WANTS_HUMAN";

    if (
      text.includes("agora sim") ||
      text.includes("vamos tocar") ||
      text.includes("já iniciou") ||
      text.includes("comprar")
    ) return "INTERESTED_NOW";

    if (
      text.includes("mais pra frente") ||
      text.includes("não agora") ||
      text.includes("depois") ||
      text.includes("mês que vem")
    ) return "LATER";

    if (
      text.includes("não tenho interesse") ||
      text.includes("não preciso") ||
      text.includes("encerrar") ||
      text.includes("parou") ||
      text.includes("já fechamos")
    ) return "NO_INTEREST";

    return "UNCLASSIFIED";
  }

  isHighCommercialIntent(intent: Intent): boolean {
    return [
      "INTERESTED_NOW",
      "NEEDS_NEW_QUOTE",
      "WANTS_HUMAN"
    ].includes(intent);
  }
}

export const intentDetector = new IntentDetector();

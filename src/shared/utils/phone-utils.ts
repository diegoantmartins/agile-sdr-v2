// src/shared/utils/phone-utils.ts

export type LanguageVariant = 'pt-BR' | 'pt-PT';

export interface PhoneInfo {
  ddi: string;
  language: LanguageVariant;
  cleanPhone: string;
}

/**
 * Detect DDI and determine the appropriate language variant.
 */
export function getPhoneInfo(phone: string): PhoneInfo {
  // Remove all non-digits
  const cleanPhone = phone.replace(/\D/g, '');
  
  // DDI Portugal: 351
  if (cleanPhone.startsWith('351')) {
    return {
      ddi: '351',
      language: 'pt-PT',
      cleanPhone
    };
  }
  
  // DDI Brasil: 55 (default for this project context)
  if (cleanPhone.startsWith('55')) {
    return {
      ddi: '55',
      language: 'pt-BR',
      cleanPhone
    };
  }

  // Fallback to BR if no specific DDI detected (assuming local BR numbers without DDI)
  return {
    ddi: '55',
    language: 'pt-BR',
    cleanPhone: cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`
  };
}

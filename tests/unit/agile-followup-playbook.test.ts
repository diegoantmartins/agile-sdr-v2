// tests/unit/agile-followup-playbook.test.ts

import { describe, it, expect } from 'vitest';
import {
  detectLanguageFromDDI,
  buildFirstMessage,
  choosePivotProduct,
  buildPivotMessage,
  AGILE_SCENARIO_MESSAGES
} from '@domain/commercial/agile-followup.playbook';

describe('detectLanguageFromDDI', () => {
  it('detecta PT-BR para DDI Brasil (+55)', () => {
    expect(detectLanguageFromDDI('+5511999999999')).toBe('PT-BR');
    expect(detectLanguageFromDDI('5511999999999')).toBe('PT-BR');
    expect(detectLanguageFromDDI('+55 11 9 9999-9999')).toBe('PT-BR');
  });

  it('detecta PT-PT para DDI Portugal (+351)', () => {
    expect(detectLanguageFromDDI('+351912345678')).toBe('PT-PT');
    expect(detectLanguageFromDDI('00351912345678')).toBe('PT-PT');
    expect(detectLanguageFromDDI('351912345678')).toBe('PT-PT');
  });

  it('default PT-BR para número desconhecido', () => {
    expect(detectLanguageFromDDI('1234567890')).toBe('PT-BR');
  });
});

describe('buildFirstMessage', () => {
  it('gera mensagem de abertura em PT-BR', () => {
    const msg = buildFirstMessage({
      contactName: 'Ricardo',
      proposalNumber: 'AGS-2024-001',
      language: 'PT-BR'
    });
    expect(msg).toContain('Ricardo');
    expect(msg).toContain('AGS-2024-001');
    expect(msg).toContain('você');
  });

  it('gera mensagem de abertura em PT-PT', () => {
    const msg = buildFirstMessage({
      contactName: 'Carlos',
      proposalNumber: 'AGS-2024-002',
      language: 'PT-PT'
    });
    expect(msg).toContain('Carlos');
    expect(msg).toContain('AGS-2024-002');
    expect(msg).toContain('decorrer');
  });
});

describe('choosePivotProduct', () => {
  it('retorna produto complementar quando drywall foi perdido', () => {
    const pivot = choosePivotProduct('drywall');
    expect(pivot).not.toBeNull();
    expect(pivot).not.toBe('drywall');
  });

  it('exclui produtos já oferecidos', () => {
    const pivot = choosePivotProduct('drywall', ['pisos vinílicos']);
    expect(pivot).not.toBe('pisos vinílicos');
    expect(pivot).not.toBe('drywall');
  });

  it('retorna null quando todos os produtos foram oferecidos', () => {
    const allAlreadyOffered = ['pisos vinílicos', 'forro acústico', 'piso elevado', 'steel frame'];
    const pivot = choosePivotProduct('drywall', allAlreadyOffered as any);
    expect(pivot).toBeNull();
  });
});

describe('buildPivotMessage', () => {
  it('gera mensagem de pivotagem para pisos vinílicos em PT-BR', () => {
    const msg = buildPivotMessage('pisos vinílicos', 'PT-BR');
    expect(msg).toContain('pisos vinílicos');
    expect(msg).toBeTruthy();
  });

  it('gera mensagem de pivotagem para forro acústico em PT-PT', () => {
    const msg = buildPivotMessage('forro acústico', 'PT-PT');
    expect(msg).toBeTruthy();
    expect(msg.length).toBeGreaterThan(20);
  });
});

describe('AGILE_SCENARIO_MESSAGES', () => {
  it('obraSemFrente pergunta prazo em PT-BR', () => {
    const msg = AGILE_SCENARIO_MESSAGES.obraSemFrente('PT-BR');
    expect(msg).toContain('frente de trabalho');
  });

  it('licitacaoPerdida pede nome da construtora em PT-BR', () => {
    const msg = AGILE_SCENARIO_MESSAGES.licitacaoPerdida('PT-BR');
    expect(msg).toContain('construtora');
  });

  it('handoffHumano menciona a Daisy em PT-BR', () => {
    const msg = AGILE_SCENARIO_MESSAGES.handoffHumano('PT-BR', 'Daisy');
    expect(msg).toContain('Daisy');
  });

  it('handoffHumano menciona nome customizado em PT-PT', () => {
    const msg = AGILE_SCENARIO_MESSAGES.handoffHumano('PT-PT', 'Sofia');
    expect(msg).toContain('Sofia');
  });
});

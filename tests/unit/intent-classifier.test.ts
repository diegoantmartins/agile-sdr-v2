// tests/unit/intent-classifier.test.ts

import { describe, it, expect } from 'vitest';
import { IntentClassifier } from '@domain/intent/intent.classifier';

describe('IntentClassifier', () => {
  const classifier = new IntentClassifier('test-key', 'gpt-4o-mini');

  describe('Pattern Matching', () => {
    it('deve detectar BUY_NOW intent', async () => {
      const result = await classifier.classify('quero contratar agora');
      expect(result.intent).toBe('BUY_NOW');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('deve detectar SUPPORT intent', async () => {
      const result = await classifier.classify('como funciona?');
      expect(result.intent).toBe('SUPPORT');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('deve padrão TRIAGE para mensagem desconhecida', async () => {
      const result = await classifier.classify('oi');
      expect(result.confidence).toBeLessThanOrEqual(0.5);
    });
  });

  describe('generateHandoffSummary', () => {
    it('deve gerar summary para BUY_NOW', () => {
      const summary = classifier.generateHandoffSummary(
        'BUY_NOW',
        'Quero contratar agora',
        'João'
      );
      expect(summary).toContain('🔥');
      expect(summary).toContain('João');
    });
  });

  describe('classifyAgile — Pattern Matching', () => {
    it('detecta OBRA_SEM_FRENTE', async () => {
      const result = await classifier.classifyAgile('não tem frente ainda');
      expect(result.intent).toBe('OBRA_SEM_FRENTE');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('detecta LICITACAO_PERDIDA', async () => {
      const result = await classifier.classifyAgile('perdemos a licitação');
      expect(result.intent).toBe('LICITACAO_PERDIDA');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('detecta SERVICO_FECHADO', async () => {
      const result = await classifier.classifyAgile('já fechei o drywall com outra empresa');
      expect(result.intent).toBe('SERVICO_FECHADO');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('detecta HANDOFF_HUMANO quando obra começa agora', async () => {
      const result = await classifier.classifyAgile('a obra vai começar essa semana');
      expect(result.intent).toBe('HANDOFF_HUMANO');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('detecta HANDOFF_HUMANO para pergunta técnica', async () => {
      const result = await classifier.classifyAgile('qual espessura de perfil metálico vocês recomendam?');
      expect(result.intent).toBe('HANDOFF_HUMANO');
    });

    it('detecta FOLLOW_UP_NORMAL', async () => {
      const result = await classifier.classifyAgile('ainda em análise, aguardando aprovação');
      expect(result.intent).toBe('FOLLOW_UP_NORMAL');
    });

    it('retorna TRIAGE para mensagem genérica', async () => {
      const result = await classifier.classifyAgile('oi');
      expect(result.intent).toBe('TRIAGE');
    });
  });

  describe('generateAgileHandoffSummary', () => {
    it('gera summary de handoff HUMANO com número de proposta', () => {
      const summary = classifier.generateAgileHandoffSummary(
        'HANDOFF_HUMANO',
        'A obra vai começar essa semana',
        'Ricardo',
        'Daisy',
        'AGS-2024-001'
      );
      expect(summary).toContain('🔥');
      expect(summary).toContain('Ricardo');
      expect(summary).toContain('AGS-2024-001');
      expect(summary).toContain('Daisy');
    });

    it('gera summary de LICITACAO_PERDIDA', () => {
      const summary = classifier.generateAgileHandoffSummary(
        'LICITACAO_PERDIDA',
        'Perdemos a licitação',
        'Marcos'
      );
      expect(summary).toContain('⚠️');
      expect(summary).toContain('Marcos');
    });
  });
});

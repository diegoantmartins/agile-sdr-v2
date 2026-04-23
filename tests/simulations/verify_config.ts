import { AgentConfigStore } from '../../src/domain/agent/agent-config.store';
import * as fs from 'fs';
import * as path from 'path';

async function testConfigPersistence() {
  const testPath = path.join(__dirname, '../../agent-config.test.json');
  
  // 1. Initialize with defaults
  const store = new AgentConfigStore(testPath, {
    autoReplyEnabled: true,
    companyName: 'Test Inc',
    objective: 'Test Objective',
    tone: 'test tone',
    language: 'português do Brasil',
    maxReplyChars: 420,
    businessNiche: 'Test Niche',
    salesType: 'consultiva',
    primaryCTA: 'Test CTA',
    qualificationQuestions: ['Q1', 'Q2'],
    customPrompt: 'Test Prompt',
    fallbackMessage: 'Fallback',
    emojisEnabled: true,
    handoffEnabled: true,
    sendToChatwoot: true,
    sendToSlack: false,
    disallowedTerms: ['term1'],
    // Agile Specifics
    handoffLabels: ['label1', 'label2'],
    handoffTargetName: 'Daisy-Test',
    pivotProducts: ['Pivot1', 'Pivot2'],
    primaryProduct: 'Product1',
    enableDdiLanguageDetection: true
  });

  await store.init();
  console.log('✅ Store inicializada');

  // 2. Update with new values
  await store.updateConfig({
    companyName: 'Agile Steel Updated',
    handoffTargetName: 'Ricardo',
    handoffLabels: ['agile-handoff', 'urgente-test']
  });
  console.log('✅ Configuração atualizada');

  // 3. Re-read from disk to verify persistence
  const raw = fs.readFileSync(testPath, 'utf-8');
  const diskData = JSON.parse(raw);
  
  if (diskData.companyName === 'Agile Steel Updated' && 
      diskData.handoffTargetName === 'Ricardo' &&
      diskData.handoffLabels.includes('urgente-test')) {
    console.log('✨ VALIDAÇÃO DE PERSISTÊNCIA: SUCESSO');
  } else {
    console.error('❌ VALIDAÇÃO DE PERSISTÊNCIA: FALHA');
    console.log('Dados no disco:', diskData);
    process.exit(1);
  }

  // Cleanup
  fs.unlinkSync(testPath);
}

testConfigPersistence().catch(err => {
  console.error(err);
  process.exit(1);
});

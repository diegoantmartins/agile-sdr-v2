import { scoringService } from '../modules/opportunities/scoring.service';
import { messageBuilder } from '../modules/messaging/message.builder';
import { Opportunity, Budget, Contact } from '@prisma/client';

async function testReactivationLogic() {
  console.log('🧪 Starting Reactivation Logic Verification...\n');

  // Mocks
  const mockContact = { name: 'João Silva', phone: '5511999999999' } as Contact;
  const mockBudget = { 
    projectName: 'Residencial Alpha', 
    product: 'Drywall', 
    value: 15000, 
    sentAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 days ago 
  } as Budget;

  const mockOpportunity = {
    contactId: '1',
    budgetId: '1',
    stage: 'sent',
    temperature: 'cold'
  } as Opportunity;

  // 1. Test Scoring
  console.log('--- Testing Scoring ---');
  const score = scoringService.calculateScore(mockOpportunity, mockBudget);
  console.log(`Budget: ${mockBudget.product} | Value: ${mockBudget.value} | Days ago: 10`);
  console.log(`Resulting Score: ${score}`);
  if (score >= 70) console.log('✅ PASS: High priority detected correctly');
  else console.log('❌ FAIL: Score lower than expected');

  // 2. Test Message Generation
  console.log('\n--- Testing Message Generation ---');
  const message = messageBuilder.buildReactivation(mockContact, mockBudget);
  console.log('Generated Message:');
  console.log(`"${message}"`);
  
  if (message.includes('João Silva') && message.includes('Drywall') && message.includes('Residencial Alpha')) {
    console.log('✅ PASS: Message contextually correct');
  } else {
    console.log('❌ FAIL: Message missing key context');
  }

  console.log('\n🏁 Verification Complete.');
}

testReactivationLogic().catch(console.error);

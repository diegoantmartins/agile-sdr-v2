import { scoringService } from '../modules/opportunities/scoring.service';
import { messageBuilder } from '../modules/messaging/message.builder';
import { Contact } from '@prisma/client';

async function testReactivationLogic() {
  console.log('🧪 Starting Reactivation Logic Verification...\n');

  // Mocks
  const mockContact = { name: 'João Silva', phone: '5511999999999' } as Contact;

  const scoringInput = {
    budgetDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    status: 'sent',
    budgetValue: 15000,
  };

  // 1. Test Scoring
  console.log('--- Testing Scoring ---');
  const score = scoringService.calculate(scoringInput);
  console.log(`Budget: Drywall | Value: ${scoringInput.budgetValue} | Days ago: 10`);
  console.log(`Resulting Score: ${score}`);
  if (score >= 70) console.log('✅ PASS: High priority detected correctly');
  else console.log('❌ FAIL: Score lower than expected');

  // 2. Test Message Generation
  console.log('\n--- Testing Message Generation ---');
  const message = messageBuilder.buildFirstTouch({
    name: mockContact.name,
    projectName: 'Residencial Alpha',
  });
  console.log('Generated Message:');
  console.log(`"${message}"`);

  if (message.includes('João')) {
    console.log('✅ PASS: Message contextually correct');
  } else {
    console.log('❌ FAIL: Message missing key context');
  }

  console.log('\n🏁 Verification Complete.');
}

testReactivationLogic().catch(console.error);

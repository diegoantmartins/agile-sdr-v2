import { AgentOrchestrator } from '../../src/application/orchestrator/agent.orchestrator';
import { chatService } from '../../src/services/chatwootService';
import { PrismaClient, LeadStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Mocking chatService.addLabels to capture calls
let capturedLabels: { phone: string, labels: string[] }[] = [];
chatService.addLabels = async (phone: string, labels: string[]) => {
  capturedLabels.push({ phone, labels });
  return true;
};

async function setupLead(phone: string) {
  return await prisma.activeLead.upsert({
    where: { tenant_phone_unique: { tenantId: 'test-tenant', phone } },
    update: { status: LeadStatus.TRIAGE, score: 0 },
    create: {
      tenantId: 'test-tenant',
      phone,
      name: 'Lead de Teste',
      status: LeadStatus.TRIAGE,
      score: 0
    }
  });
}

async function runSimulation() {
  console.log('🚀 INICIANDO SIMULAÇÃO DE FLUXO AGILE STEEL\n');
  const orchestrator = new AgentOrchestrator();

  const scenarios = [
    {
      name: 'Cenário 1: Handoff Humano (Obra começa agora)',
      phone: '5511999999999', // Brasil
      message: 'A obra vai começar agora e preciso de um orçamento técnico de drywall.',
      expectedIntent: 'HANDOFF_HUMANO',
      expectedLabels: ['agile-handoff', 'urgente', 'produto-drywall']
    },
    {
      name: 'Cenário 2: Pivot de Produto (Já fechou)',
      phone: '351912345678', // Portugal
      message: 'Olá, já fechamos o drywall com outra empresa. O que vcs tem de piso vinílico?',
      expectedIntent: 'SERVICO_FECHADO',
      expectedLabels: ['agile-intent-servico_fechado', 'agile-pivot', 'produto-piso']
    },
    {
      name: 'Cenário 3: Follow-up Normal (Em análise)',
      phone: '5511988888888',
      message: 'Ainda estamos analisando a proposta técnica que vcs mandaram.',
      expectedIntent: 'FOLLOW_UP_NORMAL',
      expectedLabels: ['agile-intent-follow_up_normal']
    }
  ];

  for (const scenario of scenarios) {
    console.log(`--- ${scenario.name} ---`);
    console.log(`Lead: ${scenario.phone} | Msg: "${scenario.message}"`);
    
    await setupLead(scenario.phone);
    
    try {
      capturedLabels = [];
      const reply = await orchestrator.processIncomingMessage(
        'test-tenant',
        scenario.phone,
        scenario.message
      );

      console.log(`🤖 IA Respondeu: "${reply?.slice(0, 80)}..."`);
      
      const labelsApplied = capturedLabels[0]?.labels || [];
      console.log(`🏷️ Etiquetas aplicadas: [${labelsApplied.join(', ')}]`);

      // Verificações
      const hasCorrectLabels = scenario.expectedLabels.every(l => labelsApplied.includes(l));
      if (hasCorrectLabels) {
        console.log('✅ VALIDAÇÃO: SUCESSO\n');
      } else {
        console.log('❌ VALIDAÇÃO: FALHA (Etiquetas incompletas)\n');
      }
    } catch (error: any) {
      console.error(`❌ Erro no cenário: ${error.message}\n`);
    }
  }
}

runSimulation().catch(console.error);

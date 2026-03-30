// prisma/seed.ts
// Popula o banco com dados de teste para o agente de reativação comercial Agile Steel

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de dados da Agile Steel...\n');

  // 1. Contatos de teste
  const contacts = await Promise.all([
    prisma.contact.upsert({
      where: { phone: '5511999990001' },
      update: {},
      create: {
        phone: '5511999990001',
        name: 'João Arquiteto',
        email: 'joao@arq.com.br',
        company: 'Arq Studio BKO',
        profile: 'Arquiteto',
      }
    }),
    prisma.contact.upsert({
      where: { phone: '5511999990002' },
      update: {},
      create: {
        phone: '5511999990002',
        name: 'Maria Engenheira',
        email: 'maria@eng.com.br',
        company: 'EngPro Construtora',
        profile: 'Engenheiro',
      }
    }),
    prisma.contact.upsert({
      where: { phone: '5511999990003' },
      update: {},
      create: {
        phone: '5511999990003',
        name: 'Carlos Gestor de Obras',
        email: 'carlos@bcb.com.br',
        company: 'BCB Construções',
        profile: 'Construtora',
      }
    }),
    prisma.contact.upsert({
      where: { phone: '5511999990004' },
      update: {},
      create: {
        phone: '5511999990004',
        name: 'Ana Paula Torres',
        email: 'ana@torres.eng.br',
        company: 'Torres Engenharia',
        profile: 'Engenheiro',
      }
    }),
    prisma.contact.upsert({
      where: { phone: '5511999990005' },
      update: {},
      create: {
        phone: '5511999990005',
        name: 'Roberto Farias',
        email: 'roberto@farias.com',
        company: 'Farias Empreendimentos',
        profile: 'Construtora',
      }
    }),
  ]);
  console.log(`✅ ${contacts.length} contatos de teste criados`);

  // 2. Orçamentos de teste (com datas variadas para testar scoring)
  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000);

  const budgets = await Promise.all([
    prisma.budget.create({
      data: {
        externalId: 'ORC-001',
        contactId: contacts[0].id,
        productName: 'Andaime Tubular 200m²',
        budgetValue: 15000,
        budgetDate: daysAgo(10),
        projectName: 'Residencial Vila Nova',
        city: 'São Paulo',
        status: 'sent',
        source: 'legacy_budget',
      }
    }),
    prisma.budget.create({
      data: {
        externalId: 'ORC-002',
        contactId: contacts[1].id,
        productName: 'Escoramento Metálico Torre',
        budgetValue: 32000,
        budgetDate: daysAgo(15),
        projectName: 'Ed. Corporate Tower',
        city: 'São Paulo',
        status: 'sent',
        source: 'legacy_budget',
      }
    }),
    prisma.budget.create({
      data: {
        externalId: 'ORC-003',
        contactId: contacts[2].id,
        productName: 'Fôrmas para Concreto',
        budgetValue: 8500,
        budgetDate: daysAgo(45),
        projectName: 'Galpão Industrial BCB',
        city: 'Guarulhos',
        status: 'pending',
        source: 'legacy_budget',
      }
    }),
    prisma.budget.create({
      data: {
        externalId: 'ORC-004',
        contactId: contacts[3].id,
        productName: 'Andaime Fachadeiro 500m²',
        budgetValue: 28000,
        budgetDate: daysAgo(8),
        projectName: 'Retrofit Prédio Comercial',
        city: 'Campinas',
        status: 'sent',
        source: 'legacy_budget',
      }
    }),
    prisma.budget.create({
      data: {
        externalId: 'ORC-005',
        contactId: contacts[4].id,
        productName: 'Escoramento Leve para Laje',
        budgetValue: 5200,
        budgetDate: daysAgo(60),
        projectName: 'Condomínio Farias II',
        city: 'Osasco',
        status: 'sent',
        source: 'legacy_budget',
      }
    }),
    prisma.budget.create({
      data: {
        externalId: 'ORC-006',
        contactId: contacts[0].id,
        productName: 'Plataforma NR18',
        budgetValue: 12000,
        budgetDate: daysAgo(20),
        projectName: 'Residencial Park Sul',
        city: 'São Paulo',
        status: 'pending',
        source: 'legacy_budget',
      }
    }),
    prisma.budget.create({
      data: {
        externalId: 'ORC-007',
        contactId: contacts[1].id,
        productName: 'Torre de Carga 150kgf',
        budgetValue: 45000,
        budgetDate: daysAgo(12),
        projectName: 'Ponte Rio Tietê',
        city: 'São Paulo',
        status: 'sent',
        source: 'legacy_budget',
      }
    }),
    prisma.budget.create({
      data: {
        externalId: 'ORC-008',
        contactId: contacts[3].id,
        productName: 'Andaime Tubular 100m²',
        budgetValue: 7800,
        budgetDate: daysAgo(3),
        projectName: 'Reforma Industrial',
        city: 'Jundiaí',
        status: 'sent',
        source: 'legacy_budget',
        notes: 'Orçamento muito recente, ainda não elegível para reativação',
      }
    }),
  ]);
  console.log(`✅ ${budgets.length} orçamentos de teste criados`);

  // 3. Oportunidades (simulando estados diferentes do pipeline)
  const opportunities = await Promise.all([
    prisma.opportunity.create({
      data: {
        budgetId: budgets[0].id,
        contactId: contacts[0].id,
        stage: 'contacted',
        temperature: 'warm',
        priorityScore: 75,
        lastOutreachAt: daysAgo(2),
        reactivationReason: 'Auto-reactivation for Andaime Tubular 200m²',
      }
    }),
    prisma.opportunity.create({
      data: {
        budgetId: budgets[1].id,
        contactId: contacts[1].id,
        stage: 'replied',
        temperature: 'hot',
        priorityScore: 85,
        lastOutreachAt: daysAgo(5),
        lastResponseAt: daysAgo(1),
        reactivationReason: 'Auto-reactivation for Escoramento Metálico Torre',
      }
    }),
    prisma.opportunity.create({
      data: {
        budgetId: budgets[3].id,
        contactId: contacts[3].id,
        stage: 'human_handoff',
        temperature: 'hot',
        priorityScore: 90,
        lastOutreachAt: daysAgo(3),
        lastResponseAt: daysAgo(1),
        ownerType: 'human',
        humanOwner: 'Eduardo (Comercial)',
        reactivationReason: 'Auto-reactivation for Andaime Fachadeiro 500m²',
      }
    }),
  ]);
  console.log(`✅ ${opportunities.length} oportunidades de teste criadas`);

  // 4. Mensagens de exemplo
  await prisma.message.createMany({
    data: [
      {
        opportunityId: opportunities[0].id,
        direction: 'outgoing',
        content: 'Olá, João. Tudo bem?\n\nEstou retomando o contato sobre o projeto "Residencial Vila Nova" referente ao orçamento de Andaime Tubular 200m².\n\nQueria entender se essa demanda ainda está em andamento ou se ficou para mais à frente.',
        sentAt: daysAgo(2),
        deliveryStatus: 'delivered',
      },
      {
        opportunityId: opportunities[1].id,
        direction: 'outgoing',
        content: 'Olá, Maria. Tudo bem?\n\nEstou retomando o contato sobre o projeto "Ed. Corporate Tower" referente ao orçamento de Escoramento Metálico Torre.\n\nQueria entender se essa demanda ainda está em andamento ou se ficou para mais à frente.',
        sentAt: daysAgo(5),
        deliveryStatus: 'read',
      },
      {
        opportunityId: opportunities[1].id,
        direction: 'incoming',
        content: 'Oi! Sim, vamos tocar essa obra. Pode me mandar um novo orçamento atualizado?',
        sentAt: daysAgo(1),
        intentDetected: 'NEEDS_NEW_QUOTE',
      },
    ]
  });
  console.log('✅ Mensagens de exemplo criadas');

  // 5. Regra de campanha
  await prisma.campaignRule.create({
    data: {
      name: 'Reativação Padrão - 7 a 90 dias',
      minDaysSinceBudget: 7,
      maxDaysSinceBudget: 90,
      cooldownDays: 15,
      enabled: true,
    }
  });
  console.log('✅ Regra de campanha criada');

  console.log('\n🎉 Seed concluído com sucesso!');
  console.log('\n📋 Próximos passos:');
  console.log('   1. npm run dev           → Inicia o backend na porta 3000');
  console.log('   2. cd console-web && npm run dev → Frontend na porta 9000');
  console.log('   3. http://localhost:3000/health');
  console.log('   4. http://localhost:9000');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

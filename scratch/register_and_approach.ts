import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { env } from '../src/config/env';

const prisma = new PrismaClient();

async function run() {
  const phone = '5546988284253';
  const name = 'Diego Martins';
  const tenantId = 'synapsea';

  console.log(`🚀 Cadastrando lead: ${name} (${phone})...`);

  // 1. Criar ou atualizar Lead
  const lead = await prisma.activeLead.upsert({
    where: {
      tenant_phone_unique: {
        tenantId,
        phone
      }
    },
    update: {
      status: 'TRIAGE',
      score: 10, // Score inicial por ser cliente antigo
      metadata: {
        customer_status: 'bought_before',
        last_purchase_context: 'Agile Steel products',
        approach_reason: 'check_new_projects'
      }
    },
    create: {
      tenantId,
      phone,
      name,
      source: 'outbound_reactivation',
      status: 'TRIAGE',
      score: 10,
      metadata: {
        customer_status: 'bought_before',
        approach_reason: 'check_new_projects'
      }
    }
  });

  console.log('✅ Lead cadastrado no banco de dados.');

  // 2. Preparar mensagem de abordagem
  const message = `Olá Diego! Tudo bem? Aqui é da Agile Steel.\n\nVi que você já realizou projetos conosco anteriormente e estava passando para saber como estão as coisas. Tem alguma obra nova em andamento ou algum projeto onde possamos te ajudar com Drywall ou Steel Frame no momento?`;

  console.log(`📤 Enviando abordagem via WhatsApp...`);

  try {
    const response = await axios.post(`${env.UAZAPI_URL}/send/text`, {
      number: lead.phone,
      text: message
    }, {
      headers: {
        'token': env.UAZAPI_KEY
      }
    });

    if (response.status === 200 || response.status === 201) {
      console.log('✅ Mensagem enviada com sucesso!');
      
      // 3. Registrar mensagem no banco
      await prisma.message.create({
        data: {
          leadId: lead.id,
          tenantId,
          direction: 'outgoing',
          content: message,
          channel: 'whatsapp',
          isAiGenerated: false,
          intentDetected: 'OUTBOUND_APPROACH'
        }
      });
      console.log('📝 Mensagem registrada no histórico.');
    } else {
      console.error('❌ Falha ao enviar mensagem:', response.data);
    }
  } catch (error: any) {
    console.error('❌ Erro na integração com UAZAPI:', error.message);
    if (error.response) {
      console.error('Detalhes:', error.response.data);
    }
  }

  await prisma.$disconnect();
}

run();

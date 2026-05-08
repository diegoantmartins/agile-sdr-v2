import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const messages = await prisma.message.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      lead: {
        select: { name: true, phone: true, status: true }
      }
    }
  });

  console.log(JSON.stringify(messages, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

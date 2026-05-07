import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const knowledgeItems = [
  {
    title: 'O que é Steel Frame?',
    category: 'Produto',
    content: 'O Light Steel Frame (LSF) é um sistema estrutural composto por perfis de aço galvanizado de espessura reduzida. Ele forma o esqueleto da edificação (paredes, pisos e telhados). É um sistema estrutural completo, ideal para casas, prédios de poucos andares e ampliações. Vantagens: agilidade, precisão dimensional e sustentabilidade.'
  },
  {
    title: 'O que é Drywall?',
    category: 'Produto',
    content: 'O Drywall é um sistema de vedação interna composto por perfis metálicos revestidos com placas de gesso acartonado. Diferente do Steel Frame, o Drywall NÃO possui função estrutural. É usado para divisórias, forros e revestimentos internos. Tipos de placas: Branca (Standard), Verde (Resistente à Umidade) e Rosa (Resistente ao Fogo).'
  },
  {
    title: 'Diferença entre Steel Frame e Alvenaria',
    category: 'FAQ',
    content: 'Embora o custo do material possa ser superior, o Steel Frame reduz drasticamente o tempo de obra (até 60% mais rápido), gera menos resíduos (obra limpa), possui melhor desempenho térmico e acústico, e oferece maior precisão, evitando desperdícios comuns na alvenaria convencional.'
  },
  {
    title: 'Como fixar objetos em Drywall?',
    category: 'Dica',
    content: 'Para objetos leves (até 15kg), use buchas específicas para drywall (tipo borboleta ou parafuso). Para objetos pesados (>15kg), é necessário fixar diretamente nos perfis metálicos da estrutura. Você pode localizar os perfis usando um ímã ou detector de metais.'
  },
  {
    title: 'Resistência ao Fogo e Umidade',
    category: 'FAQ',
    content: 'O aço é incombustível. As placas de gesso possuem propriedades que retardam a propagação do fogo. Em áreas molhadas como banheiros e cozinhas, utilizamos placas verdes (RU) e realizamos a impermeabilização da base antes do assentamento de revestimentos.'
  },
  {
    title: 'Isolamento Termoacústico',
    category: 'Produto',
    content: 'O sistema de construção a seco utiliza lã de vidro ou lã de rocha no interior das paredes. Isso garante um isolamento acústico superior ao tijolo comum, além de manter a temperatura interna da obra muito mais estável, gerando economia com ar-condicionado.'
  },
  {
    title: 'Modificações Futuras',
    category: 'Dica',
    content: 'Uma das maiores vantagens do Drywall e Steel Frame é a facilidade de manutenção e reforma. É possível abrir e fechar paredes para reparos elétricos ou hidráulicos sem quebra-quebra, de forma rápida e com acabamento perfeito.'
  }
];

async function main() {
  console.log('Iniciando o seeding da Base de Conhecimento...');
  
  for (const item of knowledgeItems) {
    await prisma.knowledge.create({
      data: {
        title: item.title,
        category: item.category,
        content: item.content,
        isActive: true
      }
    });
    console.log(`Item adicionado: ${item.title}`);
  }
  
  console.log('Seeding concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

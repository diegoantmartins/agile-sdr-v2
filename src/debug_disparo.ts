
import { getUAZAPIClient } from '../src/infra/uazapi/uazapi.client';

async function main() {
  const client = getUAZAPIClient();
  try {
    const res = await client.sendMessage({
      phone: '5546988284253',
      message: 'Olá. Tudo bem?\n\nEstou retomando o contato referente ao orçamento de Escoramentos/Andaimes.'
    });
    console.log('SUCCESS:', res);
  } catch (err: any) {
    console.error('ERROR:', err.response?.data || err.message);
    if (err.response) {
        console.error('STATUS:', err.response.status);
    }
  }
}
main();

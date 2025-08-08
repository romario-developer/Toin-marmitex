import wppconnect from '@wppconnect-team/wppconnect';
import dotenv from 'dotenv';
import Pedido from '../models/Pedido.js';

dotenv.config();

const sessoes = {};

export async function iniciarBot() {
  wppconnect.create({
    session: 'marmitex-teste2',
    headless: false,
    autoClose: 180,
    browserArgs: ['--no-sandbox'],
    catchQR: (base64Qrimg, asciiQR, attempts, urlCode) => {
      console.log('⚠️ Escaneie o QR Code:', asciiQR);
    },
    statusFind: (statusSession) => {
      console.log('📡 Status da sessão (marmitex-teste2):', statusSession);
    }
  }).then(client => {
    console.log('🤖 Bot conectado e escutando mensagens.');
    client.onMessage(async (msg) => {
      await processarMensagem(client, msg);
    });
  });
}

export async function handleMensagemSimulada({ from, body }) {
  await processarMensagem(null, { from, body, sender: { pushname: 'Teste Simulado' } }, true);
}

async function processarMensagem(client, msg, simulado = false) {
  const texto = msg.body?.toLowerCase();
  const remetente = msg.from;

  if (!sessoes[remetente]) {
    sessoes[remetente] = { etapa: 'inicio' };
  }

  const sessao = sessoes[remetente];

  const enviar = async (mensagem) => {
    if (simulado) {
      console.log(`💬 [Simulado] Para ${remetente}: ${mensagem}`);
    } else {
      await client.sendText(remetente, mensagem);
    }
  };

  switch (sessao.etapa) {
    case 'inicio':
      await enviar('Olá! Seja bem-vindo ao marmitex. Digite 1 para o CARDÁPIO 1 ou 2 para o CARDÁPIO 2.');
      sessao.etapa = 'cardapio';
      break;

    case 'cardapio':
      if (texto === '1' || texto === '2') {
        sessao.finalizacao = { cardapio: `CARDÁPIO ${texto}` };
        await enviar('Qual o tamanho da marmita? (P, M ou G)');
        sessao.etapa = 'tamanho';
      } else {
        await enviar('Por favor, digite 1 ou 2 para escolher o cardápio.');
      }
      break;

    case 'tamanho':
      if (['p', 'm', 'g'].includes(texto)) {
        sessao.finalizacao.tamanho = texto.toUpperCase();
        await enviar('Deseja bebida? Digite "sim" ou "não".');
        sessao.etapa = 'bebida';
      } else {
        await enviar('Tamanho inválido. Digite P, M ou G.');
      }
      break;

    case 'bebida':
      if (texto === 'não') {
        sessao.finalizacao.bebida = 'Nenhuma';
        sessao.etapa = 'pagamento';
        await enviar('Escolha a forma de pagamento:\n1. Dinheiro\n2. PIX\n3. Cartão');
      } else if (texto === 'sim') {
        sessao.etapa = 'escolher-bebida';
        await enviar('Escolha a bebida:\n1. Coca Lata\n2. Coca 1L\n3. Coca 2L');
      } else {
        await enviar('Por favor, responda com "sim" ou "não".');
      }
      break;

    case 'escolher-bebida':
      if (['1', '2', '3'].includes(texto)) {
        const bebidas = {
          '1': 'Coca Lata',
          '2': 'Coca 1L',
          '3': 'Coca 2L'
        };
        sessao.finalizacao.bebida = bebidas[texto];
        sessao.etapa = 'pagamento';
        await enviar('Escolha a forma de pagamento:\n1. Dinheiro\n2. PIX\n3. Cartão');
      } else {
        await enviar('Escolha inválida. Digite 1, 2 ou 3.');
      }
      break;

    case 'pagamento':
      if (['1', '2', '3'].includes(texto)) {
        const formas = {
          '1': 'Dinheiro',
          '2': 'PIX',
          '3': 'Cartão'
        };
        sessao.finalizacao.pagamento = formas[texto];

        const precos = { P: 15, M: 20, G: 25 };
        const precoBebida = sessao.finalizacao.bebida === 'Nenhuma' ? 0 : 5;
        const total = precos[sessao.finalizacao.tamanho] + precoBebida;
        sessao.finalizacao.total = total;

        await enviar(`🧾 Resumo do pedido:\n🍱 ${sessao.finalizacao.cardapio}\n📏 Tamanho: ${sessao.finalizacao.tamanho}\n🥤 Bebida: ${sessao.finalizacao.bebida}\n💰 Total: R$ ${total},00\nForma de pagamento: ${sessao.finalizacao.pagamento}`);
        await enviar('✅ Pedido confirmado! Sua marmita está sendo preparada.');
        await salvarPedido(sessao.finalizacao, remetente, msg.sender?.pushname);
        delete sessoes[remetente];
      } else {
        await enviar('Escolha inválida. Digite 1, 2 ou 3.');
      }
      break;

    default:
      await enviar('Não entendi. Por favor, digite "oi" para começar.');
      delete sessoes[remetente];
  }
}

async function salvarPedido(finalizacao, remetente, nome = '') {
  try {
    const novo = new Pedido({
      cliente: { numero: remetente, nome },
      cardapioEscolhido: finalizacao.cardapio,
      tamanho: finalizacao.tamanho,
      bebida: finalizacao.bebida,
      formaPagamento: finalizacao.pagamento,
      total: finalizacao.total,
    });
    await novo.save();
    console.log('✅ Pedido salvo com sucesso no banco.');
  } catch (erro) {
    console.error('❌ Erro ao salvar pedido:', erro);
  }
}
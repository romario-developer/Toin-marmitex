// backend/services/whatsappBot.js
import { conectarWhatsapp } from '../config/wppconnect.js';
import { verificarPagamentoPix } from './pixService.js';
import Cardapio from '../models/Cardapio.js';

let clienteWhatsapp;
const pedidos = new Map(); // Armazena estado dos pedidos por número

export async function iniciarBot() {
  clienteWhatsapp = await conectarWhatsapp(responderMensagem);
}

async function responderMensagem(message) {
  const numero = message.from;
  const texto = message.body?.trim().toLowerCase();

  // Buscar cardápio do dia
  const hoje = new Date().toISOString().split('T')[0];
  const cardapio = await Cardapio.findOne({ data: hoje });

  if (!cardapio) {
    await clienteWhatsapp.sendText(numero, '📭 Não há cardápio cadastrado para hoje.');
    return;
  }

  // Início do fluxo
  if (['oi', 'olá', 'cardápio', 'menu'].includes(texto)) {
    let resposta = '🍽️ *Cardápio de Hoje* 🍽️\n\n';

    cardapio.pratos.forEach((prato, i) => {
      resposta += `*${i + 1}) ${prato.nome}*\n_${prato.descricao}_\n💵 R$ ${prato.preco.toFixed(2)}\n\n`;
    });

    resposta += `🥤 *Bebidas Disponíveis:*\n`;
    cardapio.bebidas.forEach((bebida, i) => {
      resposta += `${i + 1}) ${bebida.nome} - R$ ${bebida.preco.toFixed(2)}\n`;
    });

    resposta += `\n*Digite o número do cardápio desejado:* (1 ou 2)`;
    pedidos.set(numero, { etapa: 'cardapio' });
    await clienteWhatsapp.sendText(numero, resposta);
    return;
  }

  const pedidoAtual = pedidos.get(numero);

  // Escolher cardápio
  if (pedidoAtual?.etapa === 'cardapio' && ['1', '2'].includes(texto)) {
    pedidoAtual.prato = cardapio.pratos[parseInt(texto) - 1];
    pedidoAtual.etapa = 'tamanho';
    await clienteWhatsapp.sendText(numero, '📦 Escolha o tamanho da marmita:\n1️⃣ Pequena\n2️⃣ Média\n3️⃣ Grande');
    return;
  }

  // Escolher tamanho
  if (pedidoAtual?.etapa === 'tamanho' && ['1', '2', '3'].includes(texto)) {
    const tamanhos = ['P', 'M', 'G'];
    pedidoAtual.tamanho = tamanhos[parseInt(texto) - 1];

    const precos = {
      P: cardapio.precoP,
      M: cardapio.precoM,
      G: cardapio.precoG
    };

    pedidoAtual.total = precos[pedidoAtual.tamanho];
    pedidoAtual.etapa = 'bebida';

    await clienteWhatsapp.sendText(numero,
      '🥤 Deseja adicionar bebida?\n1️⃣ Coca Lata\n2️⃣ Coca 1L\n3️⃣ Coca 2L\nDigite o número ou "não".');
    return;
  }

  // Escolher bebida
  if (pedidoAtual?.etapa === 'bebida') {
    const bebidas = cardapio.bebidas;

    if (['1', '2', '3'].includes(texto)) {
      const bebidaEscolhida = bebidas[parseInt(texto) - 1];
      pedidoAtual.bebida = bebidaEscolhida;
      pedidoAtual.total += bebidaEscolhida.preco;
    }

    pedidoAtual.etapa = 'confirmar';

    let resumo = `✅ *Resumo do Pedido:*\n`;
    resumo += `🍛 Marmita: ${pedidoAtual.prato.nome} (${pedidoAtual.tamanho})\n`;
    if (pedidoAtual.bebida) resumo += `🥤 Bebida: ${pedidoAtual.bebida.nome}\n`;
    resumo += `💰 Total: R$ ${pedidoAtual.total.toFixed(2)}\n\n`;
    resumo += `Escolha a forma de pagamento:\n1️⃣ Dinheiro\n2️⃣ Pix\n3️⃣ Cartão`;

    await clienteWhatsapp.sendText(numero, resumo);
    return;
  }

  // Escolher forma de pagamento
  if (pedidoAtual?.etapa === 'confirmar') {
    if (texto === '1') {
      await clienteWhatsapp.sendText(numero, '🤑 Pagamento em dinheiro confirmado!\n🥣 Sua marmita está sendo preparada.');
    } else if (texto === '2') {
      pedidoAtual.etapa = 'pix';
      await clienteWhatsapp.sendText(numero, `🔑 Chave Pix: marmitex@toin.com.br\n\nDigite "paguei" após o pagamento.`);
    } else if (texto === '3') {
      await clienteWhatsapp.sendText(numero, '💳 Pagamento via cartão confirmado na entrega!\n✅ Pedido anotado.');
    }
    pedidos.delete(numero);
    return;
  }

  // Confirmação Pix
  if (pedidoAtual?.etapa === 'pix' && texto.includes('paguei')) {
    await clienteWhatsapp.sendText(numero, '✅ Pagamento confirmado via Pix!\n🍱 Sua marmita já está sendo preparada.');
    pedidos.delete(numero);
    return;
  }
}

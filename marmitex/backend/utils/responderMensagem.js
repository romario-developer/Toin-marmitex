// backend/utils/responderMensagem.js
import { conversasAtivas, resetarConversa } from './conversasAtivas.js';
import { obterCardapioAtual } from '../controllers/cardapioController.js';

export async function responderMensagem(client, message) {
  const numero = message.from;
  const texto = message.body?.toLowerCase().trim();

  if (!texto || message.isGroupMsg) return;

  if (!conversasAtivas.has(numero)) {
    resetarConversa(numero);
  }

  const estado = conversasAtivas.get(numero);
  const cardapio = await obterCardapioAtual();

  if (texto === 'oi' || estado.etapa === 'inicio') {
    resetarConversa(numero);
    const textoCardapio = `🍽️ *Cardápio de Hoje* 🍽️

📋 *Cardápio 1*: ${cardapio.cardapio1}
📋 *Cardápio 2*: ${cardapio.cardapio2}

Digite o número do cardápio desejado:
1️⃣ Cardápio 1
2️⃣ Cardápio 2`;

    estado.etapa = 'cardapio';
    return client.sendText(numero, textoCardapio);
  }

  if (estado.etapa === 'cardapio' && ['1', '2'].includes(texto)) {
    estado.escolhaCardapio = texto === '1' ? 'Cardápio 1' : 'Cardápio 2';
    estado.etapa = 'tamanho';
    return client.sendText(numero, `Escolha o tamanho da marmita:

1️⃣ Pequena - R$ ${cardapio.precoP.toFixed(2).replace('.', ',')}
2️⃣ Média - R$ ${cardapio.precoM.toFixed(2).replace('.', ',')}
3️⃣ Grande - R$ ${cardapio.precoG.toFixed(2).replace('.', ',')}`);
  }

  if (estado.etapa === 'tamanho' && ['1', '2', '3'].includes(texto)) {
    const tamanhos = {
      '1': { nome: 'Pequena', valor: cardapio.precoP },
      '2': { nome: 'Média', valor: cardapio.precoM },
      '3': { nome: 'Grande', valor: cardapio.precoG }
    };

    estado.tamanho = tamanhos[texto].nome;
    estado.valorTotal = tamanhos[texto].valor;
    estado.etapa = 'bebida';

    return client.sendText(numero, 'Deseja adicionar bebida ao pedido? (sim ou não)');
  }

  if (estado.etapa === 'bebida') {
    if (texto === 'sim') {
      estado.etapa = 'escolherBebida';
      return client.sendText(numero, `Escolha sua bebida:
1️⃣ Coca Lata - R$ ${cardapio.precoCocaLata.toFixed(2).replace('.', ',')}
2️⃣ Coca 1L - R$ ${cardapio.precoCoca1L.toFixed(2).replace('.', ',')}
3️⃣ Coca 2L - R$ ${cardapio.precoCoca2L.toFixed(2).replace('.', ',')}`);
    } else if (texto === 'não') {
      estado.bebida = 'Nenhuma';
      estado.etapa = 'confirmar';
    } else {
      return client.sendText(numero, 'Por favor, responda com "sim" ou "não".');
    }
  }

  if (estado.etapa === 'escolherBebida' && ['1', '2', '3'].includes(texto)) {
    const bebidas = {
      '1': { nome: 'Coca Lata', valor: cardapio.precoCocaLata },
      '2': { nome: 'Coca 1L', valor: cardapio.precoCoca1L },
      '3': { nome: 'Coca 2L', valor: cardapio.precoCoca2L }
    };

    const bebidaEscolhida = bebidas[texto];
    estado.bebida = bebidaEscolhida.nome;
    estado.valorTotal += bebidaEscolhida.valor;
    estado.etapa = 'confirmar';
  }

  if (estado.etapa === 'confirmar') {
    estado.etapa = 'pagamento';
    return client.sendText(numero, `✅ *Resumo do Pedido:*

🍽️ ${estado.escolhaCardapio}
📏 Tamanho: ${estado.tamanho}
🥤 Bebida: ${estado.bebida}
💰 Total: R$ ${estado.valorTotal.toFixed(2).replace('.', ',')}

Como deseja pagar?
1️⃣ Dinheiro
2️⃣ PIX
3️⃣ Cartão`);
  }

  if (estado.etapa === 'pagamento') {
    let forma = '';
    if (texto === '1') forma = 'Dinheiro';
    else if (texto === '2') forma = 'PIX';
    else if (texto === '3') forma = 'Cartão';
    else return client.sendText(numero, 'Escolha uma forma de pagamento: 1, 2 ou 3');

    estado.pagamento = forma;
    estado.etapa = 'finalizado';

    if (forma === 'PIX') {
      return client.sendText(numero, `🔑 Chave PIX para pagamento:

copiar: *seuemail@provedor.com*

Após pagar, envie "paguei" aqui para confirmar.`);
    } else {
      return client.sendText(numero, `✅ Pedido confirmado!
Forma de pagamento: ${forma}
Sua marmita já está sendo preparada! 🍛`);
    }
  }

  if (estado.etapa === 'finalizado' && texto === 'paguei') {
    return client.sendText(numero, `✅ Pagamento confirmado com sucesso!
Sua marmita já está sendo preparada! 🍛`);
  }
}

// backend/utils/responderMensagem.js
import { conversasAtivas, resetarConversa } from './conversasAtivas.js';
import { obterCardapioAtual } from '../controllers/cardapioController.js';
import Configuracao from '../models/Configuracao.js';

export async function responderMensagem(client, message) {
  if (!message || !message.from || !message.body) {
    console.error('❌ Mensagem inválida recebida:', message);
    return;
  }

  const numero = message.from;
  const texto = message.body?.toLowerCase().trim();

  if (!texto || message.isGroupMsg) return;

  if (!conversasAtivas.has(numero)) {
    resetarConversa(numero);
  }

  const estado = conversasAtivas.get(numero);
  
  // Carregar cardápio e configurações
  const cardapio = await obterCardapioAtual();
  const config = await Configuracao.findOne();
  
  if (!cardapio || !config) {
    return client.sendText(numero, '❌ Desculpe, o cardápio não está disponível no momento. Tente novamente mais tarde.');
  }

  if (texto === 'oi' || estado.etapa === 'inicio') {
    resetarConversa(numero);
    const textoCardapio = `🍽️ *Cardápio de Hoje* 🍽️

📋 *Cardápio 1*: ${cardapio.cardapio1.descricao}
📋 *Cardápio 2*: ${cardapio.cardapio2.descricao}

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

1️⃣ Pequena - R$ ${config.precosMarmita.P.toFixed(2).replace('.', ',')}
2️⃣ Média - R$ ${config.precosMarmita.M.toFixed(2).replace('.', ',')}
3️⃣ Grande - R$ ${config.precosMarmita.G.toFixed(2).replace('.', ',')}`);
  }

  if (estado.etapa === 'tamanho' && ['1', '2', '3'].includes(texto)) {
    const tamanhos = {
      '1': { nome: 'Pequena', valor: config.precosMarmita.P },
      '2': { nome: 'Média', valor: config.precosMarmita.M },
      '3': { nome: 'Grande', valor: config.precosMarmita.G }
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
1️⃣ Coca Lata - R$ ${config.precosBebida.lata.toFixed(2).replace('.', ',')}
2️⃣ Coca 1L - R$ ${config.precosBebida.umLitro.toFixed(2).replace('.', ',')}
3️⃣ Coca 2L - R$ ${config.precosBebida.doisLitros.toFixed(2).replace('.', ',')}`);
    } else if (texto === 'não') {
      estado.bebida = 'Nenhuma';
      estado.etapa = 'confirmar';
    } else {
      return client.sendText(numero, 'Por favor, responda com "sim" ou "não".');
    }
  }

  if (estado.etapa === 'escolherBebida' && ['1', '2', '3'].includes(texto)) {
    const bebidas = {
      '1': { nome: 'Coca Lata', valor: config.precosBebida.lata },
      '2': { nome: 'Coca 1L', valor: config.precosBebida.umLitro },
      '3': { nome: 'Coca 2L', valor: config.precosBebida.doisLitros }
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

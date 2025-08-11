// backend/services/whatsappBot.js
import wppconnect from '@wppconnect-team/wppconnect';
import dotenv from 'dotenv';
import Pedido from '../models/Pedido.js';
import Configuracao from '../models/Configuracao.js';
import Cardapio from '../models/Cardapio.js';

dotenv.config();

// ===== Memória p/ simulador (suporte a image) =====
const conversas = {};
function pushMsg(from, who, text, extra = {}) {
  if (!conversas[from]) conversas[from] = [];
  conversas[from].push({ who, text, at: Date.now(), ...extra });
}
export function getConversa(from) { return conversas[from] ?? []; }
export function resetConversa(from) { conversas[from] = []; }

// ===== Estado =====
const sessoes = {};
let cacheConfig = null;
let cacheAt = 0;
const CACHE_MS = 60_000;

// ===== Helpers =====
async function getConfig() {
  const now = Date.now();
  if (cacheConfig && (now - cacheAt) < CACHE_MS) return cacheConfig;
  const cfg = await Configuracao.findOne();
  if (!cfg) {
    cacheConfig = {
      precosMarmita: { P: 15, M: 20, G: 25 },
      precosBebida: { lata: 5, umLitro: 8, doisLitros: 12 },
      taxaEntrega: 3
    };
    cacheAt = now;
    console.warn('⚠️ Nenhuma configuração encontrada. Usando preços padrão.');
    return cacheConfig;
  }
  cacheConfig = JSON.parse(JSON.stringify(cfg));
  cacheAt = now;
  return cacheConfig;
}

async function getCardapioHoje() {
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const amanha = new Date(hoje); amanha.setDate(amanha.getDate() + 1);
  return Cardapio.findOne({ data: { $gte: hoje, $lt: amanha } });
}

function moeda(v) { return `R$ ${Number(v ?? 0)},00`; }
function mensagemTamanhos(cfg) {
  const p = cfg.precosMarmita?.P ?? 0;
  const m = cfg.precosMarmita?.M ?? 0;
  const g = cfg.precosMarmita?.G ?? 0;
  return (
    'Qual o tamanho da marmita?\n' +
    `P (${moeda(p)})\n` +
    `M (${moeda(m)})\n` +
    `G (${moeda(g)})\n\n` +
    'Responda com: P, M ou G.'
  );
}
function mensagemBebidas(cfg) {
  const lata = cfg.precosBebida?.lata ?? 0;
  const um = cfg.precosBebida?.umLitro ?? 0;
  const dois = cfg.precosBebida?.doisLitros ?? 0;
  return (
    'Escolha a bebida:\n' +
    `1. Coca Lata (${moeda(lata)})\n` +
    `2. Coca 1L (${moeda(um)})\n` +
    `3. Coca 2L (${moeda(dois)})`
  );
}
function mensagemEntrega(cfg) {
  const taxa = cfg.taxaEntrega ?? 0;
  return 'Entrega ou retirar no local?\n' + `1. Entrega (+${moeda(taxa)})\n2. Retirar no local`;
}

// ===== Core =====
async function processarMensagem(client, msg, simulado = false) {
  const texto = msg.body?.toLowerCase()?.trim();
  const remetente = msg.from;

  if (!sessoes[remetente]) sessoes[remetente] = { etapa: 'inicio' };
  const sessao = sessoes[remetente];

  const enviar = async (mensagem) => {
    if (simulado) {
      console.log(`💬 [Simulado] Para ${remetente}: ${mensagem}`);
      pushMsg(remetente, 'bot', mensagem);
    } else {
      await client.sendText(remetente, mensagem);
    }
  };

  switch (sessao.etapa) {
    case 'inicio': {
      const c = await getCardapioHoje();

      // 1) TEXTO com descrições (sempre)
      let textoBase = 'Olá! Seja bem-vindo ao marmitex!\n\nDigite o numero da opção desejada:\n';
      if (c) {
        const d1 = c.cardapio1?.descricao || '';
        const d2 = c.cardapio2?.descricao || '';
        textoBase += `1. CARDÁPIO 1 : ${d1}\n2. CARDÁPIO 2. ${d2}`;
      } else {
        textoBase += '1. CARDÁPIO 1\n2. CARDÁPIO 2';
      }
      await enviar(textoBase);

      // 2) IMAGENS (se houver), sem substituir o texto
      if (c) {
        const i1 = c.cardapio1?.imagem || '';
        const i2 = c.cardapio2?.imagem || '';
        const d1 = c.cardapio1?.descricao || '';
        const d2 = c.cardapio2?.descricao || '';

        if (simulado) {
          if (i1) pushMsg(remetente, 'bot', `1. CARDÁPIO 1 : ${d1}`, { image: i1 });
          if (i2) pushMsg(remetente, 'bot', `2. CARDÁPIO 2. ${d2}`, { image: i2 });
        } else {
          const base = process.env.PUBLIC_BASE_URL || '';
          try {
            if (i1) await client.sendImage(
              remetente,
              i1.startsWith('http') ? i1 : base + i1,
              'cardapio1.jpg',
              `1. CARDÁPIO 1 : ${d1}`
            );
            if (i2) await client.sendImage(
              remetente,
              i2.startsWith('http') ? i2 : base + i2,
              'cardapio2.jpg',
              `2. CARDÁPIO 2. ${d2}`
            );
          } catch (e) {
            console.warn('Falha ao enviar imagens do cardápio:', e?.message);
          }
        }
      }

      sessao.etapa = 'cardapio';
      break;
    }

    case 'cardapio':
      if (texto === '1' || texto === '2') {
        sessao.finalizacao = { cardapio: `CARDÁPIO ${texto}` };
        const cfg1 = await getConfig();
        await enviar(mensagemTamanhos(cfg1));
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
        const cfg2 = await getConfig();
        await enviar('Tamanho inválido.\n\n' + mensagemTamanhos(cfg2));
      }
      break;

    case 'bebida':
      if (texto === 'não' || texto === 'nao') {
        sessao.finalizacao.bebida = 'Nenhuma';
        const cfg3 = await getConfig();
        await enviar(mensagemEntrega(cfg3));
        sessao.etapa = 'entrega';
      } else if (texto === 'sim') {
        sessao.etapa = 'escolher-bebida';
        const cfg4 = await getConfig();
        await enviar(mensagemBebidas(cfg4));
      } else {
        await enviar('Por favor, responda com "sim" ou "não".');
      }
      break;

    case 'escolher-bebida':
      if (['1', '2', '3'].includes(texto)) {
        const bebidas = { '1': 'Coca Lata', '2': 'Coca 1L', '3': 'Coca 2L' };
        sessao.finalizacao.bebida = bebidas[texto];
        const cfg5 = await getConfig();
        await enviar(mensagemEntrega(cfg5));
        sessao.etapa = 'entrega';
      } else {
        const cfg6 = await getConfig();
        await enviar('Escolha inválida. Digite 1, 2 ou 3.\n\n' + mensagemBebidas(cfg6));
      }
      break;

    case 'entrega':
      if (['1', '2'].includes(texto)) {
        const cfg7 = await getConfig();
        if (texto === '1') {
          sessao.finalizacao.tipoEntrega = 'Entrega';
          sessao.finalizacao.taxaEntrega = Number(cfg7.taxaEntrega ?? 0);
        } else {
          sessao.finalizacao.tipoEntrega = 'Retirar';
          sessao.finalizacao.taxaEntrega = 0;
        }
        await enviar('Escolha a forma de pagamento:\n1. Dinheiro\n2. PIX\n3. Cartão');
        sessao.etapa = 'pagamento';
      } else {
        const cfg8 = await getConfig();
        await enviar('Opção inválida.\n\n' + mensagemEntrega(cfg8));
      }
      break;

    case 'pagamento':
      if (['1', '2', '3'].includes(texto)) {
        const formas = { '1': 'Dinheiro', '2': 'PIX', '3': 'Cartão' };
        sessao.finalizacao.pagamento = formas[texto];

        const cfg = await getConfig();
        const precos = cfg.precosMarmita;
        const bebidaPrecoMap = {
          'Nenhuma': 0,
          'Coca Lata': Number(cfg.precosBebida?.lata ?? 0),
          'Coca 1L': Number(cfg.precosBebida?.umLitro ?? 0),
          'Coca 2L': Number(cfg.precosBebida?.doisLitros ?? 0),
        };

        const base = Number(precos[sessao.finalizacao.tamanho] ?? 0);
        const adicional = bebidaPrecoMap[sessao.finalizacao.bebida] ?? 0;
        const taxa = Number(sessao.finalizacao.taxaEntrega ?? 0);
        const total = base + adicional + taxa;

        sessao.finalizacao.total = total;

        await enviar(
          `🧾 Resumo do pedido:\n` +
          `🍱 ${sessao.finalizacao.cardapio}\n` +
          `📏 Tamanho: ${sessao.finalizacao.tamanho} (${moeda(base)})\n` +
          `🥤 Bebida: ${sessao.finalizacao.bebida} (${moeda(adicional)})\n` +
          (taxa > 0 ? `🚚 Entrega: ${moeda(taxa)}\n` : `🏬 Retirada no local\n`) +
          `💰 Total: ${moeda(total)}\n` +
          `Pagamento: ${sessao.finalizacao.pagamento}`
        );

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

// ===== APIs expostas =====
export async function handleMensagemSimulada({ from, body }) {
  pushMsg(from, 'user', body);
  await processarMensagem(null, { from, body, sender: { pushname: 'Teste Simulado' } }, true);
}

export async function iniciarBot() {
  wppconnect.create({
    session: 'marmitex-teste2',
    headless: false,
    autoClose: 180,
    browserArgs: ['--no-sandbox'],
    catchQR: (base64Qrimg, asciiQR) => {
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

// ===== Persistência =====
async function salvarPedido(finalizacao, remetente, nome = '') {
  try {
    const novo = new Pedido({
      cliente: { numero: remetente, nome },
      cardapioEscolhido: finalizacao.cardapio,
      tamanho: finalizacao.tamanho,
      bebida: finalizacao.bebida,
      formaPagamento: finalizacao.pagamento,
      tipoEntrega: finalizacao.tipoEntrega || 'Entrega',
      taxaEntrega: finalizacao.taxaEntrega || 0,
      total: finalizacao.total,
    });
    await novo.save();
    console.log('✅ Pedido salvo com sucesso no banco.');
  } catch (erro) {
    console.error('❌ Erro ao salvar pedido:', erro);
  }
}

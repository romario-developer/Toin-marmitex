import wppconnect from '@wppconnect-team/wppconnect';
import dotenv from 'dotenv';
import Pedido from '../models/Pedido.js';
import Configuracao from '../models/Configuracao.js';

dotenv.config();

const sessoes = {};
// 👇 memória de conversas apenas pro modo teste
const conversas = {}; // { from: [ { who:'user'|'bot', text:string, at:number } ] }

let cacheConfig = null;
let cacheAt = 0;
const CACHE_MS = 60_000; // 1 min

function pushMsg(from, who, text) {
  if (!conversas[from]) conversas[from] = [];
  conversas[from].push({ who, text, at: Date.now() });
}
export function getConversa(from) {
  return conversas[from] ?? [];
}
export function resetConversa(from) {
  conversas[from] = [];
}

async function getConfig() {
  const now = Date.now();
  if (cacheConfig && (now - cacheAt) < CACHE_MS) return cacheConfig;

  const cfg = await Configuracao.findOne();
  if (!cfg) {
    cacheConfig = {
      precosMarmita: { P: 15, M: 20, G: 25 },
      precosBebida: { lata: 5, umLitro: 8, doisLitros: 12 }
    };
    cacheAt = now;
    console.warn('⚠️ Nenhuma configuração encontrada. Usando preços padrão.');
    return cacheConfig;
  }
  cacheConfig = JSON.parse(JSON.stringify(cfg));
  cacheAt = now;
  return cacheConfig;
}

function moeda(v) {
  const n = Number(v ?? 0);
  return `R$ ${n},00`;
}
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

export async function handleMensagemSimulada({ from, body }) {
  // guarda a mensagem do usuário na conversa de teste
  pushMsg(from, 'user', body);
  await processarMensagem(null, { from, body, sender: { pushname: 'Teste Simulado' } }, true);
}

async function processarMensagem(client, msg, simulado = false) {
  const texto = msg.body?.toLowerCase()?.trim();
  const remetente = msg.from;

  if (!sessoes[remetente]) {
    sessoes[remetente] = { etapa: 'inicio' };
  }
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
    case 'inicio':
      await enviar('Olá! Seja bem-vindo ao marmitex. Digite 1 para o CARDÁPIO 1 ou 2 para o CARDÁPIO 2.');
      sessao.etapa = 'cardapio';
      break;

    case 'cardapio':
      if (texto === '1' || texto === '2') {
        sessao.finalizacao = { cardapio: `CARDÁPIO ${texto}` };
        try {
          const cfg = await getConfig();
          await enviar(mensagemTamanhos(cfg));
        } catch {
          await enviar('Qual o tamanho da marmita? (P, M ou G)');
        }
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
        const cfg = await getConfig();
        await enviar('Tamanho inválido.\n\n' + mensagemTamanhos(cfg));
      }
      break;

    case 'bebida':
      if (texto === 'não' || texto === 'nao') {
        sessao.finalizacao.bebida = 'Nenhuma';
        sessao.etapa = 'pagamento';
        await enviar('Escolha a forma de pagamento:\n1. Dinheiro\n2. PIX\n3. Cartão');
      } else if (texto === 'sim') {
        sessao.etapa = 'escolher-bebida';
        const cfg = await getConfig();
        await enviar(mensagemBebidas(cfg));
      } else {
        await enviar('Por favor, responda com "sim" ou "não".');
      }
      break;

    case 'escolher-bebida':
      if (['1', '2', '3'].includes(texto)) {
        const bebidas = { '1': 'Coca Lata', '2': 'Coca 1L', '3': 'Coca 2L' };
        sessao.finalizacao.bebida = bebidas[texto];
        sessao.etapa = 'pagamento';
        await enviar('Escolha a forma de pagamento:\n1. Dinheiro\n2. PIX\n3. Cartão');
      } else {
        const cfg = await getConfig();
        await enviar('Escolha inválida. Digite 1, 2 ou 3.\n\n' + mensagemBebidas(cfg));
      }
      break;

    case 'pagamento':
      if (['1', '2', '3'].includes(texto)) {
        const formas = { '1': 'Dinheiro', '2': 'PIX', '3': 'Cartão' };
        sessao.finalizacao.pagamento = formas[texto];

        const cfg = await getConfig();
        const precos = cfg.precosMarmita; // {P,M,G}
        const bebidaPrecoMap = {
          'Nenhuma': 0,
          'Coca Lata': Number(cfg.precosBebida?.lata ?? 0),
          'Coca 1L': Number(cfg.precosBebida?.umLitro ?? 0),
          'Coca 2L': Number(cfg.precosBebida?.doisLitros ?? 0),
        };

        const base = Number(precos[sessao.finalizacao.tamanho] ?? 0);
        const adicional = bebidaPrecoMap[sessao.finalizacao.bebida] ?? 0;
        const total = base + adicional;

        sessao.finalizacao.total = total;

        await enviar(
          `🧾 Resumo do pedido:\n` +
          `🍱 ${sessao.finalizacao.cardapio}\n` +
          `📏 Tamanho: ${sessao.finalizacao.tamanho} (${moeda(base)})\n` +
          `🥤 Bebida: ${sessao.finalizacao.bebida} (${moeda(adicional)})\n` +
          `💰 Total: ${moeda(total)}\n` +
          `Forma de pagamento: ${sessao.finalizacao.pagamento}`
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

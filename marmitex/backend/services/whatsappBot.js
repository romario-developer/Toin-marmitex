// backend/services/whatsappBot.js
import wppconnect from '@wppconnect-team/wppconnect';
import dotenv from 'dotenv';
import Pedido from '../models/Pedido.js';
import Configuracao from '../models/Configuracao.js';
import Cardapio from '../models/Cardapio.js';
import NumeroPermitido from '../models/NumeroPermitido.js';
import { conectarWhatsapp } from '../config/wppconnect.js';

dotenv.config();

// ===================== Memória do simulador =====================
const conversas = {};
function pushMsg(from, who, text, extra = {}) {
  if (!conversas[from]) conversas[from] = [];
  conversas[from].push({ who, text, at: Date.now(), ...extra });
}
export function getConversa(from) {
  return conversas[from] ?? [];
}
export function resetConversa(from) {
  conversas[from] = [];
}

// ===================== Controles de Privacidade =====================
const MODO_PRIVADO = String(process.env.MODO_PRIVADO || 'false') === 'true';
const START_KEY = (process.env.START_KEY || 'toin').toLowerCase().trim();

const ALLOWED = String(process.env.WHATSAPP_ALLOWED || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

async function isAllowedNumber(jid) {
  const num = (jid || '').split('@')[0];
  if (!MODO_PRIVADO) return true;

  // Checa se está no .env (opcional, se quiser manter ambos)
  if (ALLOWED.includes(num)) return true;

  // Checa no banco
  const permitido = await NumeroPermitido.findOne({ numero: num });
  return !!permitido;
}


// ===================== Estado / Cache =====================
const sessoes = {};
let cacheConfig = null;
let cacheAt = 0;
const CACHE_MS = 60_000;

// ===================== Helpers =====================
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

function moeda(v) {
  const n = Number(v ?? 0);
  return `R$ ${n},00`;
}

function mensagemTamanhos(cfg) {
  return (
    'Qual o tamanho da marmita?\n' +
    `P (${moeda(cfg.precosMarmita?.P ?? 0)})\n` +
    `M (${moeda(cfg.precosMarmita?.M ?? 0)})\n` +
    `G (${moeda(cfg.precosMarmita?.G ?? 0)})\n\n` +
    'Responda com: P, M ou G.'
  );
}

function mensagemBebidas(cfg) {
  return (
    'Escolha a bebida:\n' +
    `1. Coca Lata (${moeda(cfg.precosBebida?.lata ?? 0)})\n` +
    `2. Coca 1L (${moeda(cfg.precosBebida?.umLitro ?? 0)})\n` +
    `3. Coca 2L (${moeda(cfg.precosBebida?.doisLitros ?? 0)})`
  );
}

function mensagemEntrega(cfg) {
  return (
    'Entrega ou retirar no local?\n' +
    `1. Entrega (+${moeda(cfg.taxaEntrega ?? 0)})\n` +
    '2. Retirar no local'
  );
}

// ===================== Núcleo do fluxo =====================
async function processarMensagem(client, msg, simulado = false) {
  const remetente = msg.from || '';
  const texto = (msg.body || '').toLowerCase().trim();

  if (remetente === 'status@broadcast' || msg.isStatus) return;
  if (msg.isGroupMsg || remetente.endsWith('@g.us')) return;
  if (!isAllowedNumber(remetente)) {
    console.log(`🔒 [Privado] Ignorado: ${remetente}`);
    return;
  }

  if (!sessoes[remetente]) sessoes[remetente] = { etapa: 'inicio', autorizado: false };
  const sessao = sessoes[remetente];

  const enviar = async (mensagem) => {
    if (simulado) {
      pushMsg(remetente, 'bot', mensagem);
    } else {
      await client.sendText(remetente, mensagem);
    }
  };

  switch (sessao.etapa) {
    case 'inicio': {
      if (!sessao.autorizado) {
        if (texto !== START_KEY) {
          await enviar(`👋 Envie *${START_KEY}* para iniciar seu pedido.`);
          return;
        }
        sessao.autorizado = true;
      }

      const c = await getCardapioHoje();
      let textoBase = 'Olá! Seja bem-vindo ao marmitex!\n\n';
      if (!c) {
        textoBase += 'Cardápio não disponível hoje.';
        await enviar(textoBase);
        return;
      }

      const base = process.env.PUBLIC_BASE_URL || '';
      if (c.cardapio1?.imagem) {
        await client.sendImage(remetente, base + c.cardapio1.imagem, 'cardapio1.jpg', c.cardapio1.descricao);
      }
      if (c.cardapio2?.imagem) {
        await client.sendImage(remetente, base + c.cardapio2.imagem, 'cardapio2.jpg', c.cardapio2.descricao);
      }

      sessao.etapa = 'cardapio';
      break;
    }

    case 'cardapio':
      if (['1', '2'].includes(texto)) {
        sessao.finalizacao = { cardapio: `CARDÁPIO ${texto}` };
        await enviar(mensagemTamanhos(await getConfig()));
        sessao.etapa = 'tamanho';
      } else {
        await enviar('Digite 1 ou 2 para escolher o cardápio.');
      }
      break;

    case 'tamanho':
      if (['p', 'm', 'g'].includes(texto)) {
        sessao.finalizacao.tamanho = texto.toUpperCase();
        await enviar('Deseja bebida? Digite "sim" ou "não".');
        sessao.etapa = 'bebida';
      } else {
        await enviar(mensagemTamanhos(await getConfig()));
      }
      break;

    case 'bebida':
      if (['não', 'nao'].includes(texto)) {
        sessao.finalizacao.bebida = 'Nenhuma';
        await enviar(mensagemEntrega(await getConfig()));
        sessao.etapa = 'entrega';
      } else if (texto === 'sim') {
        await enviar(mensagemBebidas(await getConfig()));
        sessao.etapa = 'escolher-bebida';
      } else {
        await enviar('Responda com "sim" ou "não".');
      }
      break;

    case 'escolher-bebida':
      if (['1', '2', '3'].includes(texto)) {
        const bebidas = { 1: 'Coca Lata', 2: 'Coca 1L', 3: 'Coca 2L' };
        sessao.finalizacao.bebida = bebidas[texto];
        await enviar(mensagemEntrega(await getConfig()));
        sessao.etapa = 'entrega';
      } else {
        await enviar(mensagemBebidas(await getConfig()));
      }
      break;

    case 'entrega':
      if (['1', '2'].includes(texto)) {
        const cfg = await getConfig();
        sessao.finalizacao.tipoEntrega = texto === '1' ? 'Entrega' : 'Retirar';
        sessao.finalizacao.taxaEntrega = texto === '1' ? cfg.taxaEntrega : 0;
        await enviar('Escolha a forma de pagamento:\n1. Dinheiro\n2. PIX\n3. Cartão');
        sessao.etapa = 'pagamento';
      } else {
        await enviar(mensagemEntrega(await getConfig()));
      }
      break;

    case 'pagamento':
      if (['1', '2', '3'].includes(texto)) {
        const formas = { 1: 'Dinheiro', 2: 'PIX', 3: 'Cartão' };
        sessao.finalizacao.pagamento = formas[texto];
        const cfg = await getConfig();
        const base = cfg.precosMarmita[sessao.finalizacao.tamanho];
        const adicional = sessao.finalizacao.bebida === 'Nenhuma' ? 0 : cfg.precosBebida[
          sessao.finalizacao.bebida === 'Coca Lata' ? 'lata' :
          sessao.finalizacao.bebida === 'Coca 1L' ? 'umLitro' : 'doisLitros'
        ];
        const total = base + adicional + (sessao.finalizacao.taxaEntrega ?? 0);

        await enviar(`🧾 Resumo do pedido:\n${JSON.stringify(sessao.finalizacao, null, 2)}\nTotal: ${moeda(total)}`);
        await enviar('✅ Pedido confirmado! Sua marmita está sendo preparada.');
        await salvarPedido(sessao.finalizacao, remetente, msg.sender?.pushname);
        delete sessoes[remetente];
      } else {
        await enviar('Escolha inválida.');
      }
      break;
  }
}

// ===================== APIs =====================
export async function handleMensagemSimulada({ from, body }) {
  pushMsg(from, 'user', body);
  await processarMensagem(null, { from, body, sender: { pushname: 'Teste Simulado' } }, true);
}

export async function iniciarBot() {
  try {
    const client = await conectarWhatsapp(async (msg) => {
      try {
        await processarMensagem(client, msg);
      } catch (e) {
        console.error('❌ Erro crítico ao processar mensagem:', e);
      }
    });
    
    console.log('🤖 Bot conectado e escutando mensagens.');
  } catch (erro) {
    console.error('❌ Erro fatal ao iniciar o bot:', erro);
  }
}

process.on('unhandledRejection', (r) => console.error('⚠️ Unhandled Rejection:', r));

async function salvarPedido(finalizacao, remetente, nome = '') {
  try {
    await new Pedido({
      cliente: { numero: remetente, nome },
      ...finalizacao
    }).save();
  } catch (erro) {
    console.error('❌ Erro ao salvar pedido no banco de dados:', erro);
  }
}

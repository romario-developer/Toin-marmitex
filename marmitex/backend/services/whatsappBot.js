// backend/services/whatsappBot.js
// ESM - compatível com o server.js (injeta o client no init)

import { waitUntilReady } from '../config/wppconnect.js';
import Pedido from '../models/Pedido.js';

/* ======================= GATES ANTI-STATUS/BROADCAST/GRUPO ======================= */
function isStatusJid(jid) { return typeof jid === 'string' && jid === 'status@broadcast'; }
function isBroadcastJid(jid) { return typeof jid === 'string' && jid.endsWith('@broadcast'); }
function isGroupJid(jid) { return typeof jid === 'string' && jid.endsWith('@g.us'); }
function isPrivateChatJid(jid) { return typeof jid === 'string' && jid.endsWith('@c.us'); }
function isForbiddenJid(jid) { return isStatusJid(jid) || isBroadcastJid(jid) || isGroupJid(jid) || !isPrivateChatJid(jid); }
/* ================================================================================ */

/* =================== Configurações de Fluxo/Preços =================== */
const PRECOS = {
  P: Number(process.env.PRECO_P) || 20,
  M: Number(process.env.PRECO_M) || 25,
  G: Number(process.env.PRECO_G) || 30,
  bebidas: {
    'Coca Lata': Number(process.env.PRECO_COCA_LATA) || 6,
    'Coca 1L': Number(process.env.PRECO_COCA_1L) || 10,
    'Coca 2L': Number(process.env.PRECO_COCA_2L) || 14,
    'Não': 0,
  },
};

const PIX_KEY = process.env.PIX_KEY || 'SUACHAVE-PIX-AQUI';

const CARDAPIOS = {
  'CARDÁPIO 1': [
    '• Arroz, Feijão, Bife acebolado, Batata frita, Salada',
    '• Macarronada ao sugo com frango grelhado',
  ],
  'CARDÁPIO 2': [
    '• Arroz, Feijão, Frango à milanesa, Purê, Salada',
    '• Escondidinho de carne com arroz e salada',
  ],
};

/* =================== Estado =================== */
const SESSOES = new Map(); // telefone -> sessão
const SIM_TEL = 'simulador';
const SIM_CONVERSA = []; // { who: 'user'|'bot', text, ts }

function resetSessao(telefone) {
  SESSOES.set(telefone, {
    etapa: 'inicio',
    dados: {
      cardapio: null,
      tamanho: null,
      bebida: 'Não',
      total: 0,
      trocoPara: null,
    },
    aguardandoPIX: false,
  });
}

function precoTamanho(tamanho) { return PRECOS[tamanho] || 0; }
function precoBebida(nome) { return PRECOS.bebidas[nome] ?? 0; }
function normalizarTexto(t) { return (t || '').trim().toLowerCase(); }

function resumoPedido(d) {
  const linhas = [
    '🍽️ *Resumo do pedido*',
    '────────────────────',
    `• Cardápio: *${d.cardapio?.tipo || '-'}*`,
    `• Tamanho: *${d.tamanho || '-'}*`,
    `• Bebida: *${d.bebida || 'Não'}*`,
  ];
  if (d.trocoPara) linhas.push(`• Troco para: *R$ ${Number(d.trocoPara).toFixed(2)}*`);
  linhas.push(`• Total: *R$ ${Number(d.total).toFixed(2)}*`);
  return linhas.join('\n');
}

function isNavError(err) {
  const msg = String(err?.message || err);
  return (
    msg.includes('Execution context was destroyed') ||
    msg.includes('Cannot find context') ||
    msg.includes('Target closed') ||
    msg.includes('Navigation')
  );
}

/* =================== Envio com GATE + Retry =================== */
async function enviarMensagem(client, telefone, texto) {
  const ok = await waitUntilReady(client, 180000); // até 3 min pra conectar/parear
  if (!ok) throw new Error('Cliente não conectou (aguarde ler o QR).');

  let attempt = 0;
  const max = 5;

  while (true) {
    try {
      return await client.sendText(telefone, texto);
    } catch (err) {
      attempt++;
      if (attempt >= max || !isNavError(err)) throw err;
      const wait = 300 * attempt;
      console.warn(`sendText falhou por navegação (tentativa ${attempt}/${max}). Aguardar ${wait}ms...`);
      await new Promise((r) => setTimeout(r, wait));
      await waitUntilReady(client, 60000);
    }
  }
}

// Enviador genérico (p/ Whats real e simulador)
async function enviar(clientOrFn, telefone, texto) {
  if (typeof clientOrFn === 'function') return clientOrFn(telefone, texto); // simulador
  return enviarMensagem(clientOrFn, telefone, texto);
}

/* =================== Núcleo do fluxo =================== */
async function processarMensagem(clientOrFn, telefone, texto) {
  try {
    if (!SESSOES.has(telefone)) resetSessao(telefone);
    const sessao = SESSOES.get(telefone);

    const tNorm = normalizarTexto(texto);

    // Atalhos de início
    if (['oi', 'menu', 'toin', 'cardapio', 'cardápio', 'start'].includes(tNorm) || sessao.etapa === 'inicio') {
      sessao.etapa = 'escolher_cardapio';
      const menu1 = CARDAPIOS['CARDÁPIO 1'].map((i) => `   ${i}`).join('\n');
      const menu2 = CARDAPIOS['CARDÁPIO 2'].map((i) => `   ${i}`).join('\n');
      await enviar(clientOrFn, telefone, [
        '🥘 *CARDÁPIO DO DIA*',
        '────────────────────',
        '*1)* CARDÁPIO 1:',
        menu1,
        '',
        '*2)* CARDÁPIO 2:',
        menu2,
        '',
        'Responda com *1* ou *2* para escolher.',
      ].join('\n'));
      return;
    }

    // Aguardando PIX
    if (sessao.aguardandoPIX) {
      if (tNorm.includes('pago')) {
        await enviar(clientOrFn, telefone, '✅ Pagamento confirmado! Sua marmita já está sendo preparada. Obrigado! 🍽️');
        sessao.aguardandoPIX = false;
        sessao.etapa = 'finalizado';
        return;
      } else {
        await enviar(clientOrFn, telefone, 'Ainda aguardando confirmação do pagamento. Envie *pago* assim que concluir o PIX, por favor.');
        return;
      }
    }

    switch (sessao.etapa) {
      case 'escolher_cardapio': {
        if (tNorm === '1' || tNorm.includes('cardapio 1') || tNorm.includes('cardápio 1')) {
          sessao.dados.cardapio = { tipo: 'CARDÁPIO 1', itens: CARDAPIOS['CARDÁPIO 1'] };
        } else if (tNorm === '2' || tNorm.includes('cardapio 2') || tNorm.includes('cardápio 2')) {
          sessao.dados.cardapio = { tipo: 'CARDÁPIO 2', itens: CARDAPIOS['CARDÁPIO 2'] };
        } else {
          await enviar(clientOrFn, telefone, 'Opção inválida. Responda com *1* (CARDÁPIO 1) ou *2* (CARDÁPIO 2).');
          return;
        }
        sessao.etapa = 'escolher_tamanho';
        await enviar(clientOrFn, telefone, [
          '📏 *Tamanho da marmita*',
          '────────────────────',
          `1) P - R$ ${PRECOS.P.toFixed(2)}`,
          `2) M - R$ ${PRECOS.M.toFixed(2)}`,
          `3) G - R$ ${PRECOS.G.toFixed(2)}`,
          '',
          'Responda com *1*, *2* ou *3*.',
        ].join('\n'));
        return;
      }

      case 'escolher_tamanho': {
        let tamanho = null;
        if (tNorm === '1' || tNorm === 'p') tamanho = 'P';
        if (tNorm === '2' || tNorm === 'm') tamanho = 'M';
        if (tNorm === '3' || tNorm === 'g') tamanho = 'G';
        if (!tamanho) { await enviar(clientOrFn, telefone, 'Ops! Responda com *1* (P), *2* (M) ou *3* (G).'); return; }
        sessao.dados.tamanho = tamanho;
        sessao.dados.total = precoTamanho(tamanho);
        sessao.etapa = 'escolher_bebida';
        await enviar(clientOrFn, telefone, [
          '🥤 *Bebida*',
          '────────────────────',
          `1) Coca Lata - R$ ${PRECOS.bebidas['Coca Lata'].toFixed(2)}`,
          `2) Coca 1L   - R$ ${PRECOS.bebidas['Coca 1L'].toFixed(2)}`,
          `3) Coca 2L   - R$ ${PRECOS.bebidas['Coca 2L'].toFixed(2)}`,
          '4) Não',
          '',
          'Responda com *1*, *2*, *3* ou *4*.',
        ].join('\n'));
        return;
      }

      case 'escolher_bebida': {
        let bebida = null;
        if (tNorm === '1') bebida = 'Coca Lata';
        if (tNorm === '2') bebida = 'Coca 1L';
        if (tNorm === '3') bebida = 'Coca 2L';
        if (tNorm === '4' || tNorm === 'nao' || tNorm === 'não') bebida = 'Não';
        if (!bebida) { await enviar(clientOrFn, telefone, 'Escolha inválida. Responda com *1*, *2*, *3* ou *4*.'); return; }
        sessao.dados.bebida = bebida;
        sessao.dados.total = precoTamanho(sessao.dados.tamanho) + precoBebida(bebida);
        sessao.etapa = 'confirmar_pedido';
        await enviar(clientOrFn, telefone, [
          resumoPedido(sessao.dados),
          '',
          'Confirma o pedido?',
          'Responda *sim* para confirmar ou *não* para cancelar.',
        ].join('\n'));
        return;
      }

      case 'confirmar_pedido': {
        if (['sim', 's', 'confirmo'].includes(tNorm)) {
          sessao.etapa = 'forma_pagamento';
          await enviar(clientOrFn, telefone, [
            '💳 *Forma de pagamento*',
            '────────────────────',
            '1) Dinheiro',
            '2) PIX',
            '3) Cartão',
            '',
            'Responda com *1*, *2* ou *3*.',
          ].join('\n'));
          return;
        } else if (['nao', 'não', 'n'].includes(tNorm)) {
          await enviar(clientOrFn, telefone, 'Pedido cancelado. Se quiser começar de novo, envie *menu*.');
          resetSessao(telefone);
          return;
        } else {
          await enviar(clientOrFn, telefone, 'Por favor, responda *sim* para confirmar ou *não* para cancelar.');
          return;
        }
      }

      case 'forma_pagamento': {
        let forma = null;
        if (tNorm === '1' || tNorm.includes('dinheiro')) forma = 'Dinheiro';
        if (tNorm === '2' || tNorm === 'pix') forma = 'PIX';
        if (tNorm === '3' || tNorm.includes('cartao') || tNorm.includes('cartão')) forma = 'Cartão';
        if (!forma) { await enviar(clientOrFn, telefone, 'Opção inválida. Responda com *1* (Dinheiro), *2* (PIX) ou *3* (Cartão).'); return; }

        // Se for DINHEIRO, perguntar troco antes de gravar pedido
        if (forma === 'Dinheiro') {
          sessao.dados.formaPagamento = forma;
          sessao.etapa = 'troco_dinheiro';
          await enviar(clientOrFn, telefone, [
            '🧾 Você precisa de *troco*?',
            'Se sim, responda com o valor: ex: *50* ou *R$ 100*.',
            'Se não precisa, responda *não*.',
          ].join('\n'));
          return;
        }

        // PIX ou Cartão -> já cria pedido
        const pedidoCriado = await Pedido.create({
          telefone,
          cardapio: { tipo: sessao.dados.cardapio.tipo, itens: sessao.dados.cardapio.itens || [] },
          tamanho: sessao.dados.tamanho,
          bebida: sessao.dados.bebida,
          formaPagamento: forma,
          total: sessao.dados.total,
          statusPagamento: forma === 'PIX' ? 'pendente' : 'nao_aplicavel',
          status: 'em_preparo',
        });

        if (forma === 'PIX') {
          SESSOES.get(telefone).aguardandoPIX = true;
          await enviar(clientOrFn, telefone, [
            '🔑 *PIX* selecionado.',
            `Chave PIX: *${PIX_KEY}*`,
            `Valor: *R$ ${SESSOES.get(telefone).dados.total.toFixed(2)}*`,
            '',
            'Após pagar, responda aqui com *pago* para confirmarmos.',
          ].join('\n'));
        } else {
          await enviar(clientOrFn, telefone, [
            '✅ Pedido confirmado! Sua marmita já está sendo preparada. 😋',
            '',
            `Número do pedido: *${pedidoCriado._id}*`,
            'Agradecemos a preferência!',
          ].join('\n'));
          SESSOES.get(telefone).etapa = 'finalizado';
        }
        return;
      }

      case 'troco_dinheiro': {
        if (['nao', 'não', 'n'].includes(tNorm)) {
          sessao.dados.trocoPara = null;
        } else {
          // pega dígitos do texto
          const m = (texto.match(/\d+[.,]?\d*/g) || [])[0];
          if (m) {
            const valor = Number(String(m).replace('.', '').replace(',', '.'));
            if (!isNaN(valor) && valor > 0) sessao.dados.trocoPara = valor;
          }
        }

        const pedidoCriado = await Pedido.create({
          telefone,
          cardapio: { tipo: sessao.dados.cardapio.tipo, itens: sessao.dados.cardapio.itens || [] },
          tamanho: sessao.dados.tamanho,
          bebida: sessao.dados.bebida,
          formaPagamento: 'Dinheiro',
          trocoPara: sessao.dados.trocoPara,
          total: sessao.dados.total,
          statusPagamento: 'nao_aplicavel',
          status: 'em_preparo',
        });

        await enviar(clientOrFn, telefone, [
          resumoPedido(sessao.dados),
          '',
          '✅ Pedido confirmado! Sua marmita já está sendo preparada. 😋',
          `Número do pedido: *${pedidoCriado._id}*`,
        ].join('\n'));

        SESSOES.get(telefone).etapa = 'finalizado';
        return;
      }

      case 'finalizado': {
        if (['menu', 'novopedido', 'novo pedido', 'toin', 'oi'].includes(tNorm)) {
          resetSessao(telefone);
          await enviar(clientOrFn, telefone, 'Vamos lá de novo! 👇');
          SESSOES.get(telefone).etapa = 'escolher_cardapio';
          const menu1 = CARDAPIOS['CARDÁPIO 1'].map((i) => `   ${i}`).join('\n');
          const menu2 = CARDAPIOS['CARDÁPIO 2'].map((i) => `   ${i}`).join('\n');
          await enviar(clientOrFn, telefone, [
            '🥘 *CARDÁPIO DO DIA*',
            '────────────────────',
            '*1)* CARDÁPIO 1:',
            menu1,
            '',
            '*2)* CARDÁPIO 2:',
            menu2,
            '',
            'Responda com *1* ou *2* para escolher.',
          ].join('\n'));
          return;
        } else {
          await enviar(clientOrFn, telefone, 'Pedido já finalizado. Envie *menu* para fazer outro pedido.');
          return;
        }
      }

      default: {
        resetSessao(telefone);
        await enviar(clientOrFn, telefone, 'Vamos começar! Envie *menu* para ver o cardápio do dia.');
        return;
      }
    }
  } catch (err) {
    console.error('Erro no fluxo do bot:', err);
  }
}

/* =================== Bootstrap chamado pelo server.js =================== */
/**
 * Export default compatível com o server.js:
 * Ele injeta o `client` já criado e logado.
 */
export default async function initBot(client) {
  console.log('🤖 Bot Marmitex: iniciando listeners...');

  // Evita listeners duplicados em hot-reload/start múltiplos
  if (client.__marmitexListenersMounted) {
    console.log('ℹ️ Bot Marmitex: listeners já montados; ignorando repetição.');
    return;
  }
  client.__marmitexListenersMounted = true;

  client.onMessage(async (message) => {
    try {
      const from = message?.from || '';
      if (message.isGroupMsg) return;
      if (isForbiddenJid(from)) {
        console.warn('[BOT] Ignorando mensagem de origem proibida:', from);
        return;
      }

      const telefone = from;
      const texto = (message.body || '').trim();
      await processarMensagem(client, telefone, texto);
    } catch (err) {
      console.error('Erro no onMessage:', err);
    }
  });

  // Logs úteis
  if (typeof client.onStateChange === 'function') {
    client.onStateChange((s) => console.log('🤖 [bot] onStateChange:', s));
  }
  if (typeof client.onStreamChange === 'function') {
    client.onStreamChange((s) => console.log('🤖 [bot] onStreamChange:', s));
  }

  console.log('✅ Bot Marmitex: listeners prontos.');
}

/* =================== Simulador (painel) =================== */
export async function handleMensagemSimulada(texto) {
  const ts = Date.now();
  SIM_CONVERSA.push({ who: 'user', text: texto, ts });

  const sendSim = async (_tel, resposta) => {
    SIM_CONVERSA.push({ who: 'bot', text: resposta, ts: Date.now() });
  };

  await processarMensagem(sendSim, SIM_TEL, texto);
  return { ok: true, conversa: SIM_CONVERSA.slice(-20) };
}

export function getConversa() {
  return SIM_CONVERSA.slice(-50);
}

export function resetConversa() {
  SIM_CONVERSA.length = 0;
  resetSessao(SIM_TEL);
}

// backend/services/whatsappBot.js
// ESM - compatível com o server.js (injeta o client no init)

import { waitUntilReady } from '../config/wppconnect.js';
import Pedido from '../models/Pedido.js';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { criarPagamentoPIX } from './mercadoPagoService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ======================= VARIÁVEIS GLOBAIS ======================= */
// Mapa de sessões ativas
const SESSOES = new Map();

// Variáveis do simulador
const SIM_CONVERSA = [];
const SIM_TEL = '5511999999999@c.us';

// Monitor de conexão
let connectionMonitor = null;

/* ======================= CONFIGURAÇÕES DE ESTABILIDADE ======================= */
const BOT_CONFIG = {
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 2000,
  MESSAGE_TIMEOUT_MS: 30000,
  SESSION_CLEANUP_INTERVAL_MS: 3600000, // 1 hora
  MAX_SESSIONS: 1000,
  HEARTBEAT_INTERVAL_MS: 300000, // 5 minutos
};

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
const NUMERO_TESTE = '557391472169@c.us';

// Adicionar configurações de modo privado
const MODO_PRIVADO = process.env.MODO_PRIVADO === 'true';
const WHATSAPP_ALLOWED = process.env.WHATSAPP_ALLOWED || '557391472169,9848494243912';
const NUMEROS_PERMITIDOS = WHATSAPP_ALLOWED.split(',').map(num => num.trim());

/* =================== Funções de Monitoramento =================== */
function startConnectionMonitor(client) {
  console.log('🔄 Iniciando monitor de conexão...');
  
  // Limpar monitor anterior se existir
  if (connectionMonitor) {
    clearInterval(connectionMonitor);
  }
  
  connectionMonitor = setInterval(async () => {
    try {
      const isConnected = await client.getConnectionState();
      console.log(`📡 Status da conexão: ${isConnected}`);
      
      // Limpar sessões antigas
      cleanupOldSessions();
      
    } catch (error) {
      console.error('❌ Erro no monitor de conexão:', error.message);
    }
  }, BOT_CONFIG.HEARTBEAT_INTERVAL_MS);
}

function stopConnectionMonitor() {
  console.log('🛑 Parando monitor de conexão...');
  if (connectionMonitor) {
    clearInterval(connectionMonitor);
    connectionMonitor = null;
  }
}

function cleanupOldSessions() {
  const now = Date.now();
  const expiredSessions = [];
  
  for (const [telefone, sessao] of SESSOES.entries()) {
    if (now - sessao.lastActivity > BOT_CONFIG.SESSION_CLEANUP_INTERVAL_MS) {
      expiredSessions.push(telefone);
    }
  }
  
  expiredSessions.forEach(telefone => {
    SESSOES.delete(telefone);
    console.log(`🧹 Sessão expirada removida: ${telefone}`);
  });
  
  if (expiredSessions.length > 0) {
    console.log(`🧹 ${expiredSessions.length} sessões antigas removidas`);
  }
}

/* =================== Funções de Autorização =================== */
function isAuthorizedNumber(from) {
  if (!MODO_PRIVADO) return true;
  
  const cleanNumber = from.replace('@c.us', '');
  return NUMEROS_PERMITIDOS.some(num => cleanNumber.includes(num));
}

function isForbiddenJid(jid) {
  const forbiddenPatterns = [
    '@g.us',     // grupos
    '@broadcast', // listas de transmissão
    'status@broadcast' // status
  ];
  
  return forbiddenPatterns.some(pattern => jid.includes(pattern));
}

/* =================== Funções Auxiliares =================== */
function resetSessao(telefone) {
  SESSOES.set(telefone, {
    etapa: 'inicio',
    lastActivity: Date.now(),
    dados: {
      cardapio: null,
      tamanho: null,
      bebida: null,
      formaPagamento: null,
      total: 0,
      trocoPara: null,
    },
    aguardandoPIX: false,
  });
}

function updateSessionActivity(telefone) {
  const sessao = SESSOES.get(telefone);
  if (sessao) {
    sessao.lastActivity = Date.now();
  }
}

// Função para normalizar texto
function normalizarTexto(texto) {
  return texto
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, ' '); // Normaliza espaços
}

// Função para enviar mensagens
async function enviar(clientOrFn, telefone, mensagem) {
  try {
    if (typeof clientOrFn === 'function') {
      // Modo simulador
      clientOrFn(telefone, mensagem);
    } else {
      // Modo real
      await clientOrFn.sendText(telefone, mensagem);
    }
    console.log(`✅ Mensagem enviada para ${telefone}: ${mensagem.substring(0, 50)}...`);
  } catch (error) {
    console.error(`❌ Erro ao enviar mensagem para ${telefone}:`, error.message);
    throw error;
  }
}

async function buscarCardapioDodia() {
  try {
    // Buscar cardápio do banco de dados usando o controller
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);
    
    const Cardapio = (await import('../models/Cardapio.js')).default;
    const cardapio = await Cardapio.findOne({
      data: {
        $gte: hoje,
        $lt: amanha
      }
    });
    
    if (!cardapio) {
      return {
        cardapio1: { descricao: 'Feijoada Completa', imagem: '' },
        cardapio2: { descricao: 'Frango Grelhado com Legumes', imagem: '' }
      };
    }
    
    return cardapio;
  } catch (error) {
    console.error('❌ Erro ao buscar cardápio:', error.message);
    return {
      cardapio1: { descricao: 'Feijoada Completa', imagem: '' },
      cardapio2: { descricao: 'Frango Grelhado com Legumes', imagem: '' }
    };
  }
}

// Função de processamento - CORRIGIDA
async function processarMensagem(clientOrFn, telefone, texto) {
  const startTime = Date.now();

  try {
    if (!SESSOES.has(telefone)) {
      resetSessao(telefone);
      console.log(`🆕 Nova sessão criada para ${telefone}`);
    }

    const sessao = SESSOES.get(telefone);
    updateSessionActivity(telefone);

    const tNorm = normalizarTexto(texto);
    console.log(`📨 Processando mensagem de ${telefone}: "${texto}" (etapa: ${sessao.etapa})`);

    // Atalhos globais
    if (tNorm === 'reiniciar' || tNorm === 'inicio') {
      resetSessao(telefone);
      await enviar(clientOrFn, telefone, '🔄 Sessão reiniciada! Digite qualquer coisa para ver o cardápio.');
      return;
    }

    switch (sessao.etapa) {
      case 'inicio':
        // Mensagem de boas-vindas primeiro
        await enviar(clientOrFn, telefone, '👋 Olá! Bem-vindo(a) à nossa marmitaria! 🍽️\n\nVamos ver o cardápio de hoje:');
        
        // Aguardar 2 segundos antes de mostrar o cardápio
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // QUALQUER mensagem inicial mostra o cardápio (como estava antes)
        const cardapio = await buscarCardapioDodia();
        
        // Enviar cardápio 1 com imagem e descrição
        if (cardapio.cardapio1?.imagem) {
          try {
            await clientOrFn.sendImageFromBase64(
              telefone,
              cardapio.cardapio1.imagem,
              'cardapio1.jpg',
              `📋 *Cardápio 1*\n${cardapio.cardapio1.descricao}`
            );
          } catch (imgError) {
            console.warn('⚠️ Erro ao enviar imagem do cardápio 1:', imgError.message);
            // Se falhar, enviar só o texto
            await enviar(clientOrFn, telefone, `📋 *Cardápio 1*: ${cardapio.cardapio1.descricao}`);
          }
        } else {
          // Se não tiver imagem, enviar só o texto
          await enviar(clientOrFn, telefone, `📋 *Cardápio 1*: ${cardapio.cardapio1.descricao}`);
        }
        
        // Aguardar 1.5 segundos antes de mostrar o cardápio 2
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Enviar cardápio 2 com imagem e descrição
        if (cardapio.cardapio2?.imagem) {
          try {
            await clientOrFn.sendImageFromBase64(
              telefone,
              cardapio.cardapio2.imagem,
              'cardapio2.jpg',
              `📋 *Cardápio 2*\n${cardapio.cardapio2.descricao}`
            );
          } catch (imgError) {
            console.warn('⚠️ Erro ao enviar imagem do cardápio 2:', imgError.message);
            // Se falhar, enviar só o texto
            await enviar(clientOrFn, telefone, `📋 *Cardápio 2*: ${cardapio.cardapio2.descricao}`);
          }
        } else {
          // Se não tiver imagem, enviar só o texto
          await enviar(clientOrFn, telefone, `📋 *Cardápio 2*: ${cardapio.cardapio2.descricao}`);
        }
        
        // Aguardar 1 segundo antes da mensagem de escolha
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Enviar mensagem de escolha SEM o título \"Cardápio de Hoje\"
        const textoEscolha = `Digite o número do cardápio desejado:\n1️⃣ Cardápio 1\n2️⃣ Cardápio 2`;
        
        sessao.etapa = 'cardapio';
        await enviar(clientOrFn, telefone, textoEscolha);
        break;

      case 'cardapio':
        if (['1', '2'].includes(tNorm)) {
          const cardapio = await buscarCardapioDodia();
          
          sessao.dados.cardapio = {
            opcao: tNorm,
            tipo: tNorm === '1' ? cardapio.cardapio1.descricao : cardapio.cardapio2.descricao
          };

          sessao.etapa = 'tamanho';

          const textoTamanho = `✅ *${sessao.dados.cardapio.tipo}* selecionado!

Escolha o tamanho da marmita:

1️⃣ Pequena (P) - R$ ${PRECOS.P.toFixed(2).replace('.', ',')}
2️⃣ Média (M) - R$ ${PRECOS.M.toFixed(2).replace('.', ',')}
3️⃣ Grande (G) - R$ ${PRECOS.G.toFixed(2).replace('.', ',')}`;

          await enviar(clientOrFn, telefone, textoTamanho);
        } else {
          await enviar(clientOrFn, telefone, 
            '❌ Opção inválida. Digite *1* ou *2* para escolher o cardápio.'
          );
        }
        break;

      case 'tamanho':
        if (['1', '2', '3'].includes(tNorm)) {
          const tamanhos = { '1': 'P', '2': 'M', '3': 'G' };
          const tamanho = tamanhos[tNorm];
          
          sessao.dados.tamanho = tamanho;
          sessao.dados.preco = PRECOS[tamanho];
          sessao.etapa = 'bebida';

          const textoBebida = `✅ Tamanho *${tamanho}* selecionado!

🥤 Deseja adicionar bebida?

1️⃣ Coca Lata - R$ ${PRECOS.bebidas['Coca Lata'].toFixed(2).replace('.', ',')}
2️⃣ Coca 1L - R$ ${PRECOS.bebidas['Coca 1L'].toFixed(2).replace('.', ',')}
3️⃣ Coca 2L - R$ ${PRECOS.bebidas['Coca 2L'].toFixed(2).replace('.', ',')}
4️⃣ Não, obrigado`;

          await enviar(clientOrFn, telefone, textoBebida);
        } else {
          await enviar(clientOrFn, telefone, 
            '❌ Opção inválida. Digite *1* (P), *2* (M) ou *3* (G).'
          );
        }
        break;

      case 'bebida':
        if (['1', '2', '3', '4'].includes(tNorm)) {
          const bebidas = {
            '1': 'Coca Lata',
            '2': 'Coca 1L', 
            '3': 'Coca 2L',
            '4': 'Não'
          };

          const bebida = bebidas[tNorm];
          sessao.dados.bebida = bebida;
          sessao.dados.precoBebida = PRECOS.bebidas[bebida];
          sessao.dados.precoTotal = sessao.dados.preco + sessao.dados.precoBebida;
          sessao.etapa = 'pagamento'; // Mudança: vai direto para pagamento

          let textoBebida = '';
          if (bebida === 'Não') {
            textoBebida = '✅ Pedido sem bebida!';
          } else {
            textoBebida = `✅ *${bebida}* adicionada!`;
          }

          const textoPagamento = `${textoBebida}

💰 *Total do pedido: R$ ${sessao.dados.precoTotal.toFixed(2).replace('.', ',')}*

💳 Escolha a forma de pagamento:

1️⃣ Dinheiro
2️⃣ PIX
3️⃣ Cartão`;

          await enviar(clientOrFn, telefone, textoPagamento);
        } else {
          await enviar(clientOrFn, telefone, 
            '❌ Opção inválida. Digite *1*, *2*, *3* ou *4*.'
          );
        }
        break;

      case 'pagamento':
        if (['1', '2', '3'].includes(tNorm)) {
          const formasPagamento = {
            '1': 'Dinheiro',
            '2': 'PIX', 
            '3': 'Cartão'
          };

          const formaPagamento = formasPagamento[tNorm];
          sessao.dados.formaPagamento = formaPagamento;
          // Remover endereço - definir como padrão
          sessao.dados.endereco = 'Retirada no local';

          if (formaPagamento === 'Dinheiro') {
            sessao.etapa = 'troco';
            await enviar(clientOrFn, telefone, 
              `Precisa de troco?\n\n` +
              `1️⃣ Sim\n` +
              `2️⃣ Não (valor exato)`
            );
          } else if (formaPagamento === 'PIX') {
            await finalizarPedido(clientOrFn, telefone, sessao);

            const pedidoSalvo = await Pedido.findOne({ 
              telefone, 
              statusPagamento: 'nao_aplicavel' 
            }).sort({ createdAt: -1 });

            if (pedidoSalvo) {
              await enviarPIXComBotao(clientOrFn, telefone, pedidoSalvo);
            }

            resetSessao(telefone);
          } else {
            // Finalizar pedido para cartão também
            await finalizarPedido(clientOrFn, telefone, sessao);
            await enviar(clientOrFn, telefone, 
              '✅ Pedido confirmado!\nForma de pagamento: Cartão\nSua marmita já está sendo preparada! 🍛'
            );
            resetSessao(telefone);
          }
        }
        break;

      case 'troco':
        if (['1', '2'].includes(tNorm)) {
          if (tNorm === '1') {
            sessao.etapa = 'valor_troco';
            await enviar(clientOrFn, telefone, 
              'Para quanto você precisa de troco? (Digite apenas o valor)'
            );
          } else {
            sessao.dados.troco = 'Não precisa';
            await finalizarPedido(clientOrFn, telefone, sessao);
            await enviar(clientOrFn, telefone, 
              '✅ Pedido confirmado!\nSua marmita já está sendo preparada! 🍛'
            );
            resetSessao(telefone);
          }
        } else {
          await enviar(clientOrFn, telefone, 
            '❌ Opção inválida. Digite *1* (Sim) ou *2* (Não).'
          );
        }
        break;

      case 'valor_troco':
        const valorTroco = parseFloat(texto.replace(',', '.'));
        if (isNaN(valorTroco) || valorTroco <= sessao.dados.precoTotal) {
          await enviar(clientOrFn, telefone, 
            `❌ Valor inválido. Digite um valor maior que R$ ${sessao.dados.precoTotal.toFixed(2).replace('.', ',')}`
          );
        } else {
          sessao.dados.troco = `R$ ${valorTroco.toFixed(2).replace('.', ',')}`;
          await finalizarPedido(clientOrFn, telefone, sessao);
          await enviar(clientOrFn, telefone, 
            `✅ Pedido confirmado!\nTroco para: ${sessao.dados.troco}\nSua marmita já está sendo preparada! 🍛`
          );
          resetSessao(telefone);
        }
        break;

      default:
        await enviar(clientOrFn, telefone, 
          '❌ Comando não reconhecido. Digite *menu* para começar.'
        );
        break;
    }

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`❌ Erro no processamento da mensagem de ${telefone} após ${processingTime}ms:`, {
      error: error.message,
      stack: error.stack,
      telefone,
      texto,
      etapa: SESSOES.get(telefone)?.etapa
    });

    try {
      await enviar(clientOrFn, telefone, 
        '❌ Ops! Ocorreu um erro. Digite *reiniciar* para começar novamente.'
      );
    } catch (recoveryError) {
      console.error('❌ Falha ao enviar mensagem de recuperação:', recoveryError.message);
    }
  }
}

/* =================== Inicialização Principal =================== */
export default async function initBot(client) {
  try {
    console.log('🤖 Inicializando bot WhatsApp...');

    const isReady = await waitUntilReady(client, 300000);
    if (!isReady) {
      throw new Error('Cliente não ficou pronto em 5 minutos');
    }

    console.log('✅ Cliente WhatsApp pronto!');

    startConnectionMonitor(client);

    client.onMessage(async (message) => {
      try {
        const { from, body, isGroupMsg, author } = message;

        if (isForbiddenJid(from)) {
          console.log(`🚫 Mensagem ignorada (JID proibido): ${from}`);
          return;
        }

        if (isGroupMsg) {
          console.log(`🚫 Mensagem de grupo ignorada: ${from}`);
          return;
        }

        if (!isAuthorizedNumber(from)) {
          console.log(`🚫 Número não autorizado em modo privado: ${from}`);
          return;
        }

        if (!body || typeof body !== 'string') {
          console.log(`🚫 Mensagem sem texto válido de ${from}`);
          return;
        }

        console.log(`📱 Nova mensagem de ${from}: "${body}"`);

        await processarMensagem(client, from, body);

      } catch (error) {
        console.error('❌ Erro no listener de mensagens:', error.message);
      }
    });

    console.log('🎯 Bot configurado e aguardando mensagens...');

  } catch (error) {
    console.error('❌ Erro na inicialização do bot:', error.message);
    stopConnectionMonitor();
    throw error;
  }
}

/* =================== Funções do Simulador =================== */
export async function handleMensagemSimulada(texto) {
  try {
    const mockSender = (telefone, resposta) => {
      SIM_CONVERSA.push({ who: 'bot', text: resposta, ts: Date.now() });
      console.log(`🤖 [SIMULADOR] Bot: ${resposta}`);
    };

    SIM_CONVERSA.push({ who: 'user', text: texto, ts: Date.now() });
    console.log(`👤 [SIMULADOR] Usuário: ${texto}`);

    await processarMensagem(mockSender, SIM_TEL, texto);

  } catch (error) {
    console.error('❌ Erro no simulador:', error.message);
    SIM_CONVERSA.push({ who: 'bot', text: 'Erro interno do simulador', ts: Date.now() });
  }
}

export function getConversa() {
  return SIM_CONVERSA;
}

export function resetConversa() {
  SIM_CONVERSA.length = 0;
  resetSessao(SIM_TEL);
}
      

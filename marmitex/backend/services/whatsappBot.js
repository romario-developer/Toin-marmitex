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

// Socket.IO para notificações em tempo real
let socketIO = null;

/* ======================= CONFIGURAÇÕES DE ESTABILIDADE ======================= */
const BOT_CONFIG = {
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 2000,
  MESSAGE_TIMEOUT_MS: 30000,
  SESSION_CLEANUP_INTERVAL_MS: 3600000, // 1 hora
  MAX_SESSIONS: 1000,
  HEARTBEAT_INTERVAL_MS: 300000, // 5 minutos
  TIMEOUT_INATIVIDADE_MS: 600000, // 10 minutos de inatividade
  TIMEOUT_ENCERRAMENTO_MS: 300000, // 5 minutos após finalizar pedido
};

/* ======================= CONFIGURAÇÕES DE ENCERRAMENTO ======================= */
const MENSAGENS_ENCERRAMENTO = [
  '✅ Atendimento encerrado! Foi um prazer atendê-lo(a). Volte sempre! 😊',
  '🙏 Obrigado pela preferência! Atendimento finalizado. Até a próxima!',
  '😄 Atendimento concluído! Esperamos você novamente em breve!',
  '🤗 Muito obrigado! Atendimento encerrado. Tenha um ótimo dia!',
  '✨ Atendimento finalizado! Obrigado pela confiança. Até logo!'
];

const PALAVRAS_AGRADECIMENTO = [
  'obrigado', 'obrigada', 'obg', 'vlw', 'valeu', 'muito obrigado', 
  'muito obrigada', 'brigado', 'brigada', 'thanks', 'thank you'
];

const PALAVRAS_REATIVAR_BOT = [
  'cardapio', 'cardápio', 'marmita', 'marmitex', 'pedido', 'pedir',
  'menu', 'comida', 'almoço', 'almoco', 'jantar', 'bot', 'automatico',
  'voltar', 'retornar', 'ativar', 'reativar'
];

/* =================== Configurações de Fluxo/Preços =================== */
// Função para buscar preços das configurações do banco
async function buscarPrecos() {
  try {
    const Configuracao = (await import('../models/Configuracao.js')).default;
    const config = await Configuracao.findOne();
    
    if (config) {
      return {
        P: config.precosMarmita?.P || 20,
        M: config.precosMarmita?.M || 25,
        G: config.precosMarmita?.G || 30,
        bebidas: {
          'Coca Lata': config.precosBebida?.lata || 6,
          'Coca 1L': config.precosBebida?.umLitro || 10,
          'Coca 2L': config.precosBebida?.doisLitros || 14,
          'Não': 0,
        },
      };
    }
  } catch (error) {
    console.error('❌ Erro ao buscar preços das configurações:', error);
  }
  
  // Valores padrão em caso de erro
  return {
    P: 20,
    M: 25,
    G: 30,
    bebidas: {
      'Coca Lata': 6,
      'Coca 1L': 10,
      'Coca 2L': 14,
      'Não': 0,
    },
  };
}

const PIX_KEY = process.env.PIX_KEY || 'SUACHAVE-PIX-AQUI';
const NUMERO_TESTE = '557391472169@c.us';

// Adicionar configurações de modo privado
const MODO_PRIVADO = process.env.MODO_PRIVADO === 'true';
const WHATSAPP_ALLOWED = process.env.WHATSAPP_ALLOWED || '557391472169,9848494243912';
const NUMEROS_PERMITIDOS = WHATSAPP_ALLOWED.split(',').map(num => num.trim());

/* =================== Funções de Identificação de Cliente =================== */
// Função para verificar se o cliente já fez pedidos no mesmo dia
async function verificarClienteRecorrente(telefone) {
  try {
    const telefoneNormalizado = normalizarTelefone(telefone);
    
    // Obter início e fim do dia atual
    const hoje = new Date();
    const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 0, 0, 0, 0);
    const fimHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59, 999);
    
    // Buscar pedidos finalizados do cliente APENAS do dia atual
    const pedidosHoje = await Pedido.find({
      telefone: telefoneNormalizado,
      status: { $in: ['entregue', 'finalizado'] },
      createdAt: {
        $gte: inicioHoje,
        $lte: fimHoje
      }
    }).sort({ createdAt: -1 });
    
    return {
      isRecorrente: pedidosHoje.length > 0,
      totalPedidos: pedidosHoje.length,
      ultimoPedido: pedidosHoje[0] || null
    };
  } catch (error) {
    console.error('❌ Erro ao verificar cliente recorrente:', error);
    return {
      isRecorrente: false,
      totalPedidos: 0,
      ultimoPedido: null
    };
  }
}

// Função para gerar mensagem personalizada para cliente recorrente do dia
function gerarMensagemBoasVindas(clienteInfo) {
  if (!clienteInfo.isRecorrente) {
    return '👋 Olá! Bem-vindo(a) à nossa marmitaria! 🍽️\n\nVamos ver o cardápio de hoje:';
  }
  
  const mensagensRecorrente = [
    `🤗 Olá novamente! Que bom ter você de volta hoje! 🍽️\n\nEste é seu ${clienteInfo.totalPedidos + 1}º pedido do dia. Vamos ver o cardápio:`,
    `😊 Oi! Bem-vindo(a) de volta! 🍽️\n\nVejo que você já pediu hoje! Que tal mais uma delícia?`,
    `👋 Olá! Que alegria vê-lo(a) novamente hoje! 🍽️\n\nJá está com fome de novo? Confira nosso cardápio:`,
    `🙌 Oi! De volta por aqui hoje! 🍽️\n\nAdoro clientes que apreciam nossa comida! Vamos ver o que temos:`,
    `😄 Olá! Que bom ter você aqui novamente hoje! 🍽️\n\nMais um pedido? Fico feliz! Cardápio de hoje:`
  ];
  
  // Escolher uma mensagem aleatória
  return mensagensRecorrente[Math.floor(Math.random() * mensagensRecorrente.length)];
}

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
    const sessao = SESSOES.get(telefone);
    
    // Limpar timeout se existir
    if (sessao && sessao.timeoutId) {
      clearTimeout(sessao.timeoutId);
    }
    
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
    etapa: 'menu_inicial',
    lastActivity: Date.now(),
    estado: 'ativo', // ativo, encerrado, proprietario
    timeoutId: null,
    pedidoFinalizado: false,
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
    
    // Limpar timeout anterior se existir
    if (sessao.timeoutId) {
      clearTimeout(sessao.timeoutId);
    }
    
    // Configurar novo timeout baseado no estado
    const timeoutMs = sessao.pedidoFinalizado 
      ? BOT_CONFIG.TIMEOUT_ENCERRAMENTO_MS 
      : BOT_CONFIG.TIMEOUT_INATIVIDADE_MS;
    
    sessao.timeoutId = setTimeout(() => {
      encerrarAtendimentoPorTimeout(telefone);
    }, timeoutMs);
  }
}

/* ======================= FUNÇÕES DE ENCERRAMENTO ======================= */
async function encerrarAtendimentoPorTimeout(telefone) {
  const sessao = SESSOES.get(telefone);
  if (!sessao || sessao.estado !== 'ativo') return;
  
  try {
    const mensagem = MENSAGENS_ENCERRAMENTO[Math.floor(Math.random() * MENSAGENS_ENCERRAMENTO.length)];
    await enviarMensagem(telefone, mensagem);
    
    // Marcar sessão como encerrada
    sessao.estado = 'encerrado';
    
    console.log(`⏰ Atendimento encerrado por timeout: ${telefone}`);
    
    // Remover sessão após um tempo
    setTimeout(() => {
      SESSOES.delete(telefone);
    }, 60000); // 1 minuto
    
  } catch (error) {
    console.error('❌ Erro ao encerrar atendimento por timeout:', error);
  }
}

async function encerrarAtendimentoPorAgradecimento(clientOrFn, telefone) {
  const sessao = SESSOES.get(telefone);
  if (!sessao) return;
  
  try {
    const mensagem = MENSAGENS_ENCERRAMENTO[Math.floor(Math.random() * MENSAGENS_ENCERRAMENTO.length)];
    await enviar(clientOrFn, telefone, mensagem);
    
    // Marcar sessão como encerrada
    sessao.estado = 'encerrado';
    
    // Limpar timeout
    if (sessao.timeoutId) {
      clearTimeout(sessao.timeoutId);
    }
    
    console.log(`🙏 Atendimento encerrado por agradecimento: ${telefone}`);
    
    // Remover sessão após um tempo
    setTimeout(() => {
      SESSOES.delete(telefone);
    }, 60000); // 1 minuto
    
  } catch (error) {
    console.error('❌ Erro ao encerrar atendimento por agradecimento:', error);
  }
}

function verificarAgradecimento(texto) {
  const textoNorm = normalizarTexto(texto);
  return PALAVRAS_AGRADECIMENTO.some(palavra => textoNorm.includes(palavra));
}

function verificarPalavrasReativacao(texto) {
  const textoNorm = normalizarTexto(texto);
  return PALAVRAS_REATIVAR_BOT.some(palavra => textoNorm.includes(palavra));
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

// Função para normalizar formato do telefone WhatsApp
function normalizarTelefone(telefone) {
  // Se já tem formato válido (@c.us ou @lid), retorna como está
  if (telefone.includes('@c.us') || telefone.includes('@lid')) {
    return telefone;
  }
  // Se não tem formato, assume que é celular e adiciona @c.us
  return `${telefone}@c.us`;
}

// Função para enviar mensagens
async function enviar(clientOrFn, telefone, mensagem) {
  try {
    const telefoneFormatado = normalizarTelefone(telefone);
    
    if (typeof clientOrFn === 'function') {
      // Modo simulador
      clientOrFn(telefoneFormatado, mensagem);
    } else {
      // Modo real
      await clientOrFn.sendText(telefoneFormatado, mensagem);
    }
    console.log(`✅ Mensagem enviada para ${telefoneFormatado}: ${mensagem.substring(0, 50)}...`);
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
    
    if (cardapio && cardapio.cardapios && cardapio.cardapios.length > 0) {
      console.log('📋 Cardápio encontrado no banco:', cardapio);
      // Converte o array de cardápios para o formato esperado
      const cardapiosFormatados = {};
      cardapio.cardapios.forEach(c => {
        cardapiosFormatados[`cardapio${c.numero}`] = c.item;
      });
      return {
        ...cardapiosFormatados,
        totalCardapios: cardapio.cardapios.length
      };
    } else {
      console.log('📋 Nenhum cardápio encontrado para hoje, usando padrão');
      return {
        cardapio1: {
          descricao: 'Feijoada Completa - Feijão preto, linguiça, bacon, carne seca, acompanha arroz branco, couve refogada, farofa e laranja.',
          imagem: '',
          imagemMimeType: '',
          imagemNome: ''
        },
        cardapio2: {
          descricao: 'Frango Grelhado com Legumes - Peito de frango grelhado temperado com ervas, acompanha arroz integral, legumes no vapor e salada verde.',
          imagem: '',
          imagemMimeType: '',
          imagemNome: ''
        },
        totalCardapios: 2
      };
    }
  } catch (error) {
    console.error('❌ Erro ao buscar cardápio:', error.message);
    return {
      cardapio1: {
        descricao: 'Feijoada Completa - Feijão preto, linguiça, bacon, carne seca, acompanha arroz branco, couve refogada, farofa e laranja.',
        imagem: '',
        imagemMimeType: '',
        imagemNome: ''
      },
      cardapio2: {
        descricao: 'Frango Grelhado com Legumes - Peito de frango grelhado temperado com ervas, acompanha arroz integral, legumes no vapor e salada verde.',
        imagem: '',
        imagemMimeType: '',
        imagemNome: ''
      },
      totalCardapios: 2
    };
  }
}

/* =================== Verificação de Horário de Funcionamento =================== */
async function verificarHorarioFuncionamento() {
  try {
    const Configuracao = (await import('../models/Configuracao.js')).default;
    const config = await Configuracao.findOne();
    
    if (!config || !config.horarioFuncionamento || !config.horarioFuncionamento.ativo) {
      return { aberto: true, mensagem: null };
    }
    
    const agora = new Date();
    const diaSemana = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'][agora.getDay()];
    const horarioHoje = config.horarioFuncionamento[diaSemana];
    
    if (!horarioHoje || !horarioHoje.ativo) {
      return {
        aberto: false,
        mensagem: config.horarioFuncionamento.mensagemForaHorario
      };
    }
    
    const horaAtual = agora.getHours() * 60 + agora.getMinutes();
    const [horaAbertura, minutoAbertura] = horarioHoje.abertura.split(':').map(Number);
    const [horaFechamento, minutoFechamento] = horarioHoje.fechamento.split(':').map(Number);
    
    const minutosAbertura = horaAbertura * 60 + minutoAbertura;
    const minutosFechamento = horaFechamento * 60 + minutoFechamento;
    
    const aberto = horaAtual >= minutosAbertura && horaAtual <= minutosFechamento;
    
    return {
      aberto,
      mensagem: aberto ? null : config.horarioFuncionamento.mensagemForaHorario
    };
    
  } catch (error) {
    console.error('❌ Erro ao verificar horário de funcionamento:', error.message);
    return { aberto: true, mensagem: null }; // Em caso de erro, permite funcionamento
  }
}

// Função de processamento - CORRIGIDA
async function processarMensagem(clientOrFn, telefone, texto) {
  const startTime = Date.now();

  try {
    // Verificar horário de funcionamento ANTES de processar qualquer mensagem
    const { aberto, mensagem } = await verificarHorarioFuncionamento();
    
    if (!aberto) {
      await enviar(clientOrFn, telefone, mensagem);
      return;
    }
    
    if (!SESSOES.has(telefone)) {
      resetSessao(telefone);
      console.log(`🆕 Nova sessão criada para ${telefone}`);
    }

    const sessao = SESSOES.get(telefone);
    
    // Verificar se a sessão está encerrada ou em modo proprietário
    if (sessao.estado === 'encerrado') {
      console.log(`⚠️ Mensagem ignorada - sessão encerrada: ${telefone}`);
      return;
    }
    
    if (sessao.estado === 'proprietario') {
      // Verificar se cliente quer reativar o bot
      if (verificarPalavrasReativacao(texto)) {
        // Reativar o bot
        resetSessao(telefone);
        await enviar(clientOrFn, telefone, 
          '🤖 Bot reativado! Você voltou ao atendimento automático.\n\n' +
          'Como posso ajudá-lo(a) hoje?\n\n' +
          '1️⃣ Ver cardápio e fazer pedido\n' +
          '2️⃣ Falar com o proprietário\n\n' +
          'Digite *1* ou *2* para escolher:'
        );
        sessao.etapa = 'aguardando_opcao_inicial';
        console.log(`🤖 Bot reativado para ${telefone} via palavra-chave: "${texto}"`);
        return;
      }
      
      console.log(`👤 Mensagem encaminhada para proprietário: ${telefone} - "${texto}"`);
      // Enviar dica sobre reativação do bot
      if (Math.random() < 0.3) { // 30% de chance de mostrar a dica
        await enviar(clientOrFn, telefone, 
          '💡 *Dica*: Digite "cardápio" ou "menu" a qualquer momento para voltar ao atendimento automático.'
        );
      }
      return;
    }
    
    updateSessionActivity(telefone);

    const tNorm = normalizarTexto(texto);
    console.log(`📨 Processando mensagem de ${telefone}: "${texto}" (etapa: ${sessao.etapa})`);

    // Atalhos globais
    if (tNorm === 'reiniciar' || tNorm === 'inicio' || tNorm === 'menu') {
      resetSessao(telefone);
      await enviar(clientOrFn, telefone, '🔄 Sessão reiniciada!');
      // Continuar para mostrar o menu inicial
    }

    // Detectar mensagens de agradecimento
    if (verificarAgradecimento(texto)) {
      await encerrarAtendimentoPorAgradecimento(clientOrFn, telefone);
      return;
    }

    switch (sessao.etapa) {
      case 'menu_inicial':
        // Menu inicial com opções
        const menuInicial = `👋 Olá! Bem-vindo(a) à nossa marmitaria! 🍽️

Como posso ajudá-lo(a) hoje?

1️⃣ Ver cardápio e fazer pedido
2️⃣ Falar com o proprietário

Digite *1* ou *2* para escolher:`;
        
        await enviar(clientOrFn, telefone, menuInicial);
        sessao.etapa = 'aguardando_opcao_inicial';
        break;
        
      case 'aguardando_opcao_inicial':
        if (tNorm === '1') {
          // Verificar se é cliente recorrente
          sessao.clienteInfo = await verificarClienteRecorrente(telefone);
          
          // Mensagem de boas-vindas personalizada
          const mensagemBoasVindas = gerarMensagemBoasVindas(sessao.clienteInfo);
          await enviar(clientOrFn, telefone, mensagemBoasVindas);
          
          sessao.etapa = 'inicio';
          // Continuar para mostrar o cardápio
        } else if (tNorm === '2') {
           // Desativar bot e encaminhar para proprietário
           sessao.estado = 'proprietario';
           await enviar(clientOrFn, telefone, 
             '👤 Você será conectado(a) com o proprietário em breve.\n\n' +
             '⚠️ O atendimento automático foi desativado para esta conversa.\n' +
             'Todas as suas mensagens serão encaminhadas diretamente ao proprietário.\n\n' +
             '💡 *Para voltar ao atendimento automático*, digite a qualquer momento:\n' +
             '• "cardápio" ou "menu"\n' +
             '• "marmita" ou "pedido"\n' +
             '• "bot" ou "automático"'
           );
           console.log(`👤 Bot desativado para ${telefone} - modo proprietário ativado`);
           return;
        } else {
          await enviar(clientOrFn, telefone, 
            '❌ Opção inválida. Digite *1* para ver o cardápio ou *2* para falar com o proprietário.'
          );
          return;
        }
        // Continuar para o case 'inicio' se escolheu opção 1
        
      case 'inicio':
        
        // Log para acompanhamento
        if (sessao.clienteInfo && sessao.clienteInfo.isRecorrente) {
          console.log(`🔄 Cliente recorrente do dia detectado: ${telefone} (${sessao.clienteInfo.totalPedidos} pedidos hoje)`);
        } else {
          console.log(`🆕 Primeiro pedido do dia: ${telefone}`);
        }
        
        // Buscar configurações de delay
        const Configuracao = (await import('../models/Configuracao.js')).default;
        const config = await Configuracao.findOne();
        const delays = config?.delaysMensagens || {
          antesCardapio: 2000,
          entreCardapios: 1500,
          antesEscolha: 1000
        };
        
        // Aguardar tempo configurado antes de mostrar o cardápio
        await new Promise(resolve => setTimeout(resolve, delays.antesCardapio));
        
        // QUALQUER mensagem inicial mostra o cardápio (como estava antes)
        const cardapio = await buscarCardapioDodia();
        const totalCardapios = cardapio.totalCardapios || 2;
        
        // Enviar todos os cardápios disponíveis dinamicamente
        for (let i = 1; i <= totalCardapios; i++) {
          const cardapioAtual = cardapio[`cardapio${i}`];
          
          if (cardapioAtual) {
            if (cardapioAtual.imagem) {
              try {
                await clientOrFn.sendImageFromBase64(
                  telefone,
                  cardapioAtual.imagem,
                  `cardapio${i}.jpg`,
                  `📋 *Cardápio ${i}*\n${cardapioAtual.descricao}`
                );
              } catch (imgError) {
                console.warn(`⚠️ Erro ao enviar imagem do cardápio ${i}:`, imgError.message);
                // Se falhar, enviar só o texto
                await enviar(clientOrFn, telefone, `📋 *Cardápio ${i}*: ${cardapioAtual.descricao}`);
              }
            } else {
              // Se não tiver imagem, enviar só o texto
              await enviar(clientOrFn, telefone, `📋 *Cardápio ${i}*: ${cardapioAtual.descricao}`);
            }
            
            // Aguardar tempo configurado entre cardápios (exceto no último)
            if (i < totalCardapios) {
              await new Promise(resolve => setTimeout(resolve, delays.entreCardapios));
            }
          }
        }
        
        // Aguardar tempo configurado antes da mensagem de escolha
        await new Promise(resolve => setTimeout(resolve, delays.antesEscolha));
        
        // Gerar mensagem de escolha dinamicamente
        let textoEscolha = 'Digite o número do cardápio desejado:\n';
        for (let i = 1; i <= totalCardapios; i++) {
          const emoji = i === 1 ? '1️⃣' : i === 2 ? '2️⃣' : i === 3 ? '3️⃣' : i === 4 ? '4️⃣' : i === 5 ? '5️⃣' : `${i}️⃣`;
          textoEscolha += `${emoji} Cardápio ${i}\n`;
        }
        
        sessao.etapa = 'cardapio';
        sessao.totalCardapios = totalCardapios; // Armazenar para validação posterior
        await enviar(clientOrFn, telefone, textoEscolha);
        break;

      case 'cardapio':
        const opcaoValida = parseInt(tNorm) >= 1 && parseInt(tNorm) <= (sessao.totalCardapios || 2);
        
        if (opcaoValida) {
          const cardapio = await buscarCardapioDodia();
          const numeroCardapio = parseInt(tNorm);
          
          sessao.dados.cardapio = {
            opcao: tNorm,
            tipo: `CARDÁPIO ${numeroCardapio}`,
            descricao: cardapio[`cardapio${numeroCardapio}`]?.descricao || 'Descrição não disponível'
          };

          sessao.etapa = 'tamanho';

          // Buscar preços atualizados do banco
          const precos = await buscarPrecos();
          const textoTamanho = `✅ *${sessao.dados.cardapio.tipo}* selecionado!

Escolha o tamanho da marmita:

1️⃣ Pequena (P) - R$ ${precos.P.toFixed(2).replace('.', ',')}
2️⃣ Média (M) - R$ ${precos.M.toFixed(2).replace('.', ',')}
3️⃣ Grande (G) - R$ ${precos.G.toFixed(2).replace('.', ',')}`;

          await enviar(clientOrFn, telefone, textoTamanho);
        } else {
          // Gerar mensagem de erro dinâmica
          const totalCardapios = sessao.totalCardapios || 2;
          let opcoesValidas = '';
          for (let i = 1; i <= totalCardapios; i++) {
            opcoesValidas += i === totalCardapios ? `*${i}*` : `*${i}*, `;
          }
          await enviar(clientOrFn, telefone, 
            `❌ Opção inválida. Digite ${opcoesValidas} para escolher o cardápio.`
          );
        }
        break;

      case 'tamanho':
        if (['1', '2', '3'].includes(tNorm)) {
          const tamanhos = { '1': 'P', '2': 'M', '3': 'G' };
          const tamanho = tamanhos[tNorm];
          
          // Buscar preços atualizados do banco
          const precos = await buscarPrecos();
          
          sessao.dados.tamanho = tamanho;
          sessao.dados.preco = precos[tamanho];
          sessao.etapa = 'bebida';

          const textoBebida = `✅ Tamanho *${tamanho}* selecionado!

🥤 Deseja adicionar bebida?

1️⃣ Coca Lata - R$ ${precos.bebidas['Coca Lata'].toFixed(2).replace('.', ',')}
2️⃣ Coca 1L - R$ ${precos.bebidas['Coca 1L'].toFixed(2).replace('.', ',')}
3️⃣ Coca 2L - R$ ${precos.bebidas['Coca 2L'].toFixed(2).replace('.', ',')}
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

          // Buscar preços atualizados do banco
          const precos = await buscarPrecos();
          
          const bebida = bebidas[tNorm];
          sessao.dados.bebida = bebida;
          sessao.dados.precoBebida = precos.bebidas[bebida];
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
          
          // Perguntar sobre tipo de entrega
          sessao.etapa = 'entrega';
          await enviar(clientOrFn, telefone, 
            `Como você prefere receber seu pedido?\n\n` +
            `1️⃣ Delivery (entrega)\n` +
            `2️⃣ Retirada no local`
          );
        }
        break;

      case 'entrega':
        if (['1', '2'].includes(tNorm)) {
          const tiposEntrega = {
            '1': 'delivery',
            '2': 'retirada'
          };
          
          sessao.dados.tipoEntrega = tiposEntrega[tNorm];
          
          // Aplicar taxa de entrega apenas para delivery
          if (sessao.dados.tipoEntrega === 'delivery') {
            // Buscar taxa de entrega das configurações
            try {
              const Configuracao = (await import('../models/Configuracao.js')).default;
              const config = await Configuracao.findOne();
              const taxaEntrega = config?.taxaEntrega || 3;
              
              sessao.dados.taxaEntrega = taxaEntrega;
              sessao.dados.precoTotal += taxaEntrega;
              
              // Mostrar valor detalhado para delivery
              const valorMarmita = sessao.dados.preco + sessao.dados.precoBebida;
              await enviar(clientOrFn, telefone, 
                `🚚 *Delivery selecionado!*\n\n` +
                `💰 *Resumo do valor:*\n` +
                `• Marmita + Bebida: R$ ${valorMarmita.toFixed(2).replace('.', ',')}\n` +
                `• Taxa de entrega: R$ ${taxaEntrega.toFixed(2).replace('.', ',')}\n` +
                `• *Total: R$ ${sessao.dados.precoTotal.toFixed(2).replace('.', ',')}*`
              );
            } catch (error) {
              console.error('❌ Erro ao buscar taxa de entrega:', error);
              // Usar valor padrão em caso de erro
              const taxaEntrega = 3;
              sessao.dados.taxaEntrega = taxaEntrega;
              sessao.dados.precoTotal += taxaEntrega;
              
              const valorMarmita = sessao.dados.preco + sessao.dados.precoBebida;
              await enviar(clientOrFn, telefone, 
                `🚚 *Delivery selecionado!*\n\n` +
                `💰 *Resumo do valor:*\n` +
                `• Marmita + Bebida: R$ ${valorMarmita.toFixed(2).replace('.', ',')}\n` +
                `• Taxa de entrega: R$ ${taxaEntrega.toFixed(2).replace('.', ',')}\n` +
                `• *Total: R$ ${sessao.dados.precoTotal.toFixed(2).replace('.', ',')}*`
              );
            }
          } else {
            // Para retirada, não aplicar taxa de entrega
            sessao.dados.taxaEntrega = 0;
            await enviar(clientOrFn, telefone, 
              `🏪 *Retirada no local selecionada!*\n\n` +
              `💰 *Total: R$ ${sessao.dados.precoTotal.toFixed(2).replace('.', ',')}*\n` +
              `(Sem taxa de entrega)`
            );
          }
          
          if (sessao.dados.formaPagamento === 'Dinheiro') {
            sessao.etapa = 'troco';
            await enviar(clientOrFn, telefone, 
              `Precisa de troco?\n\n` +
              `1️⃣ Sim\n` +
              `2️⃣ Não (valor exato)`
            );
          } else if (sessao.dados.formaPagamento === 'PIX') {
            const pedidoSalvo = await finalizarPedido(clientOrFn, telefone, sessao);

            if (pedidoSalvo) {
              await enviarPIXComBotao(clientOrFn, telefone, pedidoSalvo);
            }

            // Marcar pedido como finalizado e ativar timeout de encerramento
            sessao.pedidoFinalizado = true;
            updateSessionActivity(telefone);
          } else {
            // Finalizar pedido para cartão também
            await finalizarPedido(clientOrFn, telefone, sessao);
            await enviar(clientOrFn, telefone, 
              '✅ Pedido confirmado!\nForma de pagamento: Cartão\nSua marmita já está sendo preparada! 🍛'
            );
            
            // Marcar pedido como finalizado e ativar timeout de encerramento
            sessao.pedidoFinalizado = true;
            updateSessionActivity(telefone);
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
            
            // Marcar pedido como finalizado e ativar timeout de encerramento
            sessao.pedidoFinalizado = true;
            updateSessionActivity(telefone);
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
          
          // Marcar pedido como finalizado e ativar timeout de encerramento
          sessao.pedidoFinalizado = true;
          updateSessionActivity(telefone);
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
export default async function initBot(client, io) {
  socketIO = io;
  whatsappClient = client; // ✅ Armazenar cliente globalmente
  
  if (!client) {
    console.error('❌ Cliente WhatsApp não fornecido');
    return;
  }

  console.log('🤖 Inicializando bot WhatsApp...');
  
  try { // ✅ ADICIONAR ESTE TRY
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

/* =================== Funções de Pedido =================== */

// Função para finalizar e salvar pedido no banco
async function finalizarPedido(clientOrFn, telefone, sessao) {
  try {
    const pedidoData = {
      telefone: telefone,
      cardapio: {
        tipo: sessao.dados.cardapio.tipo,
        itens: [sessao.dados.cardapio.descricao]
      },
      tamanho: sessao.dados.tamanho,
      bebida: sessao.dados.bebida,
      formaPagamento: sessao.dados.formaPagamento,
      tipoEntrega: sessao.dados.tipoEntrega || 'delivery', // Default delivery
      total: sessao.dados.precoTotal,
      taxaEntrega: sessao.dados.taxaEntrega || 0,
      statusPagamento: sessao.dados.formaPagamento === 'PIX' ? 'pendente' : 'nao_aplicavel',
      status: 'em_preparo',
      observacoes: sessao.dados.troco ? `Troco para: ${sessao.dados.troco}` : ''
    };

    // Se for PIX, criar dados do pagamento
    if (sessao.dados.formaPagamento === 'PIX') {
      try {
        console.log('💳 Criando pagamento PIX no Mercado Pago...');
        const pixData = await criarPagamentoPIX({
          _id: 'temp', // Será substituído pelo ID real
          total: sessao.dados.precoTotal,
          cardapio: { tipo: sessao.dados.cardapio.tipo }
        });
        console.log('✅ PIX criado com sucesso:', {
          transactionId: pixData.transactionId,
          temQrCode: !!pixData.qrCode,
          temQrCodeBase64: !!pixData.qrCodeBase64,
          mercadoPagoId: pixData.mercadoPagoId
        });
        pedidoData.pixData = pixData;
      } catch (pixError) {
        console.error('❌ Erro ao criar PIX no Mercado Pago:', pixError.message);
        console.error('Stack trace:', pixError.stack);
        console.warn('⚠️ Salvando pedido sem dados PIX (fallback para chave manual)');
      }
    }

    const pedido = await Pedido.create(pedidoData);
    console.log(`✅ Pedido salvo: ${pedido._id}`);
    
    // Log para verificar se os dados PIX foram salvos corretamente
    if (pedido.pixData) {
      console.log('💾 Dados PIX salvos no banco:', {
        transactionId: pedido.pixData.transactionId,
        temQrCode: !!pedido.pixData.qrCode,
        qrCodeLength: pedido.pixData.qrCode ? pedido.pixData.qrCode.length : 0,
        temQrCodeBase64: !!pedido.pixData.qrCodeBase64,
        mercadoPagoId: pedido.pixData.mercadoPagoId
      });
    } else {
      console.log('⚠️ Nenhum dado PIX foi salvo no banco');
    }
    
    // ✅ Emitir notificação em tempo real
    if (socketIO) {
      socketIO.to('admin-room').emit('novo-pedido', {
        pedido,
        timestamp: new Date(),
        message: `Novo pedido recebido de ${pedido.telefone}`
      });
      console.log('📢 Notificação emitida para admin-room');
    } else {
      console.warn('⚠️ Socket.IO não disponível para emitir notificação');
    }
    
    return pedido;
  } catch (error) {
    console.error('❌ Erro ao finalizar pedido:', error.message);
    throw error;
  }
}

// Função para enviar informações do PIX
async function enviarPIXComBotao(clientOrFn, telefone, pedido) {
  try {
    console.log('🔍 Dados PIX do pedido:', {
      temPixData: !!pedido.pixData,
      temQrCode: !!(pedido.pixData && pedido.pixData.qrCode),
      pixDataKeys: pedido.pixData ? Object.keys(pedido.pixData) : 'N/A'
    });

    if (pedido.pixData && pedido.pixData.qrCode) {
      // Enviar código PIX copiável do Mercado Pago
      const mensagemPIX = `🔑 *PIX para Pagamento - Mercado Pago*\n\n` +
        `💰 Valor: R$ ${pedido.total.toFixed(2).replace('.', ',')}\n` +
        `📋 Pedido: ${pedido._id}\n\n` +
        `📱 *Código PIX (Copie e Cole):*`;
      
      await enviar(clientOrFn, telefone, mensagemPIX);
      
      // Enviar o código PIX em mensagem separada para facilitar a cópia
      await enviar(clientOrFn, telefone, pedido.pixData.qrCode);
      
      // Enviar informações adicionais
      const infoAdicional = `⏰ O pagamento será confirmado automaticamente!\n⌛ Válido por 30 minutos`;
      await enviar(clientOrFn, telefone, infoAdicional);
    } else {
      // Fallback para chave PIX manual
      console.log('⚠️ Sem dados do Mercado Pago, usando chave PIX manual');
      const mensagemPIXSimples = `🔑 *PIX para Pagamento*\n\n` +
        `💰 Valor: R$ ${pedido.total.toFixed(2).replace('.', ',')}\n` +
        `📋 Pedido: ${pedido._id}\n\n` +
        `📱 *Chave PIX (Copie e Cole):*`;
      
      await enviar(clientOrFn, telefone, mensagemPIXSimples);
      
      // Enviar a chave PIX em mensagem separada para facilitar a cópia
      await enviar(clientOrFn, telefone, PIX_KEY);
      
      // Enviar informações adicionais
      const infoAdicional = `⏰ O pagamento será confirmado automaticamente!`;
      await enviar(clientOrFn, telefone, infoAdicional);
    }
  } catch (error) {
    console.error('❌ Erro ao enviar PIX:', error.message);
    // Enviar mensagem de fallback
    await enviar(clientOrFn, telefone, 
      `✅ Pedido confirmado!\nForma de pagamento: PIX\nEntraremos em contato para finalizar o pagamento.`
    );
  }
}

// Função para enviar confirmação automática (usada pelo webhook)
export async function enviarMensagemConfirmacao(telefone, pedido) {
  try {
    // Esta função será chamada pelo webhook quando o pagamento for confirmado
    const mensagem = `✅ *Pagamento Confirmado!*\n\n` +
      `📋 Pedido: ${pedido._id}\n` +
      `💰 Valor: R$ ${pedido.total.toFixed(2).replace('.', ',')}\n\n` +
      `🍛 Sua marmita já está sendo preparada!\n` +
      `⏰ Tempo estimado: 20-30 minutos`;
    
    // Aqui você precisará ter acesso ao cliente WhatsApp
    // Por enquanto, apenas log
    console.log(`📱 Confirmação automática para ${telefone}: ${mensagem}`);
    
    // TODO: Implementar envio real quando o webhook for ativado
    // await client.sendText(telefone, mensagem);
    
  } catch (error) {
    console.error('❌ Erro ao enviar confirmação:', error.message);
  }
}

// Função para enviar mensagens (usada pelo sistema de notificações)
let whatsappClient = null;

export async function enviarMensagem(telefone, mensagem) {
  try {
    if (!whatsappClient) {
      console.warn('⚠️ Cliente WhatsApp não disponível para envio de mensagem');
      return false;
    }

    const telefoneFormatado = normalizarTelefone(telefone);
    
    await whatsappClient.sendText(telefoneFormatado, mensagem);
    console.log(`✅ Mensagem de status enviada para ${telefoneFormatado}`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao enviar mensagem para ${telefone}:`, error.message);
    return false;
  }
}
      

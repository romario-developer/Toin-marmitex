import { waitUntilReady, startClient, getClient } from '../config/wppconnect.js';
import Cliente from '../models/Cliente.js';
import Pedido from '../models/Pedido.js';
import Cardapio from '../models/Cardapio.js';
import Configuracao from '../models/Configuracao.js';
import NumeroPermitido from '../models/NumeroPermitido.js';
import { criarPagamentoPIX } from './mercadoPagoService.js';
import fetch from 'node-fetch';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ======================= GERENCIADOR DE INSTÂNCIAS MULTI-TENANT ======================= */
class MultiTenantWhatsAppManager {
  constructor() {
    this.clienteInstances = new Map(); // clienteId -> { client, sessions, config }
    this.activeSessions = new Map(); // sessionId -> { clienteId, telefone, data }
    this.socketIO = null;
    this.monitorInterval = null;
    
    this.BOT_CONFIG = {
      MAX_RETRY_ATTEMPTS: 3,
      RETRY_DELAY_MS: 2000,
      MESSAGE_TIMEOUT_MS: 30000,
      SESSION_CLEANUP_INTERVAL_MS: 3600000, // 1 hora
      MAX_SESSIONS_PER_CLIENT: 100,
      HEARTBEAT_INTERVAL_MS: 300000, // 5 minutos
      TIMEOUT_INATIVIDADE_MS: 600000, // 10 minutos
      TIMEOUT_ENCERRAMENTO_MS: 300000, // 5 minutos
    };
    
    this.startMonitoring();
  }
  
  // Inicializar Socket.IO
  setSocketIO(io) {
    this.socketIO = io;
  }
  
  // Iniciar uma instância para um cliente
  async startClientInstance(clienteId) {
    try {
      const cliente = await Cliente.findById(clienteId);
      if (!cliente) {
        throw new Error('Cliente não encontrado');
      }
      
      // Verificar se já existe uma instância ativa
      if (this.clienteInstances.has(clienteId)) {
        const instance = this.clienteInstances.get(clienteId);
        if (instance.status === 'connected') {
          console.log(`✅ Instância já ativa para cliente ${clienteId}`);
          return instance;
        }
      }
      
      const sessionName = `cliente_${clienteId}`;
      
      // Configurar callbacks específicos do cliente
      const callbacks = {
        onQRCode: async (qrCode, asciiQR, attempts, urlCode) => {
          console.log(`📱 QR Code gerado para cliente ${clienteId} - Tentativa ${attempts || 1}`);
          console.log(`🔍 [DEBUG] QR Code length: ${qrCode?.length || 0} chars`);
          console.log(`🔍 [DEBUG] QR Code type: ${typeof qrCode}`);
          console.log(`🔍 [DEBUG] Parâmetros recebidos:`, { qrCodeType: typeof qrCode, asciiQR: !!asciiQR, attempts, urlCode });
          
          // Salvar QR code como arquivo de imagem
          try {
            const qrDir = path.resolve(process.cwd(), 'backend', 'qr');
            const qrPath = path.join(qrDir, `qr-cliente_${clienteId}.png`);
            
            // Garantir que o diretório existe
            if (!fs.existsSync(qrDir)) {
              fs.mkdirSync(qrDir, { recursive: true });
            }
            
            // Processar QR code baseado no tipo recebido
            let base64Data;
            if (typeof qrCode === 'string') {
              // Remover prefixo data URL se presente
              base64Data = qrCode.replace(/^data:image\/[a-z]+;base64,/, '');
              console.log(`🔍 [DEBUG] QR processado como string, tamanho base64: ${base64Data.length}`);
            } else if (qrCode && typeof qrCode === 'object') {
              console.log(`🔍 [DEBUG] QR recebido como objeto:`, Object.keys(qrCode));
              // Tentar extrair base64 de diferentes propriedades possíveis
              base64Data = qrCode.qrcode || qrCode.base64 || qrCode.data || qrCode;
              if (typeof base64Data === 'string') {
                base64Data = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
              }
            } else {
              console.error(`❌ Formato de QR Code não suportado:`, typeof qrCode);
              return;
            }
            
            // Validar se temos dados válidos
            if (!base64Data || typeof base64Data !== 'string' || base64Data.length < 100) {
              console.error(`❌ QR Code base64 inválido ou muito pequeno: ${base64Data?.length || 0} chars`);
              return;
            }
            
            // Salvar arquivo
            fs.writeFileSync(qrPath, base64Data, 'base64');
            console.log(`🖼️ QR Code salvo em: ${qrPath} (${base64Data.length} chars)`);
          } catch (error) {
            console.error('❌ Erro ao salvar QR Code:', error);
          }
          
          await Cliente.findByIdAndUpdate(clienteId, {
            'whatsapp.qrCode': qrCode,
            'whatsapp.statusConexao': 'qr_ready'
          });
          
          if (this.socketIO) {
            console.log(`🔍 [DEBUG] Emitindo QR Code via Socket.IO para cliente_${clienteId}`);
            this.socketIO.to(`cliente_${clienteId}`).emit('qr_code', {
              qrCode,
              clienteId
            });
            console.log(`✅ [DEBUG] QR Code emitido com sucesso via Socket.IO`);
          } else {
            console.warn(`⚠️ [DEBUG] Socket.IO não disponível para emitir QR Code`);
          }
        },
        
        onConnected: async () => {
          console.log(`✅ WhatsApp conectado para cliente ${clienteId}`);
          console.log(`🔍 [DEBUG] Iniciando processo de atualização de status para 'connected'`);
          
          try {
            await Cliente.findByIdAndUpdate(clienteId, {
              'whatsapp.statusConexao': 'connected',
              'whatsapp.ultimaConexao': new Date(),
              'whatsapp.qrCode': null
            });
            console.log(`✅ [DEBUG] Status atualizado no banco de dados`);
          } catch (error) {
            console.error(`❌ [DEBUG] Erro ao atualizar status no banco:`, error);
          }
          
          // Atualizar instância local
          const instance = this.clienteInstances.get(clienteId);
          if (instance) {
            instance.status = 'connected';
            instance.connectedAt = new Date();
            instance.lastActivity = new Date();
            console.log(`✅ [DEBUG] Instância local atualizada para 'connected'`);
            console.log(`🔍 [DEBUG] Status da instância: ${instance.status}`);
          } else {
            console.warn(`⚠️ [DEBUG] Instância local não encontrada para cliente ${clienteId}`);
            console.log(`🔍 [DEBUG] Instâncias disponíveis: ${Array.from(this.clienteInstances.keys()).join(', ')}`);
          }
          
          if (this.socketIO) {
            console.log(`🔍 [DEBUG] Emitindo evento 'whatsapp_connected' via Socket.IO`);
            this.socketIO.to(`cliente_${clienteId}`).emit('whatsapp_connected', {
              clienteId,
              status: 'connected'
            });
            console.log(`✅ [DEBUG] Evento 'whatsapp_connected' emitido com sucesso`);
          } else {
            console.warn(`⚠️ [DEBUG] Socket.IO não disponível para emitir evento de conexão`);
          }
        },
        
        onDisconnected: async () => {
          console.log(`❌ WhatsApp desconectado para cliente ${clienteId}`);
          console.log(`🔍 [DEBUG] Iniciando processo de desconexão para cliente ${clienteId}`);
          
          // Verificar se a instância ainda existe e há quanto tempo foi criada
          const instance = this.clienteInstances.get(clienteId);
          if (instance) {
            const timeSinceCreation = Date.now() - instance.createdAt.getTime();
            console.log(`🔍 [DEBUG] Tempo desde criação da instância: ${timeSinceCreation}ms`);
            
            // Se a instância foi criada há menos de 30 segundos, aguardar antes de desconectar
            // Isso evita desconexões prematuras durante o processo de conexão
            if (timeSinceCreation < 30000) {
              console.log(`⏳ [DEBUG] Instância muito recente (${timeSinceCreation}ms) - aguardando 10s antes de processar desconexão`);
              setTimeout(async () => {
                // Verificar novamente se ainda deve desconectar
                const currentInstance = this.clienteInstances.get(clienteId);
                if (currentInstance && currentInstance.status !== 'connected') {
                  console.log(`🔍 [DEBUG] Processando desconexão após delay para cliente ${clienteId}`);
                  await this.processDisconnection(clienteId);
                } else {
                  console.log(`✅ [DEBUG] Instância já conectada - cancelando desconexão para cliente ${clienteId}`);
                }
              }, 10000);
              return;
            }
          }
          
          // Processar desconexão imediatamente se a instância é antiga
          await this.processDisconnection(clienteId);
        },
        
        onMessage: async (message) => {
          console.log(`📨 [DEBUG] Mensagem recebida para cliente ${clienteId}`);
          console.log(`🔍 [DEBUG] Verificando instância antes de processar mensagem...`);
          await this.handleMessage(clienteId, message);
        }
      };
      
      // Iniciar cliente WhatsApp
      const client = await startClient(sessionName, callbacks);
      
      // Criar instância local
      const instance = {
        client,
        clienteId,
        sessionName,
        status: 'connecting',
        sessions: new Map(),
        createdAt: new Date(),
        lastActivity: new Date()
      };
      
      this.clienteInstances.set(clienteId, instance);
      
      console.log(`🚀 Instância iniciada para cliente ${clienteId}`);
      console.log(`🔍 [DEBUG] Status inicial da instância: ${instance.status}`);
      console.log(`🔍 [DEBUG] Instância armazenada no Map com chave: ${clienteId}`);
      return instance;
      
    } catch (error) {
      console.error(`❌ Erro ao iniciar instância para cliente ${clienteId}:`, error);
      
      await Cliente.findByIdAndUpdate(clienteId, {
        'whatsapp.statusConexao': 'error',
        'whatsapp.ultimoErro': error.message
      });
      
      throw error;
    }
  }
  
  // Método para processar desconexão
  async processDisconnection(clienteId) {
    try {
      console.log(`🔍 [DEBUG] Processando desconexão para cliente ${clienteId}`);
      
      // Atualizar status no banco
      await Cliente.findByIdAndUpdate(clienteId, {
        'whatsapp.statusConexao': 'disconnected'
      });
      console.log(`✅ [DEBUG] Status de desconexão atualizado no banco de dados`);
      
      // Limpar instância local
      const instanceExists = this.clienteInstances.has(clienteId);
      console.log(`🔍 [DEBUG] Instância local existe: ${instanceExists}`);
      
      this.clienteInstances.delete(clienteId);
      console.log(`✅ [DEBUG] Instância local removida para cliente ${clienteId}`);
      
      // Emitir evento via Socket.IO
      if (this.socketIO) {
        console.log(`🔍 [DEBUG] Emitindo evento 'whatsapp_disconnected' via Socket.IO`);
        this.socketIO.to(`cliente_${clienteId}`).emit('whatsapp_disconnected', {
          clienteId,
          status: 'disconnected'
        });
        console.log(`✅ [DEBUG] Evento 'whatsapp_disconnected' emitido com sucesso`);
      } else {
        console.warn(`⚠️ [DEBUG] Socket.IO não disponível para emitir evento de desconexão`);
      }
      
    } catch (error) {
      console.error(`❌ [DEBUG] Erro ao processar desconexão:`, error);
    }
  }

  // Parar instância de um cliente
  async stopClientInstance(clienteId) {
    try {
      const instance = this.clienteInstances.get(clienteId);
      if (!instance) {
        console.log(`ℹ️ Nenhuma instância ativa para cliente ${clienteId}`);
        return;
      }
      
      // Fechar cliente WhatsApp
      if (instance.client) {
        await instance.client.close();
      }
      
      // Limpar sessões ativas
      for (const [sessionId, session] of this.activeSessions.entries()) {
        if (session.clienteId === clienteId) {
          this.activeSessions.delete(sessionId);
        }
      }
      
      // Processar desconexão
      await this.processDisconnection(clienteId);
      
      console.log(`🛑 Instância parada para cliente ${clienteId}`);
      
    } catch (error) {
      console.error(`❌ Erro ao parar instância para cliente ${clienteId}:`, error);
      throw error;
    }
  }
  
  // Processar mensagem recebida
  async handleMessage(clienteId, message) {
    try {
      console.log(`🔍 [DEBUG] Processando mensagem para cliente ${clienteId}`);
      let instance = this.clienteInstances.get(clienteId);
      console.log(`🔍 [DEBUG] Instância encontrada: ${!!instance}`);
      
      if (instance) {
        console.log(`🔍 [DEBUG] Status da instância: ${instance.status}`);
        console.log(`🔍 [DEBUG] Criada em: ${instance.createdAt}`);
        console.log(`🔍 [DEBUG] Última atividade: ${instance.lastActivity}`);
      } else {
        console.log(`🔍 [DEBUG] Instâncias disponíveis: ${Array.from(this.clienteInstances.keys()).join(', ')}`);
      }
      
      // Se não há instância ou não está conectada, tentar criar uma nova
      if (!instance || instance.status !== 'connected') {
        console.log(`⚠️ Instância não conectada para cliente ${clienteId} - Status: ${instance?.status || 'N/A'}`);
        console.log(`🔄 [AUTO-START] Tentando criar instância automaticamente para cliente ${clienteId}`);
        
        try {
          // Verificar se o cliente existe no banco de dados
          const cliente = await Cliente.findById(clienteId);
          if (!cliente) {
            console.log(`❌ [AUTO-START] Cliente ${clienteId} não encontrado no banco de dados`);
            return;
          }
          
          console.log(`✅ [AUTO-START] Cliente encontrado: ${cliente.nome}`);
          console.log(`🚀 [AUTO-START] Iniciando instância automaticamente...`);
          
          // Criar nova instância
          instance = await this.startClientInstance(clienteId);
          
          // Aguardar um pouco para a instância se conectar
          console.log(`⏳ [AUTO-START] Aguardando conexão da instância...`);
          let attempts = 0;
          const maxAttempts = 30; // 30 segundos
          
          while (attempts < maxAttempts && (!instance || instance.status !== 'connected')) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            instance = this.clienteInstances.get(clienteId);
            attempts++;
            
            if (attempts % 5 === 0) {
              console.log(`⏳ [AUTO-START] Aguardando conexão... ${attempts}/${maxAttempts}s`);
            }
          }
          
          if (!instance || instance.status !== 'connected') {
            console.log(`❌ [AUTO-START] Instância não conectou após ${maxAttempts}s - mensagem será perdida`);
            return;
          }
          
          console.log(`✅ [AUTO-START] Instância conectada com sucesso! Processando mensagem...`);
          
        } catch (autoStartError) {
          console.error(`❌ [AUTO-START] Erro ao criar instância automaticamente:`, autoStartError);
          return;
        }
      }
      
      // Atualizar última atividade
      instance.lastActivity = new Date();
      
      const telefone = message.from;
      const texto = message.body?.toLowerCase()?.trim() || '';
      
      // 🚫 Bloquear mensagens de status do WhatsApp
      if (telefone.includes('status@broadcast')) {
        console.log(`🚫 Mensagem de status bloqueada de ${telefone}`);
        return;
      }
      
      // Verificar se é um número permitido
      const isAllowed = await this.isNumberAllowed(clienteId, telefone);
      if (!isAllowed) {
        console.log(`🚫 Número ${telefone} não permitido para cliente ${clienteId}`);
        return;
      }
      
      // Obter ou criar sessão
      const sessionId = `${clienteId}_${telefone}`;
      let session = this.activeSessions.get(sessionId);
      
      if (!session) {
        session = {
          clienteId,
          telefone,
          estado: 'inicio',
          pedido: {},
          lastActivity: new Date(),
          createdAt: new Date()
        };
        this.activeSessions.set(sessionId, session);
      } else {
        session.lastActivity = new Date();
      }
      
      // Processar mensagem baseado no estado da sessão
      await this.processMessage(sessionId, message, texto);
      
    } catch (error) {
      console.error(`❌ Erro ao processar mensagem para cliente ${clienteId}:`, error);
    }
  }
  
  // Verificar se número é permitido para o cliente
  async isNumberAllowed(clienteId, telefone) {
    try {
      // MODO TESTE: Apenas o número 73991472169 é permitido
      const numeroLimpo = telefone.replace('@c.us', '').replace(/\D/g, '');
      const numeroTeste = '73991472169';
      
      if (numeroLimpo.endsWith(numeroTeste)) {
        console.log(`✅ Número de teste permitido: ${numeroLimpo}`);
        return true;
      }
      
      console.log(`🚫 Número bloqueado para teste: ${numeroLimpo} (apenas ${numeroTeste} é permitido)`);
      return false;
      
    } catch (error) {
      console.error('❌ Erro ao verificar número permitido:', error);
      return false;
    }
  }
  
  // Processar mensagem baseado no estado
  async processMessage(sessionId, message, texto) {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;
    
    const { clienteId, telefone, estado } = session;
    const instance = this.clienteInstances.get(clienteId);
    
    try {
      switch (estado) {
        case 'inicio':
          await this.handleInicio(sessionId, message);
          break;
          
        case 'aguardando_opcao':
          await this.handleOpcao(sessionId, message, texto);
          break;
          
        case 'escolhendo_tamanho':
          await this.handleTamanho(sessionId, message, texto);
          break;
          
        case 'escolhendo_bebida':
          await this.handleBebida(sessionId, message, texto);
          break;
          
        case 'escolhendo_pagamento':
          await this.handlePagamento(sessionId, message, texto);
          break;
          
        case 'escolhendo_entrega':
          await this.handleEntrega(sessionId, message, texto);
          break;
          
        case 'aguardando_endereco':
          await this.handleEndereco(sessionId, message, texto);
          break;
          
        case 'confirmando_pedido':
          await this.handleConfirmacao(sessionId, message, texto);
          break;
          
        default:
          await this.handleInicio(sessionId, message);
      }
      
    } catch (error) {
      console.error(`❌ Erro ao processar estado ${estado}:`, error);
      await this.sendMessage(clienteId, telefone, '❌ Ocorreu um erro. Vamos recomeçar.');
      session.estado = 'inicio';
    }
  }
  
  // Enviar mensagem para um cliente específico
  async sendMessage(clienteId, telefone, mensagem) {
    try {
      const instance = this.clienteInstances.get(clienteId);
      if (!instance || !instance.client || instance.status !== 'connected') {
        console.log(`⚠️ Cliente ${clienteId} não conectado`);
        return false;
      }
      
      await instance.client.sendText(telefone, mensagem);
      return true;
      
    } catch (error) {
      console.error(`❌ Erro ao enviar mensagem para cliente ${clienteId}:`, error);
      return false;
    }
  }
  
  // Handlers para diferentes estados (implementação básica)
  async handleInicio(sessionId, message) {
    const session = this.activeSessions.get(sessionId);
    const { clienteId, telefone } = session;
    
    // Buscar cardápio do cliente
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);
    
    const cardapio = await Cardapio.findOne({
      clienteId,
      data: {
        $gte: hoje,
        $lt: amanha
      }
    });
    
    if (!cardapio || !cardapio.cardapios || !cardapio.cardapios.length) {
      await this.sendMessage(clienteId, telefone, 
        '😔 Desculpe, não temos cardápio disponível hoje.\n\nTente novamente mais tarde.');
      return;
    }
    
    let mensagem = '🍽️ *Cardápio de Hoje*\n\n';
    cardapio.cardapios.forEach((cardapioItem, index) => {
      mensagem += `*${cardapioItem.numero}.* ${cardapioItem.item.descricao}\n`;
    });
    
    mensagem += '\n📋 *Opções:*\n';
    mensagem += '1️⃣ Fazer pedido\n';
    mensagem += '2️⃣ Ver informações\n';
    mensagem += '\nDigite o número da opção:';
    
    await this.sendMessage(clienteId, telefone, mensagem);
    session.estado = 'aguardando_opcao';
  }
  
  async handleOpcao(sessionId, message, texto) {
    const session = this.activeSessions.get(sessionId);
    const { clienteId, telefone } = session;
    
    if (texto === '1') {
      await this.sendMessage(clienteId, telefone, 
        '🥘 *Escolha o tamanho da marmita:*\n\n' +
        '1️⃣ P - Pequena\n' +
        '2️⃣ M - Média\n' +
        '3️⃣ G - Grande\n\n' +
        'Digite o número:');
      session.estado = 'escolhendo_tamanho';
    } else if (texto === '2') {
      const cliente = await Cliente.findById(clienteId);
      const config = await Configuracao.findOne({ clienteId });
      
      let info = `ℹ️ *Informações - ${cliente.nomeEstabelecimento}*\n\n`;
      
      if (config) {
        info += `💰 *Preços:*\n`;
        info += `• Marmita P: R$ ${config.precoMarmita?.toFixed(2) || '15,00'}\n`;
        info += `• Taxa de entrega: R$ ${config.taxaEntrega?.toFixed(2) || '5,00'}\n\n`;
        
        info += `🕒 *Horário de funcionamento:*\n`;
        Object.entries(config.horarioFuncionamento || {}).forEach(([dia, horario]) => {
          if (horario.ativo) {
            info += `• ${dia}: ${horario.abre} às ${horario.fecha}\n`;
          }
        });
      }
      
      info += '\n📱 Digite 1 para fazer um pedido.';
      
      await this.sendMessage(clienteId, telefone, info);
      session.estado = 'aguardando_opcao';
    } else {
      await this.sendMessage(clienteId, telefone, 
        '❌ Opção inválida. Digite 1 para fazer pedido ou 2 para informações.');
    }
  }
  
  async handleTamanho(sessionId, message, texto) {
    const session = this.activeSessions.get(sessionId);
    const { clienteId, telefone } = session;
    
    const tamanhos = { '1': 'P', '2': 'M', '3': 'G' };
    const tamanho = tamanhos[texto];
    
    if (!tamanho) {
      await this.sendMessage(clienteId, telefone, 
        '❌ Tamanho inválido. Digite 1 (P), 2 (M) ou 3 (G):');
      return;
    }
    
    session.pedido.tamanho = tamanho;
    
    await this.sendMessage(clienteId, telefone, 
      '🥤 *Escolha a bebida:*\n\n' +
      '1️⃣ Coca Lata\n' +
      '2️⃣ Coca 1L\n' +
      '3️⃣ Coca 2L\n' +
      '4️⃣ Sem bebida\n\n' +
      'Digite o número:');
    
    session.estado = 'escolhendo_bebida';
  }
  
  async handleBebida(sessionId, message, texto) {
    const session = this.activeSessions.get(sessionId);
    const { clienteId, telefone } = session;
    
    const bebidas = {
      '1': 'Coca Lata',
      '2': 'Coca 1L', 
      '3': 'Coca 2L',
      '4': 'Não'
    };
    
    const bebida = bebidas[texto];
    
    if (!bebida) {
      await this.sendMessage(clienteId, telefone, 
        '❌ Bebida inválida. Digite 1, 2, 3 ou 4:');
      return;
    }
    
    session.pedido.bebida = bebida;
    
    await this.sendMessage(clienteId, telefone, 
      '💳 *Forma de pagamento:*\n\n' +
      '1️⃣ PIX\n' +
      '2️⃣ Dinheiro\n' +
      '3️⃣ Cartão\n\n' +
      'Digite o número:');
    
    session.estado = 'escolhendo_pagamento';
  }
  
  async handlePagamento(sessionId, message, texto) {
    const session = this.activeSessions.get(sessionId);
    const { clienteId, telefone } = session;
    
    const pagamentos = {
      '1': 'PIX',
      '2': 'Dinheiro',
      '3': 'Cartão'
    };
    
    const pagamento = pagamentos[texto];
    
    if (!pagamento) {
      await this.sendMessage(clienteId, telefone, 
        '❌ Forma de pagamento inválida. Digite 1, 2 ou 3:');
      return;
    }
    
    session.pedido.formaPagamento = pagamento;
    
    await this.sendMessage(clienteId, telefone, 
      '📍 *Tipo de entrega:*\n\n' +
      '1️⃣ Entrega (informe o endereço)\n' +
      '2️⃣ Retirada no local\n\n' +
      'Digite o número:');
    
    session.estado = 'escolhendo_entrega';
  }
  
  async handleEntrega(sessionId, message, texto) {
    const session = this.activeSessions.get(sessionId);
    const { clienteId, telefone } = session;
    
    if (texto === '1') {
      session.pedido.tipoEntrega = 'entrega';
      await this.sendMessage(clienteId, telefone, 
        '📍 *Digite seu endereço completo:*\n\n' +
        'Exemplo: Rua das Flores, 123, Bairro Centro, CEP 12345-678');
      session.estado = 'aguardando_endereco';
    } else if (texto === '2') {
      session.pedido.tipoEntrega = 'retirada';
      session.pedido.endereco = 'Retirada no local';
      await this.mostrarResumo(sessionId);
    } else {
      await this.sendMessage(clienteId, telefone, 
        '❌ Opção inválida. Digite 1 para entrega ou 2 para retirada:');
    }
  }
  
  async handleEndereco(sessionId, message, texto) {
    const session = this.activeSessions.get(sessionId);
    const { clienteId, telefone } = session;
    
    if (texto.length < 10) {
      await this.sendMessage(clienteId, telefone, 
        '❌ Endereço muito curto. Digite o endereço completo:');
      return;
    }
    
    session.pedido.endereco = texto;
    await this.mostrarResumo(sessionId);
  }
  
  async mostrarResumo(sessionId) {
    const session = this.activeSessions.get(sessionId);
    const { clienteId, telefone, pedido } = session;
    
    // Buscar preços
    const config = await Configuracao.findOne({ clienteId });
    const precoMarmita = config?.precoMarmita || 15.00;
    const taxaEntrega = pedido.tipoEntrega === 'entrega' ? (config?.taxaEntrega || 5.00) : 0;
    
    const total = precoMarmita + taxaEntrega;
    
    let resumo = '📋 *RESUMO DO PEDIDO*\n\n';
    resumo += `🥘 Marmita ${pedido.tamanho}: R$ ${precoMarmita.toFixed(2)}\n`;
    resumo += `🥤 Bebida: ${pedido.bebida}\n`;
    resumo += `💳 Pagamento: ${pedido.formaPagamento}\n`;
    resumo += `📍 ${pedido.tipoEntrega === 'entrega' ? 'Entrega' : 'Retirada'}\n`;
    
    if (pedido.tipoEntrega === 'entrega') {
      resumo += `📍 Endereço: ${pedido.endereco}\n`;
      resumo += `🚚 Taxa de entrega: R$ ${taxaEntrega.toFixed(2)}\n`;
    }
    
    resumo += `\n💰 *TOTAL: R$ ${total.toFixed(2)}*\n\n`;
    resumo += '✅ Digite *CONFIRMAR* para finalizar\n';
    resumo += '❌ Digite *CANCELAR* para cancelar';
    
    await this.sendMessage(clienteId, telefone, resumo);
    session.estado = 'confirmando_pedido';
    session.pedido.total = total;
  }
  
  async handleConfirmacao(sessionId, message, texto) {
    const session = this.activeSessions.get(sessionId);
    const { clienteId, telefone, pedido } = session;
    
    if (texto === 'confirmar') {
      try {
        // Salvar pedido no banco
        const novoPedido = new Pedido({
          clienteId,
          telefone: telefone.replace('@c.us', ''),
          itens: [{
            descricao: `Marmita ${pedido.tamanho}`,
            quantidade: 1,
            preco: pedido.total - (pedido.tipoEntrega === 'entrega' ? 5.00 : 0)
          }],
          total: pedido.total,
          formaPagamento: pedido.formaPagamento,
          tipoEntrega: pedido.tipoEntrega,
          endereco: pedido.endereco,
          status: 'pendente',
          observacoes: `Bebida: ${pedido.bebida}`
        });
        
        await novoPedido.save();
        
        let confirmacao = '✅ *PEDIDO CONFIRMADO!*\n\n';
        confirmacao += `📋 Número do pedido: #${novoPedido._id.toString().slice(-6)}\n`;
        confirmacao += `⏰ Tempo estimado: 30-45 minutos\n\n`;
        
        if (pedido.formaPagamento === 'PIX') {
          confirmacao += '💳 *Pagamento via PIX*\n';
          confirmacao += 'Aguarde o QR Code para pagamento...';
          
          // Aqui poderia gerar o QR Code do PIX
          // const qrCodePix = await this.gerarQRCodePIX(clienteId, pedido.total);
        } else {
          confirmacao += `💰 Pagamento: ${pedido.formaPagamento}\n`;
          confirmacao += 'Prepare o valor exato na entrega.';
        }
        
        confirmacao += '\n\n🙏 Obrigado pela preferência!';
        
        await this.sendMessage(clienteId, telefone, confirmacao);
        
        // Remover sessão
        this.activeSessions.delete(sessionId);
        
      } catch (error) {
        console.error('Erro ao salvar pedido:', error);
        await this.sendMessage(clienteId, telefone, 
          '❌ Erro ao processar pedido. Tente novamente.');
      }
      
    } else if (texto === 'cancelar') {
      await this.sendMessage(clienteId, telefone, 
        '❌ Pedido cancelado.\n\nDigite qualquer coisa para fazer um novo pedido.');
      
      // Remover sessão
      this.activeSessions.delete(sessionId);
      
    } else {
      await this.sendMessage(clienteId, telefone, 
        '❌ Opção inválida. Digite *CONFIRMAR* ou *CANCELAR*:');
    }
  }
  
  // Verificar se cliente está conectado
  isClientConnected(clienteId) {
    const instance = this.clienteInstances.get(clienteId);
    console.log(`🔍 [DEBUG] Verificando conexão para cliente ${clienteId}:`);
    console.log(`🔍 [DEBUG] - Instância existe: ${!!instance}`);
    console.log(`🔍 [DEBUG] - Status: ${instance?.status || 'N/A'}`);
    console.log(`🔍 [DEBUG] - Total de instâncias: ${this.clienteInstances.size}`);
    console.log(`🔍 [DEBUG] - Chaves das instâncias: ${Array.from(this.clienteInstances.keys()).join(', ')}`);
    return instance && instance.status === 'connected';
  }
  
  // Obter instância de um cliente
  getClientInstance(clienteId) {
    return this.clienteInstances.get(clienteId);
  }
  
  // Obter estatísticas das instâncias
  getInstanceStats() {
    const stats = {
      totalInstances: this.clienteInstances.size,
      connectedInstances: 0,
      totalSessions: this.activeSessions.size,
      instances: []
    };
    
    for (const [clienteId, instance] of this.clienteInstances.entries()) {
      if (instance.status === 'connected') {
        stats.connectedInstances++;
      }
      
      stats.instances.push({
        clienteId,
        status: instance.status,
        sessionName: instance.sessionName,
        activeSessions: instance.sessions?.size || 0,
        createdAt: instance.createdAt,
        lastActivity: instance.lastActivity
      });
    }
    
    return stats;
  }
  
  // Monitoramento e limpeza
  startMonitoring() {
    this.monitorInterval = setInterval(() => {
      this.cleanupInactiveSessions();
      this.checkInstanceHealth();
    }, this.BOT_CONFIG.HEARTBEAT_INTERVAL_MS);
    
    console.log('🔄 Monitor multi-tenant iniciado');
  }
  
  stopMonitoring() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    console.log('🛑 Monitor multi-tenant parado');
  }
  
  cleanupInactiveSessions() {
    const now = Date.now();
    const expiredSessions = [];
    
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (now - session.lastActivity.getTime() > this.BOT_CONFIG.TIMEOUT_INATIVIDADE_MS) {
        expiredSessions.push(sessionId);
      }
    }
    
    expiredSessions.forEach(sessionId => {
      this.activeSessions.delete(sessionId);
      console.log(`🧹 Sessão expirada removida: ${sessionId}`);
    });
  }
  
  checkInstanceHealth() {
    for (const [clienteId, instance] of this.clienteInstances.entries()) {
      const now = Date.now();
      if (now - instance.lastActivity.getTime() > this.BOT_CONFIG.SESSION_CLEANUP_INTERVAL_MS) {
        console.log(`⚠️ Instância inativa detectada para cliente ${clienteId}`);
        // Aqui poderia implementar reconexão automática se necessário
      }
    }
  }
  
  // Parar todas as instâncias
  async stopAllInstances() {
    console.log('🛑 Parando todas as instâncias...');
    
    const promises = [];
    for (const clienteId of this.clienteInstances.keys()) {
      promises.push(this.stopClientInstance(clienteId));
    }
    
    await Promise.allSettled(promises);
    this.stopMonitoring();
    
    console.log('✅ Todas as instâncias foram paradas');
  }
}

// Instância singleton do gerenciador
const multiTenantManager = new MultiTenantWhatsAppManager();

export default multiTenantManager;
export { MultiTenantWhatsAppManager };
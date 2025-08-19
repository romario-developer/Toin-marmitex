// backend/config/wppconnect.js
import wppconnect from '@wppconnect-team/wppconnect';
import path from 'node:path';
import fs from 'node:fs';
import qrcodeTerminal from 'qrcode-terminal';

const clients = new Map();

const ROOT = process.cwd();
const TOKENS_DIR = path.resolve(ROOT, 'backend', 'wpp-tokens');
const QR_DIR = path.resolve(ROOT, 'backend', 'qr');

// Garante pastas
for (const dir of [TOKENS_DIR, QR_DIR]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// Função auxiliar de delay
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Configurar reconexão automática
// Configurar reconexão automática - VERSÃO MELHORADA
function setupAutoReconnect(client, sessionId) {
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 2; // Reduzido ainda mais
  let isReconnecting = false;
  
  // Monitor de conexão MUITO mais conservador
  const connectionMonitor = setInterval(async () => {
    // Evita múltiplas tentativas simultâneas
    if (isReconnecting) {
      console.log('🔄 Reconexão já em andamento, aguardando...');
      return;
    }
    
    try {
      // Verifica se o cliente ainda existe e está válido
      if (!client || !client.getConnectionState) {
        console.log('❌ Cliente inválido, parando monitor');
        clearInterval(connectionMonitor);
        return;
      }
      
      const state = await client.getConnectionState();
      
      // APENAS reconecta em casos críticos
      if (state === 'UNPAIRED') {
        console.log(`🔄 Tentativa de reconexão ${reconnectAttempts + 1}/${maxReconnectAttempts}`);
        
        if (reconnectAttempts < maxReconnectAttempts) {
          isReconnecting = true;
          reconnectAttempts++;
          
          try {
            console.log('🧹 Limpando cliente atual...');
            clients.delete(sessionId);
            
            // Aguarda mais tempo antes de reiniciar
            await delay(10000); // 10 segundos
            
            console.log('🔄 Reiniciando cliente...');
            const newClient = await initWpp(sessionId, { autoReconnect: false }); // Desabilita reconexão no novo cliente
            
            if (newClient) {
              console.log('✅ Cliente reiniciado com sucesso');
              reconnectAttempts = 0;
              isReconnecting = false;
              clearInterval(connectionMonitor);
              return;
            }
          } catch (restartErr) {
            console.error('❌ Erro ao reiniciar cliente:', restartErr.message);
            isReconnecting = false;
          }
        } else {
          console.log('❌ Máximo de tentativas de reconexão atingido - parando reconexão automática');
          clearInterval(connectionMonitor);
          clients.delete(sessionId);
        }
      } else if (state === 'CONNECTED') {
        reconnectAttempts = 0;
        isReconnecting = false;
      }
      // Remove tratamento de DISCONNECTED para evitar reconexões desnecessárias
    } catch (err) {
      // Tratamento mais conservador para frames detached
      if (err.message.includes('detached Frame')) {
        console.log('⚠️ Frame detached detectado - aguardando estabilização...');
        // NÃO reconecta imediatamente, apenas loga
      } else {
        console.error('❌ Erro no monitor de conexão:', err.message);
      }
    }
  }, 120000); // Aumentado para 2 minutos
  
  // Cleanup de segurança mais rápido
  setTimeout(() => {
    console.log('🧹 Limpeza de segurança do monitor');
    clearInterval(connectionMonitor);
  }, 600000); // 10 minutos
}

function attachDefaultListeners(client, sessionId) {
  safeOn(client, 'onStateChange', (state) => {
    console.log(`🔄 Novo estado da sessão (${sessionId}):`, state);
    
    // Ações específicas para cada estado
    switch(state) {
      case 'CONFLICT':
        console.log('🚨 CONFLITO: Fechando outras sessões...');
        break;
      case 'UNPAIRED':
        console.log('🔓 DESEMPARELHADO: Iniciando processo de reconexão...');
        break;
      case 'CONNECTED':
        console.log('🎉 WhatsApp logado e pronto!');
        break;
    }
  });

  safeOn(client, 'onStreamChange', (stream) => {
    console.log(`📡 Status da sessão (${sessionId}):`, stream);
    
    if (stream === 'DISCONNECTED') {
      console.log('🔄 Iniciando processo de reconexão automática...');
    }
  });

  safeOn(client, 'qr', (qrCode, asciiQR) => {
    console.log(`📲 QRCode gerado. Tentativa #${qrCode?.attempt || 1}`);
    if (asciiQR) {
      console.log(asciiQR);
    }
    
    // Salva QR como imagem
    const qrPath = path.join(QR_DIR, 'qr.png');
    let base64Data;
    
    if (typeof qrCode === 'string') {
      base64Data = qrCode.replace(/^data:image\/png;base64,/, '');
    } else if (qrCode && qrCode.qrcode) {
      base64Data = qrCode.qrcode.replace(/^data:image\/png;base64,/, '');
    } else {
      console.error('❌ Formato de QR Code não reconhecido:', typeof qrCode);
      return;
    }
    
    try {
      fs.writeFileSync(qrPath, base64Data, 'base64');
      console.log(`🖼️ QR salvo em: ${qrPath}`);
      console.log(`💡 Abra no navegador: http://localhost:5000/qr/view`);
    } catch (err) {
      console.error('❌ Erro ao salvar QR:', err.message);
    }
  });
}

function safeOn(client, methodName, handler) {
  if (typeof client[methodName] === 'function') {
    client[methodName](handler);
  } else {
    console.warn(`⚠️ Método ${methodName} não disponível no cliente`);
  }
}

export async function initWpp(sessionId = 'marmitex-bot', options = {}) {
  if (clients.has(sessionId)) return clients.get(sessionId);

  const {
    headless = true,
    autoClose = 60000, // 1 minuto ao invés de 0
    logQR = true,
    debug = false,
  } = options;

  const clientPromise = wppconnect
    .create({
      session: sessionId,
      headless,
      autoClose, // Permite auto-close para limpeza
      logQR: true,
      debug,
      folderNameToken: TOKENS_DIR,
      mkdirFolderToken: TOKENS_DIR,
      // Configurações mais estáveis do Puppeteer
      puppeteerOptions: {
        userDataDir: path.join(TOKENS_DIR, sessionId),
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-extensions',
          '--disable-plugins',
          '--disable-background-timer-throttling', // Importante para estabilidade
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding'
        ],
        defaultViewport: null,
        ignoreHTTPSErrors: true,
        timeout: 180000, // 3 minutos
        slowMo: 100, // Mais lento para estabilidade
        devtools: false
      },
      // Configurações específicas para QR Code
      waitForLogin: true,
      logQR: true,
      disableSpins: true,
      disableWelcome: true,
      updatesLog: false,
      // Timeout para QR Code mais generoso
      timeout: 120000, // 2 minutos
      // Configurações de QR Code otimizadas
      catchQR: (base64Qr, asciiQR, attempts, urlCode) => {
        console.log(`📱 QR Code gerado - Tentativa ${attempts || 1}`);
        
        // Log do QR no terminal se disponível
        if (asciiQR) {
          console.log('📲 QR Code ASCII:');
          console.log(asciiQR);
        }
        
        // Salva QR como imagem com tratamento de erro melhorado
        const qrPath = path.join(QR_DIR, `qr-${sessionId}.png`);
        let base64Data;
        
        try {
          if (typeof base64Qr === 'string') {
            // Remove prefixo data URL se presente
            base64Data = base64Qr.replace(/^data:image\/[a-z]+;base64,/, '');
          } else {
            console.error('❌ Formato de QR Code inválido:', typeof base64Qr);
            return;
          }
          
          // Verifica se o base64 é válido
          if (!base64Data || base64Data.length < 100) {
            console.error('❌ QR Code base64 muito pequeno ou inválido');
            return;
          }
          
          fs.writeFileSync(qrPath, base64Data, 'base64');
          console.log(`🖼️ QR salvo em: ${qrPath}`);
          console.log(`💡 Abra no navegador: http://localhost:5000/qr/view`);
          console.log(`⏰ QR Code expira em 20 segundos - Escaneie rapidamente!`);
          console.log(`🔄 Tentativa ${attempts || 1} - Se não funcionar, será gerado um novo QR`);
          
        } catch (err) {
          console.error('❌ Erro ao salvar QR:', err.message);
          console.log('🔄 Tentando continuar sem salvar o arquivo...');
        }
      },
      statusFind: (statusSession, session) => {
        console.log(`🔍 Status da sessão (${session}):`, statusSession);
        
        switch(statusSession) {
          case 'notLogged':
            console.log('🔐 Aguardando login - Escaneie o QR Code');
            break;
          case 'qrReadSuccess':
            console.log('✅ QR Code lido com sucesso - Conectando...');
            break;
          case 'chatsAvailable':
            console.log('💬 Chats disponíveis - Sessão ativa');
            break;
          case 'desconnectedMobile':
            console.log('📱 Celular desconectado - Verifique a internet do celular');
            break;
          case 'browserClose':
            console.log('🌐 Browser fechado - Reiniciando...');
            break;
          default:
            console.log(`📊 Status: ${statusSession}`);
        }
      },
      // Configurações adicionais para estabilidade
      browserWS: '',
      browserArgs: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ],
      disableSpins: true,
      disableWelcome: true
    })
    .then((client) => {
      console.log('✅ WPPConnect criado. Aguardando login...');
      attachDefaultListeners(client, sessionId);
      
      // Configurar reconexão automática APENAS se explicitamente solicitado
      if (options.autoReconnect === true) {
        setupAutoReconnect(client, sessionId);
      }
      
      return client;
    })
    .catch((err) => {
      console.error('❌ Erro ao criar WPPConnect:', err.message);
      console.error('📋 Detalhes do erro:', err);
      
      // Limpa o cliente com erro
      clients.delete(sessionId);
      
      // Se for erro de QR, tenta novamente com configurações mais simples
      if (err.message.includes('QRCode') || err.message.includes('Failed to read')) {
        console.log('🔄 Tentando novamente com configurações simplificadas...');
        // Não relança o erro imediatamente, deixa o sistema tentar novamente
      }
      
      throw err;
    });

  clients.set(sessionId, clientPromise);
  return clientPromise;
}

export async function startClient(sessionId = 'marmitex-bot', options = {}) {
  return initWpp(sessionId, options);
}

export async function getClient(sessionId = 'marmitex-bot') {
  if (!clients.has(sessionId)) {
    throw new Error(`Cliente ${sessionId} não encontrado`);
  }
  return clients.get(sessionId);
}

// Função para aguardar cliente ficar pronto com retry
export async function waitUntilReady(client, timeoutMs = 120_000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    try {
      const state = await client.getConnectionState();
      console.log('🔍 Estado da conexão:', state);
      
      if (state === 'CONNECTED') {
        console.log('✅ Cliente WPP pronto para uso!');
        return true;
      }
      
      if (state === 'CONFLICT') {
        console.log('⚠️ Conflito detectado - Aguardando resolução...');
      }
      
    } catch (err) {
      console.log('⏳ Aguardando cliente ficar pronto...');
    }
    
    await delay(2000); // Aguarda 2 segundos
  }
  
  throw new Error('Timeout: Cliente não ficou pronto a tempo');
}


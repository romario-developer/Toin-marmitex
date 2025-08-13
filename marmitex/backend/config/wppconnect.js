// marmitex/backend/config/wppconnect.js
import wppconnect from 'wppconnect';

let client = null;
let clientPromise = null;

/**
 * Retorna a instância atual do cliente (ou null se ainda não inicializado).
 */
export function getClient() {
  return client;
}

/**
 * Inicializa e retorna o cliente do WPPConnect.
 * Chame uma vez no bootstrap do servidor e reutilize via getClient().
 */
export async function initWpp(options = {}) {
  if (client) return client;
  if (clientPromise) return clientPromise;

  const session = process.env.WPP_SESSION || 'marmitex-bot';

  const createOptions = {
    session,
    // Evita animações de terminal e ruído desnecessário
    disableSpins: true,
    disableWelcome: true,
    debug: false,
    logQR: true, // Mostra QR no terminal (útil em desenvolvimento)
    autoClose: false, // não fecha automaticamente
    waitForLogin: true,

    catchQR: (qr, asciiQR, attempts) => {
      console.log('📲 QRCode gerado. Tentativas:', attempts ?? 0);
      console.log(asciiQR); // QR em ASCII no terminal
    },

    statusFind: (status, sess) => {
      console.log(`📡 Status da sessão [${sess}]:`, status);
    },

    // Opções do Puppeteer/Chromium
    browserArgs: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu',
    ],
    puppeteerOptions: {
      headless: true, // em servidor/produção, deixe true
    },
  };

  clientPromise = wppconnect
    .create(createOptions)
    .then((cli) => {
      client = cli;

      // Eventos úteis
      client.onStateChange((state) => {
        console.log('🔄 Novo estado da sessão:', state);
        // Tratativa de conflito (web aberta em outro lugar)
        if (state === 'CONFLICT' || state === 'DISCONNECTED') {
          client.useHere();
        }
        // Caso fique "UNPAIRED" (despareado), loga pra facilitar o scan de novo
        if (state === 'UNPAIRED') {
          console.log('🔴 SESSÃO DESPAREADA! Escaneie o QR Code novamente.');
        }
      });

      client.onStreamChange((stream) => {
        console.log('🌐 Estado do stream:', stream);
      });

      // Alguns ambientes disparam esse evento
      client.onBattery((level, charging) => {
        console.log(`🔋 Bateria do dispositivo: ${level}% | Carregando: ${charging}`);
      });

      // Se quiser inspecionar mudanças de interface (útil em debug)
      if (typeof client.onInterfaceChange === 'function') {
        client.onInterfaceChange((change) => {
          console.log('🖥️ Interface change:', change);
        });
      }

      console.log('✅ WPPConnect iniciado com sessão:', session);
      return client;
    })
    .catch((err) => {
      console.error('❌ Erro ao iniciar WPPConnect:', err);
      client = null;
      clientPromise = null;
      throw err;
    });

  return clientPromise;
}

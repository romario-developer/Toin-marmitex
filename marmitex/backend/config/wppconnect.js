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

export async function initWpp(sessionId = 'marmitex-bot', options = {}) {
  if (clients.has(sessionId)) return clients.get(sessionId);

  const {
    headless = true,
    autoClose = 0,
    logQR = true,
    debug = false,
  } = options;

  const clientPromise = wppconnect
    .create({
      session: sessionId,
      headless,
      devtools: false,
      debug,
      logQR,
      autoClose,
      browserArgs: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-extensions',
      ],
      catchQR: (base64Qr, asciiQR, attempts, urlCode) => {
        console.log(`📲 QRCode gerado. Tentativa #${attempts}`);

        // 1) Tenta imprimir o ASCII da lib
        if (asciiQR) {
          console.log(asciiQR);
        } else if (urlCode) {
          // 2) Gera ASCII via qrcode-terminal
          qrcodeTerminal.generate(urlCode, { small: true }, (q) => console.log(q));
        }

        // 3) Salva PNG para visualização web
        try {
          const pngPath = path.join(QR_DIR, `${sessionId}.png`);
          const base64 = String(base64Qr || '').replace(/^data:image\/png;base64,?/, '');
          if (base64) {
            fs.writeFileSync(pngPath, Buffer.from(base64, 'base64'));
            fs.writeFileSync(path.join(QR_DIR, 'latest.txt'), `${new Date().toISOString()} ${pngPath}\n`, { flag: 'a' });
            console.log(`🖼️ QR salvo em: ${pngPath}`);
          } else {
            console.warn('⚠️ base64Qr veio vazio; aguardando próxima tentativa para salvar o PNG…');
          }
          const port = process.env.PORT || 3000;
          console.log(`💡 Abra no navegador: http://localhost:${port}/qr/view`);
        } catch (e) {
          console.error('Erro ao salvar QR PNG:', e);
        }
      },
      statusFind: (statusSession, session) => {
        console.log(`📡 Status da sessão (${session}): ${statusSession}`);
      },
      mkdirFolderToken: true,
      folderNameToken: TOKENS_DIR,
      restartOnCrash: (err, session) => {
        console.error(`⚠️ Crash detectado na sessão ${session}:`, err);
        return initWpp(sessionId, options);
      },
      updatesLog: false,
    })
    .then((client) => {
      attachDefaultListeners(client, sessionId);
      return client;
    })
    .catch((err) => {
      console.error('Erro ao criar cliente WPPConnect:', err);
      clients.delete(sessionId);
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
    throw new Error(`Cliente "${sessionId}" ainda não foi inicializado. Chame initWpp/startClient primeiro.`);
  }
  return clients.get(sessionId);
}

/**
 * Aguarda ficar pronto sem depender de "isLogged".
 * Compatível com várias versões do WPPConnect.
 */
export async function waitUntilReady(client, timeoutMs = 120_000) {
  const hasFn = (name) => typeof client?.[name] === 'function';

  async function checkConnected() {
    try {
      if (hasFn('isAuthenticated')) {
        const auth = await client.isAuthenticated();
        if (auth) return true;
      }
    } catch {}

    try {
      if (hasFn('getConnectionState')) {
        const st = await client.getConnectionState();
        // Estados típicos quando já está pronto/conectado
        if (['CONNECTED', 'OPENED', 'NORMAL', 'RESUMING', 'SYNCING'].includes(String(st).toUpperCase())) {
          // Alguns estados como SYNCING ainda estão estabilizando, mas já dá para prosseguir
          return true;
        }
      }
    } catch {}

    // fallback: não conseguimos determinar como conectado
    return false;
  }

  return new Promise((resolve) => {
    let resolved = false;
    const startAt = Date.now();

    // 1) Observa mudanças de estado — resolve quando ficar conectado
    const offState = safeOn(client, 'onStateChange', async (state) => {
      const s = String(state).toUpperCase();
      // Logs úteis:
      // console.log('[waitUntilReady] onStateChange =>', s);
      if (['CONNECTED', 'OPENED', 'NORMAL'].includes(s)) {
        done(true);
      }
    });

    // 2) Polling a cada 2s usando as funções disponíveis
    const interval = setInterval(async () => {
      if (Date.now() - startAt > timeoutMs) {
        done(false);
        return;
      }
      const ok = await checkConnected();
      if (ok) done(true);
    }, 2000);

    function done(value) {
      if (resolved) return;
      resolved = true;
      clearInterval(interval);
      offState?.();
      resolve(value);
    }
  });
}

/* ============ Utils / Listeners ============ */

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function attachDefaultListeners(client, sessionId) {
  try {
    client.onStateChange((state) => {
      console.log(`🔄 Novo estado da sessão (${sessionId}): ${state}`);
      if (state === 'UNPAIRED' || state === 'UNPAIRED_IDLE') {
        console.log('🔴 SESSÃO DESPAREADA! Escaneie o QR novamente.');
      }
    });

    client.onStreamChange((state) => console.log(`📶 Stream (${sessionId}): ${state}`));

    client.onInterfaceChange((state) => {
      // Algumas versões entregam objetos aqui; vamos imprimir de forma legível
      try {
        const pretty = typeof state === 'object' ? JSON.stringify(state, null, 2) : String(state);
        console.log(`🖥️ Interface (${sessionId}): ${pretty}`);
      } catch {
        console.log(`🖥️ Interface (${sessionId}): ${state}`);
      }
    });

    client.onMessage(() => {}); // o fluxo fica no whatsappBot.js
  } catch (e) {
    console.error('Erro ao anexar listeners padrão:', e);
  }
}

/**
 * Registra listener e retorna função para desregistrar com segurança.
 * Se a API não tiver o listener, retorna no-op.
 */
function safeOn(client, methodName, handler) {
  if (typeof client?.[methodName] === 'function') {
    client[methodName](handler);
    return () => {
      try {
        if (typeof client?.removeListener === 'function') {
          client.removeListener(methodName, handler);
        }
      } catch {}
    };
  }
  return () => {};
}

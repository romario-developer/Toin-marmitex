// backend/config/wppconnect.js
import wppconnect from '@wppconnect-team/wppconnect';
import path from 'path';
import fs from 'fs';

let _clientPromise = null;
let _client = null;

const SESSION_DIR = path.resolve('./.wpp-session'); // pasta para persistir login

export async function initWpp() {
  if (_clientPromise) return _clientPromise;

  if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true });

  _clientPromise = wppconnect.create({
    session: 'marmitex-bot',
    autoClose: 0,                // nunca fecha sozinho
    headless: true,
    useChrome: true,
    logQR: true,
    disableWelcome: true,
    deviceName: 'Marmitex Bot',
    updatesLog: true,
    puppeteerOptions: {
      userDataDir: SESSION_DIR,  // <- persiste a sessão (não precisa reler QR toda vez)
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
    catchQR: (_base64, asciiQR) => {
      console.log('📲 QRCode gerado.');
      if (asciiQR) console.log(asciiQR);
    },
    statusFind: (status) => console.log('📡 Status da sessão:', status),
    onLoadingScreen: (percent, message) => console.log('⌛', percent, message),
  }).then((client) => {
    _client = client;

    client.onStateChange((state) => {
      console.log('🔄 Novo estado da sessão:', state);
    });
    client.onStreamChange((state) => {
      console.log('🌐 Estado do stream:', state);
    });
    client.onInterfaceChange((ui) => {
      // ui.status: QR | SYNCING | MAIN | etc.
      console.log('🖥️ UI:', ui?.status, '(', ui?.mode || 'UNKNOWN', ')');
    });

    return client;
  });

  return _clientPromise;
}

export function getClient() {
  return _client;
}

/**
 * Espera conexão, mas NÃO lança erro.
 * Retorna true se conectou dentro do prazo; false caso contrário.
 */
export async function waitUntilReady(maxMs = 180000) {
  const client = await initWpp();

  // caminho rápido
  try {
    const state = await client.getConnectionState();
    if (state === 'CONNECTED') return true;
  } catch (_) {}

  return await new Promise((resolve) => {
    const start = Date.now();

    const tick = async () => {
      try {
        const s = await client.getConnectionState();
        if (s === 'CONNECTED') return resolve(true);
      } catch (_) {}
      if (Date.now() - start > maxMs) return resolve(false); // nunca rejeita
      setTimeout(tick, 1000);
    };

    tick();
  });
}

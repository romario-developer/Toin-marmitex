
import wppconnect from '@wppconnect-team/wppconnect';
import fs from 'fs';

const SESSAO = 'marmitex-bot';
const TOKEN_PATH = `./tokens/${SESSAO}/token.json`;

export async function conectarWhatsapp(callbackOnMessage) {
  const tokenSalvo = carregarToken();

  const client = await wppconnect.create({
    session: SESSAO,
    headless: false,
    autoClose: false,
    browserArgs: ['--no-sandbox'],
    catchQR: (base64Qrimg, asciiQR, attempts, urlCode) => {
      console.log('⚠️ Escaneie o QR Code no WhatsApp:\n', asciiQR);
    },
    statusFind: (statusSession, session) => {
      console.log(`💬 Status da sessão (${session}):`, statusSession);
    },
    browserSessionToken: tokenSalvo ?? undefined,
    disableWelcome: true,
    updatesLog: false
  });

  console.log('✅ Conectado ao WhatsApp!');

  salvarToken(client);

  // Escuta mensagens
  client.onMessage(callbackOnMessage);

  return client;
}

function carregarToken() {
  try {
    const raw = fs.readFileSync(TOKEN_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function salvarToken(client) {
  client.onStreamChange(async (state) => {
    if (state === 'CONNECTED') {
      const token = await client.getSessionTokenBrowser();
      fs.mkdirSync('./tokens/marmitex-bot', { recursive: true });
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(token), 'utf-8');
      console.log('💾 Token de sessão salvo!');
    }
  });
}

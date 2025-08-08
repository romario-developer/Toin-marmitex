
import wppconnect from '@wppconnect-team/wppconnect';
import fs from 'fs';

const SESSAO = 'marmitex-teste';
const TOKEN_PATH = `./tokens/${SESSAO}/token.json`;

export async function conectarWhatsapp(callbackOnMessage) {
  const tokenSalvo = carregarToken();

  const client = await wppconnect.create({
    session: SESSAO,
    headless: false,
    autoClose: 0,
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

  client.onStateChange((state) => {
  console.log('📡 State changed:', state);
  if (state === 'CONFLICT') {
    console.log('⚠️ CONFLITO! Forçando uso aqui...');
    client.useHere();
  }
  if (state === 'UNPAIRED') {
    console.log('🚫 Sessão desvinculada do WhatsApp!');
  }
  if (state === 'UNLAUNCHED') {
    console.log('⚠️ Cliente não iniciou corretamente');
  }
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

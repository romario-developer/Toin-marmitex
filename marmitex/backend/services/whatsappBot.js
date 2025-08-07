// backend/services/whatsappBot.js
import { create, Whatsapp } from 'venom-bot';
import fs from 'fs';
import path from 'path';
import { responderMensagem } from '../utils/responderMensagem.js';

const SESSAO = 'marmitex-bot';
const TOKEN_PATH = `./tokens/${SESSAO}/session.token.json`;

let client = null;

export async function iniciarBot() {
  const sessionToken = carregarTokenSalvo();

  try {
    client = await create({
      session: SESSAO,
      headless: false,
      browserArgs: ['--no-sandbox'],
      browserSessionToken: sessionToken ?? undefined,
      disableWelcome: true,
      updatesLog: false,
      autoClose: 0
    });

    console.log('✅ Conectado ao WhatsApp!');
    salvarToken(client);

    client.onMessage(async (message) => {
      await responderMensagem(client, message);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar o bot:', error);
  }
}

function carregarTokenSalvo() {
  try {
    const raw = fs.readFileSync(TOKEN_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function salvarToken(clientInstance) {
  clientInstance.onStreamChange(async (state) => {
    if (state === 'CONNECTED') {
      const token = await clientInstance.getSessionTokenBrowser();
      fs.mkdirSync(path.dirname(TOKEN_PATH), { recursive: true });
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(token), 'utf-8');
      console.log('💾 Token de sessão salvo com sucesso!');
    }
  });
}

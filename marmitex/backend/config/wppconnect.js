import { create } from '@wppconnect-team/wppconnect';

export async function conectarWhatsapp(onMessageReceived) {
  return await create({
    session: 'marmitex-bot',
    headless: false, // Mantém o navegador visível
    waitForLogin: true, // Espera login completo
    deleteSessionOnLogout: true, // Limpa sessão antiga ao sair
    autoClose: 0,
    catchQR: (base64Qr, asciiQR, attempts, urlCode) => {
      console.log('⚠️ Escaneie o QR Code no WhatsApp:');
      console.log(asciiQR);
    },
    statusFind: (statusSession, session) => {
      console.log(`💬 Status da sessão (${session}):`, statusSession);
    },
    puppeteerOptions: {
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1280,800',
      ],
    },
  }).then((client) => {
    console.log('✅ Conectado ao WhatsApp!');
    client.onMessage(onMessageReceived);
    return client;
  }).catch((error) => {
    console.error('❌ Erro ao iniciar conexão com WhatsApp:', error);
  });
}

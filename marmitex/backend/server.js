// backend/server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { startClient, getClient, waitUntilReady } from './config/wppconnect.js';

/* =========================
   Paths / Constantes
========================= */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = process.cwd();

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || '';
const QR_DIR = path.resolve(ROOT, 'backend', 'qr');

// Garante pasta do QR
if (!fs.existsSync(QR_DIR)) fs.mkdirSync(QR_DIR, { recursive: true });

/* =========================
   App
========================= */
const app = express();

// Segurança básica e utilitários
app.disable('x-powered-by');
app.set('trust proxy', 1);

// Middlewares
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Servir arquivos do QR
app.use('/qr', express.static(QR_DIR));

/* =========================
   Rotas básicas
========================= */
app.get('/', (_req, res) => {
  res.json({ ok: true, name: 'Toin Marmitex API', time: new Date().toISOString() });
});

app.get('/healthz', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), pid: process.pid });
});

// Página para visualizar o QR que é salvo em backend/qr/marmitex-bot.png
app.get('/qr/view', (_req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(`
    <!doctype html>
    <html>
    <head>
      <meta http-equiv="refresh" content="5">
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>QR WhatsApp - marmitex-bot</title>
      <style>
        :root { color-scheme: dark; }
        body{font-family:system-ui,Arial,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;background:#111;color:#eee;margin:0}
        .card{padding:24px;background:#1d1d1d;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,0.3);text-align:center;max-width:92vw}
        img{max-width:70vmin;width:420px;height:auto;border-radius:8px}
        small{opacity:.7}
        .muted{opacity:.6;font-size:12px}
      </style>
    </head>
    <body>
      <div class="card">
        <h2>Escaneie este QR no WhatsApp</h2>
        <p><img src="/qr/marmitex-bot.png?ts=${Date.now()}" alt="QR Code"></p>
        <small>Esta página atualiza a cada 5s automaticamente.</small>
        <p class="muted">Se a imagem estiver em branco, aguarde gerar novamente ou recarregue após alguns segundos.</p>
      </div>
    </body>
    </html>
  `);
});

/* =========================
   Suas rotas (se existirem)
   Ex.: import routers se você já tiver
========================= */
// Tente carregar rotas opcionais se você as tiver criadas (não quebra se não existir)
async function tryMountOptionalRouters() {
  const possibleRouters = [
    './routes/auth.routes.js',
    './routes/cardapio.routes.js',
    './routes/pedidos.routes.js',
    './routes/config.routes.js',
  ];

  for (const relPath of possibleRouters) {
    const absPath = path.resolve(__dirname, relPath);
    if (fs.existsSync(absPath)) {
      try {
        const mod = await import(pathToFileURL(absPath).href);
        if (mod?.default) {
          // monta em base path deduzida pelo nome do arquivo
          const base = '/' + path.basename(relPath).replace('.routes.js', '').replace('.js', '').replace('.routes', '');
          app.use(base, mod.default);
          console.log(`✅ Rotas montadas em ${base} a partir de ${relPath}`);
        } else if (mod?.router) {
          const base = '/' + path.basename(relPath).replace('.routes.js', '').replace('.js', '').replace('.routes', '');
          app.use(base, mod.router);
          console.log(`✅ Rotas montadas (named export "router") em ${base} a partir de ${relPath}`);
        } else {
          console.log(`ℹ️  ${relPath} encontrado, mas não exporta default nem {router}. Ignorando.`);
        }
      } catch (e) {
        console.warn(`⚠️  Falha ao importar ${relPath}:`, e.message);
      }
    }
  }
}

/* =========================
   MongoDB
========================= */
async function connectMongo() {
  if (!MONGODB_URI) {
    console.warn('⚠️  MONGODB_URI não definido no .env — seguindo sem DB.');
    return;
  }
  try {
    await mongoose.connect(MONGODB_URI, {
      // opções modernas do driver já são padrão no Mongoose 7+
    });
    console.log('✅ MongoDB conectado.');
  } catch (err) {
    console.error('❌ Erro ao conectar no MongoDB:', err);
  }
}

/* =========================
   WhatsApp (WPPConnect)
========================= */
async function initWhatsApp() {
  try {
    // Inicia/recupera o cliente
    const clientPromise = await startClient('marmitex-bot', {
      headless: true,
      autoClose: 0,
      logQR: true,   // deixa o ASCII no terminal quando possível
      debug: false,
    });

    const client = await clientPromise;
    console.log('✅ WPPConnect criado. Aguardando login...');

    const ready = await waitUntilReady(client);
    if (!ready) {
      console.log('ℹ️  Ainda não logado. Abra http://localhost:' + PORT + '/qr/view para escanear o QR.');
    } else {
      console.log('🎉 WhatsApp logado e pronto!');
    }

    // Tenta registrar o fluxo do bot
    await mountWhatsAppBot(client);
  } catch (err) {
    console.error('❌ Erro ao iniciar WhatsApp:', err);
  }
}

async function mountWhatsAppBot(client) {
  // Tenta várias formas para funcionar com o seu whatsappBot.js atual
  const botPath = path.resolve(__dirname, './services/whatsappBot.js');
  if (!fs.existsSync(botPath)) {
    console.warn('⚠️  services/whatsappBot.js não encontrado — seguindo sem fluxo do bot.');
    return;
  }
  try {
    const mod = await import(pathToFileURL(botPath).href);

    // 1) default export é uma função initBot(client)
    if (typeof mod?.default === 'function') {
      await mod.default(client);
      console.log('🤖 whatsappBot (default) inicializado.');
      return;
    }
    // 2) named export initBot
    if (typeof mod?.initBot === 'function') {
      await mod.initBot(client);
      console.log('🤖 whatsappBot (initBot) inicializado.');
      return;
    }
    // 3) Sem exports de função: apenas importar já registra listeners internamente
    //    (e.g., o arquivo importa getClient e faz client.onMessage(...))
    console.log('ℹ️  whatsappBot.js não exporta init; assumindo registro por side-effect.');
  } catch (e) {
    console.error('❌ Falha ao carregar services/whatsappBot.js:', e);
  }
}

/* =========================
   Start
========================= */
async function start() {
  await connectMongo();
  await tryMountOptionalRouters();

  // Sobe servidor HTTP
  const server = app.listen(PORT, () => {
    console.log(`🚀 API rodando em http://localhost:${PORT}`);
  });

  // Inicia WhatsApp client
  await initWhatsApp();

  // Encerramento gracioso
  const shutdown = async (signal) => {
    try {
      console.log(`\n${signal} recebido. Encerrando...`);
      // Fecha HTTP
      await new Promise((resolve) => server.close(resolve));
      // Fecha Mongo
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
        console.log('🛑 MongoDB desconectado.');
      }
    } catch (e) {
      console.error('Erro no shutdown:', e);
    } finally {
      process.exit(0);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((err) => {
  console.error('Erro fatal no bootstrap:', err);
  process.exit(1);
});

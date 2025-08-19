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

const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/marmitex';
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

// Adicionar esta linha para servir as imagens dos cardápios
app.use('/uploads', express.static(path.resolve('uploads')));

app.get('/', (_req, res) => {
  res.json({ message: 'API Marmitex funcionando!', timestamp: new Date().toISOString() });
});

app.get('/healthz', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rota para visualizar QR no navegador
app.get('/qr/view', (_req, res) => {
  const qrPath = path.join(QR_DIR, 'qr.png');
  
  // Verificar se o arquivo existe e não está vazio
  if (fs.existsSync(qrPath)) {
    const stats = fs.statSync(qrPath);
    if (stats.size > 0) {
      res.sendFile(qrPath);
      return;
    }
  }
  
  // Se não existe ou está vazio, mostrar página de aguardo
  res.status(404).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>QR Code - Marmitex Bot</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .status { padding: 20px; border-radius: 8px; margin: 20px 0; }
        .waiting { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; }
        .instructions { background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; text-align: left; }
        .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 2s linear infinite; margin: 20px auto; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🤖 Marmitex WhatsApp Bot</h1>
        <div class="spinner"></div>
        <div class="status waiting">
          <h3>⏳ Aguardando QR Code...</h3>
          <p>O QR Code está sendo gerado. Aguarde alguns segundos.</p>
          <p><strong>Esta página será atualizada automaticamente.</strong></p>
        </div>
        <div class="status instructions">
          <h4>📱 Como conectar:</h4>
          <ol>
            <li>Abra o WhatsApp no seu celular</li>
            <li>Vá em <strong>Configurações > Aparelhos conectados</strong></li>
            <li>Toque em <strong>Conectar um aparelho</strong></li>
            <li>Escaneie o QR Code que aparecerá aqui</li>
          </ol>
        </div>
      </div>
      <script>
        // Auto-refresh a cada 3 segundos
        setTimeout(() => window.location.reload(), 3000);
      </script>
    </body>
    </html>
  `);
});

/* =========================
   Rotas da API
========================= */
async function mountApiRoutes() {
  try {
    console.log('🔧 Montando rotas da API...');
    
    // Importar e montar rotas de autenticação
    try {
      const authRoutes = await import('./routes/auth.js');
      app.use('/api/auth', authRoutes.default);
      console.log('✅ Rotas de autenticação montadas em /api/auth');
    } catch (err) {
      console.error('❌ Erro ao carregar rotas de autenticação:', err.message);
    }

    // Importar e montar rotas de cardápios
    try {
      const cardapioRoutes = await import('./routes/cardapios.js');
      app.use('/api/cardapios', cardapioRoutes.default);
      console.log('✅ Rotas de cardápios montadas em /api/cardapios');
    } catch (err) {
      console.error('❌ Erro ao carregar rotas de cardápios:', err.message);
    }

    // Importar e montar rotas de pedidos
    try {
      const pedidoRoutes = await import('./routes/pedidos.js');
      app.use('/api/pedidos', pedidoRoutes.default);
      console.log('✅ Rotas de pedidos montadas em /api/pedidos');
    } catch (err) {
      console.error('❌ Erro ao carregar rotas de pedidos:', err.message);
    }

    // Importar e montar rotas de configurações
    try {
      const configRoutes = await import('./routes/configuracoes.js');
      app.use('/api/configuracoes', configRoutes.default);
      console.log('✅ Rotas de configurações montadas em /api/configuracoes');
    } catch (err) {
      console.error('❌ Erro ao carregar rotas de configurações:', err.message);
    }

    // Importar e montar outras rotas se existirem
    const optionalRoutes = [
      { file: './routes/index.js', path: '/api' },
      { file: './routes/upload.js', path: '/api/upload' },
      { file: './routes/webhooks.js', path: '/api/webhooks' }, // ✅ JÁ CONFIGURADO
    ];

    for (const { file, path: routePath } of optionalRoutes) {
      try {
        const routes = await import(file);
        app.use(routePath, routes.default);
        console.log(`✅ Rotas montadas em ${routePath} a partir de ${file}`);
      } catch (err) {
        console.log(`ℹ️  ${file} não encontrado - ignorando`);
      }
    }

    // Rota catch-all para APIs não encontradas
    app.use('/api/*', (req, res) => {
      res.status(404).json({ 
        erro: 'Rota não encontrada', 
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
      });
    });

    console.log('🎯 Todas as rotas da API foram processadas');

  } catch (err) {
    console.error('❌ Erro crítico ao montar rotas da API:', err);
  }
}

/* =========================
   MongoDB
========================= */
async function connectMongo() {
  try {
    if (!MONGODB_URI) {
      console.warn('⚠️  MONGODB_URI não definida. Usando padrão local.');
    }
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB conectado:', mongoose.connection.db.databaseName);
  } catch (err) {
    console.error('❌ Erro ao conectar MongoDB:', err.message);
    throw err;
  }
}

/* =========================
   WhatsApp (WPPConnect)
========================= */
async function initWhatsApp() {
  try {
    console.log('🤖 Inicializando WhatsApp...');
    
    const clientPromise = await startClient('marmitex-bot', {
      headless: true,
      autoClose: 0,
      logQR: true,
      debug: false,
    });

    const client = await clientPromise;
    console.log('✅ WPPConnect criado. Aguardando login...');

    const ready = await waitUntilReady(client);
    if (!ready) {
      console.log(`ℹ️  Ainda não logado. Abra http://localhost:${PORT}/qr/view para escanear o QR.`);
    } else {
      console.log('🎉 WhatsApp logado e pronto!');
    }

    await mountWhatsAppBot(client);
  } catch (err) {
    console.error('❌ Erro ao iniciar WhatsApp:', err.message);
  }
}

async function mountWhatsAppBot(client) {
  const botPath = path.resolve(__dirname, './services/whatsappBot.js');
  if (!fs.existsSync(botPath)) {
    console.warn('⚠️  services/whatsappBot.js não encontrado — seguindo sem fluxo do bot.');
    return;
  }
  
  try {
    const mod = await import(pathToFileURL(botPath).href);

    if (typeof mod?.default === 'function') {
      await mod.default(client);
      console.log('🤖 whatsappBot (default) inicializado.');
      return;
    }
    
    if (typeof mod?.initBot === 'function') {
      await mod.initBot(client);
      console.log('🤖 whatsappBot (initBot) inicializado.');
      return;
    }
    
    console.log('ℹ️  whatsappBot.js não exporta init; assumindo registro por side-effect.');
  } catch (e) {
    console.error('❌ Falha ao carregar services/whatsappBot.js:', e.message);
  }
}

/* =========================
   Start
========================= */
async function start() {
  try {
    console.log('🚀 Iniciando servidor Marmitex...');
    
    // Conecta ao MongoDB
    await connectMongo();
    
    // Monta as rotas da API
    await mountApiRoutes();

    // Sobe servidor HTTP
    const server = app.listen(PORT, () => {
      console.log(`🌐 API rodando em http://localhost:${PORT}`);
      console.log(`📱 QR Code: http://localhost:${PORT}/qr/view`);
      console.log(`🔍 Health Check: http://localhost:${PORT}/healthz`);
    });

    // Inicia WhatsApp client
    await initWhatsApp();

    // Encerramento gracioso
    const shutdown = async (signal) => {
      try {
        console.log(`\n${signal} recebido. Encerrando...`);
        
        // Fecha HTTP
        await new Promise((resolve) => server.close(resolve));
        console.log('🛑 Servidor HTTP fechado.');
        
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
    
  } catch (err) {
    console.error('❌ Erro fatal no bootstrap:', err);
    process.exit(1);
  }
}

start().catch((err) => {
  console.error('💥 Erro crítico na inicialização:', err);
  process.exit(1);
});

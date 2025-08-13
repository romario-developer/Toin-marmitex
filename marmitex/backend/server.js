// backend/server.js
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';

import { iniciarBot } from './services/whatsappBot.js';
import cardapioRoutes from './routes/cardapios.js';
import pedidosRoutes from './routes/pedidos.js';
import configuracoesRoutes from './routes/configuracoes.js';
import simulador from './routes/simulador.js';
import uploadRouter from './routes/upload.js';
import authRoutes from './routes/auth.js';
import AdminUser from './models/AdminUser.js';
import bcrypt from 'bcryptjs';
import { authMiddleware } from './middleware/auth.js';
import numerosRoutes from './routes/index.js';

dotenv.config();
console.log('🧪 MODO_TESTE:', process.env.MODO_TESTE);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// 📂 arquivos públicos (imagens)
app.use('/uploads', express.static(path.resolve('uploads')));

// 🔐 rotas públicas de autenticação
app.use('/api/auth', authRoutes);

// 🔐 (opcional) proteger rotas admin. Ative se quiser exigir login:
 app.use('/api/cardapios', authMiddleware);
app.use('/api/cardapios', cardapioRoutes);

 app.use('/api/configuracoes', authMiddleware);
app.use('/api/configuracoes', configuracoesRoutes);

 app.use('/api/pedidos', authMiddleware);
app.use('/api/pedidos', pedidosRoutes);

// upload de imagens (pode proteger também se quiser)
 app.use('/api/upload', authMiddleware);
app.use('/api/upload', uploadRouter);
app.use('/api', numerosRoutes);

// 🧪 simulador SEM autenticação quando em modo teste
if (process.env.MODO_TESTE === 'true') {
  app.use('/api/simular', simulador);
}

// 📦 conexão e boot
mongoose.connect(process.env.MONGO_URL)
  .then(async () => {
    console.log('✅ Conectado ao MongoDB');

    // seed do admin (apenas se não existir)
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@marmitex.local').toLowerCase();
    const adminSenha = process.env.ADMIN_PASSWORD || 'admin123';
    const existe = await AdminUser.findOne({ email: adminEmail });
    if (!existe) {
      const passwordHash = await bcrypt.hash(adminSenha, 10);
      await AdminUser.create({ email: adminEmail, passwordHash });
      console.log(`👤 Admin criado: ${adminEmail} / ${adminSenha}`);
    } else {
      console.log(`👤 Admin já existe: ${adminEmail}`);
    }

    if (process.env.MODO_TESTE !== 'true') {
      iniciarBot();
    } else {
      console.log('⚠️ Rodando em modo TESTE: WhatsApp NÃO será conectado.');
    }

    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Erro ao conectar no MongoDB:', error);
  });

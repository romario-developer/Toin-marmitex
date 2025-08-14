// backend/server.js
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import fs from 'fs';

import { iniciarBot } from './services/whatsappBot.js';

// Rotas
import cardapioRoutes from './routes/cardapios.js';
import pedidosRoutes from './routes/pedidos.js';
import configuracoesRoutes from './routes/configuracoes.js';
import simulador from './routes/simulador.js';
import uploadRouter from './routes/upload.js';
import authRoutes from './routes/auth.js';
// import numerosRoutes from './routes/index.js'; // ⚠️ comentado para evitar conflito

// Auth / modelos
import AdminUser from './models/AdminUser.js';
import bcrypt from 'bcryptjs';
import { authMiddleware } from './middleware/auth.js';

dotenv.config();
console.log('🧪 MODO_TESTE:', process.env.MODO_TESTE);

const app = express();
const PORT = process.env.PORT || 5000;

// ====== Middlewares base ======
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true, // não atrapalha mesmo usando Bearer
  })
);
app.use(express.json());

// ====== Arquivos públicos (imagens) ======
const uploadsDir = path.resolve('uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// ====== Rotas públicas ======
app.use('/api/auth', authRoutes);

// ====== Rotas protegidas (Bearer em Authorization) ======
app.use('/api/cardapios', authMiddleware, cardapioRoutes);
app.use('/api/configuracoes', authMiddleware, configuracoesRoutes);
app.use('/api/pedidos', authMiddleware, pedidosRoutes);
app.use('/api/upload', authMiddleware, uploadRouter);

// ⚠️ Evitar conflitos: se esse "index" remonta /cardapios, /pedidos etc., deixe comentado.
// Se for preciso, monte-o NUM PREFIXO PRÓPRIO, por ex: /api/numeros
// app.use('/api/numeros', numerosRoutes);

// ====== Simulador (sem auth) só em modo teste ======
if (process.env.MODO_TESTE === 'true') {
  app.use('/api/simular', simulador);
}

// ====== Handler global de erros (deixe após as rotas) ======
app.use((err, req, res, next) => {
  console.error('💥 Erro:', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Erro interno do servidor',
  });
});

// ====== Conexão e boot ======
mongoose
  .connect(process.env.MONGO_URL)
  .then(async () => {
    console.log('✅ Conectado ao MongoDB');

    // Seed admin (uma vez)
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

    // Iniciar WhatsApp bot só fora de teste
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
    process.exit(1);
  });

// (opcional) garantir que rejeições não tratadas apareçam no log
process.on('unhandledRejection', (reason) => {
  console.error('🔴 Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('🔴 Uncaught Exception:', err);
});

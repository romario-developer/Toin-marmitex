// backend/server.js
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path'; // 👈 Import necessário

import { iniciarBot } from './services/whatsappBot.js';
import cardapioRoutes from './routes/cardapios.js';
import pedidosRoutes from './routes/pedidos.js';
import configuracoesRoutes from './routes/configuracoes.js';
import simulador from './routes/simulador.js';
import uploadRouter from './routes/upload.js'; // 👈 Import da rota de upload

dotenv.config();
console.log('🧪 MODO_TESTE:', process.env.MODO_TESTE);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// 📂 Servir imagens
app.use('/uploads', express.static(path.resolve('uploads')));

// 📌 Rotas principais
app.use('/api/cardapios', cardapioRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/configuracoes', configuracoesRoutes);
app.use('/api/upload', uploadRouter);

// 📌 Simulador só em modo teste
if (process.env.MODO_TESTE === 'true') {
  app.use('/api/simular', simulador);
}

// 📌 Conexão MongoDB e inicialização do bot
mongoose.connect(process.env.MONGO_URL)
  .then(() => {
    console.log('✅ Conectado ao MongoDB');

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

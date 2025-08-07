// backend/server.js
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import cardapioRoutes from './routes/cardapios.js';
import { iniciarBot } from './services/whatsappBot.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Rotas
app.use('/api/cardapios', cardapioRoutes);

// Conexão com MongoDB
mongoose.connect(process.env.MONGO_URL)
  .then(() => {
    console.log('✅ Conectado ao MongoDB');
    iniciarBot(); // Iniciar o bot com WPPConnect
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Erro ao conectar no MongoDB:', error);
  });

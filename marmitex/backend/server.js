import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import simulador from './routes/simulador.js';
import { iniciarBot } from './services/whatsappBot.js';
import cardapioRoutes from './routes/cardapios.js';
import pedidoRoutes from './routes/pedidos.js';



dotenv.config();
console.log('🧪 MODO_TESTE:', process.env.MODO_TESTE);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/cardapios', cardapioRoutes);
app.use('/api/pedidos', pedidoRoutes);

if (process.env.MODO_TESTE === 'true') {
  app.use('/api/simular', simulador);
}

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
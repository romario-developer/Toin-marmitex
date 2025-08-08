import express from 'express';
import { handleMensagemSimulada } from '../services/whatsappBot.js';

const router = express.Router();

router.post('/simular', async (req, res) => {
  const { from, body } = req.body;
  if (!from || !body) {
    return res.status(400).json({ erro: 'Requisição mal formatada. "from" e "body" são obrigatórios.' });
  }

  try {
    await handleMensagemSimulada({ from, body });
    res.json({ status: 'Mensagem simulada com sucesso' });
  } catch (error) {
    console.error('Erro ao simular mensagem:', error);
    res.status(500).json({ erro: 'Erro interno ao processar mensagem simulada.' });
  }
});

export default router;
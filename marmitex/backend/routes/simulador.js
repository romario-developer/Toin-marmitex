import express from 'express';
import { handleMensagemSimulada, getConversa, resetConversa } from '../services/whatsappBot.js';

const router = express.Router();

// 👇 enviar mensagem simulada (já existente)
router.post('/', async (req, res) => {
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

// 👇 obter a conversa de um número (apenas modo teste)
router.get('/conversa/:from', (req, res) => {
  const { from } = req.params;
  const msgs = getConversa(from);
  res.json({ from, mensagens: msgs });
});

// 👇 resetar a conversa de um número (limpar tela)
router.post('/reset', (req, res) => {
  const { from } = req.body;
  if (!from) return res.status(400).json({ erro: '"from" é obrigatório.' });
  resetConversa(from);
  res.json({ status: 'Conversa resetada' });
});

export default router;

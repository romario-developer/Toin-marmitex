// backend/routes/simulador.js
import express from 'express';
import { handleMensagemSimulada, getConversa, resetConversa } from '../services/whatsappBot.js';

const router = express.Router();

// Envia uma mensagem do usuário para o simulador
router.post('/', async (req, res) => {
  try {
    const { from, body } = req.body || {};
    if (!from || !body) return res.status(400).json({ erro: 'from e body são obrigatórios' });

    // nossa função aceita (from, texto) — se a sua aceitar só (texto), o segundo arg será ignorado
    const r = await handleMensagemSimulada(from, body);
    res.json(r || { ok: true });
  } catch (err) {
    console.error('POST /simular erro:', err);
    res.status(500).json({ erro: 'Erro no simulador.' });
  }
});

// Histórico da conversa
router.get('/conversa/:from', async (req, res) => {
  try {
    const { from } = req.params;
    const mensagens = (await getConversa(from)) || [];
    res.json({ mensagens });
  } catch (err) {
    console.error('GET /simular/conversa erro:', err);
    res.status(500).json({ erro: 'Erro ao obter conversa.' });
  }
});

// Reset do histórico
router.post('/reset', async (req, res) => {
  try {
    const { from } = req.body || {};
    if (!from) return res.status(400).json({ erro: 'from é obrigatório' });
    await resetConversa(from);
    res.json({ ok: true });
  } catch (err) {
    console.error('POST /simular/reset erro:', err);
    res.status(500).json({ erro: 'Erro ao resetar conversa.' });
  }
});

export default router;

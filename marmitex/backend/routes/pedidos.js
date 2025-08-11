import express from 'express';
import Pedido from '../models/Pedido.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const pedidos = await Pedido.find().sort({ data: -1 });
    res.json(pedidos);
  } catch (e) {
    res.status(500).json({ erro: 'Erro ao buscar pedidos.' });
  }
});

// PATCH /api/pedidos/:id/status  { status: 'Pronto' }
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const permitido = ['Em preparo', 'Pronto', 'Entregue'];
    if (!permitido.includes(status)) return res.status(400).json({ erro: 'Status inválido.' });

    const upd = await Pedido.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!upd) return res.status(404).json({ erro: 'Pedido não encontrado.' });
    res.json(upd);
  } catch (e) {
    res.status(500).json({ erro: 'Erro ao atualizar status.' });
  }
});

export default router;

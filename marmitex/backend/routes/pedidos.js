import express from 'express';
import Pedido from '../models/Pedido.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const pedidos = await Pedido.find().sort({ data: -1 });
    // Corrigir para retornar no formato esperado pelo frontend
    res.json({ pedidos }); // Em vez de res.json(pedidos);
  } catch (e) {
    res.status(500).json({ erro: 'Erro ao buscar pedidos.' });
  }
});

// PATCH /api/pedidos/:id - para atualizar status ou statusPagamento
router.patch('/:id', async (req, res) => {
  try {
    const updates = {};
    
    if (req.body.status) {
      const permitido = ['Em preparo', 'Pronto', 'Entregue', 'finalizado'];
      if (!permitido.includes(req.body.status)) {
        return res.status(400).json({ erro: 'Status inválido.' });
      }
      updates.status = req.body.status;
    }
    
    if (req.body.statusPagamento) {
      const permitido = ['pendente', 'pago'];
      if (!permitido.includes(req.body.statusPagamento)) {
        return res.status(400).json({ erro: 'Status de pagamento inválido.' });
      }
      updates.statusPagamento = req.body.statusPagamento;
    }

    const upd = await Pedido.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );
    
    if (!upd) return res.status(404).json({ erro: 'Pedido não encontrado.' });
    res.json(upd);
  } catch (e) {
    res.status(500).json({ erro: 'Erro ao atualizar pedido.' });
  }
});

export default router;

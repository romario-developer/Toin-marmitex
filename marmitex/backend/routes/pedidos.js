import express from 'express';
import Pedido from '../models/Pedido.js';

const router = express.Router();

// GET /api/pedidos - Lista todos os pedidos
router.get('/', async (req, res) => {
  try {
    const pedidos = await Pedido.find().sort({ data: -1 });
    res.json(pedidos);
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    res.status(500).json({ erro: 'Erro ao buscar pedidos.' });
  }
});

export default router;

// marmitex/backend/controllers/pedidosController.js
import Pedido from '../models/Pedido.js';

export async function listarPedidos(req, res) {
  try {
    const pedidos = await Pedido.find().sort({ createdAt: -1 }).lean();
    res.json({ ok: true, pedidos });
  } catch (err) {
    console.error('Erro ao listar pedidos:', err);
    res.status(500).json({ ok: false, error: 'Erro ao listar pedidos' });
  }
}

export async function criarPedido(req, res) {
  try {
    const pedido = await Pedido.create(req.body);
    res.status(201).json({ ok: true, pedido });
  } catch (err) {
    console.error('Erro ao criar pedido:', err);
    res.status(400).json({ ok: false, error: 'Dados inválidos' });
  }
}

export async function atualizarStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, statusPagamento } = req.body;
    const pedido = await Pedido.findByIdAndUpdate(
      id,
      { ...(status ? { status } : {}), ...(statusPagamento ? { statusPagamento } : {}) },
      { new: true }
    );
    if (!pedido) return res.status(404).json({ ok: false, error: 'Pedido não encontrado' });
    res.json({ ok: true, pedido });
  } catch (err) {
    console.error('Erro ao atualizar pedido:', err);
    res.status(400).json({ ok: false, error: 'Erro ao atualizar' });
  }
}

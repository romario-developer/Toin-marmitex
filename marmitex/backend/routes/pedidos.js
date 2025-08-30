import express from 'express';
import { listarPedidos, atualizarStatus } from '../controllers/pedidosController.js';
import { verificarLimitePedidosMes, verificarLimitePedidosDia } from '../middleware/planoLimitacao.js';
import { authenticateCliente } from '../middleware/clienteAuth.js';

const router = express.Router();

// Aplicar autenticação em todas as rotas
router.use(authenticateCliente);

// GET /api/pedidos
router.get('/', listarPedidos);

// PATCH /api/pedidos/:id - usar controller com notificações
// Aplicar verificações de limite apenas para criação de novos pedidos
router.patch('/:id', atualizarStatus);

// POST /api/pedidos - criar novo pedido (se existir essa rota)
// router.post('/', verificarLimitePedidosMes, verificarLimitePedidosDia, criarPedido);

export default router;

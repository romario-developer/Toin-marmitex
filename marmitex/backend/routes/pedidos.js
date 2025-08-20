import express from 'express';
import { listarPedidos, atualizarStatus } from '../controllers/pedidosController.js';

const router = express.Router();

// GET /api/pedidos
router.get('/', listarPedidos);

// PATCH /api/pedidos/:id - usar controller com notificações
router.patch('/:id', atualizarStatus);

export default router;

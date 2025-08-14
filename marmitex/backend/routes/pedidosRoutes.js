// marmitex/backend/routes/pedidosRoutes.js
import { Router } from 'express';
import { listarPedidos, criarPedido, atualizarStatus } from '../controllers/pedidosController.js';
// Se você já tem authMiddleware para proteger painel/admin:
import authMiddleware from '../middlewares/authMiddleware.js'; // ajuste o caminho se necessário

const router = Router();

// Listar pedidos (painel)
router.get('/', authMiddleware, listarPedidos);

// Criar pedido (o bot chama internamente, mas pode ser útil manter a rota)
// Se quiser proteger, remova o auth ou troque por uma chave interna
router.post('/', criarPedido);

// Atualizar status pedido (ex.: marcar como pago/finalizado no painel)
router.patch('/:id', authMiddleware, atualizarStatus);

export default router;

import express from 'express';
import {
  getCardapio,
  criarCardapio,
  atualizarCardapio,
  deletarCardapio,
  getPedidos,
  getPedidoPorId,
  atualizarStatusPedido,
  getConfiguracoes,
  atualizarConfiguracoes,
  getNumerosPermitidos,
  adicionarNumeroPermitido,
  removerNumeroPermitido,
  getDashboardStats
} from '../controllers/clienteConfigController.js';
import { authenticateCliente } from '../middleware/clienteAuth.js';

const router = express.Router();

// Middleware de autenticação para todas as rotas
router.use(authenticateCliente);

// Rotas para cardápio
router.get('/cardapio', getCardapio);
router.post('/cardapio', criarCardapio);
router.put('/cardapio/:id', atualizarCardapio);
router.delete('/cardapio/:id', deletarCardapio);

// Rotas para pedidos
router.get('/pedidos', getPedidos);
router.get('/pedidos/:id', getPedidoPorId);
router.patch('/pedidos/:id/status', atualizarStatusPedido);

// Rotas para configurações
router.get('/configuracoes', getConfiguracoes);
router.put('/configuracoes', atualizarConfiguracoes);

// Rotas para números permitidos
router.get('/numeros-permitidos', getNumerosPermitidos);
router.post('/numeros-permitidos', adicionarNumeroPermitido);
router.delete('/numeros-permitidos/:id', removerNumeroPermitido);

// Rota para dashboard
router.get('/dashboard/stats', getDashboardStats);

export default router;
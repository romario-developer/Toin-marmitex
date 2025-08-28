import express from 'express';
import { getDashboardStats, getResumoMensal, getRelatorios } from '../controllers/dashboardController.js';
import { authenticateCliente } from '../middleware/clienteAuth.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticateCliente);

// GET /api/dashboard/stats - Obter estatísticas do dashboard
router.get('/stats', getDashboardStats);

// GET /api/dashboard/resumo-mensal - Obter resumo mensal
router.get('/resumo-mensal', getResumoMensal);

// GET /api/dashboard/relatorios - Obter dados para relatórios
router.get('/relatorios', getRelatorios);

export default router;
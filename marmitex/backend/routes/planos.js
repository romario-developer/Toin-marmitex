import express from 'express';
import {
  listarPlanos,
  obterPlanoAtual,
  iniciarTrial,
  upgradeePlano,
  verificarLimitacoes
} from '../controllers/planosController.js';
import { authenticateCliente } from '../middleware/clienteAuth.js';

const router = express.Router();

// Rotas públicas
router.get('/', listarPlanos); // Listar todos os planos disponíveis

// Rotas protegidas (requerem autenticação)
router.use(authenticateCliente);

router.get('/atual', obterPlanoAtual); // Obter plano atual do cliente
router.get('/limitacoes', verificarLimitacoes); // Verificar status das limitações
router.post('/trial', iniciarTrial); // Iniciar trial
router.post('/upgrade', upgradeePlano); // Fazer upgrade de plano

export default router;
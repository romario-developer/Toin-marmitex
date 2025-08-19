// backend/routes/cardapios.js
import express from 'express';
import {
  salvarCardapio as criarCardapio,
  obterCardapioAtual as obterCardapioDeHoje,
  atualizarCardapioDeHoje,
  listarCardapios,
  obterCardapioPorId,
  atualizarCardapioPorId,
  deletarCardapioPorId,
} from '../controllers/cardapioController.js';

const router = express.Router();

// CRUD geral
router.get('/', listarCardapios);
router.post('/', criarCardapio);

// Endpoints "hoje" (usados pelo BOT) - DEVEM VIR ANTES de /:id
router.get('/hoje', obterCardapioDeHoje);
router.put('/hoje', atualizarCardapioDeHoje);

// Rotas com parâmetros dinâmicos devem vir por último
router.get('/:id', obterCardapioPorId);
router.put('/:id', atualizarCardapioPorId);
router.delete('/:id', deletarCardapioPorId);

export default router;

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
router.get('/:id', obterCardapioPorId);
router.put('/:id', atualizarCardapioPorId);
router.delete('/:id', deletarCardapioPorId);

// Endpoints “hoje” (usados pelo BOT; admin não precisa usar)
router.get('/hoje', obterCardapioDeHoje);
router.put('/hoje', atualizarCardapioDeHoje);

export default router;

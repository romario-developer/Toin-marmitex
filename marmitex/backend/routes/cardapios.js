// backend/routes/cardapios.js
import express from 'express';
import {
  salvarCardapio as criarCardapio,
  obterCardapioAtual as obterCardapioDeHoje,
  atualizarCardapioDeHoje
} from '../controllers/cardapioController.js';

const router = express.Router();

router.post('/', criarCardapio);
router.get('/hoje', obterCardapioDeHoje);
router.put('/hoje', atualizarCardapioDeHoje);

export default router;

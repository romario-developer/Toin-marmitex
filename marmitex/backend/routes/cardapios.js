import express from 'express';
import { criarCardapio, obterCardapioDeHoje } from '../controllers/cardapioController.js';

const router = express.Router();

router.post('/', criarCardapio);
router.get('/hoje', obterCardapioDeHoje);

export default router;

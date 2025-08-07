import express from 'express';
import { salvarCardapio as criarCardapio, obterCardapioAtual as obterCardapioDeHoje } from '../controllers/cardapioController.js';


const router = express.Router();

router.post('/', criarCardapio);
router.get('/hoje', obterCardapioDeHoje);

export default router;

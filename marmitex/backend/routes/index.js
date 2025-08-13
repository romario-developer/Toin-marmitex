import express from 'express';
import * as numeros from '../controllers/numerosController.js';

const router = express.Router();

router.get('/numeros', numeros.listar);
router.post('/numeros', numeros.adicionar);
router.delete('/numeros/:id', numeros.remover);

export default router;

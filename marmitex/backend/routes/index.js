import express from 'express';
import * as numeros from '../controllers/numerosController.js';

const router = express.Router();

// Rotas existentes (admin)
router.get('/numeros', numeros.listar);
router.post('/numeros', numeros.adicionar);
router.delete('/numeros/:id', numeros.remover);

// Rotas de clientes (SaaS)
// Nota: As rotas de clientes estão em arquivo separado e serão importadas no server.js

export default router;

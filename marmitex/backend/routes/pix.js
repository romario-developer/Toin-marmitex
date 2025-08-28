import express from 'express';
import {
  getConfigPix,
  atualizarConfigPix,
  getConfigMercadoPago,
  atualizarConfigMercadoPago,
  testarConfigPix,
  gerarQRCodeTeste,
  getTiposChavePix
} from '../controllers/pixController.js';
import { authenticateCliente } from '../middleware/clienteAuth.js';

const router = express.Router();

// Middleware de autenticação para todas as rotas
router.use(authenticateCliente);

// Rotas para configurações PIX
router.get('/config', getConfigPix);
router.put('/config', atualizarConfigPix);
router.post('/testar', testarConfigPix);
router.post('/qr-teste', gerarQRCodeTeste);
router.get('/tipos-chave', getTiposChavePix);

// Rotas para Mercado Pago
router.get('/mercado-pago/config', getConfigMercadoPago);
router.put('/mercado-pago/config', atualizarConfigMercadoPago);

export default router;
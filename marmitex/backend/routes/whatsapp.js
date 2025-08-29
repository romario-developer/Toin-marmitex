import express from 'express';
import {
  iniciarConexaoWhatsApp,
  getStatusWhatsApp,
  desconectarWhatsApp,
  atualizarConfigWhatsApp,
  getQRCodeImage,
  listarInstanciasAtivas,
  limparSessoesAntigas,
  forcarNovaConexao
} from '../controllers/whatsappController.js';
import { authenticateCliente } from '../middleware/clienteAuth.js';

const router = express.Router();

// Middleware de autenticação para todas as rotas
router.use(authenticateCliente);

// Rotas para gerenciamento do WhatsApp
router.post('/conectar', iniciarConexaoWhatsApp);
router.get('/status', getStatusWhatsApp);
router.post('/desconectar', desconectarWhatsApp);
router.put('/config', atualizarConfigWhatsApp);
router.get('/qr-code', getQRCodeImage);

// Rotas para limpeza e reconexão
router.post('/limpar-sessoes', limparSessoesAntigas);
router.post('/forcar-nova-conexao', forcarNovaConexao);

// Rota para debug/admin - listar instâncias ativas
router.get('/instancias', listarInstanciasAtivas);

export default router;
import express from 'express';
import * as clienteAuthController from '../controllers/clienteAuthController.js';
import * as clienteController from '../controllers/clienteController.js';
import { authenticateCliente, addClienteFilter } from '../middleware/clienteAuth.js';

const router = express.Router();

// Rotas públicas (sem autenticação)
router.post('/registro', clienteAuthController.registrarCliente);
router.post('/login', clienteAuthController.loginCliente);
router.post('/verificar-token', clienteAuthController.verificarToken);

// Rotas protegidas (requerem autenticação)
router.use(authenticateCliente);
router.use(addClienteFilter);

// Perfil do cliente
router.get('/me', clienteController.getMe);
router.put('/me', clienteController.updateMe);

// Manter rota antiga para compatibilidade
router.get('/perfil', clienteController.getMe);
router.put('/perfil', clienteAuthController.atualizarPerfil);

// Configurações do WhatsApp
router.get('/whatsapp/status', clienteController.getWhatsAppStatus);

router.post('/whatsapp/conectar', async (req, res) => {
  try {
    const { default: Cliente } = await import('../models/Cliente.js');
    
    // Gerar sessionName único se não existir
    if (!req.cliente.whatsapp.sessionName) {
      const sessionName = req.cliente.gerarSessionName();
      await Cliente.findByIdAndUpdate(req.clienteId, {
        'whatsapp.sessionName': sessionName
      });
    }
    
    // Aqui você implementaria a lógica para gerar QR Code
    // Por enquanto, retornamos uma resposta de sucesso
    res.json({
      success: true,
      message: 'Processo de conexão iniciado',
      data: {
        sessionName: req.cliente.whatsapp.sessionName,
        qrCode: null // Será implementado posteriormente
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao iniciar conexão do WhatsApp',
      error: error.message
    });
  }
});

// Configurações do PIX
router.put('/pix', async (req, res) => {
  try {
    const { default: Cliente } = await import('../models/Cliente.js');
    const { chave, tipochave, nomeTitular, banco } = req.body;
    
    const cliente = await Cliente.findByIdAndUpdate(
      req.clienteId,
      {
        'pix.chave': chave,
        'pix.tipochave': tipochave,
        'pix.nomeTitular': nomeTitular,
        'pix.banco': banco,
        dataAtualizacao: new Date()
      },
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      message: 'Configurações do PIX atualizadas com sucesso',
      data: {
        pix: cliente.pix
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar configurações do PIX',
      error: error.message
    });
  }
});

// Horários de funcionamento
router.put('/funcionamento', async (req, res) => {
  try {
    const { default: Cliente } = await import('../models/Cliente.js');
    const { horarios, delivery, retirada } = req.body;
    
    const cliente = await Cliente.findByIdAndUpdate(
      req.clienteId,
      {
        'funcionamento.horarios': horarios,
        'funcionamento.delivery': delivery,
        'funcionamento.retirada': retirada,
        dataAtualizacao: new Date()
      },
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      message: 'Horários de funcionamento atualizados com sucesso',
      data: {
        funcionamento: cliente.funcionamento
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar horários de funcionamento',
      error: error.message
    });
  }
});

// Configurações personalizadas
router.put('/configuracoes', async (req, res) => {
  try {
    const { default: Cliente } = await import('../models/Cliente.js');
    const { mensagemBoasVindas, mensagemEncerramento, corTema } = req.body;
    
    const cliente = await Cliente.findByIdAndUpdate(
      req.clienteId,
      {
        'configuracoes.mensagemBoasVindas': mensagemBoasVindas,
        'configuracoes.mensagemEncerramento': mensagemEncerramento,
        'configuracoes.corTema': corTema,
        dataAtualizacao: new Date()
      },
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      message: 'Configurações atualizadas com sucesso',
      data: {
        configuracoes: cliente.configuracoes
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar configurações',
      error: error.message
    });
  }
});

// Dashboard - estatísticas básicas
router.get('/dashboard', async (req, res) => {
  try {
    const { default: Pedido } = await import('../models/Pedido.js');
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);
    
    // Estatísticas do dia
    const pedidosHoje = await Pedido.countDocuments({
      clienteId: req.clienteId,
      createdAt: { $gte: hoje, $lt: amanha }
    });
    
    const vendaHoje = await Pedido.aggregate([
      {
        $match: {
          clienteId: req.clienteId,
          createdAt: { $gte: hoje, $lt: amanha }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$total' }
        }
      }
    ]);
    
    // Estatísticas do mês
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    
    const pedidosMes = await Pedido.countDocuments({
      clienteId: req.clienteId,
      createdAt: { $gte: inicioMes }
    });
    
    const vendaMes = await Pedido.aggregate([
      {
        $match: {
          clienteId: req.clienteId,
          createdAt: { $gte: inicioMes }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$total' }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        hoje: {
          pedidos: pedidosHoje,
          vendas: vendaHoje[0]?.total || 0
        },
        mes: {
          pedidos: pedidosMes,
          vendas: vendaMes[0]?.total || 0
        },
        whatsapp: {
          conectado: req.cliente.whatsapp.isConnected
        },
        plano: {
          tipo: req.cliente.plano.tipo,
          vencimento: req.cliente.plano.dataVencimento,
          ativo: req.cliente.isPlanoAtivo()
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar dados do dashboard',
      error: error.message
    });
  }
});

export default router;
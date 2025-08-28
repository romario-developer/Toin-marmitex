import multiTenantManager from '../services/multiTenantWhatsappBot.js';
import Cliente from '../models/Cliente.js';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = process.cwd();
const QR_DIR = path.resolve(ROOT, 'backend', 'qr');

// Mapa para armazenar as instâncias ativas dos clientes
const clienteInstances = new Map();

// Função para gerar nome da sessão único para o cliente
function gerarNomeSessao(clienteId) {
  return `cliente_${clienteId}`;
}

// Função para obter o caminho do QR Code do cliente
function getCaminhoQR(clienteId) {
  return path.join(QR_DIR, `qr_${clienteId}.png`);
}

// Inicializar conexão WhatsApp para um cliente
export const iniciarConexaoWhatsApp = async (req, res) => {
  try {
    const { clienteId } = req.cliente;
    const cliente = await Cliente.findById(clienteId);
    
    if (!cliente) {
      return res.status(404).json({
        sucesso: false,
        erro: 'Cliente não encontrado'
      });
    }

    // Verificar se já existe uma instância ativa
    if (multiTenantManager.isClientConnected(clienteId)) {
      return res.json({
        sucesso: true,
        status: 'connected',
        mensagem: 'WhatsApp já está conectado'
      });
    }

    // Atualizar status no banco
    await Cliente.findByIdAndUpdate(clienteId, {
      'whatsapp.statusConexao': 'connecting',
      'whatsapp.ultimaConexao': new Date()
    });

    // Configurar Socket.IO no gerenciador se disponível
    if (req.io) {
      multiTenantManager.setSocketIO(req.io);
    }

    // Iniciar cliente WhatsApp
    try {
      await multiTenantManager.startClientInstance(clienteId);
      
      res.json({
        sucesso: true,
        status: 'connecting',
        mensagem: 'Iniciando conexão WhatsApp. Aguarde o QR Code.'
      });
    } catch (error) {
      console.error('Erro ao iniciar cliente WhatsApp:', error);
      
      await Cliente.findByIdAndUpdate(clienteId, {
        'whatsapp.statusConexao': 'error',
        'whatsapp.ultimoErro': error.message
      });
      
      res.status(500).json({
        sucesso: false,
        erro: 'Erro ao iniciar conexão WhatsApp',
        detalhes: error.message
      });
    }
    
  } catch (error) {
    console.error('Erro ao iniciar conexão WhatsApp:', error);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno do servidor'
    });
  }
};

// Obter status da conexão WhatsApp
export const getStatusWhatsApp = async (req, res) => {
  try {
    const { clienteId } = req.cliente;
    const cliente = await Cliente.findById(clienteId);
    
    if (!cliente) {
      return res.status(404).json({
        sucesso: false,
        erro: 'Cliente não encontrado'
      });
    }

    const instanciaLocal = clienteInstances.get(clienteId);
    
    res.json({
      sucesso: true,
      whatsapp: {
        numeroTelefone: cliente.whatsapp.numeroTelefone,
        nomeSessao: cliente.whatsapp.nomeSessao,
        statusConexao: cliente.whatsapp.statusConexao,
        ultimaConexao: cliente.whatsapp.ultimaConexao,
        qrCode: cliente.whatsapp.qrCode,
        ultimoErro: cliente.whatsapp.ultimoErro,
        instanciaAtiva: !!instanciaLocal
      }
    });
  } catch (error) {
    console.error('Erro ao obter status WhatsApp:', error);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno do servidor'
    });
  }
};

// Desconectar WhatsApp
export const desconectarWhatsApp = async (req, res) => {
  try {
    const { clienteId } = req.cliente;
    
    // Parar instância do cliente
    await multiTenantManager.stopClientInstance(clienteId);
    
    res.json({
      sucesso: true,
      mensagem: 'WhatsApp desconectado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao desconectar WhatsApp:', error);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno do servidor'
    });
  }
};

// Atualizar configurações do WhatsApp
export const atualizarConfigWhatsApp = async (req, res) => {
  try {
    const { clienteId } = req.cliente;
    const { numeroTelefone } = req.body;
    
    // Validar número de telefone
    if (numeroTelefone && !/^\d{10,15}$/.test(numeroTelefone.replace(/\D/g, ''))) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Número de telefone inválido'
      });
    }
    
    const cliente = await Cliente.findByIdAndUpdate(
      clienteId,
      {
        'whatsapp.numeroTelefone': numeroTelefone
      },
      { new: true }
    );
    
    if (!cliente) {
      return res.status(404).json({
        sucesso: false,
        erro: 'Cliente não encontrado'
      });
    }
    
    res.json({
      sucesso: true,
      whatsapp: cliente.whatsapp
    });
  } catch (error) {
    console.error('Erro ao atualizar configurações WhatsApp:', error);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno do servidor'
    });
  }
};

// Obter QR Code como imagem
export const getQRCodeImage = async (req, res) => {
  try {
    const { clienteId } = req.cliente;
    const caminhoQR = getCaminhoQR(clienteId);
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(caminhoQR)) {
      return res.status(404).json({
        sucesso: false,
        erro: 'QR Code não encontrado. Inicie a conexão primeiro.'
      });
    }
    
    // Verificar se o arquivo não está vazio
    const stats = fs.statSync(caminhoQR);
    if (stats.size === 0) {
      return res.status(404).json({
        sucesso: false,
        erro: 'QR Code ainda está sendo gerado. Aguarde alguns segundos.'
      });
    }
    
    // Enviar o arquivo
    res.sendFile(caminhoQR);
  } catch (error) {
    console.error('Erro ao obter QR Code:', error);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno do servidor'
    });
  }
};

// Função utilitária para obter instância do cliente
export const getClienteInstance = (clienteId) => {
  return multiTenantManager.getClientInstance(clienteId);
};

// Função utilitária para verificar se cliente está conectado
export const isClienteConnected = (clienteId) => {
  return multiTenantManager.isClientConnected(clienteId);
};

// Listar todas as instâncias ativas (para debug/admin)
export const listarInstanciasAtivas = async (req, res) => {
  try {
    const stats = multiTenantManager.getInstanceStats();
    
    res.json({
      sucesso: true,
      ...stats
    });
  } catch (error) {
    console.error('Erro ao listar instâncias ativas:', error);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno do servidor'
    });
  }
};
import multiTenantManager from '../services/multiTenantWhatsappBot.js';
import Cliente from '../models/Cliente.js';
import { cleanupOldSessions, forceCleanConnection } from '../config/wppconnect.js';
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
  return path.join(QR_DIR, `qr-cliente_${clienteId}.png`);
}

// Função para verificar se existe sessão salva
function verificarSessaoSalva(clienteId) {
  const TOKENS_DIR = path.resolve(process.cwd(), 'backend', 'wpp-tokens');
  const sessionDir = path.join(TOKENS_DIR, `cliente_${clienteId}`);
  
  if (!fs.existsSync(sessionDir)) {
    return { exists: false, message: 'Nenhuma sessão salva encontrada' };
  }
  
  // Verificar se há arquivos importantes da sessão
  const importantFiles = ['Local State', 'Preferences'];
  const hasImportantFiles = importantFiles.some(file => 
    fs.existsSync(path.join(sessionDir, file))
  );
  
  if (!hasImportantFiles) {
    return { exists: false, message: 'Sessão salva incompleta ou corrompida' };
  }
  
  // Verificar idade da sessão (sessões muito antigas podem não funcionar)
  const stats = fs.statSync(sessionDir);
  const daysSinceModified = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);
  
  if (daysSinceModified > 30) {
    return { 
      exists: true, 
      expired: true, 
      message: `Sessão salva encontrada mas pode estar expirada (${Math.round(daysSinceModified)} dias)` 
    };
  }
  
  return { 
    exists: true, 
    expired: false, 
    message: `Sessão salva válida encontrada (${Math.round(daysSinceModified)} dias)` 
  };
}

// Inicializar conexão WhatsApp para um cliente
export const iniciarConexaoWhatsApp = async (req, res) => {
  try {
    const clienteId = req.clienteId;
    console.log(`🚀 [DEBUG] Iniciando conexão WhatsApp para cliente: ${clienteId}`);
    const cliente = await Cliente.findById(clienteId);
    
    if (!cliente) {
      console.error(`❌ [DEBUG] Cliente não encontrado: ${clienteId}`);
      return res.status(404).json({
        success: false,
        message: 'Cliente não encontrado'
      });
    }

    // Verificar se já existe uma instância ativa
    console.log(`🔍 [DEBUG] Verificando se cliente já está conectado: ${clienteId}`);
    if (multiTenantManager.isClientConnected(clienteId)) {
      console.log(`✅ [DEBUG] Cliente já conectado: ${clienteId}`);
      return res.json({
        success: true,
        status: 'connected',
        message: 'WhatsApp já está conectado'
      });
    }

    // Verificar se existe sessão salva
    const sessaoInfo = verificarSessaoSalva(clienteId);
    console.log(`📁 Verificação de sessão para cliente ${clienteId}:`, sessaoInfo.message);

    // Atualizar status no banco
    await Cliente.findByIdAndUpdate(clienteId, {
      'whatsapp.statusConexao': 'connecting',
      'whatsapp.ultimaConexao': new Date(),
      'whatsapp.temSessaoSalva': sessaoInfo.exists,
      'whatsapp.sessaoExpirada': sessaoInfo.expired || false
    });

    // Configurar Socket.IO no gerenciador se disponível
    console.log(`🔍 [DEBUG] Configurando Socket.IO no gerenciador`);
    if (req.io) {
      multiTenantManager.setSocketIO(req.io);
      console.log(`✅ [DEBUG] Socket.IO configurado com sucesso`);
    } else {
      console.warn(`⚠️ [DEBUG] Socket.IO não disponível no request`);
    }

    // Iniciar cliente WhatsApp
    try {
      console.log(`🔄 Iniciando instância WhatsApp para cliente ${clienteId}`);
      
      if (sessaoInfo.exists && !sessaoInfo.expired) {
        console.log(`🔑 Tentando reconectar usando sessão salva...`);
      } else if (sessaoInfo.expired) {
        console.log(`⚠️ Sessão salva expirada - será necessário novo QR code`);
      } else {
        console.log(`📱 Primeira conexão - será necessário escanear QR code`);
      }
      
      console.log(`🔍 [DEBUG] Chamando multiTenantManager.startClientInstance`);
      await multiTenantManager.startClientInstance(clienteId);
      console.log(`✅ [DEBUG] Instância WhatsApp iniciada para cliente ${clienteId}`);
      
      const responseMessage = sessaoInfo.exists && !sessaoInfo.expired 
        ? 'Tentando reconectar usando sessão salva. Se não conectar automaticamente, será gerado um QR Code.'
        : 'Iniciando conexão WhatsApp. Aguarde o QR Code.';
      
      res.json({
        success: true,
        status: 'connecting',
        message: responseMessage,
        sessionInfo: {
          hasSavedSession: sessaoInfo.exists,
          sessionExpired: sessaoInfo.expired || false,
          requiresQR: !sessaoInfo.exists || sessaoInfo.expired
        }
      });
    } catch (error) {
      console.error('Erro ao iniciar cliente WhatsApp:', error);
      
      await Cliente.findByIdAndUpdate(clienteId, {
        'whatsapp.statusConexao': 'error',
        'whatsapp.ultimoErro': error.message
      });
      
      res.status(500).json({
        success: false,
        message: 'Erro ao iniciar conexão WhatsApp',
        details: error.message
      });
    }
    
  } catch (error) {
    console.error('Erro ao iniciar conexão WhatsApp:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Obter status da conexão WhatsApp
export const getStatusWhatsApp = async (req, res) => {
  try {
    const clienteId = req.clienteId;
    console.log(`🔍 [DEBUG] Obtendo status WhatsApp para cliente: ${clienteId}`);
    const cliente = await Cliente.findById(clienteId);
    
    if (!cliente) {
      console.error(`❌ [DEBUG] Cliente não encontrado ao obter status: ${clienteId}`);
      return res.status(404).json({
        success: false,
        message: 'Cliente não encontrado'
      });
    }

    console.log(`🔍 [DEBUG] Verificando instância local para cliente: ${clienteId}`);
    const instanciaLocal = clienteInstances.get(clienteId);
    console.log(`🔍 [DEBUG] Instância local encontrada: ${!!instanciaLocal}`);
    
    const statusResponse = {
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
    };
    console.log(`✅ [DEBUG] Status WhatsApp obtido:`, statusResponse.whatsapp);
    res.json(statusResponse);
  } catch (error) {
    console.error('Erro ao obter status WhatsApp:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Desconectar WhatsApp
export const desconectarWhatsApp = async (req, res) => {
  try {
    const clienteId = req.clienteId;
    
    // Parar instância do cliente
    await multiTenantManager.stopClientInstance(clienteId);
    
    res.json({
      success: true,
      message: 'WhatsApp desconectado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao desconectar WhatsApp:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Atualizar configurações do WhatsApp
export const atualizarConfigWhatsApp = async (req, res) => {
  try {
    const clienteId = req.clienteId;
    const { numeroTelefone } = req.body;
    
    // Validar número de telefone
    if (numeroTelefone && !/^\d{10,15}$/.test(numeroTelefone.replace(/\D/g, ''))) {
      return res.status(400).json({
        success: false,
        message: 'Número de telefone inválido'
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
      success: true,
      whatsapp: cliente.whatsapp
    });
  } catch (error) {
    console.error('Erro ao atualizar configurações WhatsApp:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Obter QR Code como imagem
export const getQRCodeImage = async (req, res) => {
  try {
    const clienteId = req.clienteId;
    const caminhoQR = getCaminhoQR(clienteId);
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(caminhoQR)) {
      return res.status(404).json({
        success: false,
        message: 'QR Code não encontrado. Inicie a conexão primeiro.'
      });
    }
    
    // Verificar se o arquivo não está vazio
    const stats = fs.statSync(caminhoQR);
    if (stats.size === 0) {
      return res.status(404).json({
        success: false,
        message: 'QR Code ainda está sendo gerado. Aguarde alguns segundos.'
      });
    }
    
    // Ler arquivo e converter para base64
    const qrBuffer = fs.readFileSync(caminhoQR);
    const qrBase64 = qrBuffer.toString('base64');
    
    res.json({
      success: true,
      qrCode: qrBase64
    });
  } catch (error) {
    console.error('Erro ao obter QR Code:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
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
      success: true,
      ...stats
    });
  } catch (error) {
    console.error('Erro ao listar instâncias ativas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Limpar sessões antigas e cache do WhatsApp
export const limparSessoesAntigas = async (req, res) => {
  try {
    const clienteId = req.clienteId;
    const cliente = await Cliente.findById(clienteId);
    
    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente não encontrado'
      });
    }

    console.log(`🧹 Iniciando limpeza de sessões para cliente ${clienteId}`);
    
    // Parar instância atual se estiver rodando
    if (multiTenantManager.isClientConnected(clienteId)) {
      console.log('🔄 Parando instância atual...');
      await multiTenantManager.stopClientInstance(clienteId);
    }
    
    // Limpar sessões antigas
    const sessionName = gerarNomeSessao(clienteId);
    const cleanupResult = await cleanupOldSessions(sessionName, true);
    
    if (cleanupResult) {
      // Atualizar status no banco
      await Cliente.findByIdAndUpdate(clienteId, {
        'whatsapp.statusConexao': 'disconnected',
        'whatsapp.temSessaoSalva': false,
        'whatsapp.sessaoExpirada': false,
        'whatsapp.ultimaLimpeza': new Date()
      });
      
      console.log(`✅ Limpeza concluída para cliente ${clienteId}`);
      
      res.json({
        success: true,
        message: 'Sessões antigas e cache limpos com sucesso. Você pode iniciar uma nova conexão agora.'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Erro durante a limpeza de sessões'
      });
    }
    
  } catch (error) {
    console.error('Erro ao limpar sessões antigas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      details: error.message
    });
  }
};

// Forçar nova conexão limpa (limpa tudo e inicia nova conexão)
export const resetCompleto = async (req, res) => {
  try {
    const clienteId = req.clienteId;
    console.log(`🔄 [DEBUG] Iniciando reset completo para cliente: ${clienteId}`);
    const cliente = await Cliente.findById(clienteId);
    
    if (!cliente) {
      console.error(`❌ [DEBUG] Cliente não encontrado: ${clienteId}`);
      return res.status(404).json({
        success: false,
        message: 'Cliente não encontrado'
      });
    }

    console.log(`🔄 [DEBUG] Cliente encontrado, iniciando processo de reset completo`);
    
    // 1. Parar instância atual se estiver rodando
    console.log(`🔍 [DEBUG] Verificando se cliente está conectado`);
    if (multiTenantManager.isClientConnected(clienteId)) {
      console.log('🛑 [DEBUG] Parando instância atual...');
      await multiTenantManager.stopClientInstance(clienteId);
      console.log('⏳ [DEBUG] Aguardando 2 segundos para garantir que a instância foi parada...');
      // Aguardar um pouco para garantir que a instância foi parada
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('✅ [DEBUG] Instância parada com sucesso');
    } else {
      console.log('ℹ️ [DEBUG] Nenhuma instância ativa encontrada');
    }
    
    // 2. Limpar arquivos de sessão
    const TOKENS_DIR = path.resolve(process.cwd(), 'backend', 'wpp-tokens');
    const sessionDir = path.join(TOKENS_DIR, `cliente_${clienteId}`);
    console.log(`🔍 [DEBUG] Verificando pasta de sessão: ${sessionDir}`);
    
    if (fs.existsSync(sessionDir)) {
      console.log('🗑️ [DEBUG] Removendo arquivos de sessão...');
      try {
        fs.rmSync(sessionDir, { recursive: true, force: true });
        console.log('✅ [DEBUG] Arquivos de sessão removidos com sucesso');
      } catch (error) {
        console.warn('⚠️ [DEBUG] Erro ao remover sessão:', error.message);
      }
    } else {
      console.log('ℹ️ [DEBUG] Pasta de sessão não encontrada');
    }
    
    // 3. Limpar arquivos QR
    const qrPath = getCaminhoQR(clienteId);
    console.log(`🔍 [DEBUG] Verificando arquivo QR: ${qrPath}`);
    if (fs.existsSync(qrPath)) {
      console.log('🗑️ [DEBUG] Removendo arquivo QR...');
      try {
        fs.unlinkSync(qrPath);
        console.log('✅ [DEBUG] Arquivo QR removido com sucesso');
      } catch (error) {
        console.warn('⚠️ [DEBUG] Erro ao remover QR:', error.message);
      }
    } else {
      console.log('ℹ️ [DEBUG] Arquivo QR não encontrado');
    }
    
    // 4. Limpar cache do cliente no gerenciador
    console.log(`🔍 [DEBUG] Verificando se gerenciador tem função clearClientCache`);
    if (multiTenantManager.clearClientCache) {
      console.log('🧹 [DEBUG] Limpando cache do cliente no gerenciador...');
      multiTenantManager.clearClientCache(clienteId);
      console.log('✅ [DEBUG] Cache do cliente limpo com sucesso');
    } else {
      console.log('ℹ️ [DEBUG] Função clearClientCache não disponível no gerenciador');
    }
    
    // 5. Atualizar status no banco
    console.log(`🔍 [DEBUG] Atualizando status no banco de dados`);
    await Cliente.findByIdAndUpdate(clienteId, {
      'whatsapp.statusConexao': 'disconnected',
      'whatsapp.temSessaoSalva': false,
      'whatsapp.sessaoExpirada': false,
      'whatsapp.qrCode': null,
      'whatsapp.ultimaConexao': null,
      'whatsapp.ultimaLimpeza': new Date(),
      'whatsapp.ultimoErro': null
    });
    console.log(`✅ [DEBUG] Status do banco atualizado com sucesso`);
    
    console.log(`✅ [DEBUG] Reset completo finalizado com sucesso para cliente: ${clienteId}`);
    
    res.json({
      success: true,
      message: 'Reset completo realizado com sucesso. Todos os dados de sessão foram limpos.',
      details: {
        sessionCleared: true,
        qrCleared: true,
        cacheCleared: true,
        databaseUpdated: true
      }
    });
    
  } catch (error) {
    console.error('❌ [DEBUG] Erro ao realizar reset completo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao realizar reset completo',
      details: error.message
    });
  }
};

export const forcarNovaConexao = async (req, res) => {
  try {
    const clienteId = req.clienteId;
    const cliente = await Cliente.findById(clienteId);
    
    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente não encontrado'
      });
    }

    console.log(`🔄 Forçando nova conexão limpa para cliente ${clienteId}`);
    
    // Parar instância atual se estiver rodando
    if (multiTenantManager.isClientConnected(clienteId)) {
      console.log('🔄 Parando instância atual...');
      await multiTenantManager.stopClientInstance(clienteId);
    }
    
    // Atualizar status no banco
    await Cliente.findByIdAndUpdate(clienteId, {
      'whatsapp.statusConexao': 'connecting',
      'whatsapp.temSessaoSalva': false,
      'whatsapp.sessaoExpirada': false,
      'whatsapp.ultimaConexao': new Date(),
      'whatsapp.ultimaLimpeza': new Date()
    });
    
    // Configurar Socket.IO no gerenciador se disponível
    if (req.io) {
      multiTenantManager.setSocketIO(req.io);
    }
    
    // Forçar nova conexão limpa
    try {
      console.log(`🚀 Iniciando nova conexão limpa para cliente ${clienteId}`);
      await multiTenantManager.startClientInstance(clienteId);
      
      console.log(`✅ Nova conexão iniciada para cliente ${clienteId}`);
      
      res.json({
        success: true,
        status: 'connecting',
        message: 'Nova conexão limpa iniciada. Aguarde o QR Code para escanear.',
        sessionInfo: {
          hasSavedSession: false,
          sessionExpired: false,
          requiresQR: true,
          cleanConnection: true
        }
      });
      
    } catch (error) {
      console.error('Erro ao iniciar nova conexão:', error);
      
      await Cliente.findByIdAndUpdate(clienteId, {
        'whatsapp.statusConexao': 'error',
        'whatsapp.ultimoErro': error.message
      });
      
      res.status(500).json({
        success: false,
        message: 'Erro ao iniciar nova conexão limpa',
        details: error.message
      });
    }
    
  } catch (error) {
    console.error('Erro ao forçar nova conexão:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      details: error.message
    });
  }
};
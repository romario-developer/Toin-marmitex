import jwt from 'jsonwebtoken';
import Cliente from '../models/Cliente.js';

// Middleware para autenticar clientes
const authenticateCliente = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de acesso requerido',
        clearToken: true
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'seu_jwt_secret_aqui');
    
    // Verificar se é um token de cliente
    if (decoded.tipo !== 'cliente') {
      return res.status(403).json({
        success: false,
        message: 'Token inválido para esta operação',
        clearToken: true
      });
    }

    // Buscar cliente no banco
    const cliente = await Cliente.findById(decoded.clienteId);
    
    if (!cliente || !cliente.ativo) {
      return res.status(401).json({
        success: false,
        message: 'Cliente não encontrado ou inativo',
        clearToken: true
      });
    }

    // Verificar se o plano está ativo
    if (!cliente.isPlanoAtivo()) {
      return res.status(403).json({
        success: false,
        message: 'Plano vencido. Renove para continuar usando o serviço.'
      });
    }

    // Adicionar informações do cliente ao request
    req.clienteId = cliente._id;
    req.cliente = cliente;
    
    next();
  } catch (error) {
    console.error('Erro na autenticação do cliente:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Middleware para verificar se o cliente tem acesso a um recurso específico
const checkClienteAccess = (resourceClienteIdField = 'clienteId') => {
  return (req, res, next) => {
    const resourceClienteId = req.params[resourceClienteIdField] || req.body[resourceClienteIdField];
    
    // Se não há clienteId no recurso, usar o do cliente autenticado
    if (!resourceClienteId) {
      req.body.clienteId = req.clienteId;
      return next();
    }
    
    // Verificar se o cliente tem acesso ao recurso
    if (resourceClienteId.toString() !== req.clienteId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado a este recurso'
      });
    }
    
    next();
  };
};

// Middleware para adicionar filtro de cliente nas queries
const addClienteFilter = (req, res, next) => {
  // Adicionar filtro de cliente em todas as queries
  req.clienteFilter = { clienteId: req.clienteId };
  
  // Se há parâmetros de query, adicionar o filtro
  if (req.query) {
    req.query.clienteId = req.clienteId;
  }
  
  // Se há body, adicionar o clienteId
  if (req.body && typeof req.body === 'object') {
    req.body.clienteId = req.clienteId;
  }
  
  next();
};

export {
  authenticateCliente,
  checkClienteAccess,
  addClienteFilter
};
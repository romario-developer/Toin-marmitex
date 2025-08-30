import PlanoLimitacao from '../models/PlanoLimitacao.js';
import Pedido from '../models/Pedido.js';
import Cardapio from '../models/Cardapio.js';

// Cache para limitações dos planos
let planosCache = {};

// Função para carregar limitações dos planos
const carregarLimitacoesPlanos = async () => {
  try {
    const planos = await PlanoLimitacao.find({ ativo: true });
    planosCache = {};
    planos.forEach(plano => {
      planosCache[plano.tipo] = plano.limitacoes;
    });
  } catch (error) {
    console.error('Erro ao carregar limitações dos planos:', error);
  }
};

// Carregar limitações na inicialização
carregarLimitacoesPlanos();

// Recarregar cache a cada 5 minutos
setInterval(carregarLimitacoesPlanos, 5 * 60 * 1000);

// Middleware para verificar limitações de pedidos por mês
export const verificarLimitePedidosMes = async (req, res, next) => {
  try {
    const cliente = req.cliente;
    const tipoPlano = cliente.plano.tipo;
    
    // Mapear planos antigos para novos
    const mapeamentoPlanos = {
      'basico': 'gratis',
      'premium': 'profissional',
      'enterprise': 'enterprise'
    };
    
    const planoAtual = mapeamentoPlanos[tipoPlano] || tipoPlano;
    const limitacoes = planosCache[planoAtual];
    
    if (!limitacoes) {
      return next();
    }
    
    // Verificar limite de pedidos por mês
    if (limitacoes.pedidosPorMes > 0) {
      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);
      
      const pedidosNoMes = await Pedido.countDocuments({
        clienteId: cliente._id,
        createdAt: { $gte: inicioMes }
      });
      
      if (pedidosNoMes >= limitacoes.pedidosPorMes) {
        return res.status(403).json({
          success: false,
          message: `Limite de ${limitacoes.pedidosPorMes} pedidos por mês atingido. Faça upgrade do seu plano.`,
          codigo: 'LIMITE_PEDIDOS_MES',
          limite: limitacoes.pedidosPorMes,
          atual: pedidosNoMes
        });
      }
    }
    
    next();
  } catch (error) {
    console.error('Erro ao verificar limite de pedidos por mês:', error);
    next();
  }
};

// Middleware para verificar limitações de pedidos por dia
export const verificarLimitePedidosDia = async (req, res, next) => {
  try {
    const cliente = req.cliente;
    const tipoPlano = cliente.plano.tipo;
    
    const mapeamentoPlanos = {
      'basico': 'gratis',
      'premium': 'profissional',
      'enterprise': 'enterprise'
    };
    
    const planoAtual = mapeamentoPlanos[tipoPlano] || tipoPlano;
    const limitacoes = planosCache[planoAtual];
    
    if (!limitacoes) {
      return next();
    }
    
    // Verificar limite de pedidos por dia
    if (limitacoes.pedidosPorDia > 0) {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      
      const amanha = new Date(hoje);
      amanha.setDate(amanha.getDate() + 1);
      
      const pedidosHoje = await Pedido.countDocuments({
        clienteId: cliente._id,
        createdAt: { $gte: hoje, $lt: amanha }
      });
      
      if (pedidosHoje >= limitacoes.pedidosPorDia) {
        return res.status(403).json({
          success: false,
          message: `Limite de ${limitacoes.pedidosPorDia} pedidos por dia atingido. Faça upgrade do seu plano.`,
          codigo: 'LIMITE_PEDIDOS_DIA',
          limite: limitacoes.pedidosPorDia,
          atual: pedidosHoje
        });
      }
    }
    
    next();
  } catch (error) {
    console.error('Erro ao verificar limite de pedidos por dia:', error);
    next();
  }
};

// Middleware para verificar limitações de itens do cardápio
export const verificarLimiteCardapio = async (req, res, next) => {
  try {
    const cliente = req.cliente;
    const tipoPlano = cliente.plano.tipo;
    
    const mapeamentoPlanos = {
      'basico': 'gratis',
      'premium': 'profissional',
      'enterprise': 'enterprise'
    };
    
    const planoAtual = mapeamentoPlanos[tipoPlano] || tipoPlano;
    const limitacoes = planosCache[planoAtual];
    
    if (!limitacoes) {
      return next();
    }
    
    // Verificar limite de itens do cardápio
    if (limitacoes.itensCardapio > 0) {
      const itensCardapio = await Cardapio.countDocuments({
        clienteId: cliente._id
      });
      
      if (itensCardapio >= limitacoes.itensCardapio) {
        return res.status(403).json({
          success: false,
          message: `Limite de ${limitacoes.itensCardapio} itens no cardápio atingido. Faça upgrade do seu plano.`,
          codigo: 'LIMITE_CARDAPIO',
          limite: limitacoes.itensCardapio,
          atual: itensCardapio
        });
      }
    }
    
    next();
  } catch (error) {
    console.error('Erro ao verificar limite de cardápio:', error);
    next();
  }
};

// Middleware para verificar funcionalidades disponíveis
export const verificarFuncionalidade = (funcionalidade) => {
  return async (req, res, next) => {
    try {
      const cliente = req.cliente;
      const tipoPlano = cliente.plano.tipo;
      
      const mapeamentoPlanos = {
        'basico': 'gratis',
        'premium': 'profissional',
        'enterprise': 'enterprise'
      };
      
      const planoAtual = mapeamentoPlanos[tipoPlano] || tipoPlano;
      const limitacoes = planosCache[planoAtual];
      
      if (!limitacoes) {
        return next();
      }
      
      // Verificar se a funcionalidade está disponível
      if (!limitacoes.funcionalidades[funcionalidade]) {
        return res.status(403).json({
          success: false,
          message: `Funcionalidade '${funcionalidade}' não disponível no seu plano. Faça upgrade para acessar.`,
          codigo: 'FUNCIONALIDADE_INDISPONIVEL',
          funcionalidade: funcionalidade,
          planoAtual: planoAtual
        });
      }
      
      next();
    } catch (error) {
      console.error('Erro ao verificar funcionalidade:', error);
      next();
    }
  };
};

// Função para obter limitações do plano
export const obterLimitacoesPlano = (tipoPlano) => {
  const mapeamentoPlanos = {
    'basico': 'gratis',
    'premium': 'profissional',
    'enterprise': 'enterprise'
  };
  
  const planoAtual = mapeamentoPlanos[tipoPlano] || tipoPlano;
  return planosCache[planoAtual] || null;
};

// Função para verificar se uma funcionalidade está disponível
export const funcionalidadeDisponivel = (tipoPlano, funcionalidade) => {
  const limitacoes = obterLimitacoesPlano(tipoPlano);
  return limitacoes ? limitacoes.funcionalidades[funcionalidade] : false;
};

export { carregarLimitacoesPlanos };
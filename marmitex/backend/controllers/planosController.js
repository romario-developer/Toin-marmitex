import PlanoLimitacao from '../models/PlanoLimitacao.js';
import Cliente from '../models/Cliente.js';
import Pedido from '../models/Pedido.js';
import Cardapio from '../models/Cardapio.js';
import { obterLimitacoesPlano } from '../middleware/planoLimitacao.js';

// Listar todos os planos disponíveis
export const listarPlanos = async (req, res) => {
  try {
    const planos = await PlanoLimitacao.find({ ativo: true }).sort({ ordem: 1 });
    
    const planosFormatados = planos.map(plano => ({
      id: plano._id,
      tipo: plano.tipo,
      nome: plano.nome,
      preco: plano.preco,
      limitacoes: {
        pedidosPorMes: plano.limitacoes.pedidosPorMes,
        pedidosPorDia: plano.limitacoes.pedidosPorDia,
        itensCardapio: plano.limitacoes.itensCardapio,
        numeroWhatsApp: plano.limitacoes.numeroWhatsApp,
        armazenamentoImagens: plano.limitacoes.armazenamentoImagens,
        tempoSuporte: plano.limitacoes.tempoSuporte
      },
      funcionalidades: plano.limitacoes.funcionalidades,
      trial: plano.trial,
      recomendado: plano.tipo === 'profissional' // Marcar o plano profissional como recomendado
    }));
    
    res.json({
      success: true,
      data: planosFormatados
    });
  } catch (error) {
    console.error('Erro ao listar planos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Obter detalhes do plano atual do cliente
export const obterPlanoAtual = async (req, res) => {
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
    const planoDetalhes = await PlanoLimitacao.findOne({ tipo: planoAtual, ativo: true });
    
    if (!planoDetalhes) {
      return res.status(404).json({
        success: false,
        message: 'Plano não encontrado'
      });
    }
    
    // Calcular uso atual
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);
    
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);
    
    const [pedidosHoje, pedidosNoMes, itensCardapio] = await Promise.all([
      Pedido.countDocuments({
        clienteId: cliente._id,
        createdAt: { $gte: hoje, $lt: amanha }
      }),
      Pedido.countDocuments({
        clienteId: cliente._id,
        createdAt: { $gte: inicioMes }
      }),
      Cardapio.countDocuments({
        clienteId: cliente._id
      })
    ]);
    
    const usoAtual = {
      pedidosHoje: pedidosHoje,
      pedidosNoMes: pedidosNoMes,
      itensCardapio: itensCardapio
    };
    
    res.json({
      success: true,
      data: {
        plano: {
          tipo: planoDetalhes.tipo,
          nome: planoDetalhes.nome,
          preco: planoDetalhes.preco,
          dataVencimento: cliente.plano.dataVencimento,
          ativo: cliente.isPlanoAtivo(),
          trial: cliente.plano.trial
        },
        limitacoes: planoDetalhes.limitacoes,
        usoAtual: usoAtual,
        porcentagemUso: {
          pedidosDia: planoDetalhes.limitacoes.pedidosPorDia > 0 
            ? Math.round((pedidosHoje / planoDetalhes.limitacoes.pedidosPorDia) * 100)
            : 0,
          pedidosMes: planoDetalhes.limitacoes.pedidosPorMes > 0 
            ? Math.round((pedidosNoMes / planoDetalhes.limitacoes.pedidosPorMes) * 100)
            : 0,
          cardapio: planoDetalhes.limitacoes.itensCardapio > 0 
            ? Math.round((itensCardapio / planoDetalhes.limitacoes.itensCardapio) * 100)
            : 0
        }
      }
    });
  } catch (error) {
    console.error('Erro ao obter plano atual:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Iniciar trial de um plano
export const iniciarTrial = async (req, res) => {
  try {
    const { tipoPlano } = req.body;
    const cliente = req.cliente;
    
    // Verificar se o cliente já teve trial
    if (cliente.plano.trial.ativo) {
      return res.status(400).json({
        success: false,
        message: 'Você já possui um trial ativo'
      });
    }
    
    // Buscar detalhes do plano
    const planoDetalhes = await PlanoLimitacao.findOne({ tipo: tipoPlano, ativo: true });
    
    if (!planoDetalhes || !planoDetalhes.trial.disponivel) {
      return res.status(400).json({
        success: false,
        message: 'Trial não disponível para este plano'
      });
    }
    
    // Calcular datas do trial
    const dataInicio = new Date();
    const dataFim = new Date();
    dataFim.setDate(dataFim.getDate() + planoDetalhes.trial.diasTrial);
    
    // Atualizar cliente
    await Cliente.findByIdAndUpdate(cliente._id, {
      'plano.tipo': tipoPlano,
      'plano.dataVencimento': dataFim,
      'plano.trial.ativo': true,
      'plano.trial.dataInicio': dataInicio,
      'plano.trial.dataFim': dataFim
    });
    
    res.json({
      success: true,
      message: `Trial de ${planoDetalhes.trial.diasTrial} dias iniciado com sucesso!`,
      data: {
        plano: tipoPlano,
        dataInicio: dataInicio,
        dataFim: dataFim,
        diasRestantes: planoDetalhes.trial.diasTrial
      }
    });
  } catch (error) {
    console.error('Erro ao iniciar trial:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Fazer upgrade de plano
export const upgradeePlano = async (req, res) => {
  try {
    const { tipoPlano, metodoPagamento } = req.body;
    const cliente = req.cliente;
    
    // Buscar detalhes do novo plano
    const novoPlano = await PlanoLimitacao.findOne({ tipo: tipoPlano, ativo: true });
    
    if (!novoPlano) {
      return res.status(400).json({
        success: false,
        message: 'Plano não encontrado'
      });
    }
    
    // Verificar se é realmente um upgrade
    const hierarquiaPlanos = {
      'gratis': 1,
      'profissional': 2,
      'enterprise': 3
    };
    
    const planoAtualNivel = hierarquiaPlanos[cliente.plano.tipo] || 1;
    const novoPlanoNivel = hierarquiaPlanos[tipoPlano] || 1;
    
    if (novoPlanoNivel <= planoAtualNivel) {
      return res.status(400).json({
        success: false,
        message: 'Você só pode fazer upgrade para um plano superior'
      });
    }
    
    // Calcular nova data de vencimento (30 dias)
    const novaDataVencimento = new Date();
    novaDataVencimento.setDate(novaDataVencimento.getDate() + 30);
    
    // Atualizar cliente
    await Cliente.findByIdAndUpdate(cliente._id, {
      'plano.tipo': tipoPlano,
      'plano.dataVencimento': novaDataVencimento,
      'plano.ativo': true,
      'plano.trial.ativo': false // Desativar trial se houver
    });
    
    res.json({
      success: true,
      message: `Upgrade para ${novoPlano.nome} realizado com sucesso!`,
      data: {
        planoAnterior: cliente.plano.tipo,
        novoPlano: tipoPlano,
        preco: novoPlano.preco,
        dataVencimento: novaDataVencimento
      }
    });
  } catch (error) {
    console.error('Erro ao fazer upgrade:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Verificar status de limitações
export const verificarLimitacoes = async (req, res) => {
  try {
    const cliente = req.cliente;
    const limitacoes = obterLimitacoesPlano(cliente.plano.tipo);
    
    if (!limitacoes) {
      return res.status(404).json({
        success: false,
        message: 'Limitações do plano não encontradas'
      });
    }
    
    // Calcular uso atual
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);
    
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);
    
    const [pedidosHoje, pedidosNoMes, itensCardapio] = await Promise.all([
      Pedido.countDocuments({
        clienteId: cliente._id,
        createdAt: { $gte: hoje, $lt: amanha }
      }),
      Pedido.countDocuments({
        clienteId: cliente._id,
        createdAt: { $gte: inicioMes }
      }),
      Cardapio.countDocuments({
        clienteId: cliente._id
      })
    ]);
    
    const status = {
      pedidosDia: {
        usado: pedidosHoje,
        limite: limitacoes.pedidosPorDia,
        disponivel: limitacoes.pedidosPorDia > 0 ? limitacoes.pedidosPorDia - pedidosHoje : -1,
        porcentagem: limitacoes.pedidosPorDia > 0 ? Math.round((pedidosHoje / limitacoes.pedidosPorDia) * 100) : 0,
        limiteAtingido: limitacoes.pedidosPorDia > 0 && pedidosHoje >= limitacoes.pedidosPorDia
      },
      pedidosMes: {
        usado: pedidosNoMes,
        limite: limitacoes.pedidosPorMes,
        disponivel: limitacoes.pedidosPorMes > 0 ? limitacoes.pedidosPorMes - pedidosNoMes : -1,
        porcentagem: limitacoes.pedidosPorMes > 0 ? Math.round((pedidosNoMes / limitacoes.pedidosPorMes) * 100) : 0,
        limiteAtingido: limitacoes.pedidosPorMes > 0 && pedidosNoMes >= limitacoes.pedidosPorMes
      },
      cardapio: {
        usado: itensCardapio,
        limite: limitacoes.itensCardapio,
        disponivel: limitacoes.itensCardapio > 0 ? limitacoes.itensCardapio - itensCardapio : -1,
        porcentagem: limitacoes.itensCardapio > 0 ? Math.round((itensCardapio / limitacoes.itensCardapio) * 100) : 0,
        limiteAtingido: limitacoes.itensCardapio > 0 && itensCardapio >= limitacoes.itensCardapio
      }
    };
    
    res.json({
      success: true,
      data: {
        plano: cliente.plano.tipo,
        limitacoes: limitacoes,
        status: status,
        alertas: {
          proximoLimite: Object.values(status).some(item => item.porcentagem >= 80),
          limiteAtingido: Object.values(status).some(item => item.limiteAtingido)
        }
      }
    });
  } catch (error) {
    console.error('Erro ao verificar limitações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};
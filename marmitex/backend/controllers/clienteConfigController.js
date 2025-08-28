import Cardapio from '../models/Cardapio.js';
import Pedido from '../models/Pedido.js';
import Configuracao from '../models/Configuracao.js';
import NumeroPermitido from '../models/NumeroPermitido.js';

// Controlador para gerenciar cardápios do cliente
export const getCardapio = async (req, res) => {
  try {
    const { clienteId } = req.cliente;
    const { data } = req.query;
    
    let query = { clienteId };
    if (data) {
      query.data = data;
    }
    
    const cardapios = await Cardapio.find(query).sort({ data: -1 });
    
    res.json({
      sucesso: true,
      cardapios
    });
  } catch (error) {
    console.error('Erro ao buscar cardápio:', error);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno do servidor'
    });
  }
};

export const criarCardapio = async (req, res) => {
  try {
    const { clienteId } = req.cliente;
    const cardapioData = {
      ...req.body,
      clienteId
    };
    
    const cardapio = new Cardapio(cardapioData);
    await cardapio.save();
    
    res.status(201).json({
      sucesso: true,
      cardapio
    });
  } catch (error) {
    console.error('Erro ao criar cardápio:', error);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno do servidor'
    });
  }
};

export const atualizarCardapio = async (req, res) => {
  try {
    const { clienteId } = req.cliente;
    const { id } = req.params;
    
    const cardapio = await Cardapio.findOneAndUpdate(
      { _id: id, clienteId },
      req.body,
      { new: true }
    );
    
    if (!cardapio) {
      return res.status(404).json({
        sucesso: false,
        erro: 'Cardápio não encontrado'
      });
    }
    
    res.json({
      sucesso: true,
      cardapio
    });
  } catch (error) {
    console.error('Erro ao atualizar cardápio:', error);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno do servidor'
    });
  }
};

export const deletarCardapio = async (req, res) => {
  try {
    const { clienteId } = req.cliente;
    const { id } = req.params;
    
    const cardapio = await Cardapio.findOneAndDelete({ _id: id, clienteId });
    
    if (!cardapio) {
      return res.status(404).json({
        sucesso: false,
        erro: 'Cardápio não encontrado'
      });
    }
    
    res.json({
      sucesso: true,
      mensagem: 'Cardápio deletado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar cardápio:', error);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno do servidor'
    });
  }
};

// Controlador para gerenciar pedidos do cliente
export const getPedidos = async (req, res) => {
  try {
    const { clienteId } = req.cliente;
    const { status, dataInicio, dataFim, telefone, page = 1, limit = 20 } = req.query;
    
    let query = { clienteId };
    
    if (status) query.status = status;
    if (telefone) query.telefone = { $regex: telefone, $options: 'i' };
    
    if (dataInicio || dataFim) {
      query.createdAt = {};
      if (dataInicio) query.createdAt.$gte = new Date(dataInicio);
      if (dataFim) query.createdAt.$lte = new Date(dataFim);
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [pedidos, total] = await Promise.all([
      Pedido.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Pedido.countDocuments(query)
    ]);
    
    res.json({
      sucesso: true,
      pedidos,
      paginacao: {
        total,
        pagina: parseInt(page),
        limite: parseInt(limit),
        totalPaginas: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno do servidor'
    });
  }
};

export const getPedidoPorId = async (req, res) => {
  try {
    const { clienteId } = req.cliente;
    const { id } = req.params;
    
    const pedido = await Pedido.findOne({ _id: id, clienteId });
    
    if (!pedido) {
      return res.status(404).json({
        sucesso: false,
        erro: 'Pedido não encontrado'
      });
    }
    
    res.json({
      sucesso: true,
      pedido
    });
  } catch (error) {
    console.error('Erro ao buscar pedido:', error);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno do servidor'
    });
  }
};

export const atualizarStatusPedido = async (req, res) => {
  try {
    const { clienteId } = req.cliente;
    const { id } = req.params;
    const { status } = req.body;
    
    const pedido = await Pedido.findOneAndUpdate(
      { _id: id, clienteId },
      { status },
      { new: true }
    );
    
    if (!pedido) {
      return res.status(404).json({
        sucesso: false,
        erro: 'Pedido não encontrado'
      });
    }
    
    res.json({
      sucesso: true,
      pedido
    });
  } catch (error) {
    console.error('Erro ao atualizar status do pedido:', error);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno do servidor'
    });
  }
};

// Controlador para gerenciar configurações do cliente
export const getConfiguracoes = async (req, res) => {
  try {
    const { clienteId } = req.cliente;
    
    let configuracao = await Configuracao.findOne({ clienteId });
    
    if (!configuracao) {
      // Criar configuração padrão se não existir
      configuracao = new Configuracao({
        clienteId,
        precoMarmita: 15.00,
        precoBebida: 3.00,
        taxaEntrega: 5.00,
        horarioFuncionamento: {
          segunda: { abre: '11:00', fecha: '14:00', ativo: true },
          terca: { abre: '11:00', fecha: '14:00', ativo: true },
          quarta: { abre: '11:00', fecha: '14:00', ativo: true },
          quinta: { abre: '11:00', fecha: '14:00', ativo: true },
          sexta: { abre: '11:00', fecha: '14:00', ativo: true },
          sabado: { abre: '11:00', fecha: '14:00', ativo: false },
          domingo: { abre: '11:00', fecha: '14:00', ativo: false }
        }
      });
      await configuracao.save();
    }
    
    res.json({
      sucesso: true,
      configuracao
    });
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno do servidor'
    });
  }
};

export const atualizarConfiguracoes = async (req, res) => {
  try {
    const { clienteId } = req.cliente;
    
    const configuracao = await Configuracao.findOneAndUpdate(
      { clienteId },
      req.body,
      { new: true, upsert: true }
    );
    
    res.json({
      sucesso: true,
      configuracao
    });
  } catch (error) {
    console.error('Erro ao atualizar configurações:', error);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno do servidor'
    });
  }
};

// Controlador para gerenciar números permitidos
export const getNumerosPermitidos = async (req, res) => {
  try {
    const { clienteId } = req.cliente;
    
    const numeros = await NumeroPermitido.find({ clienteId });
    
    res.json({
      sucesso: true,
      numeros
    });
  } catch (error) {
    console.error('Erro ao buscar números permitidos:', error);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno do servidor'
    });
  }
};

export const adicionarNumeroPermitido = async (req, res) => {
  try {
    const { clienteId } = req.cliente;
    const { numero } = req.body;
    
    // Verificar se o número já existe para este cliente
    const numeroExistente = await NumeroPermitido.findOne({ clienteId, numero });
    if (numeroExistente) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Número já está na lista de permitidos'
      });
    }
    
    const numeroPermitido = new NumeroPermitido({
      clienteId,
      numero
    });
    
    await numeroPermitido.save();
    
    res.status(201).json({
      sucesso: true,
      numeroPermitido
    });
  } catch (error) {
    console.error('Erro ao adicionar número permitido:', error);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno do servidor'
    });
  }
};

export const removerNumeroPermitido = async (req, res) => {
  try {
    const { clienteId } = req.cliente;
    const { id } = req.params;
    
    const numeroPermitido = await NumeroPermitido.findOneAndDelete({ _id: id, clienteId });
    
    if (!numeroPermitido) {
      return res.status(404).json({
        sucesso: false,
        erro: 'Número não encontrado'
      });
    }
    
    res.json({
      sucesso: true,
      mensagem: 'Número removido com sucesso'
    });
  } catch (error) {
    console.error('Erro ao remover número permitido:', error);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno do servidor'
    });
  }
};

// Controlador para dashboard e estatísticas
export const getDashboardStats = async (req, res) => {
  try {
    const { clienteId } = req.cliente;
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const inicioSemana = new Date(hoje.setDate(hoje.getDate() - hoje.getDay()));
    
    const [pedidosHoje, pedidosSemana, pedidosMes, totalPedidos] = await Promise.all([
      Pedido.countDocuments({
        clienteId,
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }),
      Pedido.countDocuments({
        clienteId,
        createdAt: { $gte: inicioSemana }
      }),
      Pedido.countDocuments({
        clienteId,
        createdAt: { $gte: inicioMes }
      }),
      Pedido.countDocuments({ clienteId })
    ]);
    
    const [receitaHoje, receitaSemana, receitaMes] = await Promise.all([
      Pedido.aggregate([
        {
          $match: {
            clienteId: clienteId,
            statusPagamento: 'pago',
            createdAt: {
              $gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$total' }
          }
        }
      ]),
      Pedido.aggregate([
        {
          $match: {
            clienteId: clienteId,
            statusPagamento: 'pago',
            createdAt: { $gte: inicioSemana }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$total' }
          }
        }
      ]),
      Pedido.aggregate([
        {
          $match: {
            clienteId: clienteId,
            statusPagamento: 'pago',
            createdAt: { $gte: inicioMes }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$total' }
          }
        }
      ])
    ]);
    
    res.json({
      sucesso: true,
      estatisticas: {
        pedidos: {
          hoje: pedidosHoje,
          semana: pedidosSemana,
          mes: pedidosMes,
          total: totalPedidos
        },
        receita: {
          hoje: receitaHoje[0]?.total || 0,
          semana: receitaSemana[0]?.total || 0,
          mes: receitaMes[0]?.total || 0
        }
      }
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas do dashboard:', error);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno do servidor'
    });
  }
};
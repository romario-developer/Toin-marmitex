import Pedido from '../models/Pedido.js';
import Cliente from '../models/Cliente.js';

// Obter estatísticas do dashboard para o cliente
export const getDashboardStats = async (req, res) => {
  try {
    const { clienteId } = req.cliente;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    // Pedidos de hoje
    const pedidosHoje = await Pedido.countDocuments({
      clienteId,
      createdAt: {
        $gte: hoje,
        $lt: amanha
      }
    });

    // Vendas de hoje (soma dos totais dos pedidos confirmados)
    const vendasHojeResult = await Pedido.aggregate([
      {
        $match: {
          clienteId,
          status: { $in: ['confirmado', 'entregue'] },
          createdAt: {
            $gte: hoje,
            $lt: amanha
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$total' }
        }
      }
    ]);
    const vendasHoje = vendasHojeResult[0]?.total || 0;

    // Clientes únicos que fizeram pedidos nos últimos 30 dias
    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
    
    const clientesAtivosResult = await Pedido.aggregate([
      {
        $match: {
          clienteId,
          createdAt: {
            $gte: trintaDiasAtras
          }
        }
      },
      {
        $group: {
          _id: '$telefone'
        }
      },
      {
        $count: 'total'
      }
    ]);
    const clientesAtivos = clientesAtivosResult[0]?.total || 0;

    // Status da conexão WhatsApp
    const cliente = await Cliente.findById(clienteId).select('whatsapp');
    const whatsappStatus = {
      isConnected: cliente?.whatsapp?.isConnected || false,
      numeroPrincipal: cliente?.whatsapp?.numeroPrincipal || null
    };

    // Pedidos pendentes
    const pedidosPendentes = await Pedido.countDocuments({
      clienteId,
      status: 'pendente'
    });

    res.json({
      sucesso: true,
      estatisticas: {
        pedidosHoje,
        vendasHoje,
        clientesAtivos,
        pedidosPendentes,
        whatsappStatus
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

// Obter resumo mensal
export const getResumoMensal = async (req, res) => {
  try {
    const { clienteId } = req.cliente;
    const { mes, ano } = req.query;
    
    const anoAtual = ano ? parseInt(ano) : new Date().getFullYear();
    const mesAtual = mes ? parseInt(mes) - 1 : new Date().getMonth(); // MongoDB usa 0-11 para meses
    
    const inicioMes = new Date(anoAtual, mesAtual, 1);
    const fimMes = new Date(anoAtual, mesAtual + 1, 0, 23, 59, 59, 999);

    // Vendas por dia do mês
    const vendasPorDia = await Pedido.aggregate([
      {
        $match: {
          clienteId,
          status: { $in: ['confirmado', 'entregue'] },
          createdAt: {
            $gte: inicioMes,
            $lte: fimMes
          }
        }
      },
      {
        $group: {
          _id: { $dayOfMonth: '$createdAt' },
          vendas: { $sum: '$total' },
          pedidos: { $sum: 1 }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    // Produtos mais vendidos no mês
    const produtosMaisVendidos = await Pedido.aggregate([
      {
        $match: {
          clienteId,
          status: { $in: ['confirmado', 'entregue'] },
          createdAt: {
            $gte: inicioMes,
            $lte: fimMes
          }
        }
      },
      {
        $unwind: '$itens'
      },
      {
        $group: {
          _id: '$itens.nome',
          quantidade: { $sum: '$itens.quantidade' },
          receita: { $sum: { $multiply: ['$itens.quantidade', '$itens.preco'] } }
        }
      },
      {
        $sort: { quantidade: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Total do mês
    const totalMes = await Pedido.aggregate([
      {
        $match: {
          clienteId,
          status: { $in: ['confirmado', 'entregue'] },
          createdAt: {
            $gte: inicioMes,
            $lte: fimMes
          }
        }
      },
      {
        $group: {
          _id: null,
          totalVendas: { $sum: '$total' },
          totalPedidos: { $sum: 1 }
        }
      }
    ]);

    res.json({
      sucesso: true,
      resumo: {
        mes: mesAtual + 1,
        ano: anoAtual,
        vendasPorDia,
        produtosMaisVendidos,
        totais: totalMes[0] || { totalVendas: 0, totalPedidos: 0 }
      }
    });

  } catch (error) {
    console.error('Erro ao buscar resumo mensal:', error);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno do servidor'
    });
  }
};

// Obter dados para relatórios
export const getRelatorios = async (req, res) => {
  try {
    const { clienteId } = req.cliente;
    const { tipo, dataInicio, dataFim } = req.query;
    
    const inicio = dataInicio ? new Date(dataInicio) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const fim = dataFim ? new Date(dataFim) : new Date();
    fim.setHours(23, 59, 59, 999);

    let relatorio = {};

    switch (tipo) {
      case 'vendas':
        relatorio = await Pedido.aggregate([
          {
            $match: {
              clienteId,
              status: { $in: ['confirmado', 'entregue'] },
              createdAt: {
                $gte: inicio,
                $lte: fim
              }
            }
          },
          {
            $group: {
              _id: {
                ano: { $year: '$createdAt' },
                mes: { $month: '$createdAt' },
                dia: { $dayOfMonth: '$createdAt' }
              },
              vendas: { $sum: '$total' },
              pedidos: { $sum: 1 }
            }
          },
          {
            $sort: { '_id.ano': 1, '_id.mes': 1, '_id.dia': 1 }
          }
        ]);
        break;

      case 'produtos':
        relatorio = await Pedido.aggregate([
          {
            $match: {
              clienteId,
              status: { $in: ['confirmado', 'entregue'] },
              createdAt: {
                $gte: inicio,
                $lte: fim
              }
            }
          },
          {
            $unwind: '$itens'
          },
          {
            $group: {
              _id: '$itens.nome',
              quantidade: { $sum: '$itens.quantidade' },
              receita: { $sum: { $multiply: ['$itens.quantidade', '$itens.preco'] } }
            }
          },
          {
            $sort: { quantidade: -1 }
          }
        ]);
        break;

      case 'clientes':
        relatorio = await Pedido.aggregate([
          {
            $match: {
              clienteId,
              createdAt: {
                $gte: inicio,
                $lte: fim
              }
            }
          },
          {
            $group: {
              _id: '$telefone',
              nome: { $first: '$nomeCliente' },
              totalPedidos: { $sum: 1 },
              totalGasto: {
                $sum: {
                  $cond: [
                    { $in: ['$status', ['confirmado', 'entregue']] },
                    '$total',
                    0
                  ]
                }
              },
              ultimoPedido: { $max: '$createdAt' }
            }
          },
          {
            $sort: { totalGasto: -1 }
          }
        ]);
        break;

      default:
        return res.status(400).json({
          sucesso: false,
          erro: 'Tipo de relatório inválido. Use: vendas, produtos ou clientes'
        });
    }

    res.json({
      sucesso: true,
      tipo,
      periodo: {
        inicio,
        fim
      },
      dados: relatorio
    });

  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno do servidor'
    });
  }
};
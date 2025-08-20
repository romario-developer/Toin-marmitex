// marmitex/backend/controllers/pedidosController.js
import Pedido from '../models/Pedido.js';

export async function listarPedidos(req, res) {
  try {
    const pedidos = await Pedido.find().sort({ createdAt: -1 }).lean();
    res.json({ ok: true, pedidos });
  } catch (err) {
    console.error('Erro ao listar pedidos:', err);
    res.status(500).json({ ok: false, error: 'Erro ao listar pedidos' });
  }
}

export async function criarPedido(req, res) {
  try {
    const pedido = await Pedido.create(req.body);
    
    // Emitir notificação em tempo real para o admin
    if (req.io) {
      req.io.to('admin-room').emit('novo-pedido', {
        pedido,
        timestamp: new Date(),
        message: `Novo pedido recebido de ${pedido.telefone}`
      });
    }
    
    res.status(201).json({ ok: true, pedido });
  } catch (err) {
    console.error('Erro ao criar pedido:', err);
    res.status(400).json({ ok: false, error: 'Dados inválidos' });
  }
}

export async function atualizarStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, statusPagamento } = req.body;
    
    console.log('📝 Atualizando pedido:', { id, status, statusPagamento });
    
    const pedidoAnterior = await Pedido.findById(id);
    if (!pedidoAnterior) return res.status(404).json({ ok: false, error: 'Pedido não encontrado' });
    
    const pedido = await Pedido.findByIdAndUpdate(
      id,
      { ...(status ? { status } : {}), ...(statusPagamento ? { statusPagamento } : {}) },
      { new: true }
    );
    
    // Emitir notificação para admin
    if (req.io) {
      req.io.to('admin-room').emit('status-atualizado', {
        pedido,
        timestamp: new Date(),
        message: `Status do pedido ${pedido.telefone} atualizado para ${status || statusPagamento}`
      });
    }
    
    // 🆕 Notificar cliente via WhatsApp quando status do pedido mudar
    if (status && status !== pedidoAnterior.status) {
      await notificarClienteStatus(pedido, status);
    }
    
    res.json({ ok: true, pedido });
  } catch (err) {
    console.error('Erro ao atualizar pedido:', err);
    console.error('Erro detalhado:', err.message);
    console.error('Stack:', err.stack);
    res.status(400).json({ ok: false, error: 'Erro ao atualizar', details: err.message });
  }
}

// Função para notificar cliente sobre mudança de status
async function notificarClienteStatus(pedido, novoStatus) {
  try {
    const { enviarMensagem } = await import('../services/whatsappBot.js');
    
    let mensagem = '';
    const isDelivery = pedido.tipoEntrega === 'delivery';
    
    switch (novoStatus) {
      case 'pronto':
        if (isDelivery) {
          mensagem = `🚚 *Seu pedido está PRONTO para entrega!*\n\n` +
                    `📋 *Detalhes:*\n` +
                    `• ${pedido.cardapio.tipo} (${pedido.tamanho})\n` +
                    `• ${pedido.bebida}\n` +
                    `• Total: R$ ${pedido.total.toFixed(2)}\n\n` +
                    `🛵 Nosso entregador já está a caminho!\n` +
                    `⏰ Tempo estimado: 15-25 minutos`;
        } else {
          mensagem = `🍽️ *Seu pedido está PRONTO para retirada!*\n\n` +
                    `📋 *Detalhes:*\n` +
                    `• ${pedido.cardapio.tipo} (${pedido.tamanho})\n` +
                    `• ${pedido.bebida}\n` +
                    `• Total: R$ ${pedido.total.toFixed(2)}\n\n` +
                    `✅ Pode vir buscar quando quiser!\n` +
                    `📍 Estamos te esperando!`;
        }
        break;
      case 'entregue':
        if (isDelivery) {
          mensagem = `🎉 *Pedido ENTREGUE com sucesso!*\n\n` +
                    `Obrigado por escolher nossa marmitex! 😊\n\n` +
                    `Esperamos que tenha gostado da refeição.\n` +
                    `Volte sempre! 🙏`;
        } else {
          mensagem = `🎉 *Pedido RETIRADO com sucesso!*\n\n` +
                    `Obrigado por escolher nossa marmitex! 😊\n\n` +
                    `Esperamos que tenha gostado da refeição.\n` +
                    `Volte sempre! 🙏`;
        }
        break;
    }
    
    if (mensagem) {
      await enviarMensagem(pedido.telefone, mensagem);
      console.log(`📱 Notificação enviada para ${pedido.telefone}: ${novoStatus} (${pedido.tipoEntrega})`);
    }
  } catch (error) {
    console.error('❌ Erro ao notificar cliente:', error.message);
  }
}

import express from 'express';
import crypto from 'crypto';
import Pedido from '../models/Pedido.js';
import { verificarStatusPagamento } from '../services/mercadoPagoService.js';
import { enviarMensagemConfirmacao } from '../services/whatsappBot.js';

const router = express.Router();

// Webhook do Mercado Pago
router.post('/mercadopago', async (req, res) => {
  try {
    // Validar assinatura do webhook
    const signature = req.headers['x-signature'];
    const requestId = req.headers['x-request-id'];
    
    const parts = signature.split(',');
    const ts = parts.find(part => part.startsWith('ts=')).split('=')[1];
    const hash = parts.find(part => part.startsWith('v1=')).split('=')[1];
    
    const manifest = `id:${req.body.id};request-id:${requestId};ts:${ts};`;
    const hmac = crypto.createHmac('sha256', process.env.MERCADO_PAGO_WEBHOOK_SECRET);
    hmac.update(manifest);
    const sha = hmac.digest('hex');
    
    if (sha !== hash) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Processar notificação de pagamento
    if (req.body.type === 'payment') {
      const paymentId = req.body.data.id;
      const status = await verificarStatusPagamento(paymentId);
      
      if (status === 'approved') {
        // Buscar pedido pelo mercadoPagoId
        const pedido = await Pedido.findOne({ 
          'pixData.mercadoPagoId': paymentId 
        });
        
        if (pedido && pedido.statusPagamento === 'pendente') {
          // Atualizar status do pagamento
          pedido.statusPagamento = 'pago';
          await pedido.save();
          
          // Enviar confirmação automática via WhatsApp
          await enviarMensagemConfirmacao(pedido.telefone, pedido);
          
          console.log(`✅ Pagamento confirmado automaticamente: ${pedido._id}`);
        }
      }
    }
    
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('❌ Erro no webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
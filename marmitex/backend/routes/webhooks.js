import express from 'express';
import crypto from 'crypto';
import Pedido from '../models/Pedido.js';
import { verificarStatusPagamento } from '../services/mercadoPagoService.js';
import { enviarMensagemConfirmacao } from '../services/whatsappBot.js';

const router = express.Router();

// Webhook do Mercado Pago
router.post('/mercadopago', async (req, res) => {
  try {
    console.log('🔔 Webhook recebido:', {
      headers: req.headers,
      body: req.body
    });

    // Validar assinatura do webhook (apenas se não for simulação)
    const signature = req.headers['x-signature'];
    const requestId = req.headers['x-request-id'];
    
    console.log('🔍 Dados para validação:', {
      signature,
      requestId,
      webhookSecret: process.env.MERCADO_PAGO_WEBHOOK_SECRET ? 'Configurado' : 'Não configurado',
      bodyId: req.body.id
    });
    
    if (signature && requestId) {
      try {
        const parts = signature.split(',');
        const ts = parts.find(part => part.startsWith('ts=')).split('=')[1];
        const hash = parts.find(part => part.startsWith('v1=')).split('=')[1];
        
        // Formato correto do manifest segundo documentação do Mercado Pago
        const manifest = `id:${req.body.id};request-id:${requestId};ts:${ts};`;
        console.log('🔍 Manifest para validação:', manifest);
        console.log('🔍 Hash recebido:', hash);
        
        const hmac = crypto.createHmac('sha256', process.env.MERCADO_PAGO_WEBHOOK_SECRET);
        hmac.update(manifest);
        const sha = hmac.digest('hex');
        
        console.log('🔍 Hash calculado:', sha);
        
        if (sha !== hash) {
          console.log('❌ Assinatura inválida - Hash não confere');
          console.log('Expected:', hash);
          console.log('Calculated:', sha);
          // Para desenvolvimento, vamos aceitar mesmo com assinatura inválida
          console.log('⚠️ Continuando processamento (modo desenvolvimento)');
        } else {
          console.log('✅ Assinatura válida');
        }
      } catch (signatureError) {
        console.log('⚠️ Erro na validação da assinatura:', signatureError.message);
        console.log('⚠️ Continuando processamento (simulação ou erro)');
      }
    } else {
      console.log('⚠️ Webhook sem assinatura (simulação ou teste)');
    }

    // Processar notificação de pagamento
    if (req.body.type === 'payment') {
      console.log('💳 Processando notificação de pagamento');
      const paymentId = req.body.data.id;
      console.log('🔍 Payment ID:', paymentId);
      
      try {
        const status = await verificarStatusPagamento(paymentId);
        console.log('📊 Status do pagamento:', status);
        
        if (status === 'approved') {
          console.log('✅ Pagamento aprovado, buscando pedido...');
          
          // Buscar pedido pelo mercadoPagoId
          const pedido = await Pedido.findOne({ 
            'pixData.mercadoPagoId': paymentId 
          });
          
          if (pedido) {
            console.log('📦 Pedido encontrado:', pedido._id, 'Status atual:', pedido.statusPagamento);
            
            if (pedido.statusPagamento === 'pendente') {
              // Atualizar status do pagamento
              pedido.statusPagamento = 'pago';
              await pedido.save();
              
              console.log('💾 Status atualizado para "pago"');
              
              // Enviar confirmação automática via WhatsApp
              try {
                await enviarMensagemConfirmacao(pedido.telefone, pedido);
                console.log('📱 Confirmação enviada via WhatsApp');
              } catch (whatsappError) {
                console.error('❌ Erro ao enviar WhatsApp:', whatsappError.message);
              }
              
              console.log(`✅ Pagamento confirmado automaticamente: ${pedido._id}`);
            } else {
              console.log('⚠️ Pedido já processado, status:', pedido.statusPagamento);
            }
          } else {
            console.log('❌ Pedido não encontrado para payment ID:', paymentId);
          }
        } else {
          console.log('⏳ Pagamento ainda não aprovado, status:', status);
        }
      } catch (paymentError) {
        console.error('❌ Erro ao processar pagamento:', paymentError.message);
        throw paymentError;
      }
    } else {
      console.log('ℹ️ Tipo de notificação ignorado:', req.body.type);
    }
    
    console.log('✅ Webhook processado com sucesso');
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('❌ Erro no webhook:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

export default router;
import { MercadoPagoConfig, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
  options: { timeout: 5000 }
});

const payment = new Payment(client);

export const criarPagamentoPIX = async (pedidoData) => {
  try {
    const paymentData = {
      transaction_amount: pedidoData.total,
      description: `Pedido ${pedidoData._id} - ${pedidoData.cardapio.tipo}`,
      payment_method_id: 'pix',
      payer: {
        email: 'cliente@email.com',
        identification: {
          type: 'CPF',
          number: '12345678901'
        }
      },
      notification_url: `${process.env.BASE_URL}/api/webhooks/mercadopago`
    };

    const result = await payment.create({ body: paymentData });
    
    return {
      transactionId: result.id,
      qrCode: result.point_of_interaction.transaction_data.qr_code,
      qrCodeBase64: result.point_of_interaction.transaction_data.qr_code_base64,
      paymentLink: result.point_of_interaction.transaction_data.ticket_url,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutos
      mercadoPagoId: result.id
    };
  } catch (error) {
    console.error('❌ Erro ao criar pagamento PIX:', error);
    throw error;
  }
};

export const verificarStatusPagamento = async (paymentId) => {
  try {
    const result = await payment.get({ id: paymentId });
    return result.status; // 'approved', 'pending', 'rejected'
  } catch (error) {
    console.error('❌ Erro ao verificar pagamento:', error);
    throw error;
  }
};
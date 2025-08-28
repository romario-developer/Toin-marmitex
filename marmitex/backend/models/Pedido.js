// marmitex/backend/models/Pedido.js
import mongoose from 'mongoose';

const PedidoSchema = new mongoose.Schema(
  {
    clienteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cliente',
      required: true,
      index: true
    },
    telefone: { type: String, required: true, index: true },
    cardapio: {
      tipo: { type: String, enum: ['CARDÁPIO 1', 'CARDÁPIO 2'], required: true },
      itens: [{ type: String }],
    },
    tamanho: { type: String, enum: ['P', 'M', 'G'], required: true },
    bebida: { type: String, enum: ['Coca Lata', 'Coca 1L', 'Coca 2L', 'Não'], required: true },
    formaPagamento: { type: String, enum: ['Dinheiro', 'PIX', 'Cartão'], required: true },
    total: { type: Number, required: true },
    taxaEntrega: { type: Number, default: 0 },
    statusPagamento: { type: String, enum: ['pendente', 'pago', 'nao_aplicavel'], default: 'nao_aplicavel' },
    status: {
      type: String,
      enum: ['em_preparo', 'pronto', 'entregue', 'finalizado'],
      default: 'em_preparo'
    },
    tipoEntrega: {
      type: String,
      enum: ['retirada', 'delivery'],
      default: 'delivery'
    },
    observacoes: { type: String },
    // 🆕 Novos campos para PIX
    pixData: {
      transactionId: String,
      qrCode: String,
      qrCodeBase64: String,
      paymentLink: String,
      expiresAt: Date,
      mercadoPagoId: String
    }
  },
  { timestamps: true }
);

// Índices compostos para performance e isolamento
PedidoSchema.index({ clienteId: 1, telefone: 1 });
PedidoSchema.index({ clienteId: 1, status: 1 });
PedidoSchema.index({ clienteId: 1, createdAt: -1 });

export default mongoose.model('Pedido', PedidoSchema);

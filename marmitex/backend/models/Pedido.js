// marmitex/backend/models/Pedido.js
import mongoose from 'mongoose';

const PedidoSchema = new mongoose.Schema(
  {
    telefone: { type: String, required: true, index: true },
    cardapio: {
      tipo: { type: String, enum: ['CARDÁPIO 1', 'CARDÁPIO 2'], required: true },
      itens: [{ type: String }], // opcional: descrever os pratos escolhidos
    },
    tamanho: { type: String, enum: ['P', 'M', 'G'], required: true },
    bebida: { type: String, enum: ['Coca Lata', 'Coca 1L', 'Coca 2L', 'Não'], required: true },
    formaPagamento: { type: String, enum: ['Dinheiro', 'PIX', 'Cartão'], required: true },
    total: { type: Number, required: true },
    statusPagamento: { type: String, enum: ['pendente', 'pago', 'nao_aplicavel'], default: 'nao_aplicavel' },
    status: { type: String, enum: ['em_preparo', 'finalizado'], default: 'em_preparo' },
    observacoes: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model('Pedido', PedidoSchema);

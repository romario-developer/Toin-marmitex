import mongoose from 'mongoose';

const pedidoSchema = new mongoose.Schema({
  cliente: {
    numero: String,
    nome: String
  },
  cardapioEscolhido: String,
  tamanho: String,
  bebida: String,
  formaPagamento: String,
  tipoEntrega: { type: String, enum: ['Entrega', 'Retirar'], default: 'Entrega' },
  taxaEntrega: { type: Number, default: 0 },
  total: Number,
  data: { type: Date, default: Date.now }
});

export default mongoose.model('Pedido', pedidoSchema);

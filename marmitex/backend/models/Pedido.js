import mongoose from 'mongoose';

const pedidoSchema = new mongoose.Schema({
  cliente: { nome: String, numero: String },
  cardapioEscolhido: String,
  tamanho: String,
  bebida: String,
  formaPagamento: String,
  tipoEntrega: String,
  taxaEntrega: Number,
  total: Number,
  status: { type: String, enum: ['Em preparo', 'Pronto', 'Entregue'], default: 'Em preparo' },
  data: { type: Date, default: Date.now }
});

export default mongoose.model('Pedido', pedidoSchema);

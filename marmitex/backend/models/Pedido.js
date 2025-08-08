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
  total: Number,
  data: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Pedido', pedidoSchema);
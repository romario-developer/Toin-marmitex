// backend/models/Cardapio.js
import mongoose from 'mongoose';

// descrição + imagem em base64
const itemSchema = new mongoose.Schema(
  {
    descricao: { type: String, default: '' },
    imagem: { type: String, default: '' }, // base64 da imagem
    imagemMimeType: { type: String, default: '' }, // image/jpeg, image/png, etc
    imagemNome: { type: String, default: '' } // nome original do arquivo
  },
  { _id: false }
);

const cardapioSchema = new mongoose.Schema({
  clienteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    required: true,
    index: true
  },
  data: { type: Date, required: true },
  cardapios: [{
    numero: { type: Number, required: true },
    item: itemSchema
  }]
}, {
  timestamps: true
});

// Índice composto para performance e isolamento
cardapioSchema.index({ clienteId: 1, data: 1 });

export default mongoose.model('Cardapio', cardapioSchema);

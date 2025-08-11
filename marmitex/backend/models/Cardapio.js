// backend/models/Cardapio.js
import mongoose from 'mongoose';

// descrição + imagem por cardápio
const itemSchema = new mongoose.Schema(
  {
    descricao: { type: String, default: '' },
    imagem: { type: String, default: '' } // ex.: /uploads/cardapio1-xxx.jpg
  },
  { _id: false }
);

const cardapioSchema = new mongoose.Schema({
  data: { type: Date, required: true },
  cardapio1: itemSchema,
  cardapio2: itemSchema
});

export default mongoose.model('Cardapio', cardapioSchema);

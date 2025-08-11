// backend/models/Cardapio.js
import mongoose from 'mongoose';

// Apenas descrição para cada cardápio
const itemSchema = new mongoose.Schema(
  { descricao: { type: String, default: '' } },
  { _id: false }
);

const cardapioSchema = new mongoose.Schema({
  data: { type: Date, required: true },
  cardapio1: itemSchema,
  cardapio2: itemSchema
});

export default mongoose.model('Cardapio', cardapioSchema);

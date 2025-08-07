// backend/models/Cardapio.js
import mongoose from 'mongoose';

const cardapioSchema = new mongoose.Schema({
  data: { type: Date, required: true, unique: true },
  cardapio1: String,
  cardapio2: String,
  precoP: Number,
  precoM: Number,
  precoG: Number,
  precoCocaLata: Number,
  precoCoca1L: Number,
  precoCoca2L: Number
});

export default mongoose.model('Cardapio', cardapioSchema);

import mongoose from 'mongoose';

const cardapioSchema = new mongoose.Schema({
  data: { type: Date, required: true },
  cardapio1: {
    prato: String,
    acompanhamentos: [String],
  },
  cardapio2: {
    prato: String,
    acompanhamentos: [String],
  }
});

export default mongoose.model('Cardapio', cardapioSchema);

import mongoose from 'mongoose';

const cardapioItemSchema = new mongoose.Schema({
  tipo: String,        // ex: Tradicional, Fit, Executivo
  descricao: String    // ex: Frango grelhado, arroz, feijão, salada...
}, { _id: false });

const cardapioSchema = new mongoose.Schema({
  data: { type: Date, required: true },
  cardapio1: cardapioItemSchema,
  cardapio2: cardapioItemSchema
});

export default mongoose.model('Cardapio', cardapioSchema);

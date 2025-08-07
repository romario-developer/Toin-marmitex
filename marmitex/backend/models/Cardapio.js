import mongoose from 'mongoose';

const cardapioSchema = new mongoose.Schema({
  data: {
    type: String,
    required: true,
  },
  pratos: [
    {
      nome: String,
      descricao: String,
      preco: Number,
      tamanhos: [String], // Ex: ["P", "M", "G"]
    }
  ],
  bebidas: [
    {
      nome: String,
      preco: Number,
    }
  ]
});

export default mongoose.model('Cardapio', cardapioSchema);

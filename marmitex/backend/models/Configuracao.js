import mongoose from 'mongoose';

const configuracaoSchema = new mongoose.Schema({
  precosMarmita: {
    P: Number,
    M: Number,
    G: Number,
  },
  precosBebida: {
    lata: Number,
    umLitro: Number,
    doisLitros: Number,
  }
});

export default mongoose.model('Configuracao', configuracaoSchema);

import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  clienteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    required: true,
    index: true
  },
  numero: { type: String, required: true }
}, {
  timestamps: true
});

// Índice composto para garantir que cada cliente tenha números únicos
schema.index({ clienteId: 1, numero: 1 }, { unique: true });

export default mongoose.model('NumeroPermitido', schema);

import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  numero: { type: String, required: true, unique: true }
});

export default mongoose.model('NumeroPermitido', schema);

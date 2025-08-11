// updateCardapioHoje.mjs
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Cardapio from './models/Cardapio.js';

dotenv.config();

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/marmitex';

// >>> EDITE AQUI AS DESCRIÇÕES <<<
const CARDAPIO_1 = 'Arroz, Feijão, Carne frita';
const CARDAPIO_2 = 'Feijoada, Arroz, Farofa';

function inicioDoDia(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

async function run() {
  try {
    await mongoose.connect(MONGO_URL);
    const hoje = inicioDoDia();
    const amanha = new Date(hoje); amanha.setDate(amanha.getDate() + 1);

    const payload = {
      data: hoje,
      cardapio1: { descricao: CARDAPIO_1 },
      cardapio2: { descricao: CARDAPIO_2 },
    };

    const doc = await Cardapio.findOneAndUpdate(
      { data: { $gte: hoje, $lt: amanha } },
      payload,
      { new: true, upsert: true }
    );

    console.log('✅ Cardápio de hoje atualizado/criado:\n', {
      data: doc.data,
      cardapio1: doc.cardapio1?.descricao,
      cardapio2: doc.cardapio2?.descricao,
    });
  } catch (err) {
    console.error('❌ Erro:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();

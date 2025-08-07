// backend/controllers/cardapioController.js
import Cardapio from '../models/Cardapio.js';

export async function salvarCardapio(req, res) {
  try {
    const novoCardapio = new Cardapio(req.body);
    await novoCardapio.save();
    res.status(201).json({ mensagem: 'Cardápio salvo com sucesso!' });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao salvar o cardápio.' });
  }
}

export async function obterCardapioAtual() {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const cardapio = await Cardapio.findOne({ data: hoje }).lean();
  return cardapio;
}

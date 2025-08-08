// backend/controllers/cardapioController.js
import Cardapio from '../models/Cardapio.js';

export const salvarCardapio = async (req, res) => {
  try {

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const existente = await Cardapio.findOne({ data: hoje });

    if (existente) {
      return res.status(400).json({ erro: 'Já existe um cardápio cadastrado para hoje.' });
    }

    const novoCardapio = new Cardapio(req.body);
    await novoCardapio.save();
    res.status(201).json({ mensagem: 'Cardápio salvo com sucesso!', cardapio: novoCardapio });
  } catch (erro) {
    console.error('Erro ao salvar cardápio:', erro);
    res.status(500).json({ erro: 'Erro ao salvar cardápio.' });
  }
};

export const obterCardapioAtual = async (req, res) => {
  try {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0); // início do dia
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1); // próximo dia

    const cardapio = await Cardapio.findOne({
      data: { $gte: hoje, $lt: amanha }
    });

    if (!cardapio) {
      return res.status(404).json({ mensagem: 'Nenhum cardápio encontrado para hoje.' });
    }

    res.json(cardapio);
  } catch (error) {
    console.error('Erro ao obter cardápio do dia:', error);
    res.status(500).json({ erro: 'Erro ao buscar cardápio do dia.' });
  }
};

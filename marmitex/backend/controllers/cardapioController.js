import Cardapio from '../models/Cardapio.js';

export const criarCardapio = async (req, res) => {
  try {
    const novoCardapio = new Cardapio(req.body);
    const salvo = await novoCardapio.save();
    res.status(201).json(salvo);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao salvar cardápio', detalhes: error });
  }
};

export const obterCardapioDeHoje = async (req, res) => {
  try {
    const hoje = new Date().toISOString().split('T')[0];
    const cardapio = await Cardapio.findOne({ data: hoje });

    if (!cardapio) {
      return res.status(404).json({ mensagem: 'Nenhum cardápio encontrado para hoje' });
    }

    res.json(cardapio);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar cardápio de hoje', detalhes: error });
  }
};

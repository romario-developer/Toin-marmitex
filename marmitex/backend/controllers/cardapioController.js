import Cardapio from '../models/Cardapio.js';

export const salvarCardapio = async (req, res) => {
  try {
    const dataReq = req.body.data ? new Date(req.body.data) : new Date();
    const inicio = new Date(dataReq); inicio.setHours(0,0,0,0);
    const fim = new Date(inicio); fim.setDate(fim.getDate() + 1);

    const existente = await Cardapio.findOne({ data: { $gte: inicio, $lt: fim } });
    if (existente) return res.status(400).json({ erro: 'Já existe um cardápio cadastrado para esta data.' });

    const novoCardapio = new Cardapio({
      data: inicio,
      cardapio1: {
        tipo: req.body.cardapio1?.tipo || '',
        descricao: req.body.cardapio1?.descricao || ''
      },
      cardapio2: {
        tipo: req.body.cardapio2?.tipo || '',
        descricao: req.body.cardapio2?.descricao || ''
      }
    });

    await novoCardapio.save();
    res.status(201).json({ mensagem: 'Cardápio salvo com sucesso!', cardapio: novoCardapio });
  } catch (erro) {
    console.error('Erro ao salvar cardápio:', erro);
    res.status(500).json({ erro: 'Erro ao salvar cardápio.' });
  }
};

export const obterCardapioAtual = async (req, res) => {
  try {
    const hoje = new Date(); hoje.setHours(0,0,0,0);
    const amanha = new Date(hoje); amanha.setDate(amanha.getDate() + 1);

    const cardapio = await Cardapio.findOne({ data: { $gte: hoje, $lt: amanha } });
    if (!cardapio) return res.status(404).json({ mensagem: 'Nenhum cardápio encontrado para hoje.' });

    res.json(cardapio);
  } catch (error) {
    console.error('Erro ao obter cardápio do dia:', error);
    res.status(500).json({ erro: 'Erro ao buscar cardápio do dia.' });
  }
};

// backend/controllers/cardapioController.js
import Cardapio from '../models/Cardapio.js';

// POST /api/cardapios  -> cria para a data selecionada (bloqueia duplicado no mesmo dia)
export const salvarCardapio = async (req, res) => {
  try {
    const dataReq = req.body.data ? new Date(req.body.data) : new Date();
    const inicio = new Date(dataReq);
    inicio.setHours(0, 0, 0, 0);
    const fim = new Date(inicio);
    fim.setDate(fim.getDate() + 1);

    const existente = await Cardapio.findOne({ data: { $gte: inicio, $lt: fim } });
    if (existente) {
      return res.status(400).json({ erro: 'Já existe um cardápio cadastrado para esta data.' });
    }

    const novo = new Cardapio({
      data: inicio,
      cardapio1: { descricao: req.body.cardapio1?.descricao || '' },
      cardapio2: { descricao: req.body.cardapio2?.descricao || '' }
    });

    await novo.save();
    res.status(201).json({ mensagem: 'Cardápio salvo com sucesso!', cardapio: novo });
  } catch (e) {
    console.error('Erro ao salvar cardápio:', e);
    res.status(500).json({ erro: 'Erro ao salvar cardápio.' });
  }
};

// GET /api/cardapios/hoje  -> retorna o cardápio do dia
export const obterCardapioAtual = async (req, res) => {
  try {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    const cardapio = await Cardapio.findOne({ data: { $gte: hoje, $lt: amanha } });
    if (!cardapio) {
      return res.status(404).json({ mensagem: 'Nenhum cardápio encontrado para hoje.' });
    }

    res.json(cardapio);
  } catch (e) {
    console.error('Erro ao buscar cardápio do dia:', e);
    res.status(500).json({ erro: 'Erro ao buscar cardápio do dia.' });
  }
};

// PUT /api/cardapios/hoje  -> atualiza (ou cria) o cardápio de hoje
export const atualizarCardapioDeHoje = async (req, res) => {
  try {
    const hoje = new Date(); hoje.setHours(0,0,0,0);
    const payload = {
      data: hoje,
      cardapio1: { descricao: req.body.cardapio1?.descricao || '' },
      cardapio2: { descricao: req.body.cardapio2?.descricao || '' }
    };

    const doc = await Cardapio.findOneAndUpdate(
      { data: { $gte: hoje, $lt: new Date(hoje.getTime() + 24*60*60*1000) } },
      payload,
      { new: true, upsert: true }
    );

    res.json({ mensagem: 'Cardápio de hoje atualizado com sucesso!', cardapio: doc });
  } catch (e) {
    console.error('Erro ao atualizar cardápio de hoje:', e);
    res.status(500).json({ erro: 'Erro ao atualizar cardápio de hoje.' });
  }
};

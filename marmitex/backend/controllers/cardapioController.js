// backend/controllers/cardapioController.js
import Cardapio from '../models/Cardapio.js';

// POST /api/cardapios  -> cria para a data (bloqueia duplicado no mesmo dia)
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
      cardapio1: {
        descricao: req.body.cardapio1?.descricao || '',
        imagem: req.body.cardapio1?.imagem || ''
      },
      cardapio2: {
        descricao: req.body.cardapio2?.descricao || '',
        imagem: req.body.cardapio2?.imagem || ''
      }
    });

    await novo.save();
    res.status(201).json({ mensagem: 'Cardápio salvo com sucesso!', cardapio: novo });
  } catch (e) {
    console.error('Erro ao salvar cardápio:', e);
    res.status(500).json({ erro: 'Erro ao salvar cardápio.' });
  }
};

// GET /api/cardapios/hoje  -> cardápio do dia
export const obterCardapioAtual = async (_req, res) => {
  try {
    const cardapio = await Cardapio.findOne({
      $expr: {
        $eq: [
          { $dateTrunc: { date: "$data", unit: "day", timezone: "America/Bahia" } },
          { $dateTrunc: { date: "$$NOW", unit: "day", timezone: "America/Bahia" } }
        ]
      }
    });

    if (!cardapio) return res.status(404).json({ mensagem: 'Nenhum cardápio encontrado para hoje.' });
    res.json(cardapio);
  } catch (e) {
    console.error('Erro ao buscar cardápio do dia:', e);
    res.status(500).json({ erro: 'Erro ao buscar cardápio do dia.' });
  }
};

// PUT /api/cardapios/hoje  -> atualiza (ou cria) o cardápio de hoje
export const atualizarCardapioDeHoje = async (req, res) => {
  try {
    const payload = {
      // data pode continuar sendo setada; manteremos coerência
      data: new Date(),
      cardapio1: {
        descricao: req.body.cardapio1?.descricao || '',
        imagem: req.body.cardapio1?.imagem || ''
      },
      cardapio2: {
        descricao: req.body.cardapio2?.descricao || '',
        imagem: req.body.cardapio2?.imagem || ''
      }
    };

    const doc = await Cardapio.findOneAndUpdate(
      {
        $expr: {
          $eq: [
            { $dateTrunc: { date: "$data", unit: "day", timezone: "America/Bahia" } },
            { $dateTrunc: { date: "$$NOW", unit: "day", timezone: "America/Bahia" } }
          ]
        }
      },
      payload,
      { new: true, upsert: true }
    );

    res.json({ mensagem: 'Cardápio de hoje atualizado com sucesso!', cardapio: doc });
  } catch (e) {
    console.error('Erro ao atualizar cardápio de hoje:', e);
    res.status(500).json({ erro: 'Erro ao atualizar cardápio de hoje.' });
  }
};


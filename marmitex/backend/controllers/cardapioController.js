// backend/controllers/cardapioController.js
import Cardapio from '../models/Cardapio.js';

// POST /api/cardapios  -> cria para a data informada (bloqueia duplicado no mesmo dia)
export const salvarCardapio = async (req, res) => {
  try {
    // Corrigir o processamento da data para evitar problemas de timezone
    let dataReq;
    if (req.body.data) {
      // Se a data vier como string "YYYY-MM-DD", criar a data no timezone local
      const [ano, mes, dia] = req.body.data.split('-').map(Number);
      dataReq = new Date(ano, mes - 1, dia); // mes-1 porque Date() usa 0-11 para meses
    } else {
      dataReq = new Date();
    }
    
    const inicio = new Date(dataReq);
    inicio.setHours(0, 0, 0, 0);
    const fim = new Date(inicio); fim.setDate(fim.getDate() + 1);

    const existente = await Cardapio.findOne({ data: { $gte: inicio, $lt: fim } });
    if (existente) {
      return res.status(400).json({ erro: 'Já existe um cardápio cadastrado para esta data.' });
    }

    const novo = await Cardapio.create({
      data: inicio,
      cardapio1: { descricao: req.body.cardapio1?.descricao || '', imagem: req.body.cardapio1?.imagem || '' },
      cardapio2: { descricao: req.body.cardapio2?.descricao || '', imagem: req.body.cardapio2?.imagem || '' }
    });

    res.status(201).json({ mensagem: 'Cardápio salvo com sucesso!', cardapio: novo });
  } catch (e) {
    console.error('Erro ao salvar cardápio:', e);
    res.status(500).json({ erro: 'Erro ao salvar cardápio.' });
  }
};

// GET /api/cardapios/hoje  -> ainda existe para o BOT; se não quiser usar no admin, ignore
export const obterCardapioAtual = async (_req, res) => {
  try {
    // Criar data de hoje no início do dia (00:00:00)
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    // Criar data de amanhã no início do dia
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);
    
    const cardapio = await Cardapio.findOne({
      data: {
        $gte: hoje,
        $lt: amanha
      }
    });
    
    if (!cardapio) return res.status(404).json({ mensagem: 'Nenhum cardápio encontrado para hoje.' });
    res.json(cardapio);
  } catch (e) {
    console.error('Erro ao buscar cardápio do dia:', e);
    res.status(500).json({ erro: 'Erro ao buscar cardápio do dia.' });
  }
};

// PUT /api/cardapios/hoje -> mantém para o BOT; admin não precisa usar
export const atualizarCardapioDeHoje = async (req, res) => {
  try {
    const filtroHojeExpr = {
      $expr: {
        $eq: [
          { $dateTrunc: { date: "$data", unit: "day", timezone: "America/Bahia" } },
          { $dateTrunc: { date: "$$NOW", unit: "day", timezone: "America/Bahia" } }
        ]
      }
    };

    let doc = await Cardapio.findOne(filtroHojeExpr);
    if (doc) {
      doc.cardapio1 = {
        descricao: req.body.cardapio1?.descricao || '',
        imagem: req.body.cardapio1?.imagem || ''
      };
      doc.cardapio2 = {
        descricao: req.body.cardapio2?.descricao || '',
        imagem: req.body.cardapio2?.imagem || ''
      };
      await doc.save();
    } else {
      const hoje = new Date(); hoje.setHours(0,0,0,0);
      doc = await Cardapio.create({
        data: hoje,
        cardapio1: { descricao: req.body.cardapio1?.descricao || '', imagem: req.body.cardapio1?.imagem || '' },
        cardapio2: { descricao: req.body.cardapio2?.descricao || '', imagem: req.body.cardapio2?.imagem || '' }
      });
    }

    res.json({ mensagem: 'Cardápio de hoje atualizado com sucesso!', cardapio: doc });
  } catch (e) {
    console.error('Erro ao atualizar cardápio de hoje:', e);
    res.status(500).json({ erro: 'Erro ao atualizar cardápio de hoje.' });
  }
};

// ====== NOVO: CRUD para lista/edição ======

// GET /api/cardapios  -> lista (ordenado por data desc). ?limit=50 opcional
export const listarCardapios = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const docs = await Cardapio.find().sort({ data: -1 }).limit(limit);
    res.json(docs);
  } catch (e) {
    console.error('Erro ao listar cardápios:', e);
    res.status(500).json({ erro: 'Erro ao listar cardápios.' });
  }
};

// GET /api/cardapios/:id
export const obterCardapioPorId = async (req, res) => {
  try {
    const doc = await Cardapio.findById(req.params.id);
    if (!doc) return res.status(404).json({ erro: 'Não encontrado' });
    res.json(doc);
  } catch (e) {
    res.status(400).json({ erro: 'ID inválido' });
  }
};

// PUT /api/cardapios/:id
export const atualizarCardapioPorId = async (req, res) => {
  try {
    const payload = {
      // Corrigir o processamento da data aqui também
      ...(req.body.data ? { 
        data: (() => { 
          const [ano, mes, dia] = req.body.data.split('-').map(Number);
          const d = new Date(ano, mes - 1, dia);
          d.setHours(0, 0, 0, 0); 
          return d; 
        })()
      } : {}),
      cardapio1: { descricao: req.body.cardapio1?.descricao || '', imagem: req.body.cardapio1?.imagem || '' },
      cardapio2: { descricao: req.body.cardapio2?.descricao || '', imagem: req.body.cardapio2?.imagem || '' }
    };
    const doc = await Cardapio.findByIdAndUpdate(req.params.id, payload, { new: true });
    if (!doc) return res.status(404).json({ erro: 'Não encontrado' });
    res.json({ mensagem: 'Atualizado com sucesso!', cardapio: doc });
  } catch (e) {
    console.error('Erro ao atualizar cardápio:', e);
    res.status(400).json({ erro: 'Erro ao atualizar cardápio.' });
  }
};

// DELETE /api/cardapios/:id
export const deletarCardapioPorId = async (req, res) => {
  try {
    const doc = await Cardapio.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ erro: 'Não encontrado' });
    res.json({ mensagem: 'Excluído com sucesso!' });
  } catch (e) {
    res.status(400).json({ erro: 'Erro ao excluir.' });
  }
};

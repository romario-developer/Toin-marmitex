import express from 'express';
import Configuracao from '../models/Configuracao.js';

const router = express.Router();

// GET /api/configuracoes - obter config atual
router.get('/', async (req, res) => {
  try {
    const config = await Configuracao.findOne();
    if (!config) return res.status(404).json({ erro: 'Nenhuma configuração encontrada.' });
    res.json(config);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar configuração.' });
  }
});

// POST /api/configuracoes - salvar ou atualizar config
router.post('/', async (req, res) => {
  try {
    let config = await Configuracao.findOne();
    if (config) {
      config.precosMarmita = req.body.precosMarmita;
      config.precosBebida = req.body.precosBebida;
    } else {
      config = new Configuracao(req.body);
    }
    await config.save();
    res.json({ mensagem: 'Configuração salva com sucesso.', config });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao salvar configuração.' });
  }
});

export default router;

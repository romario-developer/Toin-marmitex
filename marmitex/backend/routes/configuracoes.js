import express from 'express';
import Configuracao from '../models/Configuracao.js';

const router = express.Router();

// GET /api/configuracoes
router.get('/', async (req, res) => {
  try {
    const config = await Configuracao.findOne();
    if (!config) return res.status(404).json({ erro: 'Nenhuma configuração encontrada.' });
    res.json(config);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar configuração.' });
  }
});

// POST /api/configuracoes
router.post('/', async (req, res) => {
  try {
    let config = await Configuracao.findOne();
    if (config) {
      config.precosMarmita = req.body.precosMarmita;
      config.precosBebida = req.body.precosBebida;
      config.taxaEntrega = req.body.taxaEntrega ?? config.taxaEntrega ?? 3;
    } else {
      config = new Configuracao({
        ...req.body,
        taxaEntrega: req.body.taxaEntrega ?? 3
      });
    }
    await config.save();
    res.json({ mensagem: 'Configuração salva com sucesso.', config });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao salvar configuração.' });
  }
});

export default router;

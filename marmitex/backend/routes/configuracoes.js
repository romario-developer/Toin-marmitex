// backend/routes/configuracoes.js
import express from 'express';
import Configuracao from '../models/Configuracao.js';

const router = express.Router();

// GET /api/configuracoes
router.get('/', async (_req, res) => {
  try {
    let config = await Configuracao.findOne();
    if (!config) {
      // cria defaults
      config = await Configuracao.create({
        precosMarmita: { P: 20, M: 25, G: 30 },
        precosBebida: { lata: 6, umLitro: 10, doisLitros: 14 },
        taxaEntrega: 3,
      });
    }
    res.json(config);
  } catch (err) {
    console.error('GET /configuracoes erro:', err);
    res.status(500).json({ erro: 'Erro ao buscar configuração.' });
  }
});

// POST /api/configuracoes (cria/atualiza)
router.post('/', async (req, res) => {
  try {
    let config = await Configuracao.findOne();
    if (config) {
      config.precosMarmita = {
        P: Number(req.body?.precosMarmita?.P ?? config.precosMarmita.P ?? 20),
        M: Number(req.body?.precosMarmita?.M ?? config.precosMarmita.M ?? 25),
        G: Number(req.body?.precosMarmita?.G ?? config.precosMarmita.G ?? 30),
      };
      config.precosBebida = {
        lata: Number(req.body?.precosBebida?.lata ?? config.precosBebida.lata ?? 6),
        umLitro: Number(req.body?.precosBebida?.umLitro ?? config.precosBebida.umLitro ?? 10),
        doisLitros: Number(req.body?.precosBebida?.doisLitros ?? config.precosBebida.doisLitros ?? 14),
      };
      config.taxaEntrega = Number(req.body?.taxaEntrega ?? config.taxaEntrega ?? 3);
    } else {
      config = new Configuracao({
        precosMarmita: {
          P: Number(req.body?.precosMarmita?.P ?? 20),
          M: Number(req.body?.precosMarmita?.M ?? 25),
          G: Number(req.body?.precosMarmita?.G ?? 30),
        },
        precosBebida: {
          lata: Number(req.body?.precosBebida?.lata ?? 6),
          umLitro: Number(req.body?.precosBebida?.umLitro ?? 10),
          doisLitros: Number(req.body?.precosBebida?.doisLitros ?? 14),
        },
        taxaEntrega: Number(req.body?.taxaEntrega ?? 3),
      });
    }
    await config.save();
    res.json({ mensagem: 'Configuração salva com sucesso.', config });
  } catch (err) {
    console.error('POST /configuracoes erro:', err);
    res.status(500).json({ erro: 'Erro ao salvar configuração.' });
  }
});

export default router;

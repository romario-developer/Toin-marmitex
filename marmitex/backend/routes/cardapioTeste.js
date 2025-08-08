// backend/routes/cardapioTeste.js
import express from 'express';
import Cardapio from '../models/Cardapio.js';

const router = express.Router();

router.get('/criar-teste', async (req, res) => {
  try {
    const novoCardapio = new Cardapio({
      data: new Date(),
      cardapio1: {
        prato: 'Frango grelhado',
        acompanhamentos: ['Arroz', 'Feijão', 'Salada']
      },
      cardapio2: {
        prato: 'Carne de panela',
        acompanhamentos: ['Arroz', 'Farofa', 'Batata']
      }
    });

    await novoCardapio.save();
    res.status(201).json({ mensagem: 'Cardápio de teste criado com sucesso!' });
  } catch (error) {
    console.error('Erro ao criar cardápio de teste:', error);
    res.status(500).json({ erro: 'Erro ao criar cardápio de teste' });
  }
});

export default router;
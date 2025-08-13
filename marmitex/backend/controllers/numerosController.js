import Numero from '../models/NumeroPermitido.js';

export async function listar(req, res) {
  const numeros = await Numero.find();
  res.json(numeros);
}

export async function adicionar(req, res) {
  const { numero } = req.body;
  if (!numero) return res.status(400).json({ erro: 'Número obrigatório' });

  const novo = new Numero({ numero });
  await novo.save();
  res.json(novo);
}

export async function remover(req, res) {
  const { id } = req.params;
  await Numero.findByIdAndDelete(id);
  res.json({ sucesso: true });
}

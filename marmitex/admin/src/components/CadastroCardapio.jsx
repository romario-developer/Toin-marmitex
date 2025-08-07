// frontend/src/components/CadastroCardapio.jsx
import { useState } from 'react';
import axios from 'axios';

export default function CadastroCardapio() {
  const [formulario, setFormulario] = useState({
    data: '',
    cardapio1: '',
    cardapio2: '',
    precoP: '',
    precoM: '',
    precoG: '',
    precoCocaLata: '',
    precoCoca1L: '',
    precoCoca2L: ''
  });

  function atualizarCampo(e) {
    const { name, value } = e.target;
    setFormulario({ ...formulario, [name]: value });
  }

  async function enviar(e) {
  e.preventDefault();
  try {
    const cardapio = {
      ...formulario,
      precoP: parseFloat(formulario.precoP),
      precoM: parseFloat(formulario.precoM),
      precoG: parseFloat(formulario.precoG),
      precoCocaLata: parseFloat(formulario.precoCocaLata),
      precoCoca1L: parseFloat(formulario.precoCoca1L),
      precoCoca2L: parseFloat(formulario.precoCoca2L),
    };

    await axios.post(`${import.meta.env.VITE_API_URL}/api/cardapios`, cardapio);
    alert('Cardápio salvo com sucesso!');
  } catch (error) {
    alert('Erro ao salvar cardápio.');
  }
}


  return (
    <form onSubmit={enviar} className="max-w-xl mx-auto p-4 bg-white shadow rounded space-y-4">
      <h2 className="text-xl font-bold">Cadastro de Cardápio</h2>

      <input type="date" name="data" value={formulario.data} onChange={atualizarCampo} required className="w-full border p-2 rounded" />

      <textarea name="cardapio1" value={formulario.cardapio1} onChange={atualizarCampo} placeholder="Cardápio 1" className="w-full border p-2 rounded" required />
      <textarea name="cardapio2" value={formulario.cardapio2} onChange={atualizarCampo} placeholder="Cardápio 2" className="w-full border p-2 rounded" required />

      <div className="grid grid-cols-3 gap-2">
        <input name="precoP" value={formulario.precoP} onChange={atualizarCampo} placeholder="Preço P" type="number" step="0.01" className="border p-2 rounded" required />
        <input name="precoM" value={formulario.precoM} onChange={atualizarCampo} placeholder="Preço M" type="number" step="0.01" className="border p-2 rounded" required />
        <input name="precoG" value={formulario.precoG} onChange={atualizarCampo} placeholder="Preço G" type="number" step="0.01" className="border p-2 rounded" required />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <input name="precoCocaLata" value={formulario.precoCocaLata} onChange={atualizarCampo} placeholder="Coca Lata" type="number" step="0.01" className="border p-2 rounded" required />
        <input name="precoCoca1L" value={formulario.precoCoca1L} onChange={atualizarCampo} placeholder="Coca 1L" type="number" step="0.01" className="border p-2 rounded" required />
        <input name="precoCoca2L" value={formulario.precoCoca2L} onChange={atualizarCampo} placeholder="Coca 2L" type="number" step="0.01" className="border p-2 rounded" required />
      </div>

      <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Salvar Cardápio</button>
    </form>
  );
}

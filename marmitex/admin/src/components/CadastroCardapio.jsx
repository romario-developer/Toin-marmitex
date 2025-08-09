import { useState } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function CadastroCardapio() {
  const [data, setData] = useState(() => new Date().toISOString().substring(0, 10));
  const [card1Prato, setCard1Prato] = useState('');
  const [card1Acomp, setCard1Acomp] = useState('');
  const [card2Prato, setCard2Prato] = useState('');
  const [card2Acomp, setCard2Acomp] = useState('');
  const [msg, setMsg] = useState('');

  async function salvar(e) {
    e.preventDefault();
    setMsg('');
    try {
      const payload = {
        data, // yyyy-mm-dd
        cardapio1: {
          prato: card1Prato,
          acompanhamentos: card1Acomp.split(',').map(s => s.trim()).filter(Boolean)
        },
        cardapio2: {
          prato: card2Prato,
          acompanhamentos: card2Acomp.split(',').map(s => s.trim()).filter(Boolean)
        }
      };
      await axios.post(`${API}/api/cardapios`, payload);
      setMsg('✅ Cardápio salvo com sucesso!');
      setCard1Prato(''); setCard1Acomp(''); setCard2Prato(''); setCard2Acomp('');
    } catch (err) {
      setMsg('❌ Erro ao salvar cardápio.');
      console.error(err);
    }
  }

  return (
    <form onSubmit={salvar} className="bg-white p-4 rounded shadow max-w-3xl mx-auto">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Data</label>
          <input
            type="date"
            className="w-full border rounded px-3 py-2"
            value={data}
            onChange={e => setData(e.target.value)}
            required
          />
        </div>
      </div>

      <h2 className="mt-4 font-semibold">Cardápio 1</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Prato</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={card1Prato}
            onChange={e => setCard1Prato(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Acompanhamentos (separe por vírgula)</label>
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="Arroz, Feijão, Salada"
            value={card1Acomp}
            onChange={e => setCard1Acomp(e.target.value)}
            required
          />
        </div>
      </div>

      <h2 className="mt-4 font-semibold">Cardápio 2</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Prato</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={card2Prato}
            onChange={e => setCard2Prato(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Acompanhamentos (separe por vírgula)</label>
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="Arroz, Farofa, Batata"
            value={card2Acomp}
            onChange={e => setCard2Acomp(e.target.value)}
            required
          />
        </div>
      </div>

      <button className="mt-4 bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700">
        Salvar Cardápio
      </button>

      {msg && <p className="mt-3">{msg}</p>}
    </form>
  );
}

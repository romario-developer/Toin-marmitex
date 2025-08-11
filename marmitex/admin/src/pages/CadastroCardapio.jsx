import { useState } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function CadastroCardapio() {
  const [data, setData] = useState(() => new Date().toISOString().substring(0, 10));
  const [c1Desc, setC1Desc] = useState('');
  const [c2Desc, setC2Desc] = useState('');
  const [msg, setMsg] = useState('');

  async function salvar(e) {
    e.preventDefault();
    setMsg('');
    try {
      await axios.post(`${API}/api/cardapios`, {
        data,
        cardapio1: { descricao: c1Desc },
        cardapio2: { descricao: c2Desc }
      });
      setMsg('✅ Cardápio salvo!');
      setC1Desc(''); setC2Desc('');
    } catch {
      setMsg('❌ Erro ao salvar cardápio.');
    }
  }

  return (
    <form onSubmit={salvar} className="bg-white p-4 rounded shadow max-w-3xl mx-auto">
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

      <h2 className="mt-4 font-semibold">Cardápio 1</h2>
      <textarea
        className="w-full border rounded px-3 py-2"
        placeholder="Ex.: Feijão, Arroz, Carne frita"
        rows={3}
        value={c1Desc}
        onChange={e => setC1Desc(e.target.value)}
        required
      />

      <h2 className="mt-4 font-semibold">Cardápio 2</h2>
      <textarea
        className="w-full border rounded px-3 py-2"
        placeholder="Ex.: Feijoada, Arroz, Farofa, Carne assada"
        rows={3}
        value={c2Desc}
        onChange={e => setC2Desc(e.target.value)}
        required
      />

      <button className="mt-4 bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700">
        Salvar Cardápio
      </button>

      {msg && <p className="mt-3">{msg}</p>}
    </form>
  );
}

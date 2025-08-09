import { useState } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function CadastroCardapio() {
  const [data, setData] = useState(() => new Date().toISOString().substring(0, 10));
  const [c1Tipo, setC1Tipo] = useState('');
  const [c1Desc, setC1Desc] = useState('');
  const [c2Tipo, setC2Tipo] = useState('');
  const [c2Desc, setC2Desc] = useState('');
  const [msg, setMsg] = useState('');

  async function salvar(e) {
    e.preventDefault();
    setMsg('');
    try {
      const payload = {
        data,
        cardapio1: { tipo: c1Tipo, descricao: c1Desc },
        cardapio2: { tipo: c2Tipo, descricao: c2Desc }
      };
      await axios.post(`${API}/api/cardapios`, payload);
      setMsg('✅ Cardápio salvo com sucesso!');
      setC1Tipo(''); setC1Desc(''); setC2Tipo(''); setC2Desc('');
    } catch (err) {
      console.error(err);
      setMsg('❌ Erro ao salvar cardápio.');
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
          <label className="block text-sm font-medium mb-1">Tipo</label>
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="Ex.: Tradicional, Fit, Executivo"
            value={c1Tipo}
            onChange={e => setC1Tipo(e.target.value)}
            required
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Descrição</label>
          <textarea
            className="w-full border rounded px-3 py-2"
            placeholder="Ex.: Frango grelhado, arroz, feijão, salada"
            rows={3}
            value={c1Desc}
            onChange={e => setC1Desc(e.target.value)}
            required
          />
        </div>
      </div>

      <h2 className="mt-4 font-semibold">Cardápio 2</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Tipo</label>
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="Ex.: Tradicional, Fit, Executivo"
            value={c2Tipo}
            onChange={e => setC2Tipo(e.target.value)}
            required
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Descrição</label>
          <textarea
            className="w-full border rounded px-3 py-2"
            placeholder="Ex.: Carne de panela, arroz, farofa, batata"
            rows={3}
            value={c2Desc}
            onChange={e => setC2Desc(e.target.value)}
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

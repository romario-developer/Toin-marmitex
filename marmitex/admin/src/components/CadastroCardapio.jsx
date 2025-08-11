import { useEffect, useState } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function CadastroCardapio() {
  const [data, setData] = useState(() => new Date().toISOString().substring(0, 10));
  const [c1Desc, setC1Desc] = useState('');
  const [c2Desc, setC2Desc] = useState('');
  const [msg, setMsg] = useState('');
  const [isHoje, setIsHoje] = useState(true);
  const [editingHoje, setEditingHoje] = useState(false);

  useEffect(() => { carregarHoje(); }, []);
  useEffect(() => {
    const hojeStr = new Date().toISOString().substring(0, 10);
    setIsHoje(data === hojeStr);
  }, [data]);

  async function carregarHoje() {
    try {
      const { data: d } = await axios.get(`${API}/api/cardapios/hoje`);
      setData(new Date(d.data).toISOString().substring(0, 10));
      setC1Desc(d.cardapio1?.descricao || '');
      setC2Desc(d.cardapio2?.descricao || '');
      setEditingHoje(true);
      setMsg('ℹ️ Carregado cardápio de hoje.');
    } catch {
      setEditingHoje(false);
      setMsg('');
    }
  }

  async function salvar(e) {
    e.preventDefault();
    setMsg('');
    const payload = {
      data,
      cardapio1: { descricao: c1Desc },
      cardapio2: { descricao: c2Desc }
    };

    try {
      if (isHoje && editingHoje) {
        await axios.put(`${API}/api/cardapios/hoje`, payload);
        setMsg('✅ Cardápio de hoje atualizado com sucesso!');
      } else if (isHoje && !editingHoje) {
        await axios.post(`${API}/api/cardapios`, payload);
        setEditingHoje(true);
        setMsg('✅ Cardápio de hoje salvo com sucesso!');
      } else {
        await axios.post(`${API}/api/cardapios`, payload);
        setMsg('✅ Cardápio salvo com sucesso!');
      }
      window.dispatchEvent(new CustomEvent('cardapio-atualizado'));
    } catch {
      setMsg('❌ Erro ao salvar/atualizar cardápio.');
    }
  }

  return (
    <form onSubmit={salvar} className="bg-white p-3 sm:p-4 rounded shadow max-w-3xl mx-auto">
      <h1 className="text-xl sm:text-2xl font-bold mb-2 text-center">Cadastro de Cardápio</h1>
      {msg && <p className="mb-3 text-sm">{msg}</p>}

      <div className="mb-3">
        <label className="block text-sm font-medium mb-1">Data</label>
        <input
          type="date"
          className="w-full border rounded px-3 py-2"
          value={data}
          onChange={e => setData(e.target.value)}
          required
        />
        {isHoje && editingHoje && (
          <p className="text-xs text-emerald-700 mt-1">Editando o cardápio de hoje.</p>
        )}
      </div>

      <h2 className="mt-2 font-semibold">Cardápio 1</h2>
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

      <button className="mt-4 bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 w-full sm:w-auto">
        {isHoje ? (editingHoje ? 'Atualizar Cardápio de Hoje' : 'Salvar Cardápio de Hoje') : 'Salvar Cardápio'}
      </button>
    </form>
  );
}

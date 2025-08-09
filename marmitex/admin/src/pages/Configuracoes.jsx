import { useEffect, useState } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Configuracoes() {
  const [precos, setPrecos] = useState({
    precosMarmita: { P: '', M: '', G: '' },
    precosBebida: { lata: '', umLitro: '', doisLitros: '' },
    taxaEntrega: 3
  });

  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState('');

  useEffect(() => {
    async function carregar() {
      try {
        const res = await axios.get(`${API}/api/configuracoes`);
        setPrecos({
          precosMarmita: res.data.precosMarmita || { P: '', M: '', G: '' },
          precosBebida: res.data.precosBebida || { lata: '', umLitro: '', doisLitros: '' },
          taxaEntrega: res.data.taxaEntrega ?? 3
        });
      } catch {
        console.log('Configuração ainda não criada.');
      }
    }
    carregar();
  }, []);

  async function salvar() {
    setSalvando(true);
    setMensagem('');
    try {
      await axios.post(`${API}/api/configuracoes`, precos);
      setMensagem('✅ Configuração salva com sucesso!');
    } catch {
      setMensagem('❌ Erro ao salvar configuração.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">⚙️ Configuração de Preços</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">🍱 Marmitas</h2>
          {['P', 'M', 'G'].map((tamanho) => (
            <div key={tamanho} className="mb-2">
              <label className="block font-medium">Tamanho {tamanho}</label>
              <input
                type="number"
                className="w-full border px-3 py-1 rounded"
                value={precos.precosMarmita[tamanho]}
                onChange={(e) =>
                  setPrecos((prev) => ({
                    ...prev,
                    precosMarmita: { ...prev.precosMarmita, [tamanho]: Number(e.target.value) }
                  }))
                }
              />
            </div>
          ))}
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">🥤 Bebidas</h2>
          <div className="mb-2">
            <label className="block font-medium">Coca Lata</label>
            <input
              type="number"
              className="w-full border px-3 py-1 rounded"
              value={precos.precosBebida.lata}
              onChange={(e) =>
                setPrecos((prev) => ({
                  ...prev,
                  precosBebida: { ...prev.precosBebida, lata: Number(e.target.value) }
                }))
              }
            />
          </div>
          <div className="mb-2">
            <label className="block font-medium">Coca 1L</label>
            <input
              type="number"
              className="w-full border px-3 py-1 rounded"
              value={precos.precosBebida.umLitro}
              onChange={(e) =>
                setPrecos((prev) => ({
                  ...prev,
                  precosBebida: { ...prev.precosBebida, umLitro: Number(e.target.value) }
                }))
              }
            />
          </div>
          <div className="mb-2">
            <label className="block font-medium">Coca 2L</label>
            <input
              type="number"
              className="w-full border px-3 py-1 rounded"
              value={precos.precosBebida.doisLitros}
              onChange={(e) =>
                setPrecos((prev) => ({
                  ...prev,
                  precosBebida: { ...prev.precosBebida, doisLitros: Number(e.target.value) }
                }))
              }
            />
          </div>
        </div>
      </div>

      <div className="mt-6 max-w-md">
        <h2 className="text-lg font-semibold mb-2">🚚 Taxa de Entrega</h2>
        <input
          type="number"
          className="w-full border px-3 py-2 rounded"
          value={precos.taxaEntrega}
          onChange={(e) => setPrecos((prev) => ({ ...prev, taxaEntrega: Number(e.target.value) }))}
        />
        <p className="text-sm text-gray-600 mt-1">Valor fixo cobrado quando o cliente escolhe entrega.</p>
      </div>

      <button
        onClick={salvar}
        disabled={salvando}
        className="mt-6 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
      >
        {salvando ? 'Salvando...' : 'Salvar Configuração'}
      </button>

      {mensagem && <p className="mt-4 font-medium">{mensagem}</p>}
    </div>
  );
}

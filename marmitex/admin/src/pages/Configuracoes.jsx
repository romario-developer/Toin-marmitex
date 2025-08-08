import { useEffect, useState } from 'react';
import axios from 'axios';

export default function Configuracoes() {
  const [precos, setPrecos] = useState({
    precosMarmita: { P: '', M: '', G: '' },
    precosBebida: { lata: '', umLitro: '', doisLitros: '' }
  });

  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState('');

  useEffect(() => {
    async function carregar() {
      try {
        const res = await axios.get('http://localhost:5000/api/configuracoes');
        setPrecos(res.data);
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
      await axios.post('http://localhost:5000/api/configuracoes', precos);
      setMensagem('✅ Configuração salva com sucesso!');
    } catch (err) {
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
                    precosMarmita: { ...prev.precosMarmita, [tamanho]: e.target.value }
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
                  precosBebida: { ...prev.precosBebida, lata: e.target.value }
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
                  precosBebida: { ...prev.precosBebida, umLitro: e.target.value }
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
                  precosBebida: { ...prev.precosBebida, doisLitros: e.target.value }
                }))
              }
            />
          </div>
        </div>
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

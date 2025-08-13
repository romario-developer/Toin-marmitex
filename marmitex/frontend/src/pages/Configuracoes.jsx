import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const formatBRL = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
    .format(Number.isFinite(v) ? v : 0);

const parseToNumber = (s) => {
  const cents = String(s ?? '').replace(/[^\d]/g, '');
  return (Number(cents) || 0) / 100;
};

function CurrencyField({ label, value, onChange }) {
  const handleChange = (e) => onChange(parseToNumber(e.target.value));
  return (
    <div className="flex items-center justify-between gap-2 mb-2">
      <label className="text-sm">{label}</label>
      <input
        inputMode="numeric"
        pattern="[0-9]*"
        className="w-24 sm:w-32 border rounded px-2 py-1 text-sm text-right"
        value={formatBRL(value)}
        onChange={handleChange}
        placeholder="R$ 0,00"
      />
    </div>
  );
}

export default function Configuracoes() {
  const [precos, setPrecos] = useState({
    precosMarmita: { P: 0, M: 0, G: 0 },
    precosBebida: { lata: 0, umLitro: 0, doisLitros: 0 },
    taxaEntrega: 3
  });
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/api/configuracoes`);
      setPrecos({
        precosMarmita: {
          P: Number(data?.precosMarmita?.P ?? 0),
          M: Number(data?.precosMarmita?.M ?? 0),
          G: Number(data?.precosMarmita?.G ?? 0),
        },
        precosBebida: {
          lata: Number(data?.precosBebida?.lata ?? 0),
          umLitro: Number(data?.precosBebida?.umLitro ?? 0),
          doisLitros: Number(data?.precosBebida?.doisLitros ?? 0),
        },
        taxaEntrega: Number(data?.taxaEntrega ?? 3)
      });
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  async function salvar() {
    setSalvando(true);
    setMsg('');
    try {
      await axios.post(`${API}/api/configuracoes`, precos);
      setMsg('✅ Configurações salvas!');
    } catch {
      setMsg('❌ Erro ao salvar.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="p-3 sm:p-6 max-w-3xl mx-auto">
      <h1 className="text-xl sm:text-2xl font-bold mb-4">⚙️ Configurações de Preços</h1>

      <div className="bg-white rounded shadow p-3 sm:p-4 mb-4">
        <h2 className="font-semibold mb-3">🍱 Marmitas</h2>
        <CurrencyField
          label="Tamanho P"
          value={precos.precosMarmita.P}
          onChange={(v) => setPrecos(p => ({ ...p, precosMarmita: { ...p.precosMarmita, P: v } }))}
        />
        <CurrencyField
          label="Tamanho M"
          value={precos.precosMarmita.M}
          onChange={(v) => setPrecos(p => ({ ...p, precosMarmita: { ...p.precosMarmita, M: v } }))}
        />
        <CurrencyField
          label="Tamanho G"
          value={precos.precosMarmita.G}
          onChange={(v) => setPrecos(p => ({ ...p, precosMarmita: { ...p.precosMarmita, G: v } }))}
        />
      </div>

      <div className="bg-white rounded shadow p-3 sm:p-4 mb-4">
        <h2 className="font-semibold mb-3">🥤 Bebidas</h2>
        <CurrencyField
          label="Coca Lata"
          value={precos.precosBebida.lata}
          onChange={(v) => setPrecos(p => ({ ...p, precosBebida: { ...p.precosBebida, lata: v } }))}
        />
        <CurrencyField
          label="Coca 1L"
          value={precos.precosBebida.umLitro}
          onChange={(v) => setPrecos(p => ({ ...p, precosBebida: { ...p.precosBebida, umLitro: v } }))}
        />
        <CurrencyField
          label="Coca 2L"
          value={precos.precosBebida.doisLitros}
          onChange={(v) => setPrecos(p => ({ ...p, precosBebida: { ...p.precosBebida, doisLitros: v } }))}
        />
      </div>

      <div className="bg-white rounded shadow p-3 sm:p-4 mb-2">
        <h2 className="font-semibold mb-3">🚚 Entrega</h2>
        <CurrencyField
          label="Taxa de entrega"
          value={precos.taxaEntrega}
          onChange={(v) => setPrecos(p => ({ ...p, taxaEntrega: v }))}
        />
        <p className="text-xs text-gray-500 mt-1">Valor fixo somado ao total quando o cliente escolhe entrega.</p>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={salvar}
          disabled={salvando}
          className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700"
        >
          {salvando ? 'Salvando...' : 'Salvar'}
        </button>
        {msg && <span className="text-sm">{msg}</span>}
      </div>
    </div>
  );
}

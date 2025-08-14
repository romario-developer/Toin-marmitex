import { useEffect, useState, useCallback } from 'react';
import api from "../services/api";

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
      const { data } = await api.get('/api/configuracoes');
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
      await api.post('/api/configuracoes', precos);
      setMsg('✅ Configurações salvas!');
    } catch {
      setMsg('❌ Erro ao salvar.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="p-3 sm:p-6 max-w-3xl mx-auto">
      {/* ...restante igual ao seu... */}
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

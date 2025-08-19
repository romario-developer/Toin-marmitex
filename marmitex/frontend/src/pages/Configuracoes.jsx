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
    } catch (err) {
      console.error('Erro ao carregar configurações:', err);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function salvar() {
    setSalvando(true);
    setMsg('');
    try {
      await api.post('/api/configuracoes', precos);
      setMsg('✅ Configurações salvas!');
    } catch (err) {
      console.error('Erro ao salvar:', err);
      setMsg('❌ Erro ao salvar.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="p-3 sm:p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Configurações</h1>
      
      {/* Preços das Marmitas */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Preços das Marmitas</h2>
        <CurrencyField
          label="Marmita P"
          value={precos.precosMarmita.P}
          onChange={(v) => setPrecos(prev => ({
            ...prev,
            precosMarmita: { ...prev.precosMarmita, P: v }
          }))}
        />
        <CurrencyField
          label="Marmita M"
          value={precos.precosMarmita.M}
          onChange={(v) => setPrecos(prev => ({
            ...prev,
            precosMarmita: { ...prev.precosMarmita, M: v }
          }))}
        />
        <CurrencyField
          label="Marmita G"
          value={precos.precosMarmita.G}
          onChange={(v) => setPrecos(prev => ({
            ...prev,
            precosMarmita: { ...prev.precosMarmita, G: v }
          }))}
        />
      </div>

      {/* Preços das Bebidas */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Preços das Bebidas</h2>
        <CurrencyField
          label="Coca Lata"
          value={precos.precosBebida.lata}
          onChange={(v) => setPrecos(prev => ({
            ...prev,
            precosBebida: { ...prev.precosBebida, lata: v }
          }))}
        />
        <CurrencyField
          label="Coca 1L"
          value={precos.precosBebida.umLitro}
          onChange={(v) => setPrecos(prev => ({
            ...prev,
            precosBebida: { ...prev.precosBebida, umLitro: v }
          }))}
        />
        <CurrencyField
          label="Coca 2L"
          value={precos.precosBebida.doisLitros}
          onChange={(v) => setPrecos(prev => ({
            ...prev,
            precosBebida: { ...prev.precosBebida, doisLitros: v }
          }))}
        />
      </div>

      {/* Taxa de Entrega */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Taxa de Entrega</h2>
        <CurrencyField
          label="Taxa de Entrega"
          value={precos.taxaEntrega}
          onChange={(v) => setPrecos(prev => ({ ...prev, taxaEntrega: v }))}
        />
      </div>

      {/* Botão Salvar */}
      <div className="flex items-center gap-3">
        <button
          onClick={salvar}
          disabled={salvando}
          className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {salvando ? 'Salvando...' : 'Salvar Configurações'}
        </button>
        {msg && <span className="text-sm">{msg}</span>}
      </div>
    </div>
  );
}

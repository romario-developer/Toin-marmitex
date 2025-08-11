import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [auto, setAuto] = useState(true);

  async function carregarPedidos() {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/pedidos`);
      setPedidos(res.data || []);
    } catch (err) {
      console.error('Erro ao carregar pedidos:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { carregarPedidos(); }, []);
  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => carregarPedidos(), 5000);
    return () => clearInterval(id);
  }, [auto]);

  const totalHoje = useMemo(() => {
    const hoje = new Date(); hoje.setHours(0,0,0,0);
    return pedidos
      .filter(p => new Date(p.data) >= hoje)
      .reduce((acc, p) => acc + Number(p.total || 0), 0);
  }, [pedidos]);

  const moeda = (n) => `R$ ${Number(n || 0)},00`;

  return (
    <div className="p-3 sm:p-6">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h1 className="text-xl sm:text-2xl font-bold">📦 Pedidos Recebidos</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs sm:text-sm bg-emerald-50 text-emerald-700 px-2 sm:px-3 py-1 rounded">
            Total de hoje: <strong>{moeda(totalHoje)}</strong>
          </span>
          <label className="text-xs sm:text-sm flex items-center gap-2">
            <input type="checkbox" checked={auto} onChange={e => setAuto(e.target.checked)} />
            Auto‑atualizar
          </label>
          <button
            onClick={carregarPedidos}
            className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 text-sm"
            disabled={loading}
          >
            {loading ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>
      </div>

      {pedidos.length === 0 ? (
        <p className="text-gray-500">Nenhum pedido encontrado.</p>
      ) : (
        <>
          {/* Cards no mobile */}
          <div className="grid gap-3 md:hidden">
            {pedidos.map((p) => (
              <div key={p._id} className="bg-white rounded-lg shadow p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{p.cliente?.nome || 'Cliente'}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(p.data).toLocaleDateString('pt-BR')} •{' '}
                    {new Date(p.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div className="text-xs text-gray-600">{p.cliente?.numero}</div>

                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-500">Cardápio:</span> {p.cardapioEscolhido}</div>
                  <div><span className="text-gray-500">Tamanho:</span> {p.tamanho}</div>
                  <div><span className="text-gray-500">Bebida:</span> {p.bebida}</div>
                  <div><span className="text-gray-500">Pagamento:</span> {p.formaPagamento}</div>
                  <div><span className="text-gray-500">Entrega:</span> {p.tipoEntrega || '-'}</div>
                  <div><span className="text-gray-500">Taxa:</span> {moeda(p.taxaEntrega)}</div>
                </div>

                <div className="mt-2 text-right font-semibold">{moeda(p.total)}</div>
              </div>
            ))}
          </div>

          {/* Tabela no md+ */}
          <div className="overflow-x-auto border rounded-lg hidden md:block">
            <table className="min-w-full divide-y divide-gray-200 bg-white">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium">Cliente</th>
                  <th className="px-4 py-2 text-left text-sm font-medium">Número</th>
                  <th className="px-4 py-2 text-left text-sm font-medium">Cardápio</th>
                  <th className="px-4 py-2 text-left text-sm font-medium">Tamanho</th>
                  <th className="px-4 py-2 text-left text-sm font-medium">Bebida</th>
                  <th className="px-4 py-2 text-left text-sm font-medium">Entrega</th>
                  <th className="px-4 py-2 text-left text-sm font-medium">Taxa</th>
                  <th className="px-4 py-2 text-left text-sm font-medium">Pagamento</th>
                  <th className="px-4 py-2 text-left text-sm font-medium">Total</th>
                  <th className="px-4 py-2 text-left text-sm font-medium">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pedidos.map((p) => (
                  <tr key={p._id}>
                    <td className="px-4 py-2 text-sm">{p.cliente?.nome || '-'}</td>
                    <td className="px-4 py-2 text-sm">{p.cliente?.numero}</td>
                    <td className="px-4 py-2 text-sm">{p.cardapioEscolhido}</td>
                    <td className="px-4 py-2 text-sm">{p.tamanho}</td>
                    <td className="px-4 py-2 text-sm">{p.bebida}</td>
                    <td className="px-4 py-2 text-sm">{p.tipoEntrega || '-'}</td>
                    <td className="px-4 py-2 text-sm">{moeda(p.taxaEntrega)}</td>
                    <td className="px-4 py-2 text-sm">{p.formaPagamento}</td>
                    <td className="px-4 py-2 text-sm">{moeda(p.total)}</td>
                    <td className="px-4 py-2 text-sm">
                      {new Date(p.data).toLocaleDateString('pt-BR')}<br />
                      {new Date(p.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

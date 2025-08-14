import { useEffect, useMemo, useState } from 'react';
import { apiGetPedidos, apiPatchPedido } from '../services/api';
import StatusBadge from '../components/StatusBadge';

function formatBRL(v) {
  try { return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
  catch { return `R$ ${Number(v || 0).toFixed(2)}`; }
}
function formatDate(d) {
  try { return new Date(d).toLocaleString('pt-BR'); } catch { return d; }
}

export default function Pedidos() {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [pedidos, setPedidos] = useState([]);
  const [busca, setBusca] = useState('');
  const [somentePendentes, setSomentePendentes] = useState(false);

  const filtered = useMemo(() => {
    return pedidos.filter((p) => {
      if (somentePendentes && p.statusPagamento !== 'pendente') return false;
      if (!busca) return true;
      const q = busca.toLowerCase();
      const campos = [p.telefone, p?.cardapio?.tipo, p?.tamanho, p?.bebida, p?.formaPagamento];
      return campos.some((c) => String(c || '').toLowerCase().includes(q));
    });
  }, [pedidos, busca, somentePendentes]);

  async function carregar() {
    setErro(''); setLoading(true);
    try {
      const data = await apiGetPedidos();
      setPedidos(Array.isArray(data?.pedidos) ? data.pedidos : []);
    } catch (e) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { carregar(); }, []);

  async function marcarComoPago(id) {
    try {
      await apiPatchPedido(id, { statusPagamento: 'pago' });
      setPedidos((prev) => prev.map((p) => (p._id === id ? { ...p, statusPagamento: 'pago' } : p)));
      alert('Pagamento marcado como PAGO.');
    } catch (e) { alert('Falha ao marcar como pago: ' + e.message); }
  }
  async function finalizarPedido(id) {
    try {
      await apiPatchPedido(id, { status: 'finalizado' });
      setPedidos((prev) => prev.map((p) => (p._id === id ? { ...p, status: 'finalizado' } : p)));
      alert('Pedido marcado como FINALIZADO.');
    } catch (e) { alert('Falha ao finalizar: ' + e.message); }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Pedidos</h1>
        <button className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200" onClick={carregar} disabled={loading}>
          {loading ? 'Atualizando…' : 'Atualizar'}
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-3 mb-4">
        <input className="w-full border rounded-lg px-3 py-2" placeholder="Buscar por telefone, cardápio, pagamento…"
          value={busca} onChange={(e) => setBusca(e.target.value)} />
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" className="w-4 h-4" checked={somentePendentes}
            onChange={(e) => setSomentePendentes(e.target.checked)} />
          Mostrar apenas pagamentos pendentes
        </label>
      </div>

      {erro && <div className="mb-4 p-3 rounded bg-red-50 text-red-700 border border-red-200">Erro: {erro}</div>}

      <div className="overflow-auto border rounded-xl">
        <table className="min-w-[900px] w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="px-3 py-2">Data</th>
              <th className="px-3 py-2">Telefone</th>
              <th className="px-3 py-2">Cardápio</th>
              <th className="px-3 py-2">Tam.</th>
              <th className="px-3 py-2">Bebida</th>
              <th className="px-3 py-2">Total</th>
              <th className="px-3 py-2">Pagamento</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p._id} className="border-t">
                <td className="px-3 py-2 whitespace-nowrap">{formatDate(p.createdAt)}</td>
                <td className="px-3 py-2">{p.telefone}</td>
                <td className="px-3 py-2">{p?.cardapio?.tipo}</td>
                <td className="px-3 py-2">{p.tamanho}</td>
                <td className="px-3 py-2">{p.bebida}</td>
                <td className="px-3 py-2 whitespace-nowrap">{formatBRL(p.total)}</td>
                <td className="px-3 py-2"><StatusBadge type="pagamento" value={p.statusPagamento} /></td>
                <td className="px-3 py-2"><StatusBadge type="pedido" value={p.status} /></td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    {p.statusPagamento === 'pendente' && (
                      <button className="px-3 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                        onClick={() => marcarComoPago(p._id)}>Marcar Pago</button>
                    )}
                    {p.status !== 'finalizado' && (
                      <button className="px-3 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                        onClick={() => finalizarPedido(p._id)}>Finalizar</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="px-3 py-6 text-center text-gray-500">Nenhum pedido encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

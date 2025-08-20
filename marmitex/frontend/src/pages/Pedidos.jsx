import { useEffect, useMemo, useState } from 'react';
import { apiGetPedidos, apiPatchPedido } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { useNotifications } from '../hooks/useNotifications';

function formatBRL(v) {
  try { return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
  catch { return `R$ ${Number(v || 0).toFixed(2)}`; }
}
function formatDate(d) {
  try { return new Date(d).toLocaleString('pt-BR'); } catch { return d; }
}

export default function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  
  // Função para marcar pedido como pronto (envia notificação)
  const marcarComoPronto = async (pedidoId) => {
    try {
      await apiPatchPedido(pedidoId, { status: 'pronto' });
      setPedidos(prev => prev.map(p => 
        p._id === pedidoId ? { ...p, status: 'pronto' } : p
      ));
    } catch (error) {
      console.error('Erro ao marcar como pronto:', error);
      alert('Erro ao marcar como pronto: ' + error.message);
    }
  };

  // Função para marcar pedido como entregue (finaliza automaticamente)
  const marcarComoEntregue = async (pedidoId) => {
    try {
      await apiPatchPedido(pedidoId, { status: 'entregue' });
      setPedidos(prev => prev.map(p => 
        p._id === pedidoId ? { ...p, status: 'entregue' } : p
      ));
    } catch (error) {
      console.error('Erro ao marcar como entregue:', error);
      alert('Erro ao marcar como entregue: ' + error.message);
    }
  };
  const [erro, setErro] = useState('');
  const [busca, setBusca] = useState('');
  const [somentePendentes, setSomentePendentes] = useState(false);
  
  // Conectar ao sistema de notificações
  const { notifications } = useNotifications();
  
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
  
  // Escutar notificações de novos pedidos
  useEffect(() => {
    const novoPedidoNotification = notifications.find(n => 
      n.type === 'novo-pedido' && !n.processed
    );
    
    if (novoPedidoNotification) {
      // Adicionar o novo pedido à lista em tempo real
      setPedidos(prev => [novoPedidoNotification.pedido, ...prev]);
      // Marcar como processado para evitar duplicatas
      novoPedidoNotification.processed = true;
    }
  }, [notifications]);

  async function marcarComoPago(id) {
    try {
      await apiPatchPedido(id, { statusPagamento: 'pago' });
      setPedidos((prev) => prev.map((p) => (p._id === id ? { ...p, statusPagamento: 'pago' } : p)));
    } catch (e) { 
      alert('Falha ao marcar como pago: ' + e.message); 
    }
  }
  
  // Remover completamente a função atualizarStatusPedido e finalizarPedido
  // async function finalizarPedido(id) { ... }

  async function atualizarStatusPedido(id, novoStatus) {
    try {
      await apiPatchPedido(id, { status: novoStatus });
      setPedidos((prev) => prev.map((p) => (p._id === id ? { ...p, status: novoStatus } : p)));
      
      // Removido o alert de confirmação
    } catch (e) { 
      alert('Falha ao atualizar status: ' + e.message); 
    }
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

      {/* Layout Desktop - Tabela */}
      <div className="hidden lg:block overflow-auto border rounded-xl">
        <table className="w-full text-sm">
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
                <td className="px-3 py-2"><StatusBadge type="formaPagamento" value={p.formaPagamento} /></td>
                <td className="px-3 py-2"><StatusBadge type="pedido" value={p.status} /></td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    {p.statusPagamento === 'pendente' && (
                      <button className="px-3 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                        onClick={() => marcarComoPago(p._id)}>Marcar Pago</button>
                    )}
                    {p.status === 'em_preparo' && (
                      <button className="px-3 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                        onClick={() => marcarComoPronto(p._id)}>Marcar Pronto</button>
                    )}
                    {p.status === 'pronto' && (
                      <button className="px-3 py-1 rounded-lg bg-green-600 text-white hover:bg-green-700"
                        onClick={() => marcarComoEntregue(p._id)}>Marcar Entregue</button>
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

      {/* Layout Mobile - Cards */}
      <div className="lg:hidden space-y-4">
        {filtered.map((p) => (
          <div key={p._id} className="bg-white border rounded-lg p-4 shadow-sm">
            {/* Header do Card */}
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="text-sm font-medium text-gray-900">{p?.cardapio?.tipo}</div>
                <div className="text-xs text-gray-500">{formatDate(p.createdAt)}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-gray-900">{formatBRL(p.total)}</div>
                <StatusBadge type="pedido" value={p.status} />
              </div>
            </div>

            {/* Detalhes do Pedido */}
            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
              <div>
                <span className="text-gray-500">Tamanho:</span>
                <span className="ml-1 font-medium">{p.tamanho}</span>
              </div>
              <div>
                <span className="text-gray-500">Bebida:</span>
                <span className="ml-1 font-medium">{p.bebida}</span>
              </div>
              <div>
                <span className="text-gray-500">Pagamento:</span>
                <span className="ml-1"><StatusBadge type="formaPagamento" value={p.formaPagamento} /></span>
              </div>
              {p.statusPagamento === 'pendente' && (
                <div>
                  <span className="text-gray-500">Status Pag:</span>
                  <span className="ml-1"><StatusBadge type="pagamento" value={p.statusPagamento} /></span>
                </div>
              )}
            </div>

            {/* Ações */}
            <div className="flex gap-2 flex-wrap">
              {p.statusPagamento === 'pendente' && (
                <button className="flex-1 px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-sm"
                  onClick={() => marcarComoPago(p._id)}>Marcar Pago</button>
              )}
              {p.status === 'em_preparo' && (
                <button className="flex-1 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm"
                  onClick={() => marcarComoPronto(p._id)}>Marcar Pronto</button>
              )}
              {p.status === 'pronto' && (
                <button className="flex-1 px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 text-sm"
                  onClick={() => marcarComoEntregue(p._id)}>Marcar Entregue</button>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-8 text-gray-500">Nenhum pedido encontrado.</div>
        )}
      </div>
    </div>
  );
}

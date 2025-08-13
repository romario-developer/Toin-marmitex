import { useEffect, useState } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Pedidos() {
  const [pedidos, setPedidos] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API}/api/pedidos`);
        setPedidos(res.data);
      } catch (err) {
        console.error('Erro ao carregar pedidos:', err);
      }
    })();
  }, []);

  return (
    <div className="p-3 sm:p-6 max-w-6xl mx-auto">
      <h1 className="text-xl sm:text-2xl font-bold mb-4">📦 Pedidos Recebidos</h1>

      {/* Mobile: cards */}
      <div className="sm:hidden space-y-3">
        {pedidos.length === 0 && <p className="text-gray-500">Nenhum pedido encontrado.</p>}
        {pedidos.map((p) => (
          <div key={p._id} className="rounded border bg-white p-3 text-sm">
            <div className="font-semibold">{p.cliente?.nome || '-'}</div>
            <div className="text-xs text-gray-600">{p.cliente?.numero}</div>
            <div className="mt-2">🍱 {p.cardapioEscolhido} • 📏 {p.tamanho}</div>
            <div>🥤 {p.bebida} • 💳 {p.formaPagamento}</div>
            <div className="mt-1">💰 R$ {p.total},00</div>
            <div className="text-xs text-gray-500 mt-1">
              {new Date(p.data).toLocaleDateString('pt-BR')} {new Date(p.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: tabela */}
      <div className="hidden sm:block overflow-x-auto border rounded-lg">
        {pedidos.length === 0 ? (
          <p className="text-gray-500 p-3">Nenhum pedido encontrado.</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 bg-white">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium">Cliente</th>
                <th className="px-4 py-2 text-left text-sm font-medium">Número</th>
                <th className="px-4 py-2 text-left text-sm font-medium">Cardápio</th>
                <th className="px-4 py-2 text-left text-sm font-medium">Tamanho</th>
                <th className="px-4 py-2 text-left text-sm font-medium">Bebida</th>
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
                  <td className="px-4 py-2 text-sm">{p.formaPagamento}</td>
                  <td className="px-4 py-2 text-sm">R$ {p.total},00</td>
                  <td className="px-4 py-2 text-sm">
                    {new Date(p.data).toLocaleDateString('pt-BR')}<br />
                    {new Date(p.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

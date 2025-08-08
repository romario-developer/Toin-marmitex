import { useEffect, useState } from 'react';
import axios from 'axios';

export default function Pedidos() {
  const [pedidos, setPedidos] = useState([]);

  useEffect(() => {
    async function carregarPedidos() {
      try {
        const res = await axios.get('http://localhost:5000/api/pedidos');
        setPedidos(res.data);
      } catch (err) {
        console.error('Erro ao carregar pedidos:', err);
      }
    }
    carregarPedidos();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">📦 Pedidos Recebidos</h1>

      {pedidos.length === 0 ? (
        <p className="text-gray-500">Nenhum pedido encontrado.</p>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
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
              {pedidos.map((pedido) => (
                <tr key={pedido._id}>
                  <td className="px-4 py-2 text-sm">{pedido.cliente?.nome || '-'}</td>
                  <td className="px-4 py-2 text-sm">{pedido.cliente?.numero}</td>
                  <td className="px-4 py-2 text-sm">{pedido.cardapioEscolhido}</td>
                  <td className="px-4 py-2 text-sm">{pedido.tamanho}</td>
                  <td className="px-4 py-2 text-sm">{pedido.bebida}</td>
                  <td className="px-4 py-2 text-sm">{pedido.formaPagamento}</td>
                  <td className="px-4 py-2 text-sm">R$ {pedido.total},00</td>
                  <td className="px-4 py-2 text-sm">
                    {new Date(pedido.data).toLocaleDateString('pt-BR')}<br />
                    {new Date(pedido.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

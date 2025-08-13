import { useEffect, useState } from 'react';
import axios from 'axios';

export default function NumerosPermitidos() {
  const [numeros, setNumeros] = useState([]);
  const [novoNumero, setNovoNumero] = useState('');

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    const res = await axios.get('/api/numeros');
    setNumeros(res.data);
  }

  async function adicionar() {
    if (!novoNumero) return;
    await axios.post('/api/numeros', { numero: novoNumero });
    setNovoNumero('');
    carregar();
  }

  async function remover(id) {
    await axios.delete(`/api/numeros/${id}`);
    carregar();
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">Números Permitidos</h2>
      <div className="flex gap-2 mb-4">
        <input
          value={novoNumero}
          onChange={(e) => setNovoNumero(e.target.value)}
          placeholder="Ex: 557399999999"
          className="border px-2 py-1 rounded w-full"
        />
        <button onClick={adicionar} className="bg-green-500 text-white px-4 rounded">
          Adicionar
        </button>
      </div>

      <ul className="space-y-2">
        {numeros.map((n) => (
          <li key={n._id} className="flex justify-between items-center bg-gray-100 px-3 py-2 rounded">
            <span>{n.numero}</span>
            <button onClick={() => remover(n._id)} className="text-red-600">Remover</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

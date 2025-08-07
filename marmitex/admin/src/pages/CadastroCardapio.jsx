import React, { useState } from 'react';
import axios from 'axios';
import PratoForm from '../components/PratoForm';
import BebidaForm from '../components/BebidaForm';

const CadastroCardapio = () => {
  const [data, setData] = useState('');
  const [pratos, setPratos] = useState([]);
  const [bebidas, setBebidas] = useState([]);

  const adicionarPrato = (prato) => {
    setPratos([...pratos, prato]);
  };

  const adicionarBebida = (bebida) => {
    setBebidas([...bebidas, bebida]);
  };

  const salvar = async () => {
    if (!data) return alert('Informe a data do cardápio');
    try {
      await axios.post('/api/cardapios', {
        data,
        pratos,
        bebidas
      });
      alert('Cardápio salvo com sucesso!');
      setData('');
      setPratos([]);
      setBebidas([]);
    } catch (err) {
      alert('Erro ao salvar cardápio.');
    }
  };

  return (
    <div className="space-y-6">
      <label className="block">
        <span className="text-gray-700">Data (YYYY-MM-DD):</span>
        <input
          type="date"
          value={data}
          onChange={(e) => setData(e.target.value)}
          className="mt-1 block w-full border p-2"
        />
      </label>

      <PratoForm onAdd={adicionarPrato} />
      <BebidaForm onAdd={adicionarBebida} />

      <button onClick={salvar} className="bg-green-600 text-white px-6 py-2 rounded">
        Salvar Cardápio
      </button>
    </div>
  );
};

export default CadastroCardapio;

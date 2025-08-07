import React, { useState } from 'react';

const BebidaForm = ({ onAdd }) => {
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');

  const adicionar = () => {
    if (!nome || !preco) return;
    onAdd({ nome, preco: Number(preco) });
    setNome('');
    setPreco('');
  };

  return (
    <div className="p-4 border rounded bg-gray-50">
      <h2 className="font-semibold mb-2">Adicionar Bebida</h2>
      <input className="border p-2 w-full mb-2" placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} />
      <input className="border p-2 w-full mb-2" placeholder="Preço" type="number" value={preco} onChange={(e) => setPreco(e.target.value)} />

      <button onClick={adicionar} className="bg-purple-500 text-white px-4 py-1 rounded">
        Adicionar Bebida
      </button>
    </div>
  );
};

export default BebidaForm;

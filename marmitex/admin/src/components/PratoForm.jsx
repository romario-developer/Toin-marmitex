import React, { useState } from 'react';

const PratoForm = ({ onAdd }) => {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [preco, setPreco] = useState('');
  const [tamanhos, setTamanhos] = useState([]);

  const toggleTamanho = (t) => {
    setTamanhos((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const adicionar = () => {
    if (!nome || !preco) return;
    onAdd({ nome, descricao, preco: Number(preco), tamanhos });
    setNome('');
    setDescricao('');
    setPreco('');
    setTamanhos([]);
  };

  return (
    <div className="p-4 border rounded bg-gray-50">
      <h2 className="font-semibold mb-2">Adicionar Prato</h2>
      <input className="border p-2 w-full mb-2" placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} />
      <input className="border p-2 w-full mb-2" placeholder="Descrição" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
      <input className="border p-2 w-full mb-2" placeholder="Preço" type="number" value={preco} onChange={(e) => setPreco(e.target.value)} />

      <div className="mb-2">
        <label className="mr-2"><input type="checkbox" checked={tamanhos.includes('P')} onChange={() => toggleTamanho('P')} /> P</label>
        <label className="mr-2"><input type="checkbox" checked={tamanhos.includes('M')} onChange={() => toggleTamanho('M')} /> M</label>
        <label><input type="checkbox" checked={tamanhos.includes('G')} onChange={() => toggleTamanho('G')} /> G</label>
      </div>

      <button onClick={adicionar} className="bg-blue-500 text-white px-4 py-1 rounded">
        Adicionar Prato
      </button>
    </div>
  );
};

export default PratoForm;

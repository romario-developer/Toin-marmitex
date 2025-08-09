import { useEffect, useRef, useState } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function SimuladorWhatsApp() {
  const [from, setFrom] = useState('5599999999999');
  const [body, setBody] = useState('');
  const [mensagens, setMensagens] = useState([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const scrollRef = useRef(null);

  async function enviar() {
    if (!body.trim()) return;
    await axios.post(`${API}/api/simular`, { from, body });
    setBody('');
    await carregar();
  }

  async function carregar() {
    const res = await axios.get(`${API}/api/simular/conversa/${from}`);
    setMensagens(res.data.mensagens || []);
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: 999999, behavior: 'smooth' });
    }, 50);
  }

  async function resetar() {
    await axios.post(`${API}/api/simular/reset`, { from });
    await carregar();
  }

  useEffect(() => {
    carregar();
  }, [from]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => carregar(), 1000);
    return () => clearInterval(id);
  }, [autoRefresh, from]);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">💬 Simulador de Conversa (WhatsApp - Teste)</h1>

      <div className="flex gap-2 mb-3 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Número (from)</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={from}
            onChange={e => setFrom(e.target.value)}
          />
        </div>
        <button
          onClick={resetar}
          className="h-10 px-4 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Limpar conversa
        </button>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={e => setAutoRefresh(e.target.checked)}
          />
          Auto atualizar
        </label>
      </div>

      <div
        ref={scrollRef}
        className="bg-[#e5ddd5] rounded-lg p-3 h-[60vh] overflow-y-auto border"
      >
        {mensagens.length === 0 && (
          <div className="text-center text-sm text-gray-600">Sem mensagens. Envie "oi" para iniciar.</div>
        )}

        {mensagens.map((m, i) => (
          <div key={i} className={`w-full my-2 flex ${m.who === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 text-sm shadow
              ${m.who === 'user' ? 'bg-[#dcf8c6]' : 'bg-white'}`}
            >
              <div className="whitespace-pre-wrap">{m.text}</div>
              <div className="text-[10px] text-gray-500 text-right mt-1">
                {new Date(m.at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          className="flex-1 border rounded px-3 py-2"
          placeholder="Digite sua mensagem..."
          value={body}
          onChange={e => setBody(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && enviar()}
        />
        <button
          onClick={enviar}
          className="px-4 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Enviar
        </button>
      </div>

      {/* Atalhos úteis */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {['oi', '1', '2', 'P', 'M', 'G', 'sim', 'não', '1', '2', '3', '1', '2', '3'].map((t, i) => (
          <button
            key={i}
            onClick={() => setBody(t)}
            className="border rounded px-3 py-2 text-sm hover:bg-gray-100"
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}

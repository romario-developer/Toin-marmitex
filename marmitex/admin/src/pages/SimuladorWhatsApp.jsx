import { useEffect, useRef, useState } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function SimuladorWhatsApp() {
  const [from, setFrom] = useState('5599999999999');
  const [body, setBody] = useState('');
  const [mensagens, setMensagens] = useState([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const scrollRef = useRef(null);

  async function enviar(msg = null) {
    const text = (msg ?? body).trim();
    if (!text) return;
    await axios.post(`${API}/api/simular`, { from, body: text });
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

  const Atalho = ({ label, send }) => (
    <button
      onClick={() => enviar(send)}
      className="border rounded px-3 py-2 text-sm hover:bg-gray-100"
      title={`Enviar: ${send}`}
    >
      {label}
    </button>
  );

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
          onClick={() => enviar()}
          className="px-4 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Enviar
        </button>
      </div>

      {/* Atalhos por etapa */}
      <div className="mt-5 grid gap-3">
        <div>
          <h3 className="text-sm font-semibold mb-2">Início / Cardápio</h3>
          <div className="flex flex-wrap gap-2">
            <Atalho label="oi" send="oi" />
            <Atalho label="Cardápio 1" send="1" />
            <Atalho label="Cardápio 2" send="2" />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-2">Tamanho</h3>
          <div className="flex flex-wrap gap-2">
            <Atalho label="P" send="P" />
            <Atalho label="M" send="M" />
            <Atalho label="G" send="G" />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-2">Bebida</h3>
          <div className="flex flex-wrap gap-2">
            <Atalho label="Sim" send="sim" />
            <Atalho label="Não" send="não" />
            <Atalho label="Coca Lata (1)" send="1" />
            <Atalho label="Coca 1L (2)" send="2" />
            <Atalho label="Coca 2L (3)" send="3" />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-2">Entrega</h3>
          <div className="flex flex-wrap gap-2">
            <Atalho label="Entrega (+taxa) [1]" send="1" />
            <Atalho label="Retirar no local [2]" send="2" />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-2">Pagamento</h3>
          <div className="flex flex-wrap gap-2">
            <Atalho label="Dinheiro (1)" send="1" />
            <Atalho label="PIX (2)" send="2" />
            <Atalho label="Cartão (3)" send="3" />
          </div>
        </div>
      </div>
    </div>
  );
}

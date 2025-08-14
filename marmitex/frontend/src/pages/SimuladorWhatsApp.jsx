import { useEffect, useRef, useState } from 'react';
import api from "../services/api";

export default function SimuladorWhatsApp() {
  const [from, setFrom] = useState('5599999999999');
  const [body, setBody] = useState('');
  const [mensagens, setMensagens] = useState([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const scrollRef = useRef(null);

  const BASE = api.defaults.baseURL?.replace(/\/$/, '') || '';
  const fullUrl = (rel) => (rel?.startsWith('/uploads') ? `${BASE}${rel}` : rel);

  async function enviar(msg = null) {
    const text = (msg ?? body).trim();
    if (!text) return;
    await api.post('/api/simular', { from, body: text });
    setBody('');
    await carregar();
  }

  async function carregar() {
    const res = await api.get(`/api/simular/conversa/${from}`);
    setMensagens(res.data.mensagens || []);
    setTimeout(() => scrollRef.current?.scrollTo({ top: 999999, behavior: 'smooth' }), 50);
  }

  async function resetar() {
    await api.post('/api/simular/reset', { from });
    await carregar();
    await mostrarCardapioHoje();
  }

  async function mostrarCardapioHoje() {
    try {
      const { data } = await api.get('/api/cardapios/hoje');
      const c1 = data.cardapio1?.descricao || '';
      const c2 = data.cardapio2?.descricao || '';
      const i1 = data.cardapio1?.imagem || '';
      const i2 = data.cardapio2?.imagem || '';

      const texto =
        'Olá! Seja bem-vindo ao marmitex!\n\n' +
        'Digite o numero da opção desejada:\n' +
        `1. CARDÁPIO 1 : ${c1}\n` +
        `2. CARDÁPIO 2. ${c2}`;

      setMensagens(prev => [
        ...prev,
        { who: 'bot', text: texto, at: Date.now() },
        ...(i1 ? [{ who: 'bot', text: `1. CARDÁPIO 1 : ${c1}`, image: i1, at: Date.now() }] : []),
        ...(i2 ? [{ who: 'bot', text: `2. CARDÁPIO 2. ${c2}`, image: i2, at: Date.now() }] : []),
      ]);

      setTimeout(() => scrollRef.current?.scrollTo({ top: 999999, behavior: 'smooth' }), 50);
    } catch {
      setMensagens(prev => [...prev, { who: 'bot', text: 'Nenhum cardápio encontrado para hoje.', at: Date.now() }]);
    }
  }

  useEffect(() => { (async () => { await carregar(); await mostrarCardapioHoje(); })(); }, [from]);

  useEffect(() => {
    const handler = () => mostrarCardapioHoje();
    window.addEventListener('cardapio-atualizado', handler);
    return () => window.removeEventListener('cardapio-atualizado', handler);
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => carregar(), 1000);
    return () => clearInterval(id);
  }, [autoRefresh, from]);

  // ...resto da UI igual ao seu...
}

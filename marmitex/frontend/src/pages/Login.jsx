// admin/src/pages/Login.jsx
import { useState } from 'react';
import { api } from '../api';

export default function Login({ onSuccess }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [msg, setMsg] = useState('');

  async function entrar(e) {
    e.preventDefault();
    setMsg('');
    try {
      const { data } = await api.post('/api/auth/login', { email, senha });
      localStorage.setItem('adm_token', data.token);
      localStorage.setItem('adm_email', data.email);
      onSuccess?.();
    } catch (e) {
      setMsg('❌ Login inválido');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <form onSubmit={entrar} className="w-full max-w-sm bg-white p-6 rounded shadow">
        <h1 className="text-xl font-bold mb-4 text-center">Login Admin</h1>
        {msg && <p className="text-sm mb-3">{msg}</p>}
        <label className="block text-sm font-medium mb-1">Email</label>
        <input className="w-full border rounded px-3 py-2 mb-3" value={email} onChange={e=>setEmail(e.target.value)} />
        <label className="block text-sm font-medium mb-1">Senha</label>
        <input type="password" className="w-full border rounded px-3 py-2 mb-4" value={senha} onChange={e=>setSenha(e.target.value)} />
        <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Entrar</button>
      </form>
    </div>
  );
}

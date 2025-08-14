// frontend/src/pages/Login.jsx
import { useState } from 'react';
import { apiLogin } from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  async function entrar(e) {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      await apiLogin({ email, senha }); // já salva o token no localStorage
      window.location.replace('/');     // vai para o painel
    } catch (err) {
      console.error(err);
      setErro('E-mail ou senha inválidos.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={entrar} className="bg-white p-6 rounded shadow w-full max-w-sm">
        <h1 className="text-xl font-semibold mb-4">Login</h1>

        <label className="block text-sm mb-1">E-mail</label>
        <input
          className="w-full border rounded px-3 py-2 mb-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
        />

        <label className="block text-sm mb-1">Senha</label>
        <input
          className="w-full border rounded px-3 py-2 mb-4"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          type="password"
          required
        />

        {erro && <div className="text-red-600 text-sm mb-3">{erro}</div>}

        <button
          className="w-full bg-indigo-600 text-white py-2 rounded disabled:opacity-60"
          disabled={loading}
          type="submit"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}

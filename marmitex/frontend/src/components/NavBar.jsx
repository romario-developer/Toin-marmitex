import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function NavBar() {
  const navigate = useNavigate();
  const email = localStorage.getItem('adm_email') || '';
  const [open, setOpen] = useState(false);

  function sair() {
    localStorage.removeItem('adm_token');
    localStorage.removeItem('adm_email');
    navigate('/login', { replace: true });
  }

  const linkCls = ({ isActive }) =>
    `block px-3 py-2 rounded text-sm sm:text-base ${
      isActive ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-100'
    }`;

  return (
    <header className="bg-gray-100 p-3 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg sm:text-2xl font-bold">Painel Admin</h1>

        {/* Desktop actions */}
        <div className="hidden sm:flex gap-2 items-center">
          <span className="text-sm text-gray-600">{email}</span>
          <button
            onClick={sair}
            className="px-3 py-1.5 text-sm bg-slate-700 text-white rounded hover:bg-slate-800"
          >
            Sair
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden inline-flex items-center justify-center p-2 rounded border"
          onClick={() => setOpen(v => !v)}
          aria-label="Abrir menu"
        >
          <span className="i">☰</span>
        </button>
      </div>

      {/* Nav desktop */}
      <nav className="hidden sm:flex flex-wrap gap-2 mt-3">
        <NavLink to="/cardapio" className={linkCls}>Cadastro de Cardápio</NavLink>
        <NavLink to="/pedidos" className={linkCls}>Pedidos</NavLink>
        <NavLink to="/config" className={linkCls}>Configurações</NavLink>
        {/* Remover esta linha: <NavLink to="/simulador" className={linkCls}>Simulador</NavLink> */}
      </nav>

      {/* Nav mobile dropdown */}
      {open && (
        <div className="sm:hidden mt-3 rounded border bg-white p-2 space-y-2">
          <NavLink to="/cardapio" className={linkCls} onClick={() => setOpen(false)}>Cadastro de Cardápio</NavLink>
          <NavLink to="/pedidos" className={linkCls} onClick={() => setOpen(false)}>Pedidos</NavLink>
          <NavLink to="/config" className={linkCls} onClick={() => setOpen(false)}>Configurações</NavLink>
          {/* Remover esta linha: <NavLink to="/simulador" className={linkCls} onClick={() => setOpen(false)}>Simulador</NavLink> */}

          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-xs text-gray-600 truncate pr-2">{email}</span>
            <button
              onClick={sair}
              className="px-3 py-1 text-xs bg-slate-700 text-white rounded hover:bg-slate-800"
            >
              Sair
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

import { useState } from 'react';
import { NavLink } from 'react-router-dom';

export default function Header() {
  const [open, setOpen] = useState(false);

  const linkCls = ({ isActive }) =>
    `block px-3 py-2 rounded-md text-sm font-medium ${
      isActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
    }`;

  function close() { setOpen(false); }

  return (
    <header className="w-full border-b bg-white sticky top-0 z-20">
      <div className="mx-auto max-w-6xl px-3 sm:px-6 py-3 flex items-center justify-between">
        <div className="text-lg font-bold">Toin Admin</div>

        {/* desktop nav */}
        <nav className="hidden md:flex items-center gap-2">
          <NavLink to="/" className={linkCls} end>Cadastro</NavLink>
          <NavLink to="/pedidos" className={linkCls}>Pedidos</NavLink>
          <NavLink to="/simulador" className={linkCls}>Simulador</NavLink>
          <NavLink to="/configuracoes" className={linkCls}>Configurações</NavLink>
        </nav>

        {/* hamburger */}
        <button
          className="md:hidden inline-flex items-center justify-center p-2 rounded-md border"
          onClick={() => setOpen(!open)}
          aria-label="Abrir menu"
        >
          <span className="i">☰</span>
        </button>
      </div>

      {/* mobile menu */}
      {open && (
        <div className="md:hidden border-t bg-white">
          <div className="px-2 py-2 space-y-1">
            <NavLink to="/" className={linkCls} end onClick={close}>Cadastro</NavLink>
            <NavLink to="/pedidos" className={linkCls} onClick={close}>Pedidos</NavLink>
            <NavLink to="/simulador" className={linkCls} onClick={close}>Simulador</NavLink>
            <NavLink to="/configuracoes" className={linkCls} onClick={close}>Configurações</NavLink>
          </div>
        </div>
      )}
    </header>
  );
}

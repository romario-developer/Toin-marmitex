import { NavLink, useNavigate } from 'react-router-dom';

export default function NavBar() {
  const navigate = useNavigate();
  const email = localStorage.getItem('adm_email') || '';

  function sair() {
    localStorage.removeItem('adm_token');
    localStorage.removeItem('adm_email');
    navigate('/login', { replace: true });
  }

  const linkCls = ({ isActive }) =>
    `px-3 py-2 rounded text-sm sm:text-base ${
      isActive ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-100'
    }`;

  return (
    <header className="bg-gray-100 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <h1 className="text-xl sm:text-2xl font-bold">Painel Admin</h1>
        <div className="flex gap-2 items-center">
          <span className="text-sm text-gray-600 hidden sm:inline">{email}</span>
          <button
            onClick={sair}
            className="px-3 py-1.5 text-sm bg-slate-700 text-white rounded hover:bg-slate-800"
          >
            Sair
          </button>
        </div>
      </div>

      <nav className="flex flex-wrap gap-2">
        <NavLink to="/cardapio" className={linkCls}>
          Cadastro de Cardápio
        </NavLink>
        <NavLink to="/pedidos" className={linkCls}>
          Pedidos
        </NavLink>
        <NavLink to="/config" className={linkCls}>
          Configurações
        </NavLink>
        <NavLink to="/simulador" className={linkCls}>
          Simulador
        </NavLink>
      </nav>
    </header>
  );
}

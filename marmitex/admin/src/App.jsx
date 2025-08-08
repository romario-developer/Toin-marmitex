import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import CadastroCardapio from './components/CadastroCardapio';
import Pedidos from './pages/Pedidos';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100 p-6">
        {/* 🧭 Menu de navegação */}
        <nav className="flex gap-4 mb-6">
          <Link
            to="/"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Cadastro de Cardápio
          </Link>
          <Link
            to="/pedidos"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
          >
            Pedidos Recebidos
          </Link>
        </nav>

        <Routes>
          <Route path="/" element={<CadastroCardapio />} />
          <Route path="/pedidos" element={<Pedidos />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

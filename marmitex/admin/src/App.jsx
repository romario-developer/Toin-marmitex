import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import CadastroCardapio from './components/CadastroCardapio';
import Pedidos from './pages/Pedidos';
import Configuracoes from './pages/Configuracoes';
import SimuladorWhatsApp from './pages/SimuladorWhatsApp';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100 p-6">
        <nav className="flex gap-3 mb-6 flex-wrap">
          <Link to="/" className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700">Cadastro de Cardápio</Link>
          <Link to="/pedidos" className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700">Pedidos</Link>
          <Link to="/configuracoes" className="bg-gray-600 text-white px-3 py-2 rounded hover:bg-gray-700">Configurações</Link>
          <Link to="/simulador" className="bg-emerald-600 text-white px-3 py-2 rounded hover:bg-emerald-700">Simulador WhatsApp</Link>
        </nav>

        <Routes>
          <Route path="/" element={<CadastroCardapio />} />
          <Route path="/pedidos" element={<Pedidos />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
          <Route path="/simulador" element={<SimuladorWhatsApp />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

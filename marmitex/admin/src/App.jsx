import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';

// Páginas/Componentes existentes no seu projeto:
import CadastroCardapio from './components/CadastroCardapio';
import Pedidos from './pages/Pedidos';
import Configuracoes from './pages/Configuracoes';
import SimuladorWhatsApp from './pages/SimuladorWhatsApp';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Header />

        <main className="mx-auto max-w-6xl p-3 sm:p-6">
          <Routes>
            <Route path="/" element={<CadastroCardapio />} />
            <Route path="/pedidos" element={<Pedidos />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            <Route path="/simulador" element={<SimuladorWhatsApp />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

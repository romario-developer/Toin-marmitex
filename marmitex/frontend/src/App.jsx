import { Routes, Route, Navigate } from 'react-router-dom';
import CadastroCardapio from './pages/CadastroCardapio';
import Pedidos from './pages/Pedidos';
import Configuracoes from './pages/Configuracoes';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import NavBar from './components/NavBar';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Routes>
        {/* público */}
        <Route path="/login" element={<Login onSuccess={() => window.location.replace('/cardapio')} />} />

        {/* protegidos */}
        <Route
          path="/cardapio"
          element={
            <ProtectedRoute>
              <NavBar />
              <main className="p-4 sm:p-6">
                <CadastroCardapio />
              </main>
            </ProtectedRoute>
          }
        />
        <Route
          path="/pedidos"
          element={
            <ProtectedRoute>
              <NavBar />
              <main className="p-4 sm:p-6">
                <Pedidos />
              </main>
            </ProtectedRoute>
          }
        />
        <Route
          path="/config"
          element={
            <ProtectedRoute>
              <NavBar />
              <main className="p-4 sm:p-6">
                <Configuracoes />
              </main>
            </ProtectedRoute>
          }
        />

        {/* redirects */}
        <Route path="/" element={<Navigate to="/cardapio" replace />} />
        <Route path="*" element={<Navigate to="/cardapio" replace />} />
      </Routes>
    </div>
  );
}

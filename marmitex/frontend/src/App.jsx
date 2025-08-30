import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CadastroCardapio from './pages/CadastroCardapio';
import Pedidos from './pages/Pedidos';
import Configuracoes from './pages/Configuracoes';
import Planos from './pages/Planos';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import NavBar from './components/NavBar';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Routes>
        {/* público */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login onSuccess={() => window.location.replace('/dashboard')} />} />
        <Route path="/register" element={<Register />} />

        {/* protegidos */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <NavBar />
              <main className="p-4 sm:p-6">
                <Dashboard />
              </main>
            </ProtectedRoute>
          }
        />
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
          path="/configuracoes"
          element={
            <ProtectedRoute>
              <NavBar />
              <main className="p-4 sm:p-6">
                <Configuracoes />
              </main>
            </ProtectedRoute>
          }
        />
        <Route
          path="/planos"
          element={
            <ProtectedRoute>
              <NavBar />
              <main className="p-4 sm:p-6">
                <Planos />
              </main>
            </ProtectedRoute>
          }
        />

        {/* redirects */}
        <Route path="/app" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

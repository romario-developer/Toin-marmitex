// admin/App.jsx
import CadastroCardapio from './components/CadastroCardapio';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-bold text-center mb-4">Painel Admin - Cadastro de Cardápio</h1>
      <CadastroCardapio />
    </div>
  );
}

export default App;

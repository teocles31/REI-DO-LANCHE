import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Revenues } from './pages/Revenues';
import { Expenses } from './pages/Expenses';
import { Products } from './pages/Products';
import { Inventory } from './pages/Inventory';
import { Reports } from './pages/Reports';
import { Employees } from './pages/Employees';

// Simple Auth Component
const LoginScreen: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin1234') {
      onLogin();
    } else {
      setError('Usuário ou senha incorretos.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-orange-600 mb-2">REI DO LANCHE</h1>
          <p className="text-gray-500">Gestão Financeira e Estoque</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-500 text-sm p-3 rounded-lg text-center border border-red-100">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Usuário</label>
            <input 
              type="text" 
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none transition-all" 
              placeholder="Digite seu usuário"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input 
              type="password" 
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none transition-all" 
              placeholder="Digite sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="w-full bg-orange-600 text-white font-bold py-3 rounded-lg hover:bg-orange-700 transition shadow-lg shadow-orange-200">
            Entrar
          </button>
        </form>
        <p className="text-center text-xs text-gray-400 mt-6">Versão v1.1</p>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (!isLoggedIn) {
    return <LoginScreen onLogin={() => setIsLoggedIn(true)} />;
  }

  const renderPage = () => {
    switch(currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'revenues': return <Revenues />;
      case 'expenses': return <Expenses />;
      case 'products': return <Products />;
      case 'inventory': return <Inventory />;
      case 'employees': return <Employees />;
      case 'reports': return <Reports />;
      default: return <Dashboard />;
    }
  };

  return (
    <AppProvider>
      <Layout 
        currentPage={currentPage} 
        onNavigate={setCurrentPage} 
        onLogout={() => setIsLoggedIn(false)}
      >
        {renderPage()}
      </Layout>
    </AppProvider>
  );
};

export default App;
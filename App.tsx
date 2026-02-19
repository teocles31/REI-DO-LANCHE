import React, { useState, useEffect, useCallback } from 'react';
import { AppProvider } from './context/AppContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Revenues } from './pages/Revenues';
import { Expenses } from './pages/Expenses';
import { Products } from './pages/Products';
import { Inventory } from './pages/Inventory';
import { Reports } from './pages/Reports';
import { Employees } from './pages/Employees';
import { POS } from './pages/POS';
import { Store, ShoppingBag } from 'lucide-react';
import { AdminAuthModal } from './components/AdminAuthModal';

// --- Session Config ---
const SESSION_DURATION = 15 * 60 * 1000; // 15 Minutes in milliseconds
const SESSION_KEY = 'reidolanche_session_v1';

// --- Login Screen ---
const LoginScreen: React.FC<{ onLogin: (user: string) => void }> = ({ onLogin }) => {
  const [cpf, setCpf] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Remove non-numeric characters for validation just in case user types formatting
    const cleanCpf = cpf.replace(/\D/g, '');

    // Simulating API Latency
    setTimeout(() => {
      if (cleanCpf === '13853152619') {
        onLogin('Colaborador');
      } else {
        setError('Acesso negado. CPF não autorizado.');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-orange-600 mb-2">REI DO LANCHE</h1>
          <p className="text-gray-500">Acesso ao Sistema</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-500 text-sm p-3 rounded-lg text-center border border-red-100">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CPF de Acesso</label>
            <input 
              type="text" 
              inputMode="numeric"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-orange-500 outline-none transition-all text-center tracking-widest" 
              placeholder="Digite apenas números"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              autoFocus
            />
          </div>
          
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-orange-600 text-white font-bold py-3 rounded-lg hover:bg-orange-700 transition shadow-lg shadow-orange-200 disabled:opacity-70 flex justify-center"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : 'Acessar Sistema'}
          </button>
        </form>
        <p className="text-center text-xs text-gray-400 mt-6 flex justify-center items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Sistema Seguro v2.1
        </p>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [currentModule, setCurrentModule] = useState<'financial' | 'pos' | null>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isSessionChecking, setIsSessionChecking] = useState(true);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(0);
  
  // State for Financial Module Auth
  const [isFinancialAuthOpen, setIsFinancialAuthOpen] = useState(false);

  // --- Session Management ---

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setCurrentUser(null);
    setCurrentModule(null);
  }, []);

  const refreshSession = useCallback(() => {
    if (!currentUser) return;
    
    const sessionData = {
      user: currentUser,
      expiresAt: Date.now() + SESSION_DURATION
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
  }, [currentUser]);

  // Check session on mount
  useEffect(() => {
    const checkSession = () => {
      try {
        const stored = localStorage.getItem(SESSION_KEY);
        if (stored) {
          const session = JSON.parse(stored);
          if (Date.now() < session.expiresAt) {
            setCurrentUser(session.user);
            setSessionTimeLeft(session.expiresAt - Date.now());
          } else {
            localStorage.removeItem(SESSION_KEY); // Expired
          }
        }
      } catch (e) {
        console.error("Session parse error", e);
      } finally {
        setIsSessionChecking(false);
      }
    };
    checkSession();
  }, []);

  // Countdown Timer & Auto Logout
  useEffect(() => {
    if (!currentUser) return;

    const interval = setInterval(() => {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        const session = JSON.parse(stored);
        const remaining = session.expiresAt - Date.now();
        
        if (remaining <= 0) {
          logout();
          alert("Sua sessão expirou por inatividade.");
        } else {
          setSessionTimeLeft(remaining);
        }
      } else {
        logout();
      }
    }, 1000); // Check every second for UI update

    return () => clearInterval(interval);
  }, [currentUser, logout]);

  // Sliding Expiration: Reset timer on user interaction
  useEffect(() => {
    if (!currentUser) return;

    const handleActivity = () => {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        const session = JSON.parse(stored);
        // Only update if less than 14 minutes remaining (avoid writing on every click)
        if (session.expiresAt - Date.now() < SESSION_DURATION - 60000) {
           refreshSession();
        }
      }
    };

    window.addEventListener('click', handleActivity);
    window.addEventListener('keypress', handleActivity);
    window.addEventListener('scroll', handleActivity);

    return () => {
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keypress', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, [currentUser, refreshSession]);

  const handleLogin = (user: string) => {
    setCurrentUser(user);
    const sessionData = {
      user: user,
      expiresAt: Date.now() + SESSION_DURATION
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    setSessionTimeLeft(SESSION_DURATION);
    // Don't set page yet, let them choose module
  };

  const handleFinancialAccess = () => {
    setIsFinancialAuthOpen(false);
    setCurrentModule('financial');
    setCurrentPage('dashboard');
  };

  if (isSessionChecking) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // Module Selection Screen
  if (!currentModule) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 animate-fade-in">
            <AdminAuthModal 
              isOpen={isFinancialAuthOpen}
              onClose={() => setIsFinancialAuthOpen(false)}
              onConfirm={handleFinancialAccess}
              actionTitle="Acesso Administrativo"
            />
            
            <div className="max-w-4xl w-full">
                <div className="text-center mb-10">
                     <h1 className="text-3xl font-bold text-gray-800">Bem-vindo</h1>
                     <p className="text-gray-500">Selecione o módulo que deseja acessar</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Financial Module Card */}
                    <button 
                        onClick={() => setIsFinancialAuthOpen(true)}
                        className="bg-white p-8 rounded-2xl shadow-sm border-2 border-transparent hover:border-orange-500 hover:shadow-xl transition-all group text-left"
                    >
                        <div className="bg-orange-100 text-orange-600 w-16 h-16 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Store size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Gestão Financeira</h2>
                        <p className="text-gray-500">
                            Administre receitas, despesas, estoque, funcionários e relatórios detalhados.
                        </p>
                        <div className="mt-4 flex items-center text-xs text-orange-600 font-medium">
                           <span className="bg-orange-50 px-2 py-1 rounded-full border border-orange-100">🔒 Requer Senha</span>
                        </div>
                    </button>

                    {/* POS Module Card */}
                    <button 
                        onClick={() => { setCurrentModule('pos'); setCurrentPage('pos'); }}
                        className="bg-white p-8 rounded-2xl shadow-sm border-2 border-transparent hover:border-blue-500 hover:shadow-xl transition-all group text-left"
                    >
                        <div className="bg-blue-100 text-blue-600 w-16 h-16 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <ShoppingBag size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Pedidos & Caixa (POS)</h2>
                        <p className="text-gray-500">
                            Realize vendas no balcão, delivery ou mesas de forma ágil e integrada.
                        </p>
                    </button>
                </div>
                <div className="mt-12 text-center">
                    <button onClick={logout} className="text-gray-400 hover:text-red-500 underline text-sm">
                        Sair do Sistema
                    </button>
                </div>
            </div>
        </div>
      );
  }

  const renderPage = () => {
    if (currentModule === 'pos') {
        return <POS />;
    }

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

  const navigateBack = () => {
      setCurrentModule(null);
  };

  return (
    <AppProvider currentUser={currentUser}>
      {currentModule === 'pos' ? (
           // Simplified Layout for POS
           <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">
               <header className="bg-slate-900 text-white h-16 flex items-center justify-between px-6 shadow-md shrink-0">
                   <div className="flex items-center gap-3">
                       <span className="font-bold text-orange-500 text-xl">REI DO LANCHE</span>
                       <span className="bg-blue-600 text-xs px-2 py-0.5 rounded">PDV</span>
                   </div>
                   <div className="flex items-center gap-4">
                       {/* Timer */}
                       <div className={`text-xs font-mono ${sessionTimeLeft < 60000 ? 'text-red-400 animate-pulse' : 'text-slate-400'}`}>
                           {Math.floor(sessionTimeLeft / 60000).toString().padStart(2,'0')}:
                           {Math.floor((sessionTimeLeft % 60000) / 1000).toString().padStart(2,'0')}
                       </div>
                       <button onClick={navigateBack} className="text-sm bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded transition">
                           Trocar Módulo
                       </button>
                   </div>
               </header>
               <main className="flex-1 p-4 overflow-hidden">
                   {renderPage()}
               </main>
           </div>
      ) : (
          <Layout 
            currentPage={currentPage} 
            onNavigate={(page) => {
                if (page === 'exit_module') {
                    navigateBack();
                } else {
                    setCurrentPage(page);
                }
            }} 
            onLogout={logout}
            sessionTimeLeft={sessionTimeLeft}
          >
            {renderPage()}
          </Layout>
      )}
    </AppProvider>
  );
};

export default App;
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

// --- Session Config ---
const SESSION_DURATION = 15 * 60 * 1000; // 15 Minutes in milliseconds
const SESSION_KEY = 'reidolanche_session_v1';

// --- Login Screen ---
const LoginScreen: React.FC<{ onLogin: (user: string) => void }> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulating API Latency
    setTimeout(() => {
      // Simple Mock Auth - In a real app, this goes to a backend
      if ((username === 'admin' && password === 'admin1234') || (username === 'gerente' && password === '1234')) {
        onLogin(username);
      } else {
        setError('Usuário ou senha incorretos.');
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
              placeholder="admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input 
              type="password" 
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none transition-all" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-orange-600 text-white font-bold py-3 rounded-lg hover:bg-orange-700 transition shadow-lg shadow-orange-200 disabled:opacity-70 flex justify-center"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : 'Entrar'}
          </button>
        </form>
        <p className="text-center text-xs text-gray-400 mt-6 flex justify-center items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Sistema Seguro v2.0
        </p>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isSessionChecking, setIsSessionChecking] = useState(true);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(0);

  // --- Session Management ---

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setCurrentUser(null);
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
    // We pass the currentUser to AppProvider to scope the data
    <AppProvider currentUser={currentUser}>
      <Layout 
        currentPage={currentPage} 
        onNavigate={setCurrentPage} 
        onLogout={logout}
        sessionTimeLeft={sessionTimeLeft}
      >
        {renderPage()}
      </Layout>
    </AppProvider>
  );
};

export default App;
import React, { useState } from 'react';
import { LayoutDashboard, Wallet, TrendingDown, Package, Utensils, LogOut, FileText, Users, Menu, X } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentPage, onNavigate, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'revenues', label: 'Entradas', icon: Wallet },
    { id: 'expenses', label: 'Despesas', icon: TrendingDown },
    { id: 'products', label: 'Cardápio', icon: Utensils },
    { id: 'inventory', label: 'Estoque', icon: Package },
    { id: 'employees', label: 'Equipe', icon: Users },
    { id: 'reports', label: 'Relatórios', icon: FileText },
  ];

  const handleNavigate = (page: string) => {
    onNavigate(page);
    setIsMobileMenuOpen(false); // Close menu on mobile selection
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden relative">
      
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 text-white flex items-center justify-between px-4 z-30 shadow-md">
         <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-orange-500">REI DO LANCHE</span>
         </div>
         <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-300 hover:text-white">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
         </button>
      </div>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col shadow-xl transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-slate-700 hidden lg:block">
          <h1 className="text-2xl font-bold text-orange-500 tracking-tight">REI DO LANCHE</h1>
          <p className="text-xs text-slate-400 mt-1">Gestão Financeira</p>
        </div>
        
        <div className="lg:hidden p-6 border-b border-slate-700 flex justify-between items-center">
             <span className="font-bold text-orange-500">Menu</span>
             <button onClick={() => setIsMobileMenuOpen(false)}><X size={20} /></button>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleNavigate(item.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive 
                        ? 'bg-orange-600 text-white shadow-md' 
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-slate-700 pb-8 lg:pb-4">
          <button 
            onClick={onLogout}
            className="w-full flex items-center space-x-2 px-4 py-2 text-slate-400 hover:text-red-400 transition-colors"
          >
            <LogOut size={18} />
            <span>Sair do Sistema</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50 pt-20 lg:pt-8 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto pb-10">
          {children}
        </div>
      </main>
    </div>
  );
};
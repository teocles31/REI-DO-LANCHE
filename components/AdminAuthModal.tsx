import React, { useState } from 'react';
import { Lock, X } from 'lucide-react';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  actionTitle?: string;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({ isOpen, onClose, onConfirm, actionTitle = "Autorizar Ação" }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '3105') {
      onConfirm();
      setPassword('');
      setError('');
      onClose();
    } else {
      setError('Senha incorreta.');
      setPassword('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center mb-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-full mb-3">
            <Lock size={24} />
          </div>
          <h3 className="text-lg font-bold text-gray-800 text-center">{actionTitle}</h3>
          <p className="text-sm text-gray-500 text-center mt-1">
            Esta ação requer senha de administrador.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input 
              type="password" 
              inputMode="numeric"
              pattern="[0-9]*"
              autoFocus
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-center text-xl tracking-widest outline-none focus:border-red-500 transition-colors"
              placeholder="••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              maxLength={4}
            />
            {error && <p className="text-red-500 text-xs text-center mt-2 font-medium">{error}</p>}
          </div>
          
          <button 
            type="submit" 
            className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition shadow-md shadow-red-100"
          >
            Confirmar
          </button>
        </form>
      </div>
    </div>
  );
};
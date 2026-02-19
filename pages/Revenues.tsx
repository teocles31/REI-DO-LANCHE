import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { RevenueCategory, PaymentMethod } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { PlusCircle, Trash2, Wallet } from 'lucide-react';
import { MoneyInput } from '../components/MoneyInput';
import { AdminAuthModal } from '../components/AdminAuthModal';

export const Revenues: React.FC = () => {
  const { revenues, addRevenue, deleteRevenue } = useApp();
  
  // Admin Auth State
  const [authOpen, setAuthOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<() => void>(() => {});

  const [form, setForm] = useState({
    description: '',
    amount: 0, 
    category: 'Balcao' as RevenueCategory,
    paymentMethod: 'Dinheiro' as PaymentMethod,
    date: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || !form.description) return;

    addRevenue({
      date: new Date(form.date).toISOString(),
      amount: form.amount,
      description: form.description,
      category: form.category,
      paymentMethod: form.paymentMethod
    });

    setForm({
      ...form,
      description: '',
      amount: 0
    });
  };

  const handleDelete = (id: string) => {
    setPendingAction(() => () => deleteRevenue(id));
    setAuthOpen(true);
  };

  return (
    <div className="space-y-6">
      <AdminAuthModal 
        isOpen={authOpen} 
        onClose={() => setAuthOpen(false)} 
        onConfirm={pendingAction}
        actionTitle="Excluir Entrada"
      />

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">Entradas Financeiras</h2>
          <p className="text-sm text-gray-500">Registre suas vendas diárias ou aportes.</p>
        </div>
      </div>

      {/* Add Revenue Form */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4 text-green-700 flex items-center gap-2">
          <PlusCircle size={20} /> Nova Entrada
        </h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
            <input 
              type="date" 
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none h-10"
              value={form.date}
              onChange={e => setForm({...form, date: e.target.value})}
            />
          </div>
          <div className="lg:col-span-1">
             <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
             <MoneyInput 
               required
               className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none h-10"
               value={form.amount}
               onChange={val => setForm({...form, amount: val})}
             />
          </div>
           <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <input 
              type="text" 
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none h-10"
              value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
              placeholder="Ex: Vendas da Noite"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Canal</label>
            <select 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none h-10 bg-white"
              value={form.category}
              onChange={e => setForm({...form, category: e.target.value as RevenueCategory})}
            >
              <option value="Balcao">Balcão</option>
              <option value="Delivery">Delivery</option>
              <option value="App">App</option>
              <option value="Outros">Outros</option>
            </select>
          </div>
          <div>
            <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-medium h-10 rounded-lg transition-colors">
              Registrar
            </button>
          </div>
        </form>
      </div>

      {/* Revenues List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
         <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
            <Wallet size={18} className="text-gray-500" />
            <h3 className="font-bold text-gray-700">Histórico</h3>
         </div>
         <div className="overflow-x-auto">
             <table className="w-full text-left min-w-[600px]">
               <thead className="bg-gray-50 text-gray-600 text-sm">
                 <tr>
                   <th className="px-6 py-3">Data</th>
                   <th className="px-6 py-3">Descrição</th>
                   <th className="px-6 py-3">Canal</th>
                   <th className="px-6 py-3 text-right">Valor</th>
                   <th className="px-6 py-3 text-center">Ações</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100 text-sm">
                 {revenues.length === 0 && (
                     <tr><td colSpan={5} className="text-center py-8 text-gray-400">Nenhuma entrada registrada.</td></tr>
                 )}
                 {revenues.map((rev) => (
                   <tr key={rev.id} className="hover:bg-gray-50 transition-colors">
                     <td className="px-6 py-3">{formatDate(rev.date)}</td>
                     <td className="px-6 py-3 font-medium text-gray-900">{rev.description}</td>
                     <td className="px-6 py-3">
                       <span className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs border border-green-100">{rev.category}</span>
                     </td>
                     <td className="px-6 py-3 text-right font-bold text-green-600">+ {formatCurrency(rev.amount)}</td>
                     <td className="px-6 py-3 text-center">
                       <button onClick={() => handleDelete(rev.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                         <Trash2 size={16} />
                       </button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
         </div>
      </div>
    </div>
  );
};
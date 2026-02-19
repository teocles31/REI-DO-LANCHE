import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ExpenseCategory, PaymentMethod, Expense } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Trash2, PlusCircle, CheckCircle, Clock } from 'lucide-react';

export const Expenses: React.FC = () => {
  const { expenses, addExpense, deleteExpense, updateExpense } = useApp();
  const [activeTab, setActiveTab] = useState<'pending' | 'paid'>('pending');
  
  const [form, setForm] = useState({
    amount: '',
    category: 'Insumos' as ExpenseCategory,
    description: '',
    paymentMethod: 'Pix' as PaymentMethod,
    isRecurring: false,
    date: new Date().toISOString().split('T')[0],
    status: 'pending' as 'paid' | 'pending'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || !form.description) return;

    addExpense({
      date: new Date(form.date).toISOString(),
      amount: parseFloat(form.amount),
      category: form.category,
      description: form.description,
      isRecurring: form.isRecurring,
      paymentMethod: form.paymentMethod,
      status: form.status,
      paidDate: form.status === 'paid' ? new Date().toISOString() : undefined
    });

    setForm({
      ...form,
      amount: '',
      description: '',
    });
  };

  const markAsPaid = (id: string) => {
    updateExpense(id, { 
      status: 'paid',
      paidDate: new Date().toISOString()
    });
  };

  const filteredExpenses = expenses
    .filter(e => e.status === activeTab)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Group by Date
  const groupedExpenses = filteredExpenses.reduce((groups, expense) => {
    const date = formatDate(expense.date);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(expense);
    return groups;
  }, {} as Record<string, Expense[]>);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Controle de Despesas</h2>

      {/* Add Expense Form */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center gap-2">
          <PlusCircle size={20} /> Nova Despesa / Conta a Pagar
        </h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Data (Venc.)</label>
            <input 
              type="date" 
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
              value={form.date}
              onChange={e => setForm({...form, date: e.target.value})}
            />
          </div>
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <input 
              type="text" 
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
              value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
              placeholder="Ex: Conta de Luz"
            />
          </div>
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
            <input 
              type="number" step="0.01" required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
              value={form.amount}
              onChange={e => setForm({...form, amount: e.target.value})}
              placeholder="0,00"
            />
          </div>
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
              value={form.status}
              onChange={e => setForm({...form, status: e.target.value as 'paid' | 'pending'})}
            >
              <option value="pending">Pendente</option>
              <option value="paid">Pago</option>
            </select>
          </div>
          <div className="lg:col-span-1">
            <button type="submit" className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 rounded-lg transition-colors">
              Salvar
            </button>
          </div>
        </form>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 font-medium text-sm flex items-center gap-2 ${
            activeTab === 'pending' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Clock size={16} /> Contas Pendentes
        </button>
        <button
          onClick={() => setActiveTab('paid')}
          className={`px-4 py-2 font-medium text-sm flex items-center gap-2 ${
            activeTab === 'paid' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <CheckCircle size={16} /> Pagamentos Realizados
        </button>
      </div>

      {/* Expense List Grouped by Date */}
      <div className="space-y-4">
        {Object.keys(groupedExpenses).length === 0 && (
             <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-gray-100">
                 Nenhuma despesa {activeTab === 'pending' ? 'pendente' : 'realizada'} encontrada.
             </div>
        )}

        {Object.keys(groupedExpenses).map(date => (
          <div key={date} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 font-semibold text-gray-700 text-sm">
                 {date}
             </div>
             <table className="w-full text-left">
                <tbody className="divide-y divide-gray-100 text-sm">
                    {groupedExpenses[date].map(exp => (
                        <tr key={exp.id} className="hover:bg-gray-50">
                            <td className="px-6 py-3 font-medium text-gray-900 w-1/3">{exp.description}</td>
                            <td className="px-6 py-3 text-gray-600 w-1/4">
                                <span className="bg-gray-100 px-2 py-1 rounded text-xs">{exp.category}</span>
                            </td>
                            <td className="px-6 py-3 text-right font-bold text-red-600 w-1/4">
                                - {formatCurrency(exp.amount)}
                            </td>
                            <td className="px-6 py-3 text-center w-1/6 flex justify-end gap-2">
                                {exp.status === 'pending' && (
                                    <button 
                                      onClick={() => markAsPaid(exp.id)}
                                      className="p-1.5 text-green-600 bg-green-50 hover:bg-green-100 rounded transition-colors"
                                      title="Marcar como Pago"
                                    >
                                        <CheckCircle size={16} />
                                    </button>
                                )}
                                <button onClick={() => deleteExpense(exp.id)} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
             </table>
          </div>
        ))}
      </div>
    </div>
  );
};
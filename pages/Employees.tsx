import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Employee, ExpenseCategory, PaymentMethod } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Plus, User, Banknote, Edit2, Trash2, Phone, Calendar } from 'lucide-react';

export const Employees: React.FC = () => {
  const { employees, addEmployee, updateEmployee, deleteEmployee, addExpense, expenses } = useApp();
  
  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [editingEmpId, setEditingEmpId] = useState<string | null>(null);
  
  // Employee Form State
  const [empForm, setEmpForm] = useState<Omit<Employee, 'id'>>({
    name: '',
    role: '',
    baseSalary: 0,
    admissionDate: new Date().toISOString().split('T')[0],
    pixKey: '',
    phone: '',
    active: true
  });

  // Payment Form State
  const [payForm, setPayForm] = useState({
    employeeId: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    category: 'Salarios' as ExpenseCategory,
    paymentMethod: 'PIX' as PaymentMethod,
    isRecurring: false
  });

  // Calculate Total Paid to Employee in current month
  const getPaidThisMonth = (employeeId: string) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return expenses
        .filter(e => e.employeeId === employeeId && e.status === 'paid' && new Date(e.date) >= startOfMonth)
        .reduce((acc, curr) => acc + curr.amount, 0);
  };

  // --- Handlers ---

  const handleOpenEmpModal = (emp?: Employee) => {
    if (emp) {
      setEditingEmpId(emp.id);
      setEmpForm({
        name: emp.name,
        role: emp.role,
        baseSalary: emp.baseSalary,
        admissionDate: emp.admissionDate,
        pixKey: emp.pixKey || '',
        phone: emp.phone || '',
        active: emp.active
      });
    } else {
      setEditingEmpId(null);
      setEmpForm({
        name: '',
        role: '',
        baseSalary: 0,
        admissionDate: new Date().toISOString().split('T')[0],
        pixKey: '',
        phone: '',
        active: true
      });
    }
    setIsEmpModalOpen(true);
  };

  const handleEmpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEmpId) {
      updateEmployee(editingEmpId, empForm);
    } else {
      addEmployee(empForm);
    }
    setIsEmpModalOpen(false);
  };

  const handleOpenPayModal = (empId: string) => {
    const emp = employees.find(e => e.id === empId);
    setPayForm({
        employeeId: empId,
        amount: '',
        description: `Adiantamento - ${emp?.name}`,
        date: new Date().toISOString().split('T')[0],
        category: 'Salarios',
        paymentMethod: 'PIX',
        isRecurring: false
    });
    setIsPayModalOpen(true);
  };

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payForm.amount || !payForm.employeeId) return;

    // Create Expense linked to Employee
    addExpense({
        date: new Date(payForm.date).toISOString(),
        amount: parseFloat(payForm.amount),
        category: payForm.category,
        description: payForm.description,
        isRecurring: payForm.isRecurring,
        paymentMethod: payForm.paymentMethod,
        status: 'paid', // Assume immediate payment for advances
        paidDate: new Date().toISOString(),
        employeeId: payForm.employeeId
    });

    setIsPayModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Equipe & Folha de Pagamento</h2>
          <p className="text-gray-500">Gerencie funcionários, salários e adiantamentos.</p>
        </div>
        <button 
          onClick={() => handleOpenEmpModal()}
          className="bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-orange-700 transition"
        >
          <Plus size={18} />
          <span>Novo Funcionário</span>
        </button>
      </div>

      {employees.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
           <User size={48} className="mx-auto text-gray-300 mb-3" />
           <p className="text-gray-400">Nenhum funcionário cadastrado.</p>
           <button onClick={() => handleOpenEmpModal()} className="mt-4 text-orange-600 hover:underline">
             Cadastrar o primeiro
           </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {employees.map(emp => {
             const paidMonth = getPaidThisMonth(emp.id);
             return (
               <div key={emp.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
                 <div>
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600">
                                <User size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800">{emp.name}</h3>
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{emp.role}</span>
                            </div>
                        </div>
                        <div className="flex gap-1">
                            <button onClick={() => handleOpenEmpModal(emp)} className="p-1.5 text-gray-400 hover:text-blue-500">
                                <Edit2 size={16} />
                            </button>
                            <button onClick={() => deleteEmployee(emp.id)} className="p-1.5 text-gray-400 hover:text-red-500">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600 mb-6">
                        <div className="flex justify-between">
                            <span>Salário Base:</span>
                            <span className="font-semibold text-gray-900">{formatCurrency(emp.baseSalary)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1"><Calendar size={14}/> Admissão:</span>
                            <span>{formatDate(emp.admissionDate)}</span>
                        </div>
                         {emp.phone && (
                            <div className="flex justify-between items-center">
                                <span className="flex items-center gap-1"><Phone size={14}/> Contato:</span>
                                <span>{emp.phone}</span>
                            </div>
                        )}
                        <div className="pt-2 mt-2 border-t border-gray-100">
                            <p className="text-xs text-gray-500 mb-1">Pago este mês (Vales/Salário)</p>
                            <p className="text-lg font-bold text-green-600">{formatCurrency(paidMonth)}</p>
                        </div>
                    </div>
                 </div>

                 <button 
                   onClick={() => handleOpenPayModal(emp.id)}
                   className="w-full bg-green-50 text-green-700 py-2 rounded-lg border border-green-200 hover:bg-green-100 transition flex items-center justify-center gap-2 font-medium"
                 >
                    <Banknote size={18} />
                    Lançar Pagamento / Vale
                 </button>
               </div>
             );
           })}
        </div>
      )}

      {/* --- Modal: Employee Form --- */}
      {isEmpModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
                <h3 className="text-xl font-bold mb-4 text-gray-800">{editingEmpId ? 'Editar Funcionário' : 'Novo Funcionário'}</h3>
                <form onSubmit={handleEmpSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                        <input 
                            type="text" required
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
                            value={empForm.name}
                            onChange={e => setEmpForm({...empForm, name: e.target.value})}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
                            <input 
                                type="text" required
                                placeholder="Ex: Chapeiro"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
                                value={empForm.role}
                                onChange={e => setEmpForm({...empForm, role: e.target.value})}
                            />
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Salário Base (R$)</label>
                             <input 
                                type="number" step="0.01" required
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
                                value={empForm.baseSalary}
                                onChange={e => setEmpForm({...empForm, baseSalary: parseFloat(e.target.value)})}
                             />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Data Admissão</label>
                            <input 
                                type="date" required
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
                                value={empForm.admissionDate}
                                onChange={e => setEmpForm({...empForm, admissionDate: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone / Celular</label>
                            <input 
                                type="text" 
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
                                value={empForm.phone}
                                onChange={e => setEmpForm({...empForm, phone: e.target.value})}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Chave PIX (para pagamentos)</label>
                        <input 
                            type="text" 
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
                            value={empForm.pixKey}
                            onChange={e => setEmpForm({...empForm, pixKey: e.target.value})}
                        />
                    </div>
                    
                    <div className="flex justify-end space-x-3 mt-6 border-t border-gray-100 pt-4">
                        <button type="button" onClick={() => setIsEmpModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                            Cancelar
                        </button>
                        <button type="submit" className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
                            Salvar
                        </button>
                    </div>
                </form>
            </div>
          </div>
      )}

      {/* --- Modal: Payment Form --- */}
      {isPayModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                <div className="flex items-center gap-2 mb-4 text-green-700">
                    <Banknote size={24} />
                    <h3 className="text-xl font-bold">Realizar Pagamento</h3>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                    Isso criará automaticamente um registro nas Despesas do sistema.
                </p>
                
                <form onSubmit={handlePaySubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
                        <input 
                            type="number" step="0.01" required
                            autoFocus
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none text-lg font-semibold text-gray-800"
                            value={payForm.amount}
                            onChange={e => setPayForm({...payForm, amount: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                        <input 
                            type="text" required
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
                            value={payForm.description}
                            onChange={e => setPayForm({...payForm, description: e.target.value})}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                            <input 
                                type="date" required
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
                                value={payForm.date}
                                onChange={e => setPayForm({...payForm, date: e.target.value})}
                            />
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                             <select 
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
                                value={payForm.category}
                                onChange={e => setPayForm({...payForm, category: e.target.value as ExpenseCategory})}
                             >
                                <option value="Salarios">Salários</option>
                                <option value="Outros">Outros</option>
                             </select>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 mt-6">
                        <button type="button" onClick={() => setIsPayModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                            Cancelar
                        </button>
                        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-lg shadow-green-100">
                            Confirmar Pagamento
                        </button>
                    </div>
                </form>
            </div>
          </div>
      )}

    </div>
  );
};
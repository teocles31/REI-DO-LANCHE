import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, Clock } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { revenues, expenses } = useApp();

  // Compute Metrics
  const stats = useMemo(() => {
    const totalRevenue = revenues.reduce((acc, rev) => acc + rev.amount, 0);
    
    // Only count 'Paid' expenses for cash flow profit, or all for accrual?
    // Let's assume standard view involves realized expenses for "Caixa" and all for "Competência"
    // For simplicity, Profit = Revenue - Paid Expenses.
    // But Expense Total usually includes everything in a management view.
    // Let's show "Despesas Pagas" and "Despesas Pendentes".
    
    const paidExpenses = expenses.filter(e => e.status === 'paid').reduce((acc, exp) => acc + exp.amount, 0);
    const pendingExpenses = expenses.filter(e => e.status === 'pending').reduce((acc, exp) => acc + exp.amount, 0);
    const totalExpenses = paidExpenses; // Cash basis for profit calculation

    const cashProfit = totalRevenue - paidExpenses;
    const margin = totalRevenue > 0 ? (cashProfit / totalRevenue) * 100 : 0;

    return {
      revenue: totalRevenue,
      paidExpenses,
      pendingExpenses,
      profit: cashProfit,
      margin: margin
    };
  }, [revenues, expenses]);

  // Chart Data Preparation
  const dailyData = useMemo(() => {
    const data: Record<string, { name: string; revenue: number; expense: number }> = {};
    
    revenues.forEach(r => {
      const date = new Date(r.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      if (!data[date]) data[date] = { name: date, revenue: 0, expense: 0 };
      data[date].revenue += r.amount;
    });

    expenses.filter(e => e.status === 'paid').forEach(e => {
      const date = new Date(e.paidDate || e.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      if (!data[date]) data[date] = { name: date, revenue: 0, expense: 0 };
      data[date].expense += e.amount;
    });

    return Object.values(data).sort((a, b) => a.name.localeCompare(b.name)).slice(-7);
  }, [revenues, expenses]);

  const expenseByCategory = useMemo(() => {
    const cats: Record<string, number> = {};
    expenses.forEach(e => {
      cats[e.category] = (cats[e.category] || 0) + e.amount;
    });
    return Object.keys(cats).map(key => ({ name: key, value: cats[key] }));
  }, [expenses]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#EF4444', '#8B5CF6'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Visão Geral Financeira</h2>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Receita Total</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.revenue)}</h3>
            </div>
            <div className="p-2 bg-green-100 rounded-lg text-green-600">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Despesas Pagas</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.paidExpenses)}</h3>
            </div>
            <div className="p-2 bg-red-100 rounded-lg text-red-600">
              <TrendingDown size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">A Pagar (Pendente)</p>
              <h3 className="text-2xl font-bold text-orange-600 mt-1">{formatCurrency(stats.pendingExpenses)}</h3>
            </div>
            <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
              <Clock size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Saldo em Caixa</p>
              <h3 className={`text-2xl font-bold mt-1 ${stats.profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {formatCurrency(stats.profit)}
              </h3>
              <p className="text-xs text-gray-400 mt-1">Margem: {formatPercent(stats.margin)}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
              <DollarSign size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Fluxo de Caixa (Realizado)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Bar dataKey="revenue" name="Receita" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Despesa" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Despesas por Categoria</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={expenseByCategory}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
              >
                {expenseByCategory.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
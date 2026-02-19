import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Calendar, Download, TrendingUp, TrendingDown, AlertTriangle, ArrowUpCircle, ArrowDownCircle, CheckCircle } from 'lucide-react';

type TimeRange = 'daily' | 'weekly' | 'monthly';

export const Reports: React.FC = () => {
  const { revenues, expenses, ingredients } = useApp();
  const [timeRange, setTimeRange] = useState<TimeRange>('monthly');

  // Filter Logic
  const filteredData = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.setDate(now.getDate() - 7));
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const filterFn = (dateStr: string) => {
      const date = new Date(dateStr);
      if (timeRange === 'daily') return date >= todayStart;
      if (timeRange === 'weekly') return date >= weekStart;
      if (timeRange === 'monthly') return date >= monthStart;
      return true;
    };

    const filteredRevenues = revenues.filter(r => filterFn(r.date));
    const filteredExpenses = expenses.filter(e => filterFn(e.date)); // Using due date for report

    return { filteredRevenues, filteredExpenses };
  }, [revenues, expenses, timeRange]);

  // Combined Sorted Transactions (Ledger)
  const transactions = useMemo(() => {
    const entries = filteredData.filteredRevenues.map(r => ({
      id: r.id,
      date: r.date,
      description: r.description,
      amount: r.amount,
      type: 'entry' as const,
      category: r.category,
      status: 'paid' // Revenues are assumed realized upon entry in this simple app
    }));

    const exits = filteredData.filteredExpenses.map(e => ({
      id: e.id,
      date: e.date,
      description: e.description,
      amount: e.amount,
      type: 'exit' as const,
      category: e.category,
      status: e.status
    }));

    return [...entries, ...exits].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredData]);

  // Calculations
  const totalRevenue = filteredData.filteredRevenues.reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = filteredData.filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const netResult = totalRevenue - totalExpense;

  // Inventory Alerts (Items below min stock)
  const lowStockItems = ingredients.filter(i => i.stockQuantity <= i.minStock);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Relatórios Gerenciais</h2>
          <p className="text-gray-500">Acompanhamento detalhado de movimentações e estoque</p>
        </div>
        
        <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-200">
          {(['daily', 'weekly', 'monthly'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                timeRange === range
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {range === 'daily' ? 'Hoje' : range === 'weekly' ? '7 Dias' : 'Este Mês'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border-l-4 border-green-500 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Entradas (Receita)</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(totalRevenue)}</h3>
            </div>
            <div className="p-3 bg-green-50 text-green-600 rounded-full">
              <ArrowUpCircle size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border-l-4 border-red-500 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Saídas (Despesas)</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(totalExpense)}</h3>
            </div>
            <div className="p-3 bg-red-50 text-red-600 rounded-full">
              <ArrowDownCircle size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border-l-4 border-blue-500 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Resultado do Período</p>
              <h3 className={`text-2xl font-bold mt-1 ${netResult >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {formatCurrency(netResult)}
              </h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
              {netResult >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Transaction Ledger */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Calendar size={20} className="text-orange-600" /> 
              Extrato de Movimentações
            </h3>
            <button className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              <Download size={16} /> Exportar
            </button>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Data</th>
                    <th className="px-6 py-3 font-semibold">Descrição</th>
                    <th className="px-6 py-3 font-semibold">Categoria</th>
                    <th className="px-6 py-3 font-semibold text-right">Valor</th>
                    <th className="px-6 py-3 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-400">
                        Nenhuma movimentação neste período.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((t) => (
                      <tr key={t.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-gray-500">{formatDate(t.date)}</td>
                        <td className="px-6 py-3 font-medium text-gray-800">{t.description}</td>
                        <td className="px-6 py-3">
                          <span className={`px-2 py-1 rounded-md text-xs border ${
                            t.type === 'entry' 
                              ? 'bg-green-50 text-green-700 border-green-100' 
                              : 'bg-red-50 text-red-700 border-red-100'
                          }`}>
                            {t.category}
                          </span>
                        </td>
                        <td className={`px-6 py-3 text-right font-bold ${
                          t.type === 'entry' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {t.type === 'entry' ? '+' : '-'} {formatCurrency(t.amount)}
                        </td>
                        <td className="px-6 py-3 text-center">
                           {t.status === 'paid' ? (
                             <span title="Realizado" className="text-green-500"><CheckCircle size={16} className="mx-auto" /></span>
                           ) : (
                             <span title="Pendente" className="text-orange-400"><AlertTriangle size={16} className="mx-auto" /></span>
                           )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Stock Alerts & Insights */}
        <div className="space-y-6">
           <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <AlertTriangle size={20} className="text-red-500" /> 
              Alertas de Estoque
            </h3>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Itens Abaixo do Mínimo</h4>
              
              {lowStockItems.length === 0 ? (
                <div className="text-center py-4 text-green-600 bg-green-50 rounded-lg">
                  <CheckCircle className="mx-auto mb-2" size={24} />
                  <p className="text-sm font-medium">Estoque saudável!</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {lowStockItems.map(item => (
                    <li key={item.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100">
                      <div>
                        <p className="font-bold text-gray-800">{item.name}</p>
                        <p className="text-xs text-red-600">Mínimo: {item.minStock} {item.unit}</p>
                      </div>
                      <div className="text-right">
                        <span className="block text-xl font-bold text-red-700">{item.stockQuantity}</span>
                        <span className="text-xs text-red-500">{item.unit}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-slate-800 text-white p-5 rounded-xl shadow-lg">
               <h4 className="font-bold text-orange-400 mb-2">Dica Financeira</h4>
               <p className="text-sm text-slate-300 leading-relaxed">
                 {netResult < 0 
                   ? "Atenção! Suas despesas superaram as receitas neste período. Revise os custos com insumos e evite desperdícios na cozinha."
                   : "Ótimo trabalho! Mantenha o controle do fluxo de caixa e considere reinvestir o lucro em equipamentos para aumentar a produtividade."
                 }
               </p>
            </div>
        </div>
      </div>
    </div>
  );
};
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Ingredient, UnitType } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Plus, Trash2, Edit2, AlertTriangle, ArrowDownCircle, Package, Coffee, Box, Layers, History, ArrowUpCircle } from 'lucide-react';
import { MoneyInput } from '../components/MoneyInput';
import { AdminAuthModal } from '../components/AdminAuthModal';

export const Inventory: React.FC = () => {
  const { ingredients, stockMovements, addIngredient, updateIngredient, deleteIngredient, registerLoss, addStockEntry } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLossModalOpen, setIsLossModalOpen] = useState(false);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Admin Auth
  const [authOpen, setAuthOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<() => void>(() => {});
  const [actionTitle, setActionTitle] = useState("Autorizar Ação");

  // Ingredient Form State
  const [formData, setFormData] = useState<Omit<Ingredient, 'id'>>({
    name: '',
    category: 'Insumos',
    unit: 'kg',
    costPerUnit: 0,
    exitPrice: 0,
    stockQuantity: 0,
    minStock: 0
  });

  // Loss Form State
  const [lossData, setLossData] = useState({
    ingredientId: '',
    quantity: 0,
    reason: ''
  });

  // Entry Form State
  const [entryData, setEntryData] = useState({
    ingredientId: '',
    quantity: 0,
    costPerUnit: 0,
    reason: 'Reposição'
  });

  const requestAuth = (title: string, action: () => void) => {
    setActionTitle(title);
    setPendingAction(() => action);
    setAuthOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      // Protecting Edit
      requestAuth("Salvar Alterações", () => {
         updateIngredient(editingId, formData);
         closeModal();
      });
    } else {
      // Adding new is allowed
      addIngredient(formData);
      closeModal();
    }
  };

  const handleDelete = (id: string) => {
    requestAuth("Excluir Item", () => deleteIngredient(id));
  };

  const handleLossSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lossData.ingredientId && lossData.quantity > 0) {
        // Loss implies "removing" stock, but usually operational. 
        // Request assumes "remove item" or "change value" needs password. 
        // Let's protect Loss as it affects stock value significantly.
        requestAuth("Registrar Perda", () => {
            registerLoss(lossData.ingredientId, lossData.quantity, lossData.reason);
            closeLossModal();
        });
    }
  };

  const handleEntrySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (entryData.ingredientId && entryData.quantity > 0) {
        addStockEntry(entryData.ingredientId, entryData.quantity, entryData.costPerUnit, entryData.reason);
        closeEntryModal();
    }
  };

  const openModal = (ing?: Ingredient) => {
    if (ing) {
      setEditingId(ing.id);
      setFormData({
        name: ing.name,
        category: ing.category,
        unit: ing.unit,
        costPerUnit: ing.costPerUnit,
        exitPrice: ing.exitPrice || 0,
        stockQuantity: ing.stockQuantity,
        minStock: ing.minStock
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        category: 'Insumos',
        unit: 'kg',
        costPerUnit: 0,
        exitPrice: 0,
        stockQuantity: 0,
        minStock: 0
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const openLossModal = () => {
      setLossData({ ingredientId: ingredients[0]?.id || '', quantity: 0, reason: '' });
      setIsLossModalOpen(true);
  };
  const closeLossModal = () => setIsLossModalOpen(false);

  const openEntryModal = (ing?: Ingredient) => {
      setEntryData({ 
          ingredientId: ing ? ing.id : (ingredients[0]?.id || ''), 
          quantity: 0, 
          costPerUnit: ing ? ing.costPerUnit : 0,
          reason: 'Reposição'
      });
      setIsEntryModalOpen(true);
  };
  const closeEntryModal = () => setIsEntryModalOpen(false);

  // Helper for highlighting
  const getStockStatus = (current: number, min: number) => {
      if (current <= min) return 'critical';
      if (current <= min * 1.1) return 'warning';
      return 'ok';
  };

  // Group items by category
  const categories = ['Insumos', 'Bebidas', 'Embalagens', 'Outros'] as const;
  
  const getCategoryIcon = (cat: string) => {
    switch(cat) {
      case 'Insumos': return <Package className="text-orange-500" size={20} />;
      case 'Bebidas': return <Coffee className="text-blue-500" size={20} />;
      case 'Embalagens': return <Box className="text-brown-500" size={20} />;
      default: return <Layers className="text-gray-500" size={20} />;
    }
  };

  // Get history for editing item
  const currentHistory = editingId 
    ? stockMovements.filter(m => m.ingredientId === editingId).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  return (
    <div className="space-y-8 pb-10">
      <AdminAuthModal 
        isOpen={authOpen} 
        onClose={() => setAuthOpen(false)} 
        onConfirm={pendingAction}
        actionTitle={actionTitle}
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Estoque</h2>
          <p className="text-gray-500">Gerencie ingredientes e custos</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <button 
            onClick={openLossModal}
            className="flex-1 md:flex-none bg-red-100 text-red-600 border border-red-200 px-4 py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-red-200 transition"
            >
            <ArrowDownCircle size={18} />
            <span>Perda</span>
            </button>
            <button 
            onClick={() => openModal()}
            className="flex-1 md:flex-none bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-orange-700 transition"
            >
            <Plus size={18} />
            <span>Novo Item</span>
            </button>
        </div>
      </div>

      {ingredients.length === 0 && (
         <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <p className="text-gray-400">Nenhum insumo cadastrado.</p>
         </div>
      )}

      {categories.map(category => {
        const categoryItems = ingredients.filter(i => i.category === category);
        
        if (categoryItems.length === 0) return null;

        return (
          <div key={category} className="space-y-3">
            <div className="flex items-center space-x-2 px-1">
               {getCategoryIcon(category)}
               <h3 className="text-lg font-bold text-gray-800">{category}</h3>
               <span className="text-xs font-medium bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                 {categoryItems.length} itens
               </span>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[600px]">
                  <thead className="bg-gray-50 border-b border-gray-200 text-sm">
                    <tr>
                      <th className="px-6 py-4 font-semibold text-gray-700 w-1/3">Nome</th>
                      <th className="px-6 py-4 font-semibold text-gray-700 text-right">Custo Unit.</th>
                      <th className="px-6 py-4 font-semibold text-gray-700 text-center">Estoque</th>
                      <th className="px-6 py-4 font-semibold text-gray-700 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {categoryItems.map((ing) => {
                        const status = getStockStatus(ing.stockQuantity, ing.minStock);
                        return (
                            <tr key={ing.id} className={`hover:bg-gray-50 ${status === 'warning' ? 'bg-orange-50' : ''}`}>
                                <td className="px-6 py-4 font-medium text-gray-900">
                                  {ing.name}
                                  {status !== 'ok' && (
                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                      Baixo
                                    </span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-right text-gray-700">
                                {formatCurrency(ing.costPerUnit)} / {ing.unit}
                                </td>
                                <td className="px-6 py-4 text-center">
                                <div className="flex items-center justify-center space-x-2">
                                    <span className={`font-bold ${status === 'critical' ? 'text-red-600' : status === 'warning' ? 'text-orange-600' : 'text-gray-700'}`}>
                                    {ing.stockQuantity} {ing.unit}
                                    </span>
                                    {status !== 'ok' && (
                                    <span title={`Estoque Mínimo: ${ing.minStock}`}>
                                      <AlertTriangle size={16} className={status === 'critical' ? 'text-red-500' : 'text-orange-500'} />
                                    </span>
                                    )}
                                </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                <div className="flex justify-end space-x-2">
                                    <button onClick={() => openEntryModal(ing)} className="p-2 text-green-600 hover:bg-green-50 rounded" title="Lançar Entrada">
                                        <ArrowUpCircle size={16} />
                                    </button>
                                    <button onClick={() => openModal(ing)} className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="Editar">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(ing.id)} className="p-2 text-red-600 hover:bg-red-50 rounded" title="Excluir">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                </td>
                            </tr>
                        );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })}

      {/* Ingredient Modal (Edit/Create + History) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 my-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 text-gray-800">{editingId ? 'Editar Insumo' : 'Novo Insumo'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Item</label>
                <input 
                  type="text" 
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 outline-none"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                  <select 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value as any})}
                  >
                    <option value="Insumos">Insumos (Comida)</option>
                    <option value="Bebidas">Bebidas</option>
                    <option value="Embalagens">Embalagens</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
                  <select 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
                    value={formData.unit}
                    onChange={e => setFormData({...formData, unit: e.target.value as UnitType})}
                  >
                    <option value="un">Unidade (un)</option>
                    <option value="kg">Quilo (kg)</option>
                    <option value="l">Litro (l)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Custo Unit. (R$)</label>
                  <MoneyInput 
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
                    value={formData.costPerUnit}
                    onChange={val => setFormData({...formData, costPerUnit: val})}
                  />
                </div>
                 <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preço Saída (R$)</label>
                  <MoneyInput 
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
                    value={formData.exitPrice}
                    onChange={val => setFormData({...formData, exitPrice: val})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estoque Atual</label>
                  <input 
                    type="number" step="0.001" min="0" required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
                    value={formData.stockQuantity}
                    onChange={e => setFormData({...formData, stockQuantity: parseFloat(e.target.value)})}
                  />
                </div>
                 <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estoque Mínimo</label>
                  <input 
                    type="number" step="0.001" min="0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
                    value={formData.minStock}
                    onChange={e => setFormData({...formData, minStock: parseFloat(e.target.value)})}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 border-b border-gray-200 pb-4">
                <button 
                  type="button" 
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  Salvar
                </button>
              </div>
            </form>

            {/* History Section within Modal */}
            {editingId && (
                <div className="mt-6">
                    <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <History size={16} /> Histórico de Movimentações
                    </h4>
                    <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden max-h-48 overflow-y-auto">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-gray-100 text-gray-500">
                                <tr>
                                    <th className="px-3 py-2">Data</th>
                                    <th className="px-3 py-2">Tipo</th>
                                    <th className="px-3 py-2">Qtd</th>
                                    <th className="px-3 py-2">Motivo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {currentHistory.length === 0 ? (
                                    <tr><td colSpan={4} className="p-3 text-center text-gray-400">Sem histórico.</td></tr>
                                ) : (
                                    currentHistory.map(h => (
                                        <tr key={h.id}>
                                            <td className="px-3 py-2 text-gray-900">{formatDate(h.date)}</td>
                                            <td className="px-3 py-2">
                                                <span className={`px-1.5 py-0.5 rounded ${
                                                    h.type === 'entry' ? 'bg-green-100 text-green-700' : 
                                                    h.type === 'loss' ? 'bg-red-100 text-red-700' : 'bg-gray-200'
                                                }`}>
                                                    {h.type === 'entry' ? 'E' : h.type === 'loss' ? 'P' : 'A'}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 font-medium text-gray-900">
                                                {h.type === 'entry' ? '+' : '-'}{h.quantity}
                                            </td>
                                            <td className="px-3 py-2 text-gray-500 truncate max-w-[100px]">{h.reason}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
          </div>
        </div>
      )}

      {/* Stock Entry Modal */}
      {isEntryModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                <h3 className="text-xl font-bold mb-4 text-green-600 flex items-center gap-2">
                    <ArrowUpCircle size={24} /> Entrada de Estoque
                </h3>
                <form onSubmit={handleEntrySubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Produto/Insumo</label>
                        <select 
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none bg-gray-50"
                            value={entryData.ingredientId}
                            disabled
                        >
                            {ingredients.map(ing => (
                                <option key={ing.id} value={ing.id}>{ing.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade a Adicionar</label>
                        <input 
                            type="number" step="0.001" min="0" required
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
                            value={entryData.quantity}
                            onChange={e => setEntryData({...entryData, quantity: parseFloat(e.target.value)})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Novo Custo Unitário</label>
                        <MoneyInput 
                            placeholder="R$ 0,00"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
                            value={entryData.costPerUnit}
                            onChange={val => setEntryData({...entryData, costPerUnit: val})}
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Motivo / Observação</label>
                        <input 
                            type="text" 
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
                            value={entryData.reason}
                            onChange={e => setEntryData({...entryData, reason: e.target.value})}
                        />
                    </div>
                    <div className="flex justify-end space-x-3 mt-6">
                        <button 
                        type="button" 
                        onClick={closeEntryModal}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                        >
                        Cancelar
                        </button>
                        <button 
                        type="submit" 
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                        Confirmar
                        </button>
                    </div>
                </form>
            </div>
          </div>
      )}

      {/* Loss Modal */}
      {isLossModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                <h3 className="text-xl font-bold mb-4 text-red-600">Registrar Perda</h3>
                <form onSubmit={handleLossSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Produto/Insumo</label>
                        <select 
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
                            value={lossData.ingredientId}
                            onChange={e => setLossData({...lossData, ingredientId: e.target.value})}
                        >
                            <option value="">Selecione...</option>
                            {ingredients.map(ing => (
                                <option key={ing.id} value={ing.id}>{ing.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Qtd Perdida</label>
                        <input 
                            type="number" step="0.001" min="0" required
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
                            value={lossData.quantity}
                            onChange={e => setLossData({...lossData, quantity: parseFloat(e.target.value)})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
                        <input 
                            type="text" 
                            required
                            placeholder="Ex: Vencimento..."
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
                            value={lossData.reason}
                            onChange={e => setLossData({...lossData, reason: e.target.value})}
                        />
                    </div>
                    <div className="flex justify-end space-x-3 mt-6">
                        <button 
                        type="button" 
                        onClick={closeLossModal}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                        >
                        Cancelar
                        </button>
                        <button 
                        type="submit" 
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                        Confirmar
                        </button>
                    </div>
                </form>
            </div>
          </div>
      )}
    </div>
  );
};
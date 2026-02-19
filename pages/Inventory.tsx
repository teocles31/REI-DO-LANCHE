import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Ingredient, UnitType } from '../types';
import { formatCurrency } from '../utils/formatters';
import { Plus, Trash2, Edit2, AlertTriangle, ArrowDownCircle } from 'lucide-react';

export const Inventory: React.FC = () => {
  const { ingredients, addIngredient, updateIngredient, deleteIngredient, registerLoss } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLossModalOpen, setIsLossModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateIngredient(editingId, formData);
    } else {
      addIngredient(formData);
    }
    closeModal();
  };

  const handleLossSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lossData.ingredientId && lossData.quantity > 0) {
        registerLoss(lossData.ingredientId, lossData.quantity, lossData.reason);
        closeLossModal();
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

  // Helper for highlighting: 10% threshold or below min
  const getStockStatus = (current: number, min: number) => {
      if (current <= min) return 'critical'; // Red
      if (current <= min * 1.1) return 'warning'; // Orange (10% threshold)
      return 'ok';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Estoque de Insumos</h2>
          <p className="text-gray-500">Gerencie ingredientes, custos e perdas</p>
        </div>
        <div className="flex gap-2">
            <button 
            onClick={openLossModal}
            className="bg-red-100 text-red-600 border border-red-200 px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-red-200 transition"
            >
            <ArrowDownCircle size={18} />
            <span>Lançar Perda</span>
            </button>
            <button 
            onClick={() => openModal()}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-orange-700 transition"
            >
            <Plus size={18} />
            <span>Novo Insumo</span>
            </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200 text-sm">
            <tr>
              <th className="px-6 py-4 font-semibold text-gray-700">Nome</th>
              <th className="px-6 py-4 font-semibold text-gray-700">Categoria</th>
              <th className="px-6 py-4 font-semibold text-gray-700 text-right">Custo Unit.</th>
              <th className="px-6 py-4 font-semibold text-gray-700 text-right">Preço Saída</th>
              <th className="px-6 py-4 font-semibold text-gray-700 text-center">Estoque</th>
              <th className="px-6 py-4 font-semibold text-gray-700 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {ingredients.map((ing) => {
                const status = getStockStatus(ing.stockQuantity, ing.minStock);
                return (
                    <tr key={ing.id} className={`hover:bg-gray-50 ${status === 'warning' ? 'bg-orange-50' : ''}`}>
                        <td className="px-6 py-4 font-medium text-gray-900">{ing.name}</td>
                        <td className="px-6 py-4 text-gray-600">
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs">{ing.category}</span>
                        </td>
                        <td className="px-6 py-4 text-right text-gray-700">
                        {formatCurrency(ing.costPerUnit)}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-700">
                        {formatCurrency(ing.exitPrice)}
                        </td>
                        <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                            <span className={`font-medium ${status === 'critical' ? 'text-red-600' : status === 'warning' ? 'text-orange-600' : 'text-gray-700'}`}>
                            {ing.stockQuantity} {ing.unit}
                            </span>
                            {status !== 'ok' && (
                            <span title="Estoque Baixo!">
                              <AlertTriangle size={16} className={status === 'critical' ? 'text-red-500' : 'text-orange-500'} />
                            </span>
                            )}
                        </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                            <button onClick={() => openModal(ing)} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                            <Edit2 size={16} />
                            </button>
                            <button onClick={() => deleteIngredient(ing.id)} className="p-2 text-red-600 hover:bg-red-50 rounded">
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

      {/* Ingredient Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
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
                  <input 
                    type="number" step="0.01" min="0" required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
                    value={formData.costPerUnit}
                    onChange={e => setFormData({...formData, costPerUnit: parseFloat(e.target.value)})}
                  />
                </div>
                 <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preço Saída/Venda (R$)</label>
                  <input 
                    type="number" step="0.01" min="0" required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
                    value={formData.exitPrice}
                    onChange={e => setFormData({...formData, exitPrice: parseFloat(e.target.value)})}
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

              <div className="flex justify-end space-x-3 mt-6">
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
          </div>
        </div>
      )}

      {/* Loss Modal */}
      {isLossModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                <h3 className="text-xl font-bold mb-4 text-red-600">Registrar Perda de Estoque</h3>
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
                                <option key={ing.id} value={ing.id}>{ing.name} (Atual: {ing.stockQuantity} {ing.unit})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade Perdida</label>
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
                            placeholder="Ex: Vencimento, Avaria..."
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
                        Confirmar Perda
                        </button>
                    </div>
                </form>
            </div>
          </div>
      )}
    </div>
  );
};
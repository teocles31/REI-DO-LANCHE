import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Product, ProductIngredient } from '../types';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

export const Products: React.FC = () => {
  const { products, ingredients, addProduct, deleteProduct, getProductCost } = useApp();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);

  // New Product State
  const [newProduct, setNewProduct] = useState<{
    name: string;
    description: string;
    price: number;
    ingredients: ProductIngredient[];
  }>({
    name: '',
    description: '',
    price: 0,
    ingredients: []
  });

  const [selectedIngId, setSelectedIngId] = useState<string>('');
  const [selectedQty, setSelectedQty] = useState<number>(0);

  const handleAddIngredient = () => {
    if (selectedIngId && selectedQty > 0) {
      setNewProduct(prev => ({
        ...prev,
        ingredients: [...prev.ingredients, { ingredientId: selectedIngId, quantity: selectedQty }]
      }));
      setSelectedIngId('');
      setSelectedQty(0);
    }
  };

  const handleRemoveIngredient = (index: number) => {
    setNewProduct(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const handleSaveProduct = () => {
    if (newProduct.name && newProduct.price > 0) {
      addProduct(newProduct);
      setNewProduct({ name: '', description: '', price: 0, ingredients: [] });
      setIsFormOpen(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedProductId(expandedProductId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Cardápio & Engenharia de Menu</h2>
          <p className="text-gray-500">Defina os produtos, suas receitas e analise as margens.</p>
        </div>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-orange-700 transition"
        >
          <Plus size={18} />
          <span>Novo Produto</span>
        </button>
      </div>

      {/* Product Creation Form */}
      {isFormOpen && (
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 animate-fade-in">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Novo Produto</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome do Produto</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-orange-500"
                  value={newProduct.name}
                  onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Descrição</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
                  value={newProduct.description}
                  onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Preço de Venda (R$)</label>
                <input 
                  type="number" step="0.01"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
                  value={newProduct.price}
                  onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})}
                />
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-700 mb-2">Composição (Receita)</h4>
              <div className="flex space-x-2 mb-3">
                <select 
                  className="flex-1 border border-gray-300 rounded-lg px-2 py-1 text-sm"
                  value={selectedIngId}
                  onChange={e => setSelectedIngId(e.target.value)}
                >
                  <option value="">Selecione Insumo...</option>
                  {ingredients.map(ing => (
                    <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                  ))}
                </select>
                <input 
                  type="number" step="0.001" placeholder="Qtd"
                  className="w-20 border border-gray-300 rounded-lg px-2 py-1 text-sm"
                  value={selectedQty}
                  onChange={e => setSelectedQty(parseFloat(e.target.value))}
                />
                <button 
                  onClick={handleAddIngredient}
                  className="bg-green-600 text-white p-1.5 rounded hover:bg-green-700"
                >
                  <Plus size={16} />
                </button>
              </div>
              
              <ul className="space-y-2 max-h-40 overflow-y-auto">
                {newProduct.ingredients.map((item, idx) => {
                  const ing = ingredients.find(i => i.id === item.ingredientId);
                  return (
                    <li key={idx} className="flex justify-between items-center text-sm bg-white p-2 rounded shadow-sm">
                      <span>{ing?.name} ({item.quantity} {ing?.unit})</span>
                      <button onClick={() => handleRemoveIngredient(idx)} className="text-red-500 hover:text-red-700">
                        <Trash2 size={14} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
             <button 
               onClick={() => setIsFormOpen(false)}
               className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
             >
               Cancelar
             </button>
             <button 
               onClick={handleSaveProduct}
               className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
             >
               Salvar Produto
             </button>
          </div>
        </div>
      )}

      {/* Product List */}
      <div className="grid grid-cols-1 gap-4">
        {products.map(product => {
          const cost = getProductCost(product);
          const margin = product.price - cost;
          const marginPercent = product.price > 0 ? (margin / product.price) * 100 : 0;
          const isExpanded = expandedProductId === product.id;

          return (
            <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all">
              <div 
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                onClick={() => toggleExpand(product.id)}
              >
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800">{product.name}</h3>
                  <p className="text-gray-500 text-sm">{product.description}</p>
                </div>
                
                <div className="flex items-center space-x-8 mr-4">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Preço Venda</p>
                    <p className="font-bold text-gray-900">{formatCurrency(product.price)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Custo Total</p>
                    <p className="font-bold text-red-600">{formatCurrency(cost)}</p>
                  </div>
                  <div className="text-right hidden md:block">
                     <p className="text-xs text-gray-500">Margem</p>
                     <div className={`font-bold ${marginPercent < 30 ? 'text-orange-500' : 'text-green-600'}`}>
                       {formatPercent(marginPercent)}
                     </div>
                  </div>
                </div>

                <div className="text-gray-400">
                  {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>

              {isExpanded && (
                <div className="bg-gray-50 p-4 border-t border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Detalhamento de Custos:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ul className="space-y-1">
                      {product.ingredients.map((item, idx) => {
                        const ing = ingredients.find(i => i.id === item.ingredientId);
                        const itemCost = ing ? ing.costPerUnit * item.quantity : 0;
                        return (
                          <li key={idx} className="flex justify-between text-sm text-gray-600 border-b border-gray-200 py-1">
                            <span>{ing?.name} ({item.quantity} {ing?.unit})</span>
                            <span>{formatCurrency(itemCost)}</span>
                          </li>
                        );
                      })}
                    </ul>
                    <div className="flex flex-col justify-end items-end space-y-2">
                       <div className="text-right text-sm">
                          <span className="text-gray-500">Lucro Bruto por Unidade:</span>
                          <span className="ml-2 font-bold text-green-600">{formatCurrency(margin)}</span>
                       </div>
                       <button 
                         onClick={(e) => { e.stopPropagation(); deleteProduct(product.id); }}
                         className="flex items-center space-x-1 text-red-500 text-sm hover:text-red-700 mt-4"
                       >
                         <Trash2 size={16} /> 
                         <span>Excluir Produto</span>
                       </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
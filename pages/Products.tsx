import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Product, ProductIngredient, ProductComplement, ProductCategory, ProductAddOn } from '../types';
import { formatCurrency, formatPercent, generateId } from '../utils/formatters';
import { Plus, Trash2, ChevronDown, ChevronUp, Layers, X, Edit2, Zap } from 'lucide-react';
import { MoneyInput } from '../components/MoneyInput';
import { AdminAuthModal } from '../components/AdminAuthModal';

export const Products: React.FC = () => {
  const { products, ingredients, addProduct, updateProduct, deleteProduct, getProductCost } = useApp();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Admin Auth
  const [authOpen, setAuthOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<() => void>(() => {});
  const [actionTitle, setActionTitle] = useState("Autorizar Ação");

  // New Product State
  const [newProduct, setNewProduct] = useState<{
    name: string;
    description: string;
    price: number;
    category: ProductCategory;
    ingredients: ProductIngredient[];
    complements: ProductComplement[];
    addOns: ProductAddOn[];
  }>({
    name: '',
    description: '',
    price: 0,
    category: 'Lanches',
    ingredients: [],
    complements: [],
    addOns: []
  });

  // Ingredient Selection State
  const [selectedIngId, setSelectedIngId] = useState<string>('');
  const [selectedQty, setSelectedQty] = useState<number>(0);

  // Complement Creation State
  const [compTitle, setCompTitle] = useState('');
  const [compMax, setCompMax] = useState(1);
  const [compRequired, setCompRequired] = useState(false);
  const [compOptionsStr, setCompOptionsStr] = useState(''); 

  // Add-on Creation State
  const [addOnName, setAddOnName] = useState('');
  const [addOnPrice, setAddOnPrice] = useState(0);

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

  const handleAddComplement = () => {
    if (compTitle && compOptionsStr) {
        const options = compOptionsStr.split(',').map(s => s.trim()).filter(s => s !== '');
        if (options.length > 0) {
            setNewProduct(prev => ({
                ...prev,
                complements: [
                    ...prev.complements, 
                    { title: compTitle, maxSelection: compMax, required: compRequired, options }
                ]
            }));
            setCompTitle('');
            setCompOptionsStr('');
            setCompMax(1);
            setCompRequired(false);
        }
    }
  };

  const handleRemoveComplement = (index: number) => {
    setNewProduct(prev => ({
      ...prev,
      complements: prev.complements.filter((_, i) => i !== index)
    }));
  };

  const handleAddAddOn = () => {
      if (addOnName) {
          setNewProduct(prev => ({
              ...prev,
              addOns: [...prev.addOns, { id: generateId(), name: addOnName, price: addOnPrice }]
          }));
          setAddOnName('');
          setAddOnPrice(0);
      }
  };

  const handleRemoveAddOn = (index: number) => {
      setNewProduct(prev => ({
          ...prev,
          addOns: prev.addOns.filter((_, i) => i !== index)
      }));
  };

  const resetForm = () => {
    setNewProduct({ name: '', description: '', price: 0, category: 'Lanches', ingredients: [], complements: [], addOns: [] });
    setEditingProductId(null);
    setIsFormOpen(false);
  };

  const handleSaveProduct = () => {
    if (newProduct.name && newProduct.price > 0) {
      if (editingProductId) {
          // Update
          requestAuth("Editar Produto", () => {
              updateProduct(editingProductId, newProduct);
              resetForm();
          });
      } else {
          // Create
          addProduct(newProduct);
          resetForm();
      }
    }
  };

  const handleEditProduct = (product: Product) => {
      setEditingProductId(product.id);
      setNewProduct({
          name: product.name,
          description: product.description,
          price: product.price,
          category: product.category,
          ingredients: [...product.ingredients],
          complements: [...(product.complements || [])],
          addOns: [...(product.addOns || [])]
      });
      setIsFormOpen(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const requestAuth = (title: string, action: () => void) => {
    setActionTitle(title);
    setPendingAction(() => action);
    setAuthOpen(true);
  };

  const handleDelete = (id: string) => {
    requestAuth("Excluir Produto", () => deleteProduct(id));
  };

  const toggleExpand = (id: string) => {
    setExpandedProductId(expandedProductId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <AdminAuthModal 
        isOpen={authOpen} 
        onClose={() => setAuthOpen(false)} 
        onConfirm={pendingAction}
        actionTitle={actionTitle}
      />

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">Cardápio</h2>
        </div>
        <button 
          onClick={() => { resetForm(); setIsFormOpen(true); }}
          className="bg-orange-600 text-white px-3 py-2 rounded-lg flex items-center space-x-2 hover:bg-orange-700 transition text-sm md:text-base"
        >
          <Plus size={18} />
          <span>Novo Produto</span>
        </button>
      </div>

      {/* Product Creation/Edit Form */}
      {isFormOpen && (
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-md border border-gray-200 animate-fade-in">
          <h3 className="text-lg font-bold text-gray-800 mb-4">{editingProductId ? 'Editar Produto' : 'Novo Produto'}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Basic Info */}
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
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Categoria</label>
                    <select 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none bg-white"
                      value={newProduct.category}
                      onChange={e => setNewProduct({...newProduct, category: e.target.value as ProductCategory})}
                    >
                        <option value="Lanches">Lanches</option>
                        <option value="Bebidas">Bebidas</option>
                        <option value="Combos">Combos</option>
                        <option value="Porções">Porções</option>
                        <option value="Sobremesas">Sobremesas</option>
                        <option value="Outros">Outros</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Preço (R$)</label>
                    <MoneyInput 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
                      value={newProduct.price}
                      onChange={val => setNewProduct({...newProduct, price: val})}
                    />
                  </div>
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
            </div>

            {/* Right Column: Recipe */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-700 mb-2">Composição (Receita)</h4>
              <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 mb-3">
                <select 
                  className="flex-1 border border-gray-300 rounded-lg px-2 py-2 md:py-1 text-sm bg-white"
                  value={selectedIngId}
                  onChange={e => setSelectedIngId(e.target.value)}
                >
                  <option value="">Selecione Insumo...</option>
                  {ingredients.map(ing => (
                    <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                  ))}
                </select>
                <div className="flex gap-2">
                    <input 
                    type="number" step="0.001" placeholder="Qtd"
                    className="w-20 flex-1 md:flex-none border border-gray-300 rounded-lg px-2 py-2 md:py-1 text-sm"
                    value={selectedQty}
                    onChange={e => setSelectedQty(parseFloat(e.target.value))}
                    />
                    <button 
                    onClick={handleAddIngredient}
                    className="bg-green-600 text-white p-2 md:p-1.5 rounded hover:bg-green-700"
                    >
                    <Plus size={16} />
                    </button>
                </div>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 border-t border-gray-200 pt-4">
              {/* Complements Section */}
              <div className="">
                <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <Layers size={18} className="text-orange-500"/> Complementos (Opções)
                </h4>
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-100 mb-3">
                    <div className="space-y-3 mb-3">
                        <input 
                            placeholder="Título (Ex: Ponto da Carne)" 
                            className="w-full border p-2 rounded text-sm"
                            value={compTitle}
                            onChange={e => setCompTitle(e.target.value)}
                        />
                        <input 
                            placeholder="Opções (Ex: Ao Ponto, Bem Passada)" 
                            className="w-full border p-2 rounded text-sm"
                            value={compOptionsStr}
                            onChange={e => setCompOptionsStr(e.target.value)}
                        />
                        <div className="flex gap-2">
                            <input 
                                type="number" min="1" placeholder="Max" className="w-16 border p-2 rounded text-sm"
                                value={compMax} onChange={e => setCompMax(parseInt(e.target.value))}
                            />
                            <div className="flex items-center gap-1 bg-white px-2 rounded border">
                                <input type="checkbox" checked={compRequired} onChange={e => setCompRequired(e.target.checked)} id="reqCheck" />
                                <label htmlFor="reqCheck" className="text-xs">Obrig?</label>
                            </div>
                            <button onClick={handleAddComplement} className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 flex-1 flex justify-center items-center">
                                <Plus size={16} />
                            </button>
                        </div>
                    </div>
                    
                    {newProduct.complements && newProduct.complements.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {newProduct.complements.map((comp, idx) => (
                                <div key={idx} className="bg-white border border-orange-200 rounded px-2 py-1 text-xs flex items-center gap-2">
                                    <span>{comp.title} ({comp.options.length})</span>
                                    <button onClick={() => handleRemoveComplement(idx)} className="text-red-500"><X size={12} /></button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
              </div>

              {/* Add-ons (Acréscimos) Section */}
              <div className="">
                  <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                      <Zap size={18} className="text-yellow-500"/> Acréscimos (Extras)
                  </h4>
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 mb-3">
                      <div className="flex gap-2 mb-3">
                          <input 
                              placeholder="Nome (Ex: Bacon Extra)" 
                              className="flex-1 border p-2 rounded text-sm"
                              value={addOnName}
                              onChange={e => setAddOnName(e.target.value)}
                          />
                          <div className="w-24">
                             <MoneyInput 
                                value={addOnPrice} 
                                onChange={setAddOnPrice} 
                                placeholder="R$ 0,00"
                                className="w-full border p-2 rounded text-sm"
                             />
                          </div>
                          <button onClick={handleAddAddOn} className="bg-yellow-600 text-white p-2 rounded hover:bg-yellow-700">
                              <Plus size={16} />
                          </button>
                      </div>

                      {newProduct.addOns && newProduct.addOns.length > 0 && (
                          <div className="flex flex-col gap-2 max-h-32 overflow-y-auto">
                              {newProduct.addOns.map((addon, idx) => (
                                  <div key={idx} className="bg-white border border-yellow-200 rounded px-3 py-2 text-sm flex justify-between items-center">
                                      <span>{addon.name}</span>
                                      <div className="flex items-center gap-3">
                                          <span className="font-bold text-green-600">+{formatCurrency(addon.price)}</span>
                                          <button onClick={() => handleRemoveAddOn(idx)} className="text-red-500 hover:text-red-700">
                                              <Trash2 size={14} />
                                          </button>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
             <button 
               onClick={resetForm}
               className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
             >
               Cancelar
             </button>
             <button 
               onClick={handleSaveProduct}
               className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
             >
               Salvar
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
                className="p-4 flex flex-col md:flex-row md:items-center justify-between cursor-pointer hover:bg-gray-50 gap-4 md:gap-0"
                onClick={() => toggleExpand(product.id)}
              >
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                        <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded uppercase mr-2">
                            {product.category}
                        </span>
                        <h3 className="text-lg font-bold text-gray-800 inline">{product.name}</h3>
                    </div>
                    <div className="text-gray-400 md:hidden">
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>
                  <p className="text-gray-500 text-sm mt-1">{product.description}</p>
                </div>
                
                <div className="flex items-center justify-between md:space-x-8 md:mr-4 border-t md:border-t-0 pt-4 md:pt-0 border-gray-100">
                  <div className="text-left md:text-right">
                    <p className="text-xs text-gray-500">Venda</p>
                    <p className="font-bold text-gray-900">{formatCurrency(product.price)}</p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-xs text-gray-500">Custo</p>
                    <p className="font-bold text-red-600">{formatCurrency(cost)}</p>
                  </div>
                  <div className="text-right">
                     <p className="text-xs text-gray-500">Margem</p>
                     <div className={`font-bold ${marginPercent < 30 ? 'text-orange-500' : 'text-green-600'}`}>
                       {formatPercent(marginPercent)}
                     </div>
                  </div>
                </div>

                <div className="text-gray-400 hidden md:block">
                  {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>

              {isExpanded && (
                <div className="bg-gray-50 p-4 border-t border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Detalhamento:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs font-bold text-gray-500 mb-1">INGREDIENTES</p>
                        <ul className="space-y-1 mb-3">
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

                        {(product.complements && product.complements.length > 0) && (
                            <div className="mb-2">
                                <p className="text-xs font-bold text-gray-500 mb-1">COMPLEMENTOS</p>
                                <div className="flex flex-wrap gap-2">
                                    {product.complements.map((c, i) => (
                                        <span key={i} className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                                            {c.title}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {(product.addOns && product.addOns.length > 0) && (
                            <div>
                                <p className="text-xs font-bold text-gray-500 mb-1">ACRÉSCIMOS (EXTRAS)</p>
                                <div className="flex flex-wrap gap-2">
                                    {product.addOns.map((a, i) => (
                                        <span key={i} className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                            {a.name} (+{formatCurrency(a.price)})
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col justify-end items-end space-y-2">
                       <div className="text-right text-sm">
                          <span className="text-gray-500">Lucro Bruto:</span>
                          <span className="ml-2 font-bold text-green-600">{formatCurrency(margin)}</span>
                       </div>
                       <div className="flex gap-2 mt-4">
                           <button 
                             onClick={(e) => { e.stopPropagation(); handleEditProduct(product); }}
                             className="flex items-center space-x-1 text-blue-600 text-sm hover:text-blue-800 bg-white border border-blue-200 px-3 py-1.5 rounded shadow-sm hover:bg-blue-50"
                           >
                             <Edit2 size={16} /> 
                             <span>Editar</span>
                           </button>
                           <button 
                             onClick={(e) => { e.stopPropagation(); handleDelete(product.id); }}
                             className="flex items-center space-x-1 text-red-500 text-sm hover:text-red-700 bg-white border border-red-200 px-3 py-1.5 rounded shadow-sm hover:bg-red-50"
                           >
                             <Trash2 size={16} /> 
                             <span>Excluir</span>
                           </button>
                       </div>
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
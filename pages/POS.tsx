import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Product, OrderItem, PaymentMethod, ProductCategory, Order, Customer, ProductAddOn } from '../types';
import { formatCurrency, generateId, formatDate } from '../utils/formatters';
import { ShoppingCart, Search, Plus, Minus, CheckCircle, User, MapPin, Phone, History, LayoutGrid, List, Printer, Trash2, Users, FileEdit } from 'lucide-react';
import { MoneyInput } from '../components/MoneyInput';

export const POS: React.FC = () => {
  const { products, processOrder, customers, orders, deleteOrder, saveCustomer } = useApp();
  const [activeTab, setActiveTab] = useState<'new_order' | 'history'>('new_order');

  // New Order State
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'Todos'>('Todos');
  
  // Checkout Form
  const [phone, setPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [deliveryType, setDeliveryType] = useState<'retirada' | 'entrega' | 'mesa'>('retirada');
  const [address, setAddress] = useState('');
  const [reference, setReference] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Dinheiro');
  const [changeFor, setChangeFor] = useState(0);
  const [isCheckoutSuccess, setIsCheckoutSuccess] = useState(false);

  // Modal State for Options (Complements, Add-ons, Observation)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [pendingComplements, setPendingComplements] = useState<Record<string, string[]>>({}); 
  const [pendingAddOns, setPendingAddOns] = useState<ProductAddOn[]>([]);
  const [pendingObservation, setPendingObservation] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal State for Customer Selection
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [isNewCustomerMode, setIsNewCustomerMode] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({ name: '', phone: '', address: '', reference: '' });

  // Printing State
  const [orderToPrint, setOrderToPrint] = useState<Order | null>(null);

  // Visual History State (Timestamp to filter visible orders)
  const [historyClearTime, setHistoryClearTime] = useState<number>(() => {
      const saved = localStorage.getItem('pos_history_clear_time');
      return saved ? parseInt(saved) : 0;
  });

  // Filter Products
  const filteredProducts = products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
  });

  // Filter Visible Orders based on clear time
  const visibleOrders = useMemo(() => {
    return orders.filter(o => new Date(o.date).getTime() > historyClearTime);
  }, [orders, historyClearTime]);

  // Trigger print dialog automatically when orderToPrint is set
  useEffect(() => {
    if (orderToPrint) {
      const timer = setTimeout(() => {
        window.print();
        setOrderToPrint(null); 
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [orderToPrint]);

  // Categories
  const categories: (ProductCategory | 'Todos')[] = ['Todos', 'Lanches', 'Combos', 'Porções', 'Bebidas', 'Sobremesas', 'Outros'];

  // Customer Selection Logic
  const filteredCustomers = customers.filter(c => 
     c.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) || 
     c.phone.includes(customerSearchTerm)
  );

  const handleSelectCustomer = (customer: Customer) => {
      setCustomerName(customer.name);
      setPhone(customer.phone);
      setAddress(customer.address || '');
      setReference(customer.reference || '');
      setIsCustomerModalOpen(false);
  };

  const handleCreateCustomer = () => {
      if (!newCustomerForm.name || !newCustomerForm.phone) {
          alert("Nome e Telefone são obrigatórios.");
          return;
      }
      
      const newCustomer = {
          name: newCustomerForm.name,
          phone: newCustomerForm.phone,
          address: newCustomerForm.address,
          reference: newCustomerForm.reference
      };
      
      saveCustomer(newCustomer);
      
      setCustomerName(newCustomer.name);
      setPhone(newCustomer.phone);
      setAddress(newCustomer.address);
      setReference(newCustomer.reference);
      
      setIsCustomerModalOpen(false);
      setIsNewCustomerMode(false);
      setNewCustomerForm({ name: '', phone: '', address: '', reference: '' });
  };

  const handleClearHistory = () => {
      if (confirm('Deseja limpar a lista de pedidos da tela? \n\nNota: Os valores financeiros continuarão salvos nos relatórios.')) {
          const now = Date.now();
          setHistoryClearTime(now);
          localStorage.setItem('pos_history_clear_time', now.toString());
      }
  };

  const handleDeleteOrder = (orderId: string) => {
    if (window.confirm("ATENÇÃO: Deseja excluir este pedido permanentemente?\n\nEsta ação irá:\n1. Estornar o valor do caixa (Financeiro).\n2. Devolver os itens ao estoque.\n3. Remover dos relatórios de vendas.")) {
        deleteOrder(orderId);
    }
  };

  // Cart Logic
  const addToCart = (product: Product, selectedComplements: string[], selectedAddOns: ProductAddOn[], observation: string) => {
    // Calculate price including add-ons
    const addOnsTotal = selectedAddOns.reduce((acc, curr) => acc + curr.price, 0);
    const finalUnitPrice = product.price + addOnsTotal;

    const existingItemIndex = cart.findIndex(
        item => item.productId === product.id && 
        JSON.stringify(item.selectedComplements.sort()) === JSON.stringify(selectedComplements.sort()) &&
        JSON.stringify(item.selectedAddOns.map(a => a.id).sort()) === JSON.stringify(selectedAddOns.map(a => a.id).sort()) &&
        item.observation === observation
    );

    if (existingItemIndex > -1) {
      const newCart = [...cart];
      newCart[existingItemIndex].quantity += 1;
      newCart[existingItemIndex].total = newCart[existingItemIndex].quantity * newCart[existingItemIndex].unitPrice;
      setCart(newCart);
    } else {
      setCart([...cart, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: finalUnitPrice,
        total: finalUnitPrice,
        selectedComplements,
        selectedAddOns,
        observation
      }]);
    }
  };

  const handleProductClick = (product: Product) => {
    // Always open modal to allow observation and extras
    setSelectedProduct(product);
    setPendingComplements({});
    setPendingAddOns([]);
    setPendingObservation('');
    setIsModalOpen(true);
  };

  const handleConfirmProductOptions = () => {
    if (selectedProduct) {
       // Validation
       for (const comp of (selectedProduct.complements || [])) {
           const selected = pendingComplements[comp.title] || [];
           if (comp.required && selected.length === 0) {
               alert(`Por favor selecione uma opção para: ${comp.title}`);
               return;
           }
       }

       const allComplements = Object.values(pendingComplements).flat() as string[];
       addToCart(selectedProduct, allComplements, pendingAddOns, pendingObservation);
       setIsModalOpen(false);
       setSelectedProduct(null);
    }
  };

  const handleComplementToggle = (title: string, option: string, max: number) => {
      setPendingComplements(prev => {
          const current = prev[title] || [];
          if (current.includes(option)) {
              return { ...prev, [title]: current.filter(o => o !== option) };
          } else {
              if (current.length < max) {
                  return { ...prev, [title]: [...current, option] };
              } else {
                  if (max === 1) return { ...prev, [title]: [option] };
                  return prev;
              }
          }
      });
  };

  const handleAddOnToggle = (addon: ProductAddOn) => {
      setPendingAddOns(prev => {
          const exists = prev.find(a => a.id === addon.id);
          if (exists) {
              return prev.filter(a => a.id !== addon.id);
          } else {
              return [...prev, addon];
          }
      });
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const updateQuantity = (index: number, delta: number) => {
    const newCart = [...cart];
    newCart[index].quantity += delta;
    if (newCart[index].quantity <= 0) {
      removeFromCart(index);
    } else {
      newCart[index].total = newCart[index].quantity * newCart[index].unitPrice;
      setCart(newCart);
    }
  };

  const totalAmount = cart.reduce((acc, item) => acc + item.total, 0);

  const handleFinalizeOrder = () => {
    if (cart.length === 0) return;
    if (!customerName) {
        alert("Preencha o nome do cliente.");
        return;
    }

    const newOrder: Order = {
        id: generateId(),
        date: new Date().toISOString(),
        customerName,
        customerPhone: phone,
        deliveryType,
        address,
        reference,
        paymentMethod,
        changeFor: paymentMethod === 'Dinheiro' ? changeFor : undefined,
        items: cart,
        totalAmount,
        status: 'completed'
    };

    processOrder(newOrder);
    setIsCheckoutSuccess(true);
    
    // Reset Form
    setTimeout(() => {
        setIsCheckoutSuccess(false);
        setCart([]);
        setCustomerName('');
        setPhone('');
        setAddress('');
        setReference('');
        setChangeFor(0);
    }, 2000);
  };

  if (activeTab === 'history') {
      return (
          <div className="h-full flex flex-col animate-fade-in bg-gray-100">
              <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <button onClick={() => setActiveTab('new_order')} className="bg-white p-2 rounded-lg shadow-sm text-gray-600 hover:text-orange-600 transition">
                        ← Voltar ao PDV
                    </button>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <History /> Histórico de Pedidos
                    </h2>
                  </div>
                  <button 
                    onClick={handleClearHistory}
                    className="flex items-center gap-2 bg-red-100 text-red-600 px-4 py-2 rounded-lg hover:bg-red-200 transition text-sm font-medium"
                  >
                      <Trash2 size={16} /> Limpar Tela
                  </button>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 overflow-y-auto">
                 <table className="w-full text-left">
                     <thead className="bg-gray-50 border-b border-gray-200 text-gray-700">
                         <tr>
                             <th className="px-6 py-4">ID / Data</th>
                             <th className="px-6 py-4">Cliente</th>
                             <th className="px-6 py-4">Tipo</th>
                             <th className="px-6 py-4">Pagamento</th>
                             <th className="px-6 py-4 text-right">Total</th>
                             <th className="px-6 py-4 text-center">Itens</th>
                             <th className="px-6 py-4 text-center">Ações</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                         {visibleOrders.length === 0 ? (
                             <tr><td colSpan={7} className="text-center py-10 text-gray-400">Nenhum pedido recente.</td></tr>
                         ) : (
                             visibleOrders.map(order => (
                                 <tr key={order.id} className="hover:bg-gray-50">
                                     <td className="px-6 py-3">
                                         <span className="font-mono text-xs text-gray-400">#{order.id.slice(0,4)}</span>
                                         <div className="text-sm text-gray-800">{formatDate(order.date)}</div>
                                     </td>
                                     <td className="px-6 py-3">
                                         <div className="font-bold text-gray-800">{order.customerName}</div>
                                         <div className="text-xs text-gray-500">{order.customerPhone || '-'}</div>
                                     </td>
                                     <td className="px-6 py-3">
                                         <span className={`px-2 py-1 rounded text-xs font-medium border ${
                                             order.deliveryType === 'entrega' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                             order.deliveryType === 'retirada' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                             'bg-purple-50 text-purple-700 border-purple-100'
                                         }`}>
                                             {order.deliveryType.toUpperCase()}
                                         </span>
                                     </td>
                                     <td className="px-6 py-3 text-sm text-gray-600">
                                         {order.paymentMethod}
                                         {order.changeFor && order.changeFor > 0 && (
                                             <span className="text-xs block text-gray-400">Troco p/ {formatCurrency(order.changeFor)}</span>
                                         )}
                                     </td>
                                     <td className="px-6 py-3 text-right font-bold text-green-700">
                                         {formatCurrency(order.totalAmount)}
                                     </td>
                                     <td className="px-6 py-3 text-center">
                                         <div className="text-xs text-gray-500">
                                             {order.items.length} itens
                                             <div title={order.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')} className="cursor-help underline decoration-dotted">ver</div>
                                         </div>
                                     </td>
                                     <td className="px-6 py-3 text-center">
                                         <div className="flex justify-center gap-2">
                                             <button 
                                                onClick={() => setOrderToPrint(order)}
                                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-lg transition-colors flex items-center justify-center"
                                                title="Imprimir Cupom"
                                             >
                                                 <Printer size={18} />
                                             </button>
                                              <button 
                                                onClick={() => handleDeleteOrder(order.id)}
                                                className="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-lg transition-colors flex items-center justify-center"
                                                title="Excluir Pedido"
                                             >
                                                 <Trash2 size={18} />
                                             </button>
                                         </div>
                                     </td>
                                 </tr>
                             ))
                         )}
                     </tbody>
                 </table>
              </div>
              
              {/* Invisible Print Component (Only visible in Print Dialog) */}
              <div id="printable-content">
                {orderToPrint && (
                    <>
                        <div className="print-center print-bold" style={{ fontSize: '10pt', marginBottom: '2mm' }}>REI DO LANCHE</div>
                        <div className="print-center">Pedido: #{orderToPrint.id.slice(0,4)}</div>
                        <div className="print-center">{new Date(orderToPrint.date).toLocaleString('pt-BR')}</div>
                        <div className="print-divider"></div>
                        <div className="print-left">
                           Cliente: {orderToPrint.customerName}<br/>
                           Tel: {orderToPrint.customerPhone || 'N/A'}<br/>
                           Tipo: {orderToPrint.deliveryType.toUpperCase()}
                        </div>
                        {orderToPrint.deliveryType === 'entrega' && (
                             <div className="print-left" style={{ marginTop: '1mm', fontSize: '6.90pt' }}>
                                 End: {orderToPrint.address}<br/>
                                 Ref: {orderToPrint.reference}
                             </div>
                        )}
                        <div className="print-divider"></div>
                        {orderToPrint.items.map((item, i) => (
                            <div key={i} style={{ marginBottom: '1mm', fontSize: '7pt' }}>
                                <div className="print-row">
                                    <span style={{ width: '10%' }}>{item.quantity}x</span>
                                    <span style={{ width: '65%' }}>{item.productName}</span>
                                    <span style={{ width: '25%', textAlign: 'right' }}>{formatCurrency(item.total).replace('R$', '').trim()}</span>
                                </div>
                                {item.selectedComplements.length > 0 && (
                                    <div style={{ fontSize: '6pt', paddingLeft: '10%' }}>
                                        + {item.selectedComplements.join(', ')}
                                    </div>
                                )}
                                {item.selectedAddOns.length > 0 && (
                                    <div style={{ fontSize: '6pt', paddingLeft: '10%' }}>
                                        + Extras: {item.selectedAddOns.map(a => a.name).join(', ')}
                                    </div>
                                )}
                                {item.observation && (
                                    <div style={{ fontSize: '6pt', paddingLeft: '10%', fontStyle: 'italic' }}>
                                        Obs: {item.observation}
                                    </div>
                                )}
                            </div>
                        ))}
                        <div className="print-divider"></div>
                        <div className="print-row print-bold" style={{ fontSize: '8pt' }}>
                            <span>TOTAL:</span>
                            <span>{formatCurrency(orderToPrint.totalAmount)}</span>
                        </div>
                        <div className="print-divider"></div>
                        <div className="print-left">
                            Pagamento: {orderToPrint.paymentMethod}<br/>
                            {orderToPrint.paymentMethod === 'Dinheiro' && orderToPrint.changeFor && (
                                <>Troco para: {formatCurrency(orderToPrint.changeFor)}<br/>
                                  Devolver: {formatCurrency(orderToPrint.changeFor - orderToPrint.totalAmount)}
                                </>
                            )}
                        </div>
                        <div className="print-center" style={{ marginTop: '4mm' }}>
                            Obrigado pela preferência!<br/>
                            Volte sempre.
                        </div>
                    </>
                )}
              </div>
          </div>
      );
  }

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col md:flex-row gap-4 animate-fade-in pb-4 relative">
      
      {/* Invisible Print Component Container */}
      <div id="printable-content">
        {orderToPrint && (
            <>
                <div className="print-center print-bold" style={{ fontSize: '10pt', marginBottom: '2mm' }}>REI DO LANCHE</div>
                <div className="print-center">Pedido: #{orderToPrint.id.slice(0,4)}</div>
                <div className="print-center">{new Date(orderToPrint.date).toLocaleString('pt-BR')}</div>
                <div className="print-divider"></div>
                <div className="print-left">
                    Cliente: {orderToPrint.customerName}<br/>
                    Tel: {orderToPrint.customerPhone || 'N/A'}<br/>
                    Tipo: {orderToPrint.deliveryType.toUpperCase()}
                </div>
                {orderToPrint.deliveryType === 'entrega' && (
                        <div className="print-left" style={{ marginTop: '1mm', fontSize: '6.90pt' }}>
                            End: {orderToPrint.address}<br/>
                            Ref: {orderToPrint.reference}
                        </div>
                )}
                <div className="print-divider"></div>
                {orderToPrint.items.map((item, i) => (
                    <div key={i} style={{ marginBottom: '1mm', fontSize: '7pt' }}>
                        <div className="print-row">
                            <span style={{ width: '10%' }}>{item.quantity}x</span>
                            <span style={{ width: '65%' }}>{item.productName}</span>
                            <span style={{ width: '25%', textAlign: 'right' }}>{formatCurrency(item.total).replace('R$', '').trim()}</span>
                        </div>
                        {item.selectedComplements.length > 0 && (
                            <div style={{ fontSize: '6pt', paddingLeft: '10%' }}>
                                + {item.selectedComplements.join(', ')}
                            </div>
                        )}
                        {item.selectedAddOns.length > 0 && (
                            <div style={{ fontSize: '6pt', paddingLeft: '10%' }}>
                                + Extras: {item.selectedAddOns.map(a => a.name).join(', ')}
                            </div>
                        )}
                        {item.observation && (
                            <div style={{ fontSize: '6pt', paddingLeft: '10%', fontStyle: 'italic' }}>
                                Obs: {item.observation}
                            </div>
                        )}
                    </div>
                ))}
                <div className="print-divider"></div>
                <div className="print-row print-bold" style={{ fontSize: '8pt' }}>
                    <span>TOTAL:</span>
                    <span>{formatCurrency(orderToPrint.totalAmount)}</span>
                </div>
                <div className="print-divider"></div>
                <div className="print-left">
                    Pagamento: {orderToPrint.paymentMethod}<br/>
                    {orderToPrint.paymentMethod === 'Dinheiro' && orderToPrint.changeFor && (
                        <>Troco para: {formatCurrency(orderToPrint.changeFor)}<br/>
                            Devolver: {formatCurrency(orderToPrint.changeFor - orderToPrint.totalAmount)}
                        </>
                    )}
                </div>
                <div className="print-center" style={{ marginTop: '4mm' }}>
                    Obrigado pela preferência!<br/>
                    Volte sempre.
                </div>
            </>
        )}
      </div>

      {/* Left: Product Catalog */}
      <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
         {/* Top Bar: Search & Categories */}
         <div className="p-4 border-b border-gray-100 bg-gray-50 space-y-3">
             <div className="flex justify-between items-center">
                 <div className="flex items-center gap-2">
                    <LayoutGrid size={20} className="text-orange-600" />
                    <h2 className="font-bold text-gray-800">Catálogo</h2>
                 </div>
                 <button 
                    onClick={() => setActiveTab('history')} 
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-md transition-all font-medium text-sm"
                 >
                     <List size={18} /> 
                     <span>Ver Histórico</span>
                 </button>
             </div>
             <div className="flex gap-2">
                 <div className="bg-white border border-gray-300 rounded-lg flex items-center px-3 py-2 flex-1 shadow-sm">
                    <Search size={20} className="text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Buscar produto..." 
                        className="ml-2 outline-none w-full text-sm"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                 </div>
             </div>
             {/* Categories */}
             <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                 {categories.map(cat => (
                     <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                            selectedCategory === cat 
                            ? 'bg-orange-600 text-white shadow-md' 
                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                     >
                         {cat}
                     </button>
                 ))}
             </div>
         </div>

         {/* Grid */}
         <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredProducts.map(product => (
                    <div 
                        key={product.id} 
                        onClick={() => handleProductClick(product)}
                        className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm hover:shadow-md cursor-pointer transition-all active:scale-95 flex flex-col justify-between h-32 md:h-40"
                    >
                        <div>
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded uppercase">{product.category}</span>
                            </div>
                            <h3 className="font-bold text-gray-800 text-sm leading-tight line-clamp-2">{product.name}</h3>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{product.description}</p>
                        </div>
                        <div className="flex justify-between items-end mt-2">
                             <span className="font-bold text-orange-600">{formatCurrency(product.price)}</span>
                             <div className="bg-orange-100 text-orange-600 p-1.5 rounded-full">
                                <Plus size={16} />
                             </div>
                        </div>
                    </div>
                ))}
            </div>
         </div>
      </div>

      {/* Right: Cart & Checkout */}
      <div className="w-full md:w-96 bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col">
         <div className="p-4 bg-slate-900 text-white flex items-center justify-between rounded-t-xl">
             <div className="flex items-center gap-2">
                 <ShoppingCart size={20} />
                 <span className="font-bold">Pedido Atual</span>
             </div>
             <span className="bg-orange-600 text-xs px-2 py-0.5 rounded-full font-bold">{cart.length} itens</span>
         </div>

         {/* Cart Items */}
         <div className="flex-1 overflow-y-auto p-4 space-y-3">
             {cart.length === 0 ? (
                 <div className="text-center py-10 text-gray-400">
                     <ShoppingCart size={48} className="mx-auto mb-2 opacity-20" />
                     <p>Selecione produtos ao lado</p>
                 </div>
             ) : (
                 cart.map((item, idx) => (
                     <div key={idx} className="flex flex-col border-b border-gray-100 pb-3">
                         <div className="flex justify-between items-start">
                             <div className="flex-1">
                                 <div className="font-medium text-gray-800">{item.productName}</div>
                                 {/* Item Details */}
                                 <div className="text-xs text-gray-500 space-y-0.5 mt-0.5">
                                     {item.selectedComplements.length > 0 && (
                                         <div className="italic">+ {item.selectedComplements.join(', ')}</div>
                                     )}
                                     {item.selectedAddOns.length > 0 && (
                                         <div className="text-orange-600">
                                            + Extras: {item.selectedAddOns.map(a => a.name).join(', ')}
                                         </div>
                                     )}
                                     {item.observation && (
                                         <div className="text-blue-600 italic border-l-2 border-blue-200 pl-1 mt-1">
                                            Obs: {item.observation}
                                         </div>
                                     )}
                                 </div>
                             </div>
                             <div className="font-bold text-gray-900 ml-2">
                                 {formatCurrency(item.total)}
                             </div>
                         </div>
                         <div className="flex justify-between items-center mt-2">
                             <div className="flex items-center gap-3 bg-gray-100 rounded-lg px-2 py-1">
                                 <button onClick={() => updateQuantity(idx, -1)} className="text-gray-500 hover:text-red-500"><Minus size={14} /></button>
                                 <span className="text-sm font-bold w-4 text-center text-gray-800">{item.quantity}</span>
                                 <button onClick={() => updateQuantity(idx, 1)} className="text-gray-500 hover:text-green-500"><Plus size={14} /></button>
                             </div>
                             <button onClick={() => removeFromCart(idx)} className="text-xs text-red-400 hover:text-red-600 underline">remover</button>
                         </div>
                     </div>
                 ))
             )}
         </div>

         {/* Customer Info Form */}
         <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-3">
             <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                 <div className="flex justify-between items-center mb-2">
                     <div className="flex items-center gap-2 text-blue-800 font-bold text-sm">
                         <User size={16} />
                         {customerName ? 'Cliente Selecionado' : 'Identificar Cliente'}
                     </div>
                     <button 
                        onClick={() => {
                            setIsCustomerModalOpen(true);
                            setCustomerSearchTerm('');
                            setIsNewCustomerMode(false);
                        }}
                        className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition"
                     >
                         {customerName ? 'Trocar' : 'Selecionar'}
                     </button>
                 </div>
                 
                 {customerName ? (
                     <div className="text-sm text-gray-700 space-y-1">
                         <div className="font-bold">{customerName}</div>
                         <div className="flex items-center gap-1 text-xs text-gray-500">
                             <Phone size={12} /> {phone}
                         </div>
                         {address && (
                            <div className="flex items-start gap-1 text-xs text-gray-500">
                                <MapPin size={12} className="mt-0.5 min-w-[12px]"/> 
                                <span className="line-clamp-1">{address}</span>
                            </div>
                         )}
                     </div>
                 ) : (
                     <div className="text-xs text-blue-400 italic">
                         Nenhum cliente vinculado.
                     </div>
                 )}
             </div>
             
             <div className="flex gap-2">
                 <select 
                    className="flex-1 bg-white border border-gray-300 rounded-lg text-sm px-2 py-1.5 outline-none text-gray-700"
                    value={deliveryType}
                    onChange={e => setDeliveryType(e.target.value as any)}
                 >
                     <option value="retirada">Retirada</option>
                     <option value="entrega">Entrega</option>
                     <option value="mesa">Mesa</option>
                 </select>

                 <select 
                    className="flex-1 bg-white border border-gray-300 rounded-lg text-sm px-2 py-1.5 outline-none text-gray-700"
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                 >
                     <option value="Dinheiro">Dinheiro</option>
                     <option value="PIX">PIX</option>
                     <option value="Debito">Débito</option>
                     <option value="Credito">Crédito</option>
                 </select>
             </div>

             {deliveryType === 'entrega' && (
                 <div className="space-y-2 animate-fade-in text-sm">
                     <input 
                        className="w-full bg-white border border-gray-300 rounded-lg px-2 py-1.5 outline-none text-gray-700" 
                        placeholder="Endereço"
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                     />
                     <input 
                        className="w-full bg-white border border-gray-300 rounded-lg px-2 py-1.5 outline-none text-gray-700" 
                        placeholder="Ponto de Referência"
                        value={reference}
                        onChange={e => setReference(e.target.value)}
                    />
                 </div>
             )}

             {paymentMethod === 'Dinheiro' && (
                 <div>
                     <MoneyInput 
                        placeholder="Troco p/ R$" 
                        className="w-full bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-sm outline-none text-gray-700"
                        value={changeFor}
                        onChange={setChangeFor}
                     />
                 </div>
             )}

             <div className="border-t border-gray-200 pt-3 mt-2">
                 <div className="flex justify-between items-end mb-3">
                     <span className="text-gray-600 font-medium">Total</span>
                     <span className="text-2xl font-bold text-gray-900">{formatCurrency(totalAmount)}</span>
                 </div>
                 {paymentMethod === 'Dinheiro' && changeFor > totalAmount && (
                     <div className="flex justify-between items-center mb-3 text-sm">
                         <span className="text-gray-500">Troco a devolver:</span>
                         <span className="font-bold text-green-600">{formatCurrency(changeFor - totalAmount)}</span>
                     </div>
                 )}
                 <button 
                    onClick={handleFinalizeOrder}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg shadow-md transition-colors flex justify-center items-center gap-2"
                 >
                     <CheckCircle size={20} /> Finalizar Pedido
                 </button>
             </div>
         </div>
      </div>

      {/* Success Overlay */}
      {isCheckoutSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white p-8 rounded-2xl flex flex-col items-center animate-bounce">
                  <div className="bg-green-100 text-green-600 p-4 rounded-full mb-4">
                      <CheckCircle size={48} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">Pedido Realizado!</h2>
                  <p className="text-gray-500">Enviado para produção.</p>
              </div>
          </div>
      )}

      {/* Options Modal (Complements + Add-ons + Observation) */}
      {isModalOpen && selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
              <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto flex flex-col">
                  <div className="p-4 border-b border-gray-100 bg-gray-50 sticky top-0 z-10">
                      <h3 className="font-bold text-lg text-gray-800">{selectedProduct.name}</h3>
                      <p className="text-sm text-gray-500">{formatCurrency(selectedProduct.price)} (Base)</p>
                  </div>
                  
                  <div className="p-4 space-y-6 flex-1 overflow-y-auto">
                      {/* Complements */}
                      {(selectedProduct.complements || []).map((comp, idx) => {
                          const currentSelected = pendingComplements[comp.title] || [];
                          return (
                            <div key={idx}>
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-bold text-gray-700">{comp.title}</h4>
                                    <span className="text-xs bg-gray-200 px-2 py-0.5 rounded text-gray-600">
                                        Max: {comp.maxSelection} {comp.required && '(Obrigatório)'}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {comp.options.map(opt => {
                                        const isSelected = currentSelected.includes(opt);
                                        return (
                                            <button
                                                key={opt}
                                                onClick={() => handleComplementToggle(comp.title, opt, comp.maxSelection)}
                                                className={`text-sm py-2 px-3 rounded-lg border transition-all ${
                                                    isSelected 
                                                    ? 'bg-orange-600 text-white border-orange-600 font-medium' 
                                                    : 'bg-white text-gray-600 border-gray-300 hover:border-orange-400'
                                                }`}
                                            >
                                                {opt}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                          );
                      })}

                      {/* Add-ons (Acréscimos) */}
                      {(selectedProduct.addOns && selectedProduct.addOns.length > 0) && (
                          <div>
                              <div className="flex justify-between items-center mb-2">
                                  <h4 className="font-bold text-gray-700">Acréscimos</h4>
                                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">Opcional</span>
                              </div>
                              <div className="space-y-2">
                                  {selectedProduct.addOns.map(addon => {
                                      const isSelected = pendingAddOns.some(a => a.id === addon.id);
                                      return (
                                          <button
                                              key={addon.id}
                                              onClick={() => handleAddOnToggle(addon)}
                                              className={`w-full flex justify-between items-center text-sm py-2 px-3 rounded-lg border transition-all ${
                                                  isSelected 
                                                  ? 'bg-yellow-50 border-yellow-500 ring-1 ring-yellow-500' 
                                                  : 'bg-white border-gray-300 hover:bg-gray-50'
                                              }`}
                                          >
                                              <span className={isSelected ? 'font-bold text-gray-800' : 'text-gray-600'}>{addon.name}</span>
                                              <span className="font-semibold text-green-600">+{formatCurrency(addon.price)}</span>
                                          </button>
                                      );
                                  })}
                              </div>
                          </div>
                      )}

                      {/* Observation */}
                      <div>
                          <div className="flex justify-between items-center mb-2">
                              <h4 className="font-bold text-gray-700 flex items-center gap-2">
                                  <FileEdit size={16} /> Observação
                              </h4>
                              <span className="text-xs text-gray-400">Opcional</span>
                          </div>
                          <textarea 
                              className="w-full border border-gray-300 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-orange-500"
                              rows={3}
                              placeholder="Ex: Sem cebola, caprichar no molho..."
                              value={pendingObservation}
                              onChange={e => setPendingObservation(e.target.value)}
                          />
                      </div>
                  </div>

                  <div className="p-4 border-t border-gray-100 flex gap-3 sticky bottom-0 bg-white">
                      <button 
                        onClick={() => setIsModalOpen(false)}
                        className="flex-1 py-3 text-gray-600 bg-gray-100 rounded-lg font-medium hover:bg-gray-200"
                      >
                          Cancelar
                      </button>
                      <button 
                        onClick={handleConfirmProductOptions}
                        className="flex-1 py-3 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700 shadow-md flex justify-center items-center gap-1"
                      >
                          Adicionar 
                          <span>
                              {formatCurrency(selectedProduct.price + pendingAddOns.reduce((acc, curr) => acc + curr.price, 0))}
                          </span>
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Customer Selection Modal */}
      {isCustomerModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
              <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
                  <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-xl">
                      <h3 className="text-lg font-bold text-gray-800">Identificação do Cliente</h3>
                      <button onClick={() => setIsCustomerModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                          <Plus size={24} className="rotate-45" /> {/* Close Icon */}
                      </button>
                  </div>
                  
                  <div className="p-4">
                      {/* Tabs */}
                      <div className="flex gap-2 mb-4">
                          <button 
                            onClick={() => setIsNewCustomerMode(false)}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                                !isNewCustomerMode ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                              Buscar Existente
                          </button>
                          <button 
                            onClick={() => setIsNewCustomerMode(true)}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                                isNewCustomerMode ? 'bg-orange-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                              + Novo Cliente
                          </button>
                      </div>

                      {isNewCustomerMode ? (
                          <div className="space-y-3 animate-fade-in">
                              <div>
                                  <label className="text-xs font-bold text-gray-600">Nome</label>
                                  <input 
                                    className="w-full border p-2 rounded outline-none focus:border-orange-500"
                                    placeholder="Nome do cliente"
                                    value={newCustomerForm.name}
                                    onChange={e => setNewCustomerForm({...newCustomerForm, name: e.target.value})}
                                    autoFocus
                                  />
                              </div>
                              <div>
                                  <label className="text-xs font-bold text-gray-600">Telefone</label>
                                  <input 
                                    className="w-full border p-2 rounded outline-none focus:border-orange-500"
                                    placeholder="Ex: (00) 00000-0000"
                                    value={newCustomerForm.phone}
                                    onChange={e => setNewCustomerForm({...newCustomerForm, phone: e.target.value})}
                                  />
                              </div>
                              <div>
                                  <label className="text-xs font-bold text-gray-600">Endereço</label>
                                  <input 
                                    className="w-full border p-2 rounded outline-none focus:border-orange-500"
                                    placeholder="Rua, Número, Bairro"
                                    value={newCustomerForm.address}
                                    onChange={e => setNewCustomerForm({...newCustomerForm, address: e.target.value})}
                                  />
                              </div>
                              <div>
                                  <label className="text-xs font-bold text-gray-600">Referência</label>
                                  <input 
                                    className="w-full border p-2 rounded outline-none focus:border-orange-500"
                                    placeholder="Opcional"
                                    value={newCustomerForm.reference}
                                    onChange={e => setNewCustomerForm({...newCustomerForm, reference: e.target.value})}
                                  />
                              </div>
                              <button 
                                onClick={handleCreateCustomer}
                                className="w-full bg-orange-600 text-white py-3 rounded-lg font-bold shadow-lg hover:bg-orange-700 mt-2"
                              >
                                  Cadastrar e Selecionar
                              </button>
                          </div>
                      ) : (
                          <div className="space-y-4 animate-fade-in">
                               <div className="relative">
                                   <Search className="absolute left-3 top-2.5 text-gray-400" size={18}/>
                                   <input 
                                      className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:border-blue-500"
                                      placeholder="Buscar por nome ou telefone..."
                                      value={customerSearchTerm}
                                      onChange={e => setCustomerSearchTerm(e.target.value)}
                                      autoFocus
                                   />
                               </div>
                               
                               <div className="h-64 overflow-y-auto border rounded-lg divide-y divide-gray-100">
                                   {filteredCustomers.length === 0 ? (
                                       <div className="p-4 text-center text-gray-400 text-sm">
                                           Nenhum cliente encontrado.
                                       </div>
                                   ) : (
                                       filteredCustomers.map(c => (
                                           <button 
                                              key={c.id}
                                              onClick={() => handleSelectCustomer(c)}
                                              className="w-full text-left p-3 hover:bg-blue-50 flex justify-between items-center group transition-colors"
                                           >
                                               <div>
                                                   <div className="font-bold text-gray-800">{c.name}</div>
                                                   <div className="text-xs text-gray-500">{c.phone}</div>
                                               </div>
                                               <div className="text-blue-600 opacity-0 group-hover:opacity-100 font-medium text-sm">
                                                   Selecionar →
                                               </div>
                                           </button>
                                       ))
                                   )}
                               </div>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
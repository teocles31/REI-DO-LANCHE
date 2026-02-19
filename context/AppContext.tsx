import React, { createContext, useContext, useState, useEffect } from 'react';
import { Ingredient, Product, Revenue, Expense, StockMovement, Employee, Order, Customer } from '../types';
import { generateId } from '../utils/formatters';

interface AppContextProps {
  currentUser: string;
  ingredients: Ingredient[];
  products: Product[];
  revenues: Revenue[];
  expenses: Expense[];
  stockMovements: StockMovement[];
  employees: Employee[];
  customers: Customer[];
  orders: Order[]; // Historico de pedidos
  addIngredient: (ing: Omit<Ingredient, 'id'>) => void;
  updateIngredient: (id: string, ing: Partial<Ingredient>) => void;
  addProduct: (prod: Omit<Product, 'id' | 'totalCost' | 'margin' | 'marginPercent'>) => void;
  addRevenue: (rev: Omit<Revenue, 'id'>) => void;
  addExpense: (exp: Omit<Expense, 'id'>) => void;
  updateExpense: (id: string, exp: Partial<Expense>) => void;
  deleteProduct: (id: string) => void;
  deleteIngredient: (id: string) => void;
  deleteExpense: (id: string) => void;
  deleteRevenue: (id: string) => void;
  registerLoss: (ingredientId: string, quantity: number, reason: string) => void;
  addStockEntry: (ingredientId: string, quantity: number, costPerUnit: number, reason?: string) => void;
  getProductCost: (product: Product) => number;
  addEmployee: (emp: Omit<Employee, 'id'>) => void;
  updateEmployee: (id: string, emp: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  processOrder: (order: Order) => void;
  deleteOrder: (orderId: string) => void;
  saveCustomer: (customerData: Omit<Customer, 'id' | 'lastOrderDate' | 'totalOrders'>) => void;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

// Initial Data for new users
const INITIAL_INGREDIENTS: Ingredient[] = [
  { id: '1', name: 'Pão Brioche', category: 'Insumos', unit: 'un', costPerUnit: 1.50, exitPrice: 0, stockQuantity: 100, minStock: 20 },
  { id: '2', name: 'Carne Moída (Blend)', category: 'Insumos', unit: 'kg', costPerUnit: 35.00, exitPrice: 0, stockQuantity: 10, minStock: 5 },
  { id: '3', name: 'Queijo Cheddar', category: 'Insumos', unit: 'kg', costPerUnit: 45.00, exitPrice: 0, stockQuantity: 5, minStock: 2 },
  { id: '4', name: 'Bacon Fatiado', category: 'Insumos', unit: 'kg', costPerUnit: 40.00, exitPrice: 0, stockQuantity: 3, minStock: 1 },
  { id: '5', name: 'Coca-Cola Lata', category: 'Bebidas', unit: 'un', costPerUnit: 2.50, exitPrice: 6.00, stockQuantity: 48, minStock: 12 },
];

const INITIAL_PRODUCTS: Product[] = [
  { 
    id: 'p1', 
    name: 'X-Bacon Clássico', 
    description: 'Pão, 150g carne, cheddar, bacon',
    price: 32.00,
    category: 'Lanches',
    ingredients: [
      { ingredientId: '1', quantity: 1 }, // 1 pão
      { ingredientId: '2', quantity: 0.150 }, // 150g carne
      { ingredientId: '3', quantity: 0.030 }, // 30g queijo
      { ingredientId: '4', quantity: 0.040 }, // 40g bacon
    ],
    complements: [
      { 
        title: "Ponto da Carne", 
        maxSelection: 1, 
        required: true,
        options: ["Mal Passada", "Ao Ponto", "Bem Passada"] 
      },
      { 
        title: "Molho Extra", 
        maxSelection: 1, 
        required: false,
        options: ["Maionese Verde", "Barbecue", "Alho"] 
      }
    ]
  },
  { 
    id: 'p2', 
    name: 'Coca-Cola', 
    description: 'Lata 350ml',
    price: 6.00,
    category: 'Bebidas',
    ingredients: [
      { ingredientId: '5', quantity: 1 }
    ]
  }
];

export const AppProvider: React.FC<{ children: React.ReactNode; currentUser: string }> = ({ children, currentUser }) => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Dynamic Keys based on User
  const getKeys = (user: string) => ({
    INGREDIENTS: `${user}_ingredients`,
    PRODUCTS: `${user}_products`,
    REVENUES: `${user}_revenues`,
    EXPENSES: `${user}_expenses`,
    STOCK: `${user}_stock_movements`,
    EMPLOYEES: `${user}_employees`,
    CUSTOMERS: `${user}_customers`,
    ORDERS: `${user}_orders`,
  });

  const loadData = () => {
    if (!currentUser) return;
    const keys = getKeys(currentUser);

    const load = (key: string, initial: any) => {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : initial;
    };

    setIngredients(load(keys.INGREDIENTS, INITIAL_INGREDIENTS));
    setProducts(load(keys.PRODUCTS, INITIAL_PRODUCTS));
    setRevenues(load(keys.REVENUES, []));
    setExpenses(load(keys.EXPENSES, []));
    setStockMovements(load(keys.STOCK, []));
    setEmployees(load(keys.EMPLOYEES, []));
    setCustomers(load(keys.CUSTOMERS, []));
    setOrders(load(keys.ORDERS, []));
  };

  useEffect(() => { loadData(); }, [currentUser]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
        if (e.key && e.key.startsWith(currentUser)) loadData();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [currentUser]);

  useEffect(() => { if (currentUser) localStorage.setItem(getKeys(currentUser).INGREDIENTS, JSON.stringify(ingredients)); }, [ingredients, currentUser]);
  useEffect(() => { if (currentUser) localStorage.setItem(getKeys(currentUser).PRODUCTS, JSON.stringify(products)); }, [products, currentUser]);
  useEffect(() => { if (currentUser) localStorage.setItem(getKeys(currentUser).REVENUES, JSON.stringify(revenues)); }, [revenues, currentUser]);
  useEffect(() => { if (currentUser) localStorage.setItem(getKeys(currentUser).EXPENSES, JSON.stringify(expenses)); }, [expenses, currentUser]);
  useEffect(() => { if (currentUser) localStorage.setItem(getKeys(currentUser).STOCK, JSON.stringify(stockMovements)); }, [stockMovements, currentUser]);
  useEffect(() => { if (currentUser) localStorage.setItem(getKeys(currentUser).EMPLOYEES, JSON.stringify(employees)); }, [employees, currentUser]);
  useEffect(() => { if (currentUser) localStorage.setItem(getKeys(currentUser).CUSTOMERS, JSON.stringify(customers)); }, [customers, currentUser]);
  useEffect(() => { if (currentUser) localStorage.setItem(getKeys(currentUser).ORDERS, JSON.stringify(orders)); }, [orders, currentUser]);

  const getProductCost = (product: Product): number => {
    return product.ingredients.reduce((total, item) => {
      const ing = ingredients.find(i => i.id === item.ingredientId);
      return total + (ing ? ing.costPerUnit * item.quantity : 0);
    }, 0);
  };

  const addIngredient = (data: Omit<Ingredient, 'id'>) => {
    const newId = generateId();
    setIngredients(prev => [...prev, { ...data, id: newId }]);
    if (data.stockQuantity > 0) {
      setStockMovements(prev => [{
        id: generateId(),
        ingredientId: newId,
        type: 'entry',
        quantity: data.stockQuantity,
        date: new Date().toISOString(),
        reason: 'Estoque Inicial',
        cost: data.costPerUnit
      }, ...prev]);
    }
  };

  const updateIngredient = (id: string, data: Partial<Ingredient>) => {
    setIngredients(prev => prev.map(i => i.id === id ? { ...i, ...data } : i));
  };

  const deleteIngredient = (id: string) => {
    setIngredients(prev => prev.filter(i => i.id !== id));
  };

  const addProduct = (data: Omit<Product, 'id' | 'totalCost' | 'margin' | 'marginPercent'>) => {
    setProducts(prev => [...prev, { ...data, id: generateId() }]);
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const addRevenue = (data: Omit<Revenue, 'id'>) => {
    setRevenues(prev => [{ ...data, id: generateId() }, ...prev]);
  };

  const deleteRevenue = (id: string) => {
    setRevenues(prev => prev.filter(r => r.id !== id));
  };

  const addExpense = (data: Omit<Expense, 'id'>) => {
    setExpenses(prev => [{ ...data, id: generateId() }, ...prev]);
  };

  const updateExpense = (id: string, data: Partial<Expense>) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const registerLoss = (ingredientId: string, quantity: number, reason: string) => {
    setIngredients(prev => prev.map(ing => {
      if (ing.id === ingredientId) {
        return { ...ing, stockQuantity: Math.max(0, ing.stockQuantity - quantity) };
      }
      return ing;
    }));

    setStockMovements(prev => [{
        id: generateId(),
        ingredientId,
        type: 'loss',
        quantity: quantity,
        date: new Date().toISOString(),
        reason: reason
    }, ...prev]);

    const ingredient = ingredients.find(i => i.id === ingredientId);
    if (ingredient) {
        const costLost = ingredient.costPerUnit * quantity;
        addExpense({
            date: new Date().toISOString(),
            amount: costLost,
            category: 'Outros',
            description: `Perda de Estoque: ${ingredient.name} (${reason})`,
            isRecurring: false,
            paymentMethod: 'Dinheiro', 
            status: 'paid'
        });
    }
  };

  const addStockEntry = (ingredientId: string, quantity: number, costPerUnit: number, reason: string = 'Compra de Estoque') => {
    setIngredients(prev => prev.map(ing => {
        if (ing.id === ingredientId) {
            return { 
                ...ing, 
                stockQuantity: ing.stockQuantity + quantity,
                costPerUnit: costPerUnit > 0 ? costPerUnit : ing.costPerUnit 
            };
        }
        return ing;
    }));

    setStockMovements(prev => [{
        id: generateId(),
        ingredientId,
        type: 'entry',
        quantity: quantity,
        date: new Date().toISOString(),
        reason: reason,
        cost: costPerUnit
    }, ...prev]);
  };

  const addEmployee = (data: Omit<Employee, 'id'>) => {
    setEmployees(prev => [...prev, { ...data, id: generateId() }]);
  };

  const updateEmployee = (id: string, data: Partial<Employee>) => {
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
  };

  const deleteEmployee = (id: string) => {
    setEmployees(prev => prev.filter(e => e.id !== id));
  };

  const saveCustomer = (customerData: Omit<Customer, 'id' | 'lastOrderDate' | 'totalOrders'>) => {
      setCustomers(prev => {
          const existing = prev.find(c => c.phone === customerData.phone);
          if (existing) {
              return prev.map(c => c.id === existing.id ? { ...c, ...customerData } : c);
          }
          return [...prev, { 
              ...customerData, 
              id: generateId(), 
              totalOrders: 0,
              lastOrderDate: undefined
          }];
      });
  };

  const processOrder = (order: Order) => {
    // 1. Save Order History
    setOrders(prev => [order, ...prev]);

    // 2. Update Customer Data (if phone provided)
    if (order.customerPhone) {
        setCustomers(prev => {
            const existing = prev.find(c => c.phone === order.customerPhone);
            if (existing) {
                return prev.map(c => c.phone === order.customerPhone ? {
                    ...c,
                    name: order.customerName,
                    address: order.address || c.address,
                    reference: order.reference || c.reference,
                    lastOrderDate: order.date,
                    totalOrders: c.totalOrders + 1
                } : c);
            } else {
                return [...prev, {
                    id: generateId(),
                    name: order.customerName,
                    phone: order.customerPhone!,
                    address: order.address,
                    reference: order.reference,
                    lastOrderDate: order.date,
                    totalOrders: 1
                }];
            }
        });
    }

    // 3. Add to Revenue
    addRevenue({
        date: order.date,
        amount: order.totalAmount,
        description: `Pedido #${order.id.slice(0, 4)} - ${order.customerName}`,
        category: order.deliveryType === 'entrega' ? 'Delivery' : order.deliveryType === 'mesa' ? 'Balcao' : 'Outros',
        paymentMethod: order.paymentMethod
    });

    // 4. Deduct Inventory
    const stockUpdates = new Map<string, number>();
    
    order.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
            product.ingredients.forEach(ing => {
                const totalQtyToDeduct = ing.quantity * item.quantity;
                const current = stockUpdates.get(ing.ingredientId) || 0;
                stockUpdates.set(ing.ingredientId, current + totalQtyToDeduct);
            });
        }
    });

    setIngredients(prev => prev.map(ing => {
        const deduction = stockUpdates.get(ing.id);
        if (deduction) {
            return { ...ing, stockQuantity: ing.stockQuantity - deduction };
        }
        return ing;
    }));

    stockUpdates.forEach((qty, ingId) => {
        setStockMovements(prev => [{
            id: generateId(),
            ingredientId: ingId,
            type: 'sale',
            quantity: qty,
            date: new Date().toISOString(),
            reason: `Venda Pedido #${order.id.slice(0, 4)}`
        }, ...prev]);
    });
  };

  const deleteOrder = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    // 1. REVERTER ESTOQUE (Devolver itens)
    const stockRestoration = new Map<string, number>();
    
    // Recalcular ingredientes usados no pedido
    order.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
            product.ingredients.forEach(ing => {
                const totalQty = ing.quantity * item.quantity;
                const current = stockRestoration.get(ing.ingredientId) || 0;
                stockRestoration.set(ing.ingredientId, current + totalQty);
            });
        }
    });

    // Atualizar estado de ingredientes (Adicionando de volta)
    setIngredients(prev => prev.map(ing => {
        const toRestore = stockRestoration.get(ing.id);
        if (toRestore) {
            return { ...ing, stockQuantity: ing.stockQuantity + toRestore };
        }
        return ing;
    }));

    // 2. REMOVER RECEITA FINANCEIRA
    // Busca pela string padrão gerada no processOrder
    const orderTag = `Pedido #${order.id.slice(0, 4)}`;
    setRevenues(prev => prev.filter(r => !r.description.includes(orderTag)));

    // 3. REMOVER HISTÓRICO DE MOVIMENTAÇÃO DE ESTOQUE
    const reasonTag = `Venda Pedido #${order.id.slice(0, 4)}`;
    setStockMovements(prev => prev.filter(sm => !sm.reason.includes(reasonTag)));

    // 4. ATUALIZAR ESTATÍSTICAS DO CLIENTE (Opcional, mas consistente)
    if (order.customerPhone) {
        setCustomers(prev => prev.map(c => {
            if (c.phone === order.customerPhone) {
                return { 
                    ...c, 
                    totalOrders: Math.max(0, c.totalOrders - 1) 
                };
            }
            return c;
        }));
    }

    // 5. EXCLUIR O PEDIDO DA LISTA
    setOrders(prev => prev.filter(o => o.id !== orderId));
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      ingredients,
      products,
      revenues,
      expenses,
      stockMovements,
      employees,
      customers,
      orders,
      addIngredient,
      updateIngredient,
      addProduct,
      addRevenue,
      addExpense,
      updateExpense,
      deleteProduct,
      deleteIngredient,
      deleteExpense,
      deleteRevenue,
      registerLoss,
      addStockEntry,
      getProductCost,
      addEmployee,
      updateEmployee,
      deleteEmployee,
      processOrder,
      deleteOrder,
      saveCustomer
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};
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
  orders: Order[];
  addIngredient: (ing: Omit<Ingredient, 'id'>) => Promise<void>;
  updateIngredient: (id: string, ing: Partial<Ingredient>) => Promise<void>;
  addProduct: (prod: Omit<Product, 'id' | 'totalCost' | 'margin' | 'marginPercent'>) => Promise<void>;
  updateProduct: (id: string, prod: Partial<Product>) => Promise<void>;
  addRevenue: (rev: Omit<Revenue, 'id'>) => Promise<void>;
  addExpense: (exp: Omit<Expense, 'id'>) => Promise<void>;
  updateExpense: (id: string, exp: Partial<Expense>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  deleteIngredient: (id: string) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  deleteRevenue: (id: string) => Promise<void>;
  registerLoss: (ingredientId: string, quantity: number, reason: string) => Promise<void>;
  addStockEntry: (ingredientId: string, quantity: number, costPerUnit: number, reason?: string) => Promise<void>;
  getProductCost: (product: Product) => number;
  addEmployee: (emp: Omit<Employee, 'id'>) => Promise<void>;
  updateEmployee: (id: string, emp: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  processOrder: (order: Order) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
  saveCustomer: (customerData: Omit<Customer, 'id' | 'lastOrderDate' | 'totalOrders'>) => Promise<void>;
  forceMigration: () => Promise<void>;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

// Initial Data for new users (used for seeding if local storage is empty)
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

  const headers = {
    'Content-Type': 'application/json',
    'x-user-id': currentUser
  };

  // Dynamic Keys based on User (for migration)
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

  const loadFromLocalStorage = () => {
    const keys = getKeys(currentUser);
    const getLocal = (key: string, initial: any) => {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : initial;
    };

    setIngredients(getLocal(keys.INGREDIENTS, INITIAL_INGREDIENTS));
    setProducts(getLocal(keys.PRODUCTS, INITIAL_PRODUCTS));
    setRevenues(getLocal(keys.REVENUES, []));
    setExpenses(getLocal(keys.EXPENSES, []));
    setStockMovements(getLocal(keys.STOCK, []));
    setEmployees(getLocal(keys.EMPLOYEES, []));
    setCustomers(getLocal(keys.CUSTOMERS, []));
    setOrders(getLocal(keys.ORDERS, []));
  };

  const loadData = async () => {
    if (!currentUser) return;
    try {
        const responses = await Promise.all([
            fetch('/api/ingredients', { headers }),
            fetch('/api/products', { headers }),
            fetch('/api/revenues', { headers }),
            fetch('/api/expenses', { headers }),
            fetch('/api/stock_movements', { headers }),
            fetch('/api/employees', { headers }),
            fetch('/api/customers', { headers }),
            fetch('/api/orders', { headers }),
        ]);

        // Check if any response is not OK (e.g. 404 if API is missing)
        if (responses.some(r => !r.ok)) {
            throw new Error("API unavailable");
        }

        const [ing, prod, rev, exp, stock, emp, cust, ord] = await Promise.all(responses.map(r => r.json()));
        
        setIngredients(Array.isArray(ing) ? ing : []);
        setProducts(Array.isArray(prod) ? prod : []);
        setRevenues(Array.isArray(rev) ? rev : []);
        setExpenses(Array.isArray(exp) ? exp : []);
        setStockMovements(Array.isArray(stock) ? stock : []);
        setEmployees(Array.isArray(emp) ? emp : []);
        setCustomers(Array.isArray(cust) ? cust : []);
        setOrders(Array.isArray(ord) ? ord : []);
    } catch (e) {
        console.warn("API unavailable or failed, falling back to LocalStorage", e);
        loadFromLocalStorage();
    }
  };

  useEffect(() => {
    if (!currentUser) return;

    const checkMigration = async () => {
        const migrationKey = `${currentUser}_MIGRATED_DB_V1`;
        const isMigrated = localStorage.getItem(migrationKey);

        if (!isMigrated) {
            const keys = getKeys(currentUser);
            const getLocal = (key: string, initial: any) => {
                const saved = localStorage.getItem(key);
                return saved ? JSON.parse(saved) : initial;
            };

            const localData = {
                userId: currentUser,
                ingredients: getLocal(keys.INGREDIENTS, INITIAL_INGREDIENTS),
                products: getLocal(keys.PRODUCTS, INITIAL_PRODUCTS),
                revenues: getLocal(keys.REVENUES, []),
                expenses: getLocal(keys.EXPENSES, []),
                stockMovements: getLocal(keys.STOCK, []),
                employees: getLocal(keys.EMPLOYEES, []),
                customers: getLocal(keys.CUSTOMERS, []),
                orders: getLocal(keys.ORDERS, []),
            };
            
            try {
                await fetch('/api/migrate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(localData)
                });
                localStorage.setItem(migrationKey, 'true');
            } catch (e) {
                console.error("Migration failed", e);
            }
        }
        
        loadData();
    };

    checkMigration();
  }, [currentUser]);

  // Sync to LocalStorage on changes (Backup)
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

  const addIngredient = async (data: Omit<Ingredient, 'id'>) => {
    const newId = generateId();
    const newItem = { ...data, id: newId };
    setIngredients(prev => [...prev, newItem]);
    
    await fetch('/api/ingredients', { method: 'POST', headers, body: JSON.stringify(newItem) });

    if (data.stockQuantity > 0) {
      const movement = {
        id: generateId(),
        ingredientId: newId,
        type: 'entry',
        quantity: data.stockQuantity,
        date: new Date().toISOString(),
        reason: 'Estoque Inicial',
        cost: data.costPerUnit
      };
      setStockMovements(prev => [movement, ...prev]);
      await fetch('/api/stock_movements', { method: 'POST', headers, body: JSON.stringify(movement) });
    }
  };

  const updateIngredient = async (id: string, data: Partial<Ingredient>) => {
    setIngredients(prev => prev.map(i => i.id === id ? { ...i, ...data } : i));
    await fetch(`/api/ingredients/${id}`, { method: 'PUT', headers, body: JSON.stringify(data) });
  };

  const deleteIngredient = async (id: string) => {
    setIngredients(prev => prev.filter(i => i.id !== id));
    await fetch(`/api/ingredients/${id}`, { method: 'DELETE', headers });
  };

  const addProduct = async (data: Omit<Product, 'id' | 'totalCost' | 'margin' | 'marginPercent'>) => {
    const newId = generateId();
    const newItem = { ...data, id: newId };
    setProducts(prev => [...prev, newItem]);
    await fetch('/api/products', { method: 'POST', headers, body: JSON.stringify(newItem) });
  };

  const updateProduct = async (id: string, data: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
    await fetch(`/api/products/${id}`, { method: 'PUT', headers, body: JSON.stringify(data) });
  };

  const deleteProduct = async (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    await fetch(`/api/products/${id}`, { method: 'DELETE', headers });
  };

  const addRevenue = async (data: Omit<Revenue, 'id'>) => {
    const newId = generateId();
    const newItem = { ...data, id: newId };
    setRevenues(prev => [newItem, ...prev]);
    await fetch('/api/revenues', { method: 'POST', headers, body: JSON.stringify(newItem) });
  };

  const deleteRevenue = async (id: string) => {
    setRevenues(prev => prev.filter(r => r.id !== id));
    await fetch(`/api/revenues/${id}`, { method: 'DELETE', headers });
  };

  const addExpense = async (data: Omit<Expense, 'id'>) => {
    const newId = generateId();
    const newItem = { ...data, id: newId };
    setExpenses(prev => [newItem, ...prev]);
    await fetch('/api/expenses', { method: 'POST', headers, body: JSON.stringify(newItem) });
  };

  const updateExpense = async (id: string, data: Partial<Expense>) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
    await fetch(`/api/expenses/${id}`, { method: 'PUT', headers, body: JSON.stringify(data) });
  };

  const deleteExpense = async (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    await fetch(`/api/expenses/${id}`, { method: 'DELETE', headers });
  };

  const registerLoss = async (ingredientId: string, quantity: number, reason: string) => {
    const ingredient = ingredients.find(i => i.id === ingredientId);
    if (!ingredient) return;

    const newStock = Math.max(0, ingredient.stockQuantity - quantity);
    setIngredients(prev => prev.map(ing => ing.id === ingredientId ? { ...ing, stockQuantity: newStock } : ing));
    await fetch(`/api/ingredients/${ingredientId}`, { method: 'PUT', headers, body: JSON.stringify({ stockQuantity: newStock }) });

    const movement = {
        id: generateId(),
        ingredientId,
        type: 'loss',
        quantity: quantity,
        date: new Date().toISOString(),
        reason: reason
    };
    setStockMovements(prev => [movement, ...prev]);
    await fetch('/api/stock_movements', { method: 'POST', headers, body: JSON.stringify(movement) });

    const costLost = ingredient.costPerUnit * quantity;
    const expense = {
        id: generateId(),
        date: new Date().toISOString(),
        amount: costLost,
        category: 'Outros',
        description: `Perda de Estoque: ${ingredient.name} (${reason})`,
        isRecurring: false,
        paymentMethod: 'Dinheiro', 
        status: 'paid'
    };
    addExpense(expense); // This already calls API
  };

  const addStockEntry = async (ingredientId: string, quantity: number, costPerUnit: number, reason: string = 'Compra de Estoque') => {
    const ingredient = ingredients.find(i => i.id === ingredientId);
    if (!ingredient) return;

    const newStock = ingredient.stockQuantity + quantity;
    const newCost = costPerUnit > 0 ? costPerUnit : ingredient.costPerUnit;
    
    setIngredients(prev => prev.map(ing => ing.id === ingredientId ? { ...ing, stockQuantity: newStock, costPerUnit: newCost } : ing));
    await fetch(`/api/ingredients/${ingredientId}`, { method: 'PUT', headers, body: JSON.stringify({ stockQuantity: newStock, costPerUnit: newCost }) });

    const movement = {
        id: generateId(),
        ingredientId,
        type: 'entry',
        quantity: quantity,
        date: new Date().toISOString(),
        reason: reason,
        cost: costPerUnit
    };
    setStockMovements(prev => [movement, ...prev]);
    await fetch('/api/stock_movements', { method: 'POST', headers, body: JSON.stringify(movement) });
  };

  const addEmployee = async (data: Omit<Employee, 'id'>) => {
    const newId = generateId();
    const newItem = { ...data, id: newId };
    setEmployees(prev => [...prev, newItem]);
    await fetch('/api/employees', { method: 'POST', headers, body: JSON.stringify(newItem) });
  };

  const updateEmployee = async (id: string, data: Partial<Employee>) => {
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
    await fetch(`/api/employees/${id}`, { method: 'PUT', headers, body: JSON.stringify(data) });
  };

  const deleteEmployee = async (id: string) => {
    setEmployees(prev => prev.filter(e => e.id !== id));
    await fetch(`/api/employees/${id}`, { method: 'DELETE', headers });
  };

  const saveCustomer = async (customerData: Omit<Customer, 'id' | 'lastOrderDate' | 'totalOrders'>) => {
      let customerToSave: Customer;
      const existing = customers.find(c => c.phone === customerData.phone);
      
      if (existing) {
          customerToSave = { ...existing, ...customerData };
          setCustomers(prev => prev.map(c => c.id === existing.id ? customerToSave : c));
          await fetch(`/api/customers/${existing.id}`, { method: 'PUT', headers, body: JSON.stringify(customerToSave) });
      } else {
          customerToSave = { 
              ...customerData, 
              id: generateId(), 
              totalOrders: 0,
              lastOrderDate: undefined
          };
          setCustomers(prev => [...prev, customerToSave]);
          await fetch('/api/customers', { method: 'POST', headers, body: JSON.stringify(customerToSave) });
      }
  };

  const processOrder = async (order: Order) => {
    // 1. Save Order History
    setOrders(prev => [order, ...prev]);
    await fetch('/api/orders', { method: 'POST', headers, body: JSON.stringify(order) });

    // 2. Update Customer Data
    if (order.customerPhone) {
        const existing = customers.find(c => c.phone === order.customerPhone);
        if (existing) {
            const updated = {
                ...existing,
                name: order.customerName,
                address: order.address || existing.address,
                reference: order.reference || existing.reference,
                lastOrderDate: order.date,
                totalOrders: existing.totalOrders + 1
            };
            setCustomers(prev => prev.map(c => c.id === existing.id ? updated : c));
            await fetch(`/api/customers/${existing.id}`, { method: 'PUT', headers, body: JSON.stringify(updated) });
        } else {
            const newCustomer = {
                id: generateId(),
                name: order.customerName,
                phone: order.customerPhone!,
                address: order.address,
                reference: order.reference,
                lastOrderDate: order.date,
                totalOrders: 1
            };
            setCustomers(prev => [...prev, newCustomer]);
            await fetch('/api/customers', { method: 'POST', headers, body: JSON.stringify(newCustomer) });
        }
    }

    // 3. Add to Revenue
    const revenue = {
        id: generateId(),
        date: order.date,
        amount: order.totalAmount,
        description: `Pedido #${order.id.slice(0, 4)} - ${order.customerName}`,
        category: order.deliveryType === 'entrega' ? 'Delivery' : order.deliveryType === 'mesa' ? 'Balcao' : 'Outros',
        paymentMethod: order.paymentMethod,
        isRecurring: false,
        status: 'paid'
    };
    setRevenues(prev => [revenue, ...prev]);
    await fetch('/api/revenues', { method: 'POST', headers, body: JSON.stringify(revenue) });

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

    // We need to update ingredients one by one or batch. API is one by one for now.
    // To avoid race conditions in UI, we update state first.
    
    const updatedIngredients = ingredients.map(ing => {
        const deduction = stockUpdates.get(ing.id);
        if (deduction) {
            return { ...ing, stockQuantity: ing.stockQuantity - deduction };
        }
        return ing;
    });
    setIngredients(updatedIngredients);

    // Sync with API
    for (const [ingId, deduction] of stockUpdates.entries()) {
        const ing = ingredients.find(i => i.id === ingId);
        if (ing) {
             const newQty = ing.stockQuantity - deduction;
             await fetch(`/api/ingredients/${ingId}`, { method: 'PUT', headers, body: JSON.stringify({ stockQuantity: newQty }) });
             
             const movement = {
                id: generateId(),
                ingredientId: ingId,
                type: 'sale',
                quantity: deduction,
                date: new Date().toISOString(),
                reason: `Venda Pedido #${order.id.slice(0, 4)}`
             };
             setStockMovements(prev => [movement, ...prev]);
             await fetch('/api/stock_movements', { method: 'POST', headers, body: JSON.stringify(movement) });
        }
    }
  };

  const deleteOrder = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    // 1. REVERTER ESTOQUE
    const stockRestoration = new Map<string, number>();
    
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

    const updatedIngredients = ingredients.map(ing => {
        const toRestore = stockRestoration.get(ing.id);
        if (toRestore) {
            return { ...ing, stockQuantity: ing.stockQuantity + toRestore };
        }
        return ing;
    });
    setIngredients(updatedIngredients);

    for (const [ingId, toRestore] of stockRestoration.entries()) {
         const ing = ingredients.find(i => i.id === ingId);
         if (ing) {
             const newQty = ing.stockQuantity + toRestore;
             await fetch(`/api/ingredients/${ingId}`, { method: 'PUT', headers, body: JSON.stringify({ stockQuantity: newQty }) });
         }
    }

    // 2. REMOVER RECEITA FINANCEIRA
    const orderTag = `Pedido #${order.id.slice(0, 4)}`;
    const revenueToDelete = revenues.find(r => r.description.includes(orderTag));
    if (revenueToDelete) {
        setRevenues(prev => prev.filter(r => r.id !== revenueToDelete.id));
        await fetch(`/api/revenues/${revenueToDelete.id}`, { method: 'DELETE', headers });
    }

    // 3. REMOVER HISTÓRICO DE MOVIMENTAÇÃO DE ESTOQUE
    const reasonTag = `Venda Pedido #${order.id.slice(0, 4)}`;
    // This is tricky because there might be multiple movements (one per ingredient).
    // We need to find them all.
    const movementsToDelete = stockMovements.filter(sm => sm.reason.includes(reasonTag));
    setStockMovements(prev => prev.filter(sm => !sm.reason.includes(reasonTag)));
    
    for (const mov of movementsToDelete) {
        await fetch(`/api/stock_movements/${mov.id}`, { method: 'DELETE', headers });
    }

    // 4. ATUALIZAR ESTATÍSTICAS DO CLIENTE
    if (order.customerPhone) {
        const customer = customers.find(c => c.phone === order.customerPhone);
        if (customer) {
            const updated = { ...customer, totalOrders: Math.max(0, customer.totalOrders - 1) };
            setCustomers(prev => prev.map(c => c.id === customer.id ? updated : c));
            await fetch(`/api/customers/${customer.id}`, { method: 'PUT', headers, body: JSON.stringify(updated) });
        }
    }

    // 5. EXCLUIR O PEDIDO DA LISTA
    setOrders(prev => prev.filter(o => o.id !== orderId));
    await fetch(`/api/orders/${orderId}`, { method: 'DELETE', headers });
  };

  const forceMigration = async () => {
    if (!currentUser) return;
    const keys = getKeys(currentUser);
    const getLocal = (key: string, initial: any) => {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : initial;
    };

    const localData = {
        userId: currentUser,
        ingredients: getLocal(keys.INGREDIENTS, INITIAL_INGREDIENTS),
        products: getLocal(keys.PRODUCTS, INITIAL_PRODUCTS),
        revenues: getLocal(keys.REVENUES, []),
        expenses: getLocal(keys.EXPENSES, []),
        stockMovements: getLocal(keys.STOCK, []),
        employees: getLocal(keys.EMPLOYEES, []),
        customers: getLocal(keys.CUSTOMERS, []),
        orders: getLocal(keys.ORDERS, []),
    };
    
    try {
        const res = await fetch('/api/migrate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(localData)
        });
        if (res.ok) {
            localStorage.setItem(`${currentUser}_MIGRATED_DB_V1`, 'true');
            alert('Dados restaurados com sucesso! A página será recarregada.');
            window.location.reload();
        } else {
            const text = await res.text();
            throw new Error(text);
        }
    } catch (e) {
        console.warn("Migration to API failed, loading locally", e);
        // Fallback: Load directly into state
        setIngredients(localData.ingredients);
        setProducts(localData.products);
        setRevenues(localData.revenues);
        setExpenses(localData.expenses);
        setStockMovements(localData.stockMovements);
        setEmployees(localData.employees);
        setCustomers(localData.customers);
        setOrders(localData.orders);
        alert('Servidor indisponível. Seus dados foram carregados do armazenamento local do navegador.');
    }
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
      updateProduct,
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
      saveCustomer,
      forceMigration
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
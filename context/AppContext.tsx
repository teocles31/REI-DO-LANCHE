import React, { createContext, useContext, useState, useEffect } from 'react';
import { Ingredient, Product, Revenue, Expense, StockMovement, Employee } from '../types';
import { generateId } from '../utils/formatters';

interface AppContextProps {
  currentUser: string;
  ingredients: Ingredient[];
  products: Product[];
  revenues: Revenue[];
  expenses: Expense[];
  stockMovements: StockMovement[];
  employees: Employee[];
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
    ingredients: [
      { ingredientId: '1', quantity: 1 }, // 1 pão
      { ingredientId: '2', quantity: 0.150 }, // 150g carne
      { ingredientId: '3', quantity: 0.030 }, // 30g queijo
      { ingredientId: '4', quantity: 0.040 }, // 40g bacon
    ]
  },
  { 
    id: 'p2', 
    name: 'Coca-Cola', 
    description: 'Lata 350ml',
    price: 6.00,
    ingredients: [
      { ingredientId: '5', quantity: 1 }
    ]
  }
];

export const AppProvider: React.FC<{ children: React.ReactNode; currentUser: string }> = ({ children, currentUser }) => {
  // We use state to hold data, but loading happens in useEffect to support key-swapping based on user
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Dynamic Keys based on User
  const getKeys = (user: string) => ({
    INGREDIENTS: `${user}_ingredients`,
    PRODUCTS: `${user}_products`,
    REVENUES: `${user}_revenues`,
    EXPENSES: `${user}_expenses`,
    STOCK: `${user}_stock_movements`,
    EMPLOYEES: `${user}_employees`,
  });

  // Load Data function (Can be replaced by API call for real cloud sync)
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
  };

  // 1. Initial Load when User Changes
  useEffect(() => {
    loadData();
  }, [currentUser]);

  // 2. Real-time Cross-Tab/Window Sync
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
        // If storage changes in another tab for this user's keys, reload
        if (e.key && e.key.startsWith(currentUser)) {
            loadData();
        }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [currentUser]);

  // 3. Persist Data (Save to Cloud/LocalStorage)
  // Note: For real cross-device (Phone <-> PC), replace localStorage.setItem with await api.post(...)
  useEffect(() => {
    if (!currentUser) return;
    const keys = getKeys(currentUser);
    localStorage.setItem(keys.INGREDIENTS, JSON.stringify(ingredients));
  }, [ingredients, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const keys = getKeys(currentUser);
    localStorage.setItem(keys.PRODUCTS, JSON.stringify(products));
  }, [products, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const keys = getKeys(currentUser);
    localStorage.setItem(keys.REVENUES, JSON.stringify(revenues));
  }, [revenues, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const keys = getKeys(currentUser);
    localStorage.setItem(keys.EXPENSES, JSON.stringify(expenses));
  }, [expenses, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const keys = getKeys(currentUser);
    localStorage.setItem(keys.STOCK, JSON.stringify(stockMovements));
  }, [stockMovements, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const keys = getKeys(currentUser);
    localStorage.setItem(keys.EMPLOYEES, JSON.stringify(employees));
  }, [employees, currentUser]);


  // --- Logic Implementations ---

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

  return (
    <AppContext.Provider value={{
      currentUser,
      ingredients,
      products,
      revenues,
      expenses,
      stockMovements,
      employees,
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
      deleteEmployee
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
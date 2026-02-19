import React, { createContext, useContext, useState } from 'react';
import { Ingredient, Product, Revenue, Expense } from '../types';
import { generateId } from '../utils/formatters';

interface AppContextProps {
  ingredients: Ingredient[];
  products: Product[];
  revenues: Revenue[];
  expenses: Expense[];
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
  getProductCost: (product: Product) => number;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

// Seed Data
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

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ingredients, setIngredients] = useState<Ingredient[]>(INITIAL_INGREDIENTS);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Calculate generic cost for a product
  const getProductCost = (product: Product): number => {
    return product.ingredients.reduce((total, item) => {
      const ing = ingredients.find(i => i.id === item.ingredientId);
      return total + (ing ? ing.costPerUnit * item.quantity : 0);
    }, 0);
  };

  const addIngredient = (data: Omit<Ingredient, 'id'>) => {
    setIngredients(prev => [...prev, { ...data, id: generateId() }]);
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
    // Reduce stock
    setIngredients(prev => prev.map(ing => {
      if (ing.id === ingredientId) {
        return { ...ing, stockQuantity: Math.max(0, ing.stockQuantity - quantity) };
      }
      return ing;
    }));

    // Optionally record as an expense or just a log. 
    // For simplicity, we add it as an "Outros" expense to reflect financial loss
    const ingredient = ingredients.find(i => i.id === ingredientId);
    if (ingredient) {
        const costLost = ingredient.costPerUnit * quantity;
        addExpense({
            date: new Date().toISOString(),
            amount: costLost,
            category: 'Outros',
            description: `Perda de Estoque: ${ingredient.name} (${reason})`,
            isRecurring: false,
            paymentMethod: 'Dinheiro', // Symbolic
            status: 'paid' // Loss is immediate
        });
    }
  };

  return (
    <AppContext.Provider value={{
      ingredients,
      products,
      revenues,
      expenses,
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
      getProductCost
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
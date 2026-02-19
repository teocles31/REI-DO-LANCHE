export type UnitType = 'kg' | 'un' | 'l';

export interface Ingredient {
  id: string;
  name: string;
  category: 'Insumos' | 'Bebidas' | 'Embalagens' | 'Outros';
  unit: UnitType;
  costPerUnit: number;
  exitPrice: number; // Preço de saída/venda (novo campo)
  stockQuantity: number;
  minStock: number;
}

export interface ProductIngredient {
  ingredientId: string;
  quantity: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  ingredients: ProductIngredient[];
  totalCost?: number;
  margin?: number;
  marginPercent?: number;
}

export type PaymentMethod = 'Dinheiro' | 'PIX' | 'Debito' | 'Credito';
export type RevenueCategory = 'Balcao' | 'Delivery' | 'App' | 'Outros';

export interface Revenue {
  id: string;
  date: string; // ISO string
  description: string;
  amount: number;
  category: RevenueCategory;
  paymentMethod: PaymentMethod;
}

export type ExpenseCategory = 
  | 'Insumos' 
  | 'Bebidas' 
  | 'Embalagens' 
  | 'Limpeza' 
  | 'Salarios' 
  | 'Aluguel' 
  | 'Energia' 
  | 'Agua' 
  | 'Internet' 
  | 'Taxas' 
  | 'Manutencao' 
  | 'Outros';

export interface Expense {
  id: string;
  date: string; // Data de vencimento ou competência
  paidDate?: string; // Data do pagamento efetivo (se realizado)
  amount: number;
  category: ExpenseCategory;
  description: string;
  isRecurring: boolean;
  status: 'paid' | 'pending';
  paymentMethod: PaymentMethod;
}

export interface DashboardStats {
  revenue: number;
  expenses: number;
  profit: number;
  margin: number;
  pendingExpenses: number;
}

export type StockMovementType = 'entry' | 'loss' | 'adjustment';

export interface StockMovement {
  id: string;
  ingredientId: string;
  type: StockMovementType;
  quantity: number;
  date: string;
  reason?: string;
  cost?: number; // Custo unitário ou total naquele momento
}
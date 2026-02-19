
export type UnitType = 'kg' | 'un' | 'l';

export interface Ingredient {
  id: string;
  name: string;
  category: 'Insumos' | 'Bebidas' | 'Embalagens' | 'Outros';
  unit: UnitType;
  costPerUnit: number;
  exitPrice: number; // Preço de saída/venda
  stockQuantity: number;
  minStock: number;
}

export interface ProductIngredient {
  ingredientId: string;
  quantity: number;
}

export interface ProductComplement {
  title: string; // Ex: "Escolha o Molho"
  maxSelection: number; // Ex: 1
  options: string[]; // Ex: ["Alho", "Barbecue", "Picante"]
  required: boolean;
}

export type ProductCategory = 'Lanches' | 'Bebidas' | 'Combos' | 'Porções' | 'Sobremesas' | 'Outros';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: ProductCategory; // Novo campo
  ingredients: ProductIngredient[];
  complements?: ProductComplement[]; 
  totalCost?: number;
  margin?: number;
  marginPercent?: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  reference?: string;
  lastOrderDate?: string;
  totalOrders: number;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  baseSalary: number;
  admissionDate: string;
  pixKey?: string;
  phone?: string;
  active: boolean;
}

export type PaymentMethod = 'Dinheiro' | 'PIX' | 'Debito' | 'Credito';
export type RevenueCategory = 'Balcao' | 'Delivery' | 'App' | 'Outros';

export interface Revenue {
  id: string;
  date: string;
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
  date: string;
  paidDate?: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  isRecurring: boolean;
  status: 'paid' | 'pending';
  paymentMethod: PaymentMethod;
  employeeId?: string;
}

export interface DashboardStats {
  revenue: number;
  expenses: number;
  profit: number;
  margin: number;
  pendingExpenses: number;
}

export type StockMovementType = 'entry' | 'loss' | 'adjustment' | 'sale';

export interface StockMovement {
  id: string;
  ingredientId: string;
  type: StockMovementType;
  quantity: number;
  date: string;
  reason?: string;
  cost?: number;
}

// Order Types for POS
export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  selectedComplements: string[]; // Lista de complementos escolhidos (strings)
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone?: string; // Novo
  deliveryType: 'retirada' | 'entrega' | 'mesa';
  address?: string;
  reference?: string;
  paymentMethod: PaymentMethod;
  changeFor?: number; // Troco para
  items: OrderItem[];
  totalAmount: number;
  date: string;
  status: 'pending' | 'completed' | 'canceled';
}

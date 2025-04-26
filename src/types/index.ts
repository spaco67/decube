export type Role = 'waiter' | 'barman' | 'kitchen' | 'admin';

export type User = {
  id: number;
  name: string;
  email: string;
  role: Role;
};

export type MenuItem = {
  id: number;
  name: string;
  category: 'food' | 'drink' | 'dessert';
  price: number;
  preparationType: 'kitchen' | 'bar';
  quantity: number;
};

export type OrderItem = {
  id: number;
  menuItemId: number;
  name: string;
  price: number;
  quantity: number;
  preparationType: 'kitchen' | 'bar';
  status: OrderStatus;
  notes?: string;
};

export type OrderStatus = 'pending' | 'in-progress' | 'ready' | 'completed' | 'cancelled';

export type Order = {
  id: number;
  tableNumber: number;
  waiterId: number;
  waiterName: string;
  status: OrderStatus;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  totalAmount: number;
};

export type StatisticsData = {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  itemsSold: number;
  categorySales: {
    food: number;
    drink: number;
    dessert: number;
  };
};
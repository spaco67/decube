export type Role = 'waiter' | 'barman' | 'kitchen' | 'admin' | 'accountant';

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type MenuItem = {
  id: string;
  name: string;
  category: 'food' | 'drink' | 'dessert';
  price: number;
  preparationType: 'kitchen' | 'bar';
  quantity: number;
};

export type OrderItem = {
  id: number;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  preparationType: 'kitchen' | 'bar';
  status: OrderStatus;
  notes?: string;
};

export type OrderStatus = 'pending' | 'in-progress' | 'ready' | 'completed' | 'cancelled';

export type Order = {
  id: string;
  tableId?: string;
  waiter_id?: string;
  waiter?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  items: OrderItem[];
  total: number;
  createdAt: Date;
  updatedAt: Date;
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

export type Table = {
  id: string;
  number: number;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved';
};

export type InventoryItem = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  price: number;
};

export type Receipt = {
  id: string;
  orderId: string;
  createdBy: string;
  filename?: string;
  fileUrl?: string;
  sharedUrl?: string;
  sharedPlatform?: string;
  createdAt: Date;
  updatedAt: Date;
  order?: Order;
};
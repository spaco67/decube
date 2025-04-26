import { MenuItem } from '../types';

// Sample menu items for demo purposes
export const menuItems: MenuItem[] = [
  // Drinks (Bar items)
  { id: 1, name: 'Classic Mojito', category: 'drink', price: 9.99, preparationType: 'bar' },
  { id: 2, name: 'Margarita', category: 'drink', price: 10.99, preparationType: 'bar' },
  { id: 3, name: 'Old Fashioned', category: 'drink', price: 12.99, preparationType: 'bar' },
  { id: 4, name: 'Red Wine (Glass)', category: 'drink', price: 8.99, preparationType: 'bar' },
  { id: 5, name: 'White Wine (Glass)', category: 'drink', price: 8.99, preparationType: 'bar' },
  { id: 6, name: 'Draft Beer', category: 'drink', price: 6.99, preparationType: 'bar' },
  { id: 7, name: 'Bottled Beer', category: 'drink', price: 5.99, preparationType: 'bar' },
  { id: 8, name: 'Espresso Martini', category: 'drink', price: 11.99, preparationType: 'bar' },
  { id: 9, name: 'Soft Drink', category: 'drink', price: 3.99, preparationType: 'bar' },
  { id: 10, name: 'Water', category: 'drink', price: 2.99, preparationType: 'bar' },
  
  // Food (Kitchen items)
  { id: 11, name: 'Steak & Fries', category: 'food', price: 24.99, preparationType: 'kitchen' },
  { id: 12, name: 'Grilled Salmon', category: 'food', price: 22.99, preparationType: 'kitchen' },
  { id: 13, name: 'Burger & Fries', category: 'food', price: 16.99, preparationType: 'kitchen' },
  { id: 14, name: 'Caesar Salad', category: 'food', price: 12.99, preparationType: 'kitchen' },
  { id: 15, name: 'Pasta Carbonara', category: 'food', price: 18.99, preparationType: 'kitchen' },
  { id: 16, name: 'Margherita Pizza', category: 'food', price: 15.99, preparationType: 'kitchen' },
  { id: 17, name: 'Chicken Wings', category: 'food', price: 14.99, preparationType: 'kitchen' },
  { id: 18, name: 'Nachos', category: 'food', price: 10.99, preparationType: 'kitchen' },
  
  // Desserts (Kitchen items)
  { id: 19, name: 'Chocolate Cake', category: 'dessert', price: 8.99, preparationType: 'kitchen' },
  { id: 20, name: 'Cheesecake', category: 'dessert', price: 8.99, preparationType: 'kitchen' },
  { id: 21, name: 'Ice Cream', category: 'dessert', price: 6.99, preparationType: 'kitchen' },
  { id: 22, name: 'Tiramisu', category: 'dessert', price: 9.99, preparationType: 'kitchen' },
];

export const getMenuItemsByCategory = (category: MenuItem['category']) => {
  return menuItems.filter(item => item.category === category);
};

export const getMenuItemsByPreparationType = (type: MenuItem['preparationType']) => {
  return menuItems.filter(item => item.preparationType === type);
};

export const getMenuItemById = (id: number) => {
  return menuItems.find(item => item.id === id);
};
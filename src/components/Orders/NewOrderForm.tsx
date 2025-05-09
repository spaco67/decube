import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '../../contexts/OrderContext';
import { useEffect } from 'react';
import { MenuItem, OrderItem } from '../../types';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const NewOrderForm: React.FC = () => {
  const navigate = useNavigate();
  const { createOrder } = useOrders();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tables, setTables] = useState<Array<{ id: string; number: number }>>([]);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<MenuItem['category']>('food');

  useEffect(() => {
    fetchMenuItems();
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const { data, error } = await supabase
        .from('tables')
        .select('id, number')
        .order('number');

      if (error) throw error;

      setTables(data);
      if (data.length > 0) {
        setSelectedTableId(data[0].id);
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching tables:', err);
    }
  };

  const fetchMenuItems = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .gt('quantity', 0)
        .order('name');

      if (error) throw error;

      setMenuItems(data.map(item => ({
        id: item.id,
        name: item.name,
        category: mapCategory(item.category),
        price: item.price,
        preparationType: mapPreparationType(item.category),
        quantity: item.quantity
      })));
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching menu items:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const mapCategory = (inventoryCategory: string): MenuItem['category'] => {
    switch (inventoryCategory) {
      case 'beverages':
        return 'drink';
      case 'meat':
      case 'vegetables':
      case 'dry-goods':
      case 'spices':
        return 'food';
      case 'dairy':
        return 'dessert';
      default:
        return 'food';
    }
  };

  const mapPreparationType = (inventoryCategory: string): 'kitchen' | 'bar' => {
    return inventoryCategory === 'beverages' ? 'bar' : 'kitchen';
  };

  const categories = [
    { id: 'food', label: 'Food' },
    { id: 'drink', label: 'Drinks' },
    { id: 'dessert', label: 'Desserts' },
  ];

  const filteredItems = menuItems.filter(item => item.category === activeCategory);

  const addItemToOrder = (menuItem: MenuItem) => {
    // Check if there's enough quantity in inventory
    const existingQuantity = selectedItems.find(item => item.menuItemId === menuItem.id)?.quantity || 0;
    if (existingQuantity + 1 > menuItem.quantity) {
      setError(`Not enough ${menuItem.name} in inventory (${menuItem.quantity} available)`);
      return;
    }

    const existingItem = selectedItems.find(item => item.menuItemId === menuItem.id);
    
    if (existingItem) {
      setSelectedItems(items =>
        items.map(item =>
          item.menuItemId === menuItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setSelectedItems(items => [
        ...items,
        {
          id: 0, // Will be set by the backend
          menuItemId: menuItem.id,
          name: menuItem.name,
          price: menuItem.price,
          quantity: 1,
          preparationType: menuItem.preparationType,
          status: 'pending',
        },
      ]);
    }
  };

  const updateItemQuantity = (menuItemId: number, change: number) => {
    const menuItem = menuItems.find(item => item.id === menuItemId);
    if (!menuItem) return;

    const existingItem = selectedItems.find(item => item.menuItemId === menuItemId);
    const newQuantity = (existingItem?.quantity || 0) + change;

    // Check if there's enough quantity in inventory
    if (newQuantity > menuItem.quantity) {
      setError(`Not enough ${menuItem.name} in inventory (${menuItem.quantity} available)`);
      return;
    }

    setSelectedItems(items =>
      items.map(item => {
        if (item.menuItemId === menuItemId) {
          return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
        }
        return item;
      }).filter(item => item.quantity > 0)
    );
  };

  const removeItem = (menuItemId: number) => {
    setSelectedItems(items => items.filter(item => item.menuItemId !== menuItemId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0 || !selectedTableId) return;
    setError(null);
    setError(null);

    try {
      // First check if table exists and is available
      const { data: tableData, error: tableError } = await supabase
        .from('tables')
        .select('status')
        .eq('id', selectedTableId)
        .single();

      if (tableError) throw new Error('Failed to check table status');
      if (tableData.status !== 'available') {
        throw new Error('Selected table is not available');
      }

      // Create the order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          table_id: selectedTableId,
          status: 'pending',
          total_amount: totalAmount
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = selectedItems.map(item => ({
        order_id: orderData.id,
        menu_item_id: item.menuItemId,
        quantity: item.quantity,
        price: item.price,
        status: 'pending'
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Update table status
      const { error: updateTableError } = await supabase
        .from('tables')
        .update({ status: 'occupied' })
        .eq('id', selectedTableId);

      if (updateTableError) throw updateTableError;

      navigate('/waiter');
    } catch (error: any) {
      console.error('Failed to create order:', error);
      setError(error.message || 'Failed to create order. Please try again.');
    }
  };

  const totalAmount = selectedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Menu Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">Loading menu items...</p>
          </div>
        )}
        
        {error && (
          <div className="p-4 text-red-700 bg-red-100 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex -mb-px">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id as MenuItem['category'])}
                className={`py-4 px-6 text-sm font-medium ${
                  activeCategory === category.id
                    ? 'border-b-2 border-teal-500 text-teal-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {category.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredItems.map(item => (
            <button
              key={item.id}
              onClick={() => addItemToOrder(item)}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
            >
              <h3 className="font-medium text-gray-900 dark:text-white">{item.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">₦{item.price.toFixed(2)}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Table Number
            </label>
            <select
              value={selectedTableId || ''}
              onChange={(e) => setSelectedTableId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
            >
              {tables.map(table => (
                <option key={table.id} value={table.id}>
                  Table {table.number}
                </option>
              ))}
            </select>
          </div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Order Summary</h2>
        </div>

        <div className="p-4 space-y-4">
          {selectedItems.map(item => (
            <div key={item.menuItemId} className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 dark:text-white">{item.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  ₦{(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => updateItemQuantity(item.menuItemId, -1)}
                  className="p-1 text-gray-500 hover:text-gray-700"
                >
                  <Minus size={16} />
                </button>
                <span className="w-8 text-center">{item.quantity}</span>
                <button
                  onClick={() => updateItemQuantity(item.menuItemId, 1)}
                  className="p-1 text-gray-500 hover:text-gray-700"
                >
                  <Plus size={16} />
                </button>
                <button
                  onClick={() => removeItem(item.menuItemId)}
                  className="p-1 text-red-500 hover:text-red-700"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}

          {selectedItems.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-4">
              No items added to order
            </p>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between mb-4">
            <span className="font-medium text-gray-900 dark:text-white">Total</span>
            <span className="font-medium text-gray-900 dark:text-white">
              ₦{totalAmount.toFixed(2)}
            </span>
          </div>
          <button
            onClick={handleSubmit}
            disabled={selectedItems.length === 0 || !selectedTableId}
            className={`w-full py-2 px-4 rounded-md text-white font-medium ${
              selectedItems.length > 0 && selectedTableId
                ? 'bg-teal-600 hover:bg-teal-700'
                : 'bg-gray-400 cursor-not-allowed'
            } transition-colors`}
          >
            Place Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewOrderForm;
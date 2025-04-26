import React, { useState } from 'react';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import Modal from '../../components/UI/Modal';
import { Package, Plus, Search, Filter } from 'lucide-react';
import { useContext } from 'react';
import { InventoryContext } from '../../contexts/InventoryContext';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  min_stock: number;
  price: number;
  created_at: string;
  updated_at: string;
}

const Inventory: React.FC = () => {
  const { inventory, isLoading, error: contextError, updateItem, deleteItem, addItem } = useContext(InventoryContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'beverages',
    quantity: '',
    unit: 'units',
    minStock: '',
    price: ''
  });

  const getItemStatus = (item: InventoryItem) => {
    if (item.quantity <= 0) return 'critical';
    if (item.quantity <= item.min_stock) return 'low';
    return 'good';
  };

  const statusColors = {
    good: 'bg-green-100 text-green-800',
    low: 'bg-amber-100 text-amber-800',
    critical: 'bg-red-100 text-red-800',
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewItem(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addItem({
        name: newItem.name,
        category: newItem.category,
        quantity: parseFloat(newItem.quantity),
        unit: newItem.unit,
        min_stock: parseFloat(newItem.minStock),
        price: parseFloat(newItem.price)
      });

      setIsModalOpen(false);
      setNewItem({
        name: '',
        category: 'beverages',
        quantity: '',
        unit: 'units',
        minStock: '',
        price: ''
      });
    } catch (err: any) {
      console.error('Failed to add item:', err);
    }
  };

  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (filterCategory === 'all' || item.category === filterCategory)
  );

  const handleUpdateItem = async (id: string, updates: Partial<InventoryItem>) => {
    try {
      await updateItem(id, updates);
    } catch (err: any) {
      console.error('Failed to update item:', err);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await deleteItem(id);
    } catch (err: any) {
      console.error('Failed to delete item:', err);
    }
  };

  return (
    <DashboardLayout title="Inventory Management">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">Inventory</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
        >
          <Plus size={20} className="mr-2" />
          Add Item
        </button>
      </div>

      {/* Add Item Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Inventory Item"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Item Name
            </label>
            <input
              type="text"
              name="name"
              value={newItem.name}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              placeholder="e.g., Red Wine"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category
            </label>
            <select
              name="category"
              value={newItem.category}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
            >
              <option value="beverages">Beverages</option>
              <option value="meat">Meat</option>
              <option value="dry-goods">Dry Goods</option>
              <option value="vegetables">Vegetables</option>
              <option value="dairy">Dairy</option>
              <option value="spices">Spices</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Quantity
              </label>
              <input
                type="number"
                name="quantity"
                value={newItem.quantity}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Unit
              </label>
              <select
                name="unit"
                value={newItem.unit}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              >
                <option value="units">Units</option>
                <option value="kg">Kilograms</option>
                <option value="g">Grams</option>
                <option value="l">Liters</option>
                <option value="ml">Milliliters</option>
                <option value="bottles">Bottles</option>
                <option value="boxes">Boxes</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Minimum Stock
              </label>
              <input
                type="number"
                name="minStock"
                value={newItem.minStock}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Price per Unit
              </label>
              <input
                type="number"
                name="price"
                value={newItem.price}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md transition-colors"
            >
              Add Item
            </button>
          </div>
        </form>
      </Modal>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        {/* Filters and Search */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search inventory..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-500" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Categories</option>
                <option value="beverages">Beverages</option>
                <option value="meat">Meat</option>
                <option value="dry-goods">Dry Goods</option>
                <option value="vegetables">Vegetables</option>
              </select>
            </div>
          </div>
        </div>

        {contextError && (
          <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-lg">
            {contextError}
          </div>
        )}

        {isLoading ? (
          <div className="p-8 text-center text-gray-500">
            Loading inventory...
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredInventory.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Package size={24} className="text-teal-600 dark:text-teal-500 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {item.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Min. Stock: {item.min_stock} {item.unit}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 capitalize">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {item.quantity} {item.unit}
                      {item.quantity <= item.min_stock && (
                        <span className="ml-2 text-xs text-amber-600">
                          (Below min. stock of {item.min_stock})
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${statusColors[getItemStatus(item)]} capitalize`}>
                      {getItemStatus(item)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => {
                        const newQuantity = prompt('Enter new quantity:', item.quantity.toString());
                        if (newQuantity !== null) {
                          handleUpdateItem(item.id, { quantity: parseFloat(newQuantity) });
                        }
                      }}
                      className="text-teal-600 hover:text-teal-900 dark:text-teal-400 dark:hover:text-teal-300 mr-3"
                    >
                      Update
                    </button>
                    <button 
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default Inventory;
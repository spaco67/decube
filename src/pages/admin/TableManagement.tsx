import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import Modal from '../../components/UI/Modal';
import { Table2, Plus, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Table {
  id: string;
  number: number;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved';
  created_at: string;
  updated_at: string;
}

const TableManagement: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tables, setTables] = useState<Table[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTable, setNewTable] = useState({
    number: '',
    capacity: '4',
    status: 'available'
  });

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .order('number');

      if (error) throw error;
      setTables(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const statusColors = {
    available: 'bg-green-100 text-green-800',
    occupied: 'bg-red-100 text-red-800',
    reserved: 'bg-amber-100 text-amber-800',
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewTable(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('tables')
        .insert([{
          number: parseInt(newTable.number),
          capacity: parseInt(newTable.capacity),
          status: newTable.status
        }]);

      if (error) throw error;

      setIsModalOpen(false);
      setNewTable({
        number: '',
        capacity: '4',
        status: 'available'
      });
      fetchTables();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('tables')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      fetchTables();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteTable = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this table?')) return;
    
    try {
      const { error } = await supabase
        .from('tables')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchTables();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <DashboardLayout title="Table Management">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">Tables</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
        >
          <Plus size={20} className="mr-2" />
          Add Table
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-lg">
          {error}
        </div>
      )}

      {/* Add Table Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Table"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Table Number
            </label>
            <input
              type="number"
              name="number"
              value={newTable.number}
              onChange={handleInputChange}
              required
              min="1"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Seating Capacity
            </label>
            <input
              type="number"
              name="capacity"
              value={newTable.capacity}
              onChange={handleInputChange}
              required
              min="1"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Initial Status
            </label>
            <select
              name="status"
              value={newTable.status}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
            >
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="reserved">Reserved</option>
            </select>
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
              Add Table
            </button>
          </div>
        </form>
      </Modal>

      {isLoading ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">Loading tables...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tables.map((table) => (
            <div key={table.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Table2 size={24} className="text-teal-600 dark:text-teal-500" />
                    <h3 className="ml-2 text-lg font-medium text-gray-900 dark:text-white">
                      Table {table.number}
                    </h3>
                  </div>
                  <select
                    value={table.status}
                    onChange={(e) => handleUpdateStatus(table.id, e.target.value)}
                    className={`px-2 py-1 text-xs rounded-full ${statusColors[table.status]} border-0 cursor-pointer`}
                  >
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="reserved">Reserved</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Users size={16} className="mr-2" />
                    <span>Capacity: {table.capacity}</span>
                  </div>
                </div>
                
                <div className="mt-4 flex space-x-2">
                  <button 
                    onClick={() => handleDeleteTable(table.id)}
                    className="flex-1 px-3 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-md transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {!isLoading && tables.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">No tables found. Add your first table!</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
          >
            Add Table
          </button>
          </div>
      )}
    </DashboardLayout>
  );
};

export default TableManagement;
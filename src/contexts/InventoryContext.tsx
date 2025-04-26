import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

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

interface InventoryContextType {
  inventory: InventoryItem[];
  isLoading: boolean;
  error: string | null;
  fetchInventory: () => Promise<void>;
  updateItem: (id: string, updates: Partial<InventoryItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  addItem: (item: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType>({
  inventory: [],
  isLoading: false,
  error: null,
  fetchInventory: async () => {},
  updateItem: async () => {},
  deleteItem: async () => {},
  addItem: async () => {},
});

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInventory = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('inventory_items')
        .select('*')
        .order('name');

      if (fetchError) throw fetchError;
      setInventory(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching inventory:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateItem = async (id: string, updates: Partial<InventoryItem>) => {
    try {
      setError(null);
      const { error: updateError } = await supabase
        .from('inventory_items')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;
      await fetchInventory();
    } catch (err: any) {
      setError(err.message);
      console.error('Error updating inventory item:', err);
      throw err;
    }
  };

  const deleteItem = async (id: string) => {
    try {
      setError(null);
      const { error: deleteError } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      await fetchInventory();
    } catch (err: any) {
      setError(err.message);
      console.error('Error deleting inventory item:', err);
      throw err;
    }
  };

  const addItem = async (item: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setError(null);
      const { error: insertError } = await supabase
        .from('inventory_items')
        .insert([item]);

      if (insertError) throw insertError;
      await fetchInventory();
    } catch (err: any) {
      setError(err.message);
      console.error('Error adding inventory item:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  return (
    <InventoryContext.Provider
      value={{
        inventory,
        isLoading,
        error,
        fetchInventory,
        updateItem,
        deleteItem,
        addItem,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export { InventoryContext }
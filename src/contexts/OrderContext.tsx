import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Order, OrderItem, OrderStatus, User } from '../types';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { sendTransactionNotification } from '../lib/email';

interface OrderContextType {
  orders: Order[];
  createOrder: (tableId: string, items: OrderItem[]) => Promise<Order>;
  updateOrderStatus: (orderId: number, status: OrderStatus, itemIds?: number[]) => Promise<void>;
  processPayment: (orderId: number, method: 'cash' | 'card' | 'transfer', amount: number) => Promise<void>;
  closeOrder: (orderId: number) => Promise<void>;
  getOrdersByStatus: (status: OrderStatus) => Order[];
  getOrdersByWaiter: (waiterId: number) => Order[];
  activeOrders: Order[];
  completedOrders: Order[];
}

const OrderContext = createContext<OrderContextType>({
  orders: [],
  createOrder: async () => ({ id: 0 }) as Order,
  updateOrderStatus: async () => {},
  closeOrder: async () => {},
  getOrdersByStatus: () => [],
  getOrdersByWaiter: () => [],
  activeOrders: [],
  completedOrders: [],
});

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);

  const processPayment = useCallback(
    async (orderId: number, method: 'cash' | 'card' | 'transfer', amount: number) => {
      try {
        const reference = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const { error } = await supabase
          .from('orders')
          .update({
            payment_method: method,
            payment_status: 'paid',
            payment_amount: amount,
            payment_reference: reference,
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', orderId);

        if (error) throw error;

        // Send notification
        const { data: orderData } = await supabase
          .from('orders')
          .select(`
            *,
            items:order_items(*)
          `)
          .eq('id', orderId)
          .single();

        if (orderData) {
          const itemsList = orderData.items.map((item: any) => 
            `${item.quantity}x ${item.name} (₦${item.price.toFixed(2)})`
          );

          await sendTransactionNotification(
            user?.name || 'Unknown Staff',
            user?.role || 'Unknown Role',
            reference,
            amount,
            itemsList,
            method
          );
        }
      } catch (error) {
        console.error('Error processing payment:', error);
        throw error;
      }
    },
    [user]
  );

  useEffect(() => {
    if (user) {
      // Fetch initial orders
      fetchOrders();

      // Subscribe to real-time updates
      const ordersSubscription = supabase
        .channel('orders')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, handleOrderChange)
        .subscribe();

      const orderItemsSubscription = supabase
        .channel('order_items')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, handleOrderItemChange)
        .subscribe();

      return () => {
        ordersSubscription.unsubscribe();
        orderItemsSubscription.unsubscribe();
      };
    } else {
      setOrders([]);
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      let query = supabase
        .from('orders')
        .select(`
          id,
          table_id,
          waiter_id,
          status,
          total_amount,
          created_at,
          updated_at,
          completed_at,
          items:order_items (
            id,
            menu_item_id,
            quantity,
            price,
            status,
            notes
          )
        `)
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    }
  };

  const handleOrderChange = (payload: any) => {
    if (payload.eventType === 'INSERT') {
      setOrders(prev => [payload.new, ...prev]);
    } else if (payload.eventType === 'UPDATE') {
      setOrders(prev => prev.map(order => 
        order.id === payload.new.id ? { ...order, ...payload.new } : order
      ));
    } else if (payload.eventType === 'DELETE') {
      setOrders(prev => prev.filter(order => order.id !== payload.old.id));
    }
  };

  const handleOrderItemChange = (payload: any) => {
    setOrders(prev => prev.map(order => {
      if (order.id === payload.new.order_id) {
        const items = [...(order.items || [])];
        if (payload.eventType === 'INSERT') {
          items.push(payload.new);
        } else if (payload.eventType === 'UPDATE') {
          const index = items.findIndex(item => item.id === payload.new.id);
          if (index !== -1) {
            items[index] = { ...items[index], ...payload.new };
          }
        } else if (payload.eventType === 'DELETE') {
          const index = items.findIndex(item => item.id === payload.old.id);
          if (index !== -1) {
            items.splice(index, 1);
          }
        }
        return { ...order, items };
      }
      return order;
    }));
  };

  const createOrder = useCallback(
    async (tableId: string, items: OrderItem[]): Promise<Order> => {
      try {
        // Insert order
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert([{
            table_id: tableId,
            waiter_id: user?.id,
            total_amount: items.reduce((sum, item) => sum + item.price * item.quantity, 0)
          }])
          .select()
          .single();

        if (orderError) throw orderError;

        // Insert order items
        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(
            items.map(item => ({
              order_id: orderData.id,
              menu_item_id: item.menuItemId,
              quantity: item.quantity,
              price: item.price,
              notes: item.notes
            }))
          );

        if (itemsError) throw itemsError;

        return orderData;
      } catch (error) {
        console.error('Error creating order:', error);
        throw error;
      }
    },
    [user]
  );

  const updateOrderStatus = useCallback(
    async (orderId: number, status: OrderStatus, itemIds?: number[]): Promise<void> => {
      try {
        if (itemIds?.length) {
          // Update specific items
          const { error: itemsError } = await supabase
            .from('order_items')
            .update({ status })
            .in('id', itemIds);

          if (itemsError) throw itemsError;
        } else {
          // Update all items and order status
          const { error: orderError } = await supabase
            .from('orders')
            .update({ status })
            .eq('id', orderId);

          if (orderError) throw orderError;

          const { error: itemsError } = await supabase
            .from('order_items')
            .update({ status })
            .eq('order_id', orderId);

          if (itemsError) throw itemsError;
        }
      } catch (error) {
        console.error('Error updating order status:', error);
        throw error;
      }
    },
    []
  );

  const closeOrder = useCallback(
    async (orderId: number): Promise<void> => {
      try {
        const { error } = await supabase
          .from('orders')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', orderId);

        if (error) throw error;
      } catch (error) {
        console.error('Error closing order:', error);
        throw error;
      }
    },
    []
  );

  const getOrdersByStatus = useCallback(
    (status: OrderStatus): Order[] => {
      return orders.filter(order => order.status === status);
    },
    [orders]
  );

  const getOrdersByWaiter = useCallback(
    (waiterId: number): Order[] => {
      return orders.filter(order => order.waiterId === waiterId);
    },
    [orders]
  );

  const activeOrders = orders.filter(order => 
    ['pending', 'in-progress', 'ready'].includes(order.status)
  );
  
  const completedOrders = orders.filter(order => order.status === 'completed');

  return (
    <OrderContext.Provider
      value={{
        orders,
        createOrder,
        processPayment,
        updateOrderStatus,
        closeOrder,
        getOrdersByStatus,
        getOrdersByWaiter,
        activeOrders,
        completedOrders,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => useContext(OrderContext);
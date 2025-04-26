import React, { createContext, useContext, useState } from 'react';
import { supabase } from '../lib/supabase';

interface SalesData {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  topItems: {
    name: string;
    sales: number;
    revenue: number;
  }[];
  dailySales: {
    day: string;
    amount: number;
  }[];
  customerCount: number;
  salesGrowth: number;
}

interface ReportsContextType {
  salesData: SalesData | null;
  isLoading: boolean;
  error: string | null;
  fetchSalesData: (dateRange: 'today' | 'week' | 'month' | 'year') => Promise<void>;
}

const ReportsContext = createContext<ReportsContextType>({
  salesData: null,
  isLoading: false,
  error: null,
  fetchSalesData: async () => {},
});

export const ReportsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSalesData = async (dateRange: 'today' | 'week' | 'month' | 'year') => {
    try {
      setIsLoading(true);
      setError(null);

      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      switch (dateRange) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      // Fetch completed orders within date range
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(*)
        `)
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', now.toISOString());

      if (ordersError) throw ordersError;

      // Calculate total sales and order count
      const totalSales = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      const totalOrders = orders?.length || 0;
      const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

      // Calculate unique customers (unique waiter_ids in this case)
      const uniqueCustomers = new Set(orders?.map(order => order.waiter_id));
      const customerCount = uniqueCustomers.size;

      // Calculate top items
      const itemSales = new Map<string, { sales: number; revenue: number }>();
      orders?.forEach(order => {
        order.items.forEach((item: any) => {
          const existing = itemSales.get(item.name) || { sales: 0, revenue: 0 };
          itemSales.set(item.name, {
            sales: existing.sales + item.quantity,
            revenue: existing.revenue + (item.price * item.quantity),
          });
        });
      });

      const topItems = Array.from(itemSales.entries())
        .map(([name, data]) => ({
          name,
          sales: data.sales,
          revenue: data.revenue,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 4);

      // Calculate daily sales
      const dailySales = new Array(7).fill(0).map((_, index) => {
        const date = new Date();
        date.setDate(date.getDate() - index);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const dayOrders = orders?.filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate >= date && orderDate < nextDate;
        });

        const amount = dayOrders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

        return {
          day: date.toLocaleDateString('en-US', { weekday: 'short' }),
          amount,
        };
      }).reverse();

      // Calculate sales growth
      const previousPeriodOrders = await supabase
        .from('orders')
        .select('total_amount')
        .eq('status', 'completed')
        .gte('created_at', new Date(startDate.getTime() - (now.getTime() - startDate.getTime())).toISOString())
        .lt('created_at', startDate.toISOString());

      const previousTotal = previousPeriodOrders.data?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      const salesGrowth = previousTotal > 0 
        ? ((totalSales - previousTotal) / previousTotal) * 100 
        : 0;

      setSalesData({
        totalSales,
        totalOrders,
        averageOrderValue,
        topItems,
        dailySales,
        customerCount,
        salesGrowth,
      });
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching sales data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ReportsContext.Provider
      value={{
        salesData,
        isLoading,
        error,
        fetchSalesData,
      }}
    >
      {children}
    </ReportsContext.Provider>
  );
};

export const useReports = () => {
  const context = useContext(ReportsContext);
  if (!context) {
    throw new Error('useReports must be used within a ReportsProvider');
  }
  return context;
};
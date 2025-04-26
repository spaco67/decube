import React, { useState } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import StatsCard from '../components/UI/StatsCard';
import OrderCard from '../components/UI/OrderCard';
import { useOrders } from '../contexts/OrderContext';
import { DollarSign, Users, TrendingUp, Clock } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { orders } = useOrders();
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

  const activeOrders = orders.filter(order => 
    ['pending', 'in-progress', 'ready'].includes(order.status)
  );
  
  const completedOrders = orders.filter(order => 
    order.status === 'completed'
  );

  // Calculate statistics
  const totalSales = completedOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const averageOrderValue = completedOrders.length > 0 
    ? totalSales / completedOrders.length 
    : 0;

  // Get unique waiter IDs to count staff
  const uniqueWaiters = new Set(orders.map(order => order.waiterId));

  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Total Sales"
          value={`₦${totalSales.toFixed(2)}`}
          icon={<DollarSign size={20} />}
          color="green"
          change={12} // Example change percentage
        />
        <StatsCard
          title="Active Staff"
          value={uniqueWaiters.size}
          icon={<Users size={20} />}
          color="blue"
        />
        <StatsCard
          title="Avg. Order Value"
          value={`₦${averageOrderValue.toFixed(2)}`}
          icon={<TrendingUp size={20} />}
          color="purple"
          change={5} // Example change percentage
        />
        <StatsCard
          title="Active Orders"
          value={activeOrders.length}
          icon={<Clock size={20} />}
          color="amber"
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('active')}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'active'
                  ? 'border-b-2 border-teal-500 text-teal-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Active Orders ({activeOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'completed'
                  ? 'border-b-2 border-teal-500 text-teal-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Completed Orders ({completedOrders.length})
            </button>
          </nav>
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeTab === 'active' && activeOrders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              showDetails
            />
          ))}

          {activeTab === 'completed' && completedOrders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              showDetails
            />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
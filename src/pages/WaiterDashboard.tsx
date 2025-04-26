import React, { useState } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import OrderCard from '../components/UI/OrderCard';
import StatsCard from '../components/UI/StatsCard';
import { useOrders } from '../contexts/OrderContext';
import { useAuth } from '../contexts/AuthContext';
import { DollarSign, Clock, CheckCircle, PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const WaiterDashboard: React.FC = () => {
  const { user } = useAuth();
  const { orders, closeOrder } = useOrders();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

  // Filter orders for the current waiter
  const waiterOrders = orders.filter(order => order.waiterId === user?.id);
  
  const activeOrders = waiterOrders.filter(order => 
    ['pending', 'in-progress', 'ready'].includes(order.status)
  );
  
  const completedOrders = waiterOrders.filter(order => 
    order.status === 'completed'
  );

  // Calculate statistics
  const totalSales = completedOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const pendingOrders = activeOrders.filter(order => order.status === 'pending').length;
  const readyOrders = activeOrders.filter(order => order.status === 'ready').length;

  const handleCloseOrder = async (order: any) => {
    await closeOrder(order.id);
  };

  return (
    <DashboardLayout title="Waiter Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Total Sales"
          value={`₦${totalSales.toFixed(2)}`}
          icon={<DollarSign size={20} />}
          color="green"
        />
        <StatsCard
          title="Active Orders"
          value={activeOrders.length}
          icon={<Clock size={20} />}
          color="amber"
        />
        <StatsCard
          title="Ready for Service"
          value={readyOrders}
          icon={<CheckCircle size={20} />}
          color="blue"
        />
        <StatsCard
          title="Pending Orders"
          value={pendingOrders}
          icon={<PlusCircle size={20} />}
          color="purple"
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
              onAction={order.status === 'ready' ? handleCloseOrder : undefined}
              actionText="Close Order"
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

          {activeTab === 'active' && activeOrders.length === 0 && (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No active orders</p>
              <button
                onClick={() => navigate('/waiter/new-order')}
                className="mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md transition-colors"
              >
                Create New Order
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default WaiterDashboard;
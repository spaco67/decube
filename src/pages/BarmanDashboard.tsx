import React, { useState } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import OrderCard from '../components/UI/OrderCard';
import StatsCard from '../components/UI/StatsCard';
import { useOrders } from '../contexts/OrderContext';
import { Beer, Clock, CheckCircle } from 'lucide-react';

const BarmanDashboard: React.FC = () => {
  const { orders, updateOrderStatus } = useOrders();
  const [activeTab, setActiveTab] = useState<'pending' | 'in-progress' | 'completed'>('pending');

  // Filter orders that have bar items
  const barOrders = orders.filter(order => 
    order.items.some(item => item.preparationType === 'bar')
  );

  const pendingOrders = barOrders.filter(order => 
    order.items.some(item => 
      item.preparationType === 'bar' && item.status === 'pending'
    )
  );

  const inProgressOrders = barOrders.filter(order => 
    order.items.some(item => 
      item.preparationType === 'bar' && item.status === 'in-progress'
    )
  );

  const completedOrders = barOrders.filter(order => 
    order.items.every(item => 
      item.preparationType === 'bar' ? item.status === 'completed' : true
    )
  );

  const handleOrderAction = async (order: any, newStatus: 'in-progress' | 'ready') => {
    const barItemIds = order.items
      .filter(item => item.preparationType === 'bar')
      .map(item => item.id);
    
    await updateOrderStatus(order.id, newStatus, barItemIds);
  };

  return (
    <DashboardLayout title="Bar Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatsCard
          title="Pending Orders"
          value={pendingOrders.length}
          icon={<Clock size={20} />}
          color="amber"
        />
        <StatsCard
          title="In Progress"
          value={inProgressOrders.length}
          icon={<Beer size={20} />}
          color="blue"
        />
        <StatsCard
          title="Completed Today"
          value={completedOrders.length}
          icon={<CheckCircle size={20} />}
          color="green"
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'pending'
                  ? 'border-b-2 border-teal-500 text-teal-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pending ({pendingOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('in-progress')}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'in-progress'
                  ? 'border-b-2 border-teal-500 text-teal-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              In Progress ({inProgressOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'completed'
                  ? 'border-b-2 border-teal-500 text-teal-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Completed ({completedOrders.length})
            </button>
          </nav>
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeTab === 'pending' && pendingOrders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onAction={() => handleOrderAction(order, 'in-progress')}
              actionText="Start Preparing"
              showDetails
            />
          ))}

          {activeTab === 'in-progress' && inProgressOrders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onAction={() => handleOrderAction(order, 'ready')}
              actionText="Mark as Ready"
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

export default BarmanDashboard;
import React from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import OrderCard from '../components/UI/OrderCard';
import StatsCard from '../components/UI/StatsCard';
import { useOrders } from '../contexts/OrderContext';
import { Beer, Clock, CheckCircle } from 'lucide-react';

const BarOrders: React.FC = () => {
  const { orders, updateOrderStatus } = useOrders();

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
    <DashboardLayout title="Bar Orders">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pendingOrders.map(order => (
          <OrderCard
            key={order.id}
            order={order}
            onAction={() => handleOrderAction(order, 'in-progress')}
            actionText="Start Preparing"
            showDetails
          />
        ))}

        {inProgressOrders.map(order => (
          <OrderCard
            key={order.id}
            order={order}
            onAction={() => handleOrderAction(order, 'ready')}
            actionText="Mark as Ready"
            showDetails
          />
        ))}
      </div>
    </DashboardLayout>
  );
};

export default BarOrders;
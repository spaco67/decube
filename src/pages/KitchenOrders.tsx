import React from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import OrderCard from '../components/UI/OrderCard';
import StatsCard from '../components/UI/StatsCard';
import { useOrders } from '../contexts/OrderContext';
import { Utensils, Clock, CheckCircle } from 'lucide-react';

const KitchenOrders: React.FC = () => {
  const { orders, updateOrderStatus } = useOrders();

  // Filter orders that have kitchen items
  const kitchenOrders = orders.filter(order => 
    order.items.some(item => item.preparationType === 'kitchen')
  );

  const pendingOrders = kitchenOrders.filter(order => 
    order.items.some(item => 
      item.preparationType === 'kitchen' && item.status === 'pending'
    )
  );

  const inProgressOrders = kitchenOrders.filter(order => 
    order.items.some(item => 
      item.preparationType === 'kitchen' && item.status === 'in-progress'
    )
  );

  const completedOrders = kitchenOrders.filter(order => 
    order.items.every(item => 
      item.preparationType === 'kitchen' ? item.status === 'completed' : true
    )
  );

  const handleOrderAction = async (order: any, newStatus: 'in-progress' | 'ready') => {
    const kitchenItemIds = order.items
      .filter(item => item.preparationType === 'kitchen')
      .map(item => item.id);
    
    await updateOrderStatus(order.id, newStatus, kitchenItemIds);
  };

  return (
    <DashboardLayout title="Kitchen Orders">
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
          icon={<Utensils size={20} />}
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

export default KitchenOrders;
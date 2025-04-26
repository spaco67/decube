import React from 'react';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import NewOrderForm from '../../components/Orders/NewOrderForm';

const NewOrder: React.FC = () => {
  return (
    <DashboardLayout title="New Order">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">Create New Order</h2>
          <p className="text-gray-600 dark:text-gray-400">Select items and table to create a new order</p>
        </div>
        
        <NewOrderForm />
      </div>
    </DashboardLayout>
  );
};

export default NewOrder;
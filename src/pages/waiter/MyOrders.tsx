import React, { useState } from "react";
import DashboardLayout from "../../components/Layout/DashboardLayout";
import OrderCard from "../../components/UI/OrderCard";
import { useOrders } from "../../contexts/OrderContext";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Filter, Search } from "lucide-react";

const MyOrders: React.FC = () => {
  const { user } = useAuth();
  const { orders, closeOrder } = useOrders();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Filter orders for the current waiter - use waiter_id not waiterId
  const waiterOrders = orders.filter((order) => order.waiter_id === user?.id);

  // Apply search and status filters - fix the tableNumber reference to use table_id
  const filteredOrders = waiterOrders.filter((order) => {
    // Get table number from the order if possible
    const tableIdMatches = order.table_id?.toString().includes(searchTerm);

    // Check if any item names match
    const itemNameMatches = order.items?.some((item) =>
      item.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const matchesSearch =
      tableIdMatches || itemNameMatches || searchTerm === "";
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleCloseOrder = async (order: any) => {
    await closeOrder(order.id);
  };

  return (
    <DashboardLayout title="My Orders">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
              My Orders
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              View and manage your orders
            </p>
          </div>

          <button
            onClick={() => navigate("/waiter/new-order")}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
          >
            Create New Order
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-6">
          <div className="p-4 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search
                size={20}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="ready">Ready</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onAction={
                  order.status === "ready" ? handleCloseOrder : undefined
                }
                actionText="Close Order"
                showDetails
                showPayment={order.status === "ready"}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-8 bg-white dark:bg-gray-800 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400">
                No orders found
              </p>
              <button
                onClick={() => navigate("/waiter/new-order")}
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

export default MyOrders;

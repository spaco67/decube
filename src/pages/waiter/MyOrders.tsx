import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/Layout/DashboardLayout";
import { useOrders } from "../../contexts/OrderContext";
import { Search } from "lucide-react";
import { Link } from "react-router-dom";
import OrderCard from "../../components/UI/OrderCard";

const MyOrders: React.FC = () => {
  const { orders, getOrdersByWaiter, refetchOrders } = useOrders();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    refetchOrders();
  }, [refetchOrders]);

  const filteredOrders = orders.filter((order) => {
    // Apply search and status filters
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;

    // Search by order items
    const itemNameMatches = order.items.some((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return matchesStatus && (itemNameMatches || searchTerm === "");
  });

  return (
    <DashboardLayout title="My Orders">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2">
          Order History
        </h2>
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search orders..."
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
          </div>

          <div className="flex space-x-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="ready">Ready</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <Link
              to="/waiter/new-order"
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg flex items-center"
            >
              New Order
            </Link>
          </div>
        </div>
      </div>

      {filteredOrders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => (
            <OrderCard key={order.id} order={order} isWaiter={true} />
          ))}
        </div>
      ) : (
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            No orders found
          </p>
          <Link
            to="/waiter/new-order"
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg inline-block"
          >
            Create New Order
          </Link>
        </div>
      )}
    </DashboardLayout>
  );
};

export default MyOrders;

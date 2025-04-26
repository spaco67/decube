import React, { useState, useEffect } from "react";
import DashboardLayout from "../components/Layout/DashboardLayout";
import OrderCard from "../components/UI/OrderCard";
import StatsCard from "../components/UI/StatsCard";
import { useOrders } from "../contexts/OrderContext";
import { Beer, Clock, CheckCircle, RefreshCw } from "lucide-react";

const BarmanDashboard: React.FC = () => {
  const { orders, updateOrderStatus, isLoading, error, refetchOrders } =
    useOrders();
  const [activeTab, setActiveTab] = useState<
    "pending" | "in-progress" | "completed"
  >("pending");

  // Filter orders that have bar items - including checking preparationType
  const barOrders = orders.filter(
    (order) =>
      order.items &&
      order.items.some((item) => {
        return item.preparationType === "bar";
      })
  );

  // Filter orders with pending bar items
  const pendingOrders = barOrders.filter(
    (order) =>
      order.items &&
      order.items.some((item) => {
        const isBarItem = item.preparationType === "bar";
        const isPending = item.status === "pending";
        return isBarItem && isPending;
      })
  );

  // Filter orders with in-progress bar items
  const inProgressOrders = barOrders.filter(
    (order) =>
      order.items &&
      order.items.some((item) => {
        const isBarItem = item.preparationType === "bar";
        const isInProgress = item.status === "in-progress";
        return isBarItem && isInProgress;
      })
  );

  // Filter orders with completed bar items
  const completedOrders = barOrders.filter(
    (order) =>
      order.items &&
      order.items.every((item) => {
        // If it's a bar item, check if it's completed
        const isBarItem = item.preparationType === "bar";
        if (isBarItem) {
          return item.status === "completed" || item.status === "ready";
        }
        // Not a bar item, so we don't care about its status
        return true;
      })
  );

  const handleOrderAction = async (
    order: any,
    newStatus: "in-progress" | "ready"
  ) => {
    try {
      // Find the bar items in this order
      const barItemIds = order.items
        .filter((item) => item.preparationType === "bar")
        .map((item) => item.id);

      if (barItemIds.length > 0) {
        await updateOrderStatus(order.id, newStatus, barItemIds);
      }
    } catch (error) {
      console.error(`Error updating order to ${newStatus}:`, error);
    }
  };

  const handleRefresh = async () => {
    await refetchOrders();
  };

  return (
    <DashboardLayout title="Bar Dashboard">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Bar Orders</h1>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex items-center px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-md transition-colors"
        >
          <RefreshCw
            size={16}
            className={`mr-2 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatsCard
          title="Pending Orders"
          value={pendingOrders.length.toString()}
          icon={<Clock size={20} className="text-amber-600" />}
        />
        <StatsCard
          title="In Progress"
          value={inProgressOrders.length.toString()}
          icon={<Beer size={20} className="text-blue-600" />}
        />
        <StatsCard
          title="Completed Today"
          value={completedOrders.length.toString()}
          icon={<CheckCircle size={20} className="text-green-600" />}
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab("pending")}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === "pending"
                  ? "border-b-2 border-teal-500 text-teal-600"
                  : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Pending ({pendingOrders.length})
            </button>
            <button
              onClick={() => setActiveTab("in-progress")}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === "in-progress"
                  ? "border-b-2 border-teal-500 text-teal-600"
                  : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              In Progress ({inProgressOrders.length})
            </button>
            <button
              onClick={() => setActiveTab("completed")}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === "completed"
                  ? "border-b-2 border-teal-500 text-teal-600"
                  : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Completed ({completedOrders.length})
            </button>
          </nav>
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            <div className="col-span-full text-center py-8">
              <RefreshCw
                size={32}
                className="mx-auto mb-4 animate-spin text-teal-500"
              />
              <p className="text-gray-500 dark:text-gray-400">
                Loading orders...
              </p>
            </div>
          ) : (
            <>
              {activeTab === "pending" && pendingOrders.length > 0
                ? pendingOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onAction={() => handleOrderAction(order, "in-progress")}
                      actionText="Start Preparing"
                      showDetails
                    />
                  ))
                : activeTab === "pending" && (
                    <div className="col-span-full text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">
                        No pending orders
                      </p>
                    </div>
                  )}

              {activeTab === "in-progress" && inProgressOrders.length > 0
                ? inProgressOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onAction={() => handleOrderAction(order, "ready")}
                      actionText="Mark as Ready"
                      showDetails
                    />
                  ))
                : activeTab === "in-progress" && (
                    <div className="col-span-full text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">
                        No orders in progress
                      </p>
                    </div>
                  )}

              {activeTab === "completed" && completedOrders.length > 0
                ? completedOrders.map((order) => (
                    <OrderCard key={order.id} order={order} showDetails />
                  ))
                : activeTab === "completed" && (
                    <div className="col-span-full text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">
                        No completed orders
                      </p>
                    </div>
                  )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BarmanDashboard;

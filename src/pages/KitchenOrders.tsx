import React from "react";
import DashboardLayout from "../components/Layout/DashboardLayout";
import OrderCard from "../components/UI/OrderCard";
import StatsCard from "../components/UI/StatsCard";
import { useOrders } from "../contexts/OrderContext";
import { Utensils, Clock, CheckCircle, RefreshCw } from "lucide-react";

const KitchenOrders: React.FC = () => {
  const { orders, updateOrderStatus, isLoading, error, refetchOrders } =
    useOrders();

  // Filter orders that have kitchen items
  const kitchenOrders = orders.filter(
    (order) =>
      order.items &&
      order.items.some((item) => item.preparationType === "kitchen")
  );

  const pendingOrders = kitchenOrders.filter(
    (order) =>
      order.items &&
      order.items.some(
        (item) =>
          item.preparationType === "kitchen" && item.status === "pending"
      )
  );

  const inProgressOrders = kitchenOrders.filter(
    (order) =>
      order.items &&
      order.items.some(
        (item) =>
          item.preparationType === "kitchen" && item.status === "in-progress"
      )
  );

  const completedOrders = kitchenOrders.filter(
    (order) =>
      order.items &&
      order.items.every((item) =>
        item.preparationType === "kitchen"
          ? item.status === "completed" || item.status === "ready"
          : true
      )
  );

  const handleOrderAction = async (
    order: any,
    newStatus: "in-progress" | "ready"
  ) => {
    try {
      const kitchenItemIds = order.items
        .filter((item) => item.preparationType === "kitchen")
        .map((item) => item.id);

      if (kitchenItemIds.length > 0) {
        await updateOrderStatus(order.id, newStatus, kitchenItemIds);
      }
    } catch (error) {
      console.error(`Error updating order to ${newStatus}:`, error);
    }
  };

  const handleRefresh = async () => {
    await refetchOrders();
  };

  return (
    <DashboardLayout title="Kitchen Orders">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Kitchen Orders</h1>
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
          icon={<Utensils size={20} className="text-blue-600" />}
        />
        <StatsCard
          title="Completed Today"
          value={completedOrders.length.toString()}
          icon={<CheckCircle size={20} className="text-green-600" />}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            {pendingOrders.length > 0 ? (
              pendingOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onAction={() => handleOrderAction(order, "in-progress")}
                  actionText="Start Preparing"
                  showDetails
                />
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  No pending kitchen orders
                </p>
              </div>
            )}

            {inProgressOrders.length > 0
              ? inProgressOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onAction={() => handleOrderAction(order, "ready")}
                    actionText="Mark as Ready"
                    showDetails
                  />
                ))
              : null}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default KitchenOrders;

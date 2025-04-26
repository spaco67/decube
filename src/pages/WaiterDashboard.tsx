import React, { useState } from "react";
import DashboardLayout from "../components/Layout/DashboardLayout";
import OrderCard from "../components/UI/OrderCard";
import StatsCard from "../components/UI/StatsCard";
import { useOrders } from "../contexts/OrderContext";
import { useAuth } from "../contexts/AuthContext";
import {
  DollarSign,
  Clock,
  CheckCircle,
  PlusCircle,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const WaiterDashboard: React.FC = () => {
  const { user } = useAuth();
  const { orders, closeOrder, isLoading, error, refetchOrders } = useOrders();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active");

  // Filter orders for the current waiter
  const waiterOrders = orders.filter((order) => order.waiter_id === user?.id);

  const activeOrders = waiterOrders.filter((order) =>
    ["pending", "in-progress", "ready"].includes(order.status)
  );

  const completedOrders = waiterOrders.filter(
    (order) => order.status === "completed"
  );

  // Calculate statistics
  const totalSales = completedOrders.reduce(
    (sum, order) => sum + (order.total_amount || 0),
    0
  );
  const pendingOrders = activeOrders.filter(
    (order) => order.status === "pending"
  ).length;
  const readyOrders = activeOrders.filter(
    (order) => order.status === "ready"
  ).length;

  const handleCloseOrder = async (order: any) => {
    try {
      await closeOrder(order.id);
    } catch (error) {
      console.error("Error closing order:", error);
    }
  };

  const handleRefresh = async () => {
    await refetchOrders();
  };

  return (
    <DashboardLayout title="Waiter Dashboard">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
              Welcome, {user?.name}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Here's an overview of your orders
            </p>
          </div>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <StatsCard
            title="Total Sales"
            value={`₦${totalSales.toFixed(2)}`}
            icon={<DollarSign className="text-green-600" />}
            trend="up"
            trendValue="12%"
          />
          <StatsCard
            title="Pending Orders"
            value={pendingOrders.toString()}
            icon={<Clock className="text-amber-600" />}
          />
          <StatsCard
            title="Ready Orders"
            value={readyOrders.toString()}
            icon={<CheckCircle className="text-teal-600" />}
          />
        </div>

        <div className="mb-6 flex justify-between items-center">
          <h3 className="text-xl font-medium text-gray-800 dark:text-white">
            Your Orders
          </h3>
          <button
            onClick={() => navigate("/waiter/new-order")}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <PlusCircle size={16} />
            <span>New Order</span>
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab("active")}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === "active"
                    ? "border-b-2 border-teal-500 text-teal-600"
                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Active ({activeOrders.length})
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

          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
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
                {activeTab === "active" && activeOrders.length > 0
                  ? activeOrders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        onAction={
                          order.status === "ready"
                            ? () => handleCloseOrder(order)
                            : undefined
                        }
                        actionText={
                          order.status === "ready"
                            ? "Complete Order"
                            : undefined
                        }
                        showDetails
                        showPayment={order.status === "ready"}
                      />
                    ))
                  : activeTab === "active" && (
                      <div className="col-span-full text-center py-8">
                        <p className="text-gray-500 dark:text-gray-400">
                          No active orders. Create a new order to get started!
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
                          No completed orders yet
                        </p>
                      </div>
                    )}
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default WaiterDashboard;

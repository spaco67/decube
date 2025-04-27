import React from "react";
import {
  Clock,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Wallet,
  BanknoteIcon,
  DollarSign,
  Hash,
} from "lucide-react";
import { Order, OrderStatus } from "../../types";
import { useState, useEffect } from "react";
import { useOrders } from "../../contexts/OrderContext";
import { supabase } from "../../lib/supabase";

interface OrderCardProps {
  order: any;
  onAction?: (order: any) => void;
  actionText?: string;
  showDetails?: boolean;
  showPayment?: boolean;
  isWaiter?: boolean;
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onAction,
  actionText = "Process Order",
  showDetails = false,
  showPayment = false,
  isWaiter = false,
}) => {
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { processPayment } = useOrders();
  const [waiterName, setWaiterName] = useState<string>("");
  const [itemsWithDetails, setItemsWithDetails] = useState<any[]>([]);

  useEffect(() => {
    // Initialize waiter name if available
    if (order.waiterName && !waiterName) {
      setWaiterName(order.waiterName);
    }
    // Fetch waiter name if we only have waiter_id
    else if (order.waiter_id && !waiterName) {
      fetchWaiterName(order.waiter_id);
    }

    // If order items exist, normalize them
    if (order.items && order.items.length > 0) {
      normalizeItems(order.items);
    }
  }, [order, waiterName]);

  const fetchWaiterName = async (waiterId: string) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("name")
        .eq("id", waiterId)
        .single();

      if (error) throw error;
      if (data) {
        setWaiterName(data.name);
      }
    } catch (err) {
      console.error("Error fetching waiter name:", err);
    }
  };

  const normalizeItems = (items: any[]) => {
    try {
      const normalizedItems = items.map((item) => ({
        id: item.id,
        name: item.name || "Unknown Item",
        preparationType:
          item.preparationType || item.preparation_type || "unknown",
        status: item.status || "pending",
        quantity: item.quantity || 1,
        price: item.price || 0,
        notes: item.notes || "",
      }));

      setItemsWithDetails(normalizedItems);
    } catch (err) {
      console.error("Error normalizing order items:", err);
      // Fall back to original items
      setItemsWithDetails(items);
    }
  };

  const statusColors = {
    pending: "bg-amber-100 text-amber-800 border-amber-200",
    "in-progress": "bg-blue-100 text-blue-800 border-blue-200",
    ready: "bg-green-100 text-green-800 border-green-200",
    completed: "bg-gray-100 text-gray-800 border-gray-200",
    cancelled: "bg-red-100 text-red-800 border-red-200",
  };

  const statusIcons = {
    pending: <Clock size={16} className="text-amber-600" />,
    "in-progress": <Clock size={16} className="text-blue-600" />,
    ready: <CheckCircle size={16} className="text-green-600" />,
    completed: <CheckCircle size={16} className="text-gray-600" />,
    cancelled: <AlertCircle size={16} className="text-red-600" />,
  };

  // Use enhanced items if available, otherwise fall back to original items
  const items =
    itemsWithDetails.length > 0 ? itemsWithDetails : order.items || [];

  // Create a truncated or full view of items
  const itemsToShow = showDetails ? items : items.slice(0, 2);
  const hasMoreItems = !showDetails && items.length > 2;

  // Calculate how much time has passed since order creation
  const createdAtStr = order.created_at || order.createdAt;
  const createdAt = createdAtStr ? new Date(createdAtStr) : new Date();
  const now = new Date();
  const diffInMinutes = Math.floor(
    (now.getTime() - createdAt.getTime()) / (1000 * 60)
  );

  const timeDisplay =
    diffInMinutes < 60
      ? `${diffInMinutes}m ago`
      : `${Math.floor(diffInMinutes / 60)}h ${diffInMinutes % 60}m ago`;

  const handlePayment = async (method: "cash" | "card" | "transfer") => {
    try {
      setIsProcessingPayment(true);
      setPaymentError(null);
      setShowPaymentModal(false);
      await processPayment(
        order.id,
        method,
        order.total_amount || order.totalAmount || order.total || 0
      );
    } catch (error: any) {
      setPaymentError(error.message);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Get correct total amount
  const totalAmount =
    order.total_amount || order.totalAmount || order.total || 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden transition-all hover:shadow-md">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="font-medium text-gray-800 dark:text-gray-200 flex items-center">
            <Hash size={16} className="mr-1" />
            {order.id.substring(0, 8)}
          </span>
          <span
            className={`px-2 py-1 text-xs rounded-full ${
              statusColors[order.status as OrderStatus]
            } flex items-center`}
          >
            {statusIcons[order.status as OrderStatus]}
            <span className="ml-1 capitalize">{order.status}</span>
          </span>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
          <Clock size={14} className="mr-1" />
          {timeDisplay}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="mb-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Waiter: {waiterName || "Unknown"}
          </span>
        </div>

        <ul className="space-y-2 mb-4">
          {itemsToShow.map((item) => (
            <li key={item.id} className="flex justify-between text-sm">
              <div className="flex-1">
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  {item.quantity}x {item.name}
                </span>
                <span className="ml-2 text-xs text-gray-500">
                  ({item.preparationType})
                </span>
                {item.notes && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {item.notes}
                  </p>
                )}
              </div>
              <div className="flex items-center">
                <span
                  className={`px-2 py-0.5 text-xs rounded-full ${
                    statusColors[item.status || "pending"]
                  } mr-2`}
                >
                  {item.status || "pending"}
                </span>
                <span className="text-gray-700 dark:text-gray-300">
                  ₦{(item.price || 0).toFixed(2)}
                </span>
              </div>
            </li>
          ))}

          {hasMoreItems && (
            <li className="text-sm text-gray-500 dark:text-gray-400">
              + {items.length - 2} more items...
            </li>
          )}
        </ul>

        <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="font-medium text-gray-900 dark:text-white">
            Total: ₦{totalAmount.toFixed(2)}
            {paymentError && (
              <p className="text-xs text-red-600 mt-1">{paymentError}</p>
            )}
            {order.payment_status && (
              <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center mt-1">
                <DollarSign size={14} className="mr-1" />
                <span className="capitalize">{order.payment_status}</span>
                {order.payment_method && (
                  <span className="ml-1">via {order.payment_method}</span>
                )}
              </div>
            )}
          </div>

          {showPayment &&
          (order.status === "ready" || order.status === "completed") &&
          order.payment_status !== "paid" ? (
            <div className="flex space-x-2">
              <button
                onClick={() => handlePayment("cash")}
                disabled={isProcessingPayment}
                className="flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50"
              >
                <BanknoteIcon size={16} className="mr-1" />
                Cash
              </button>
              <button
                onClick={() => handlePayment("card")}
                disabled={isProcessingPayment}
                className="flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50"
              >
                <CreditCard size={16} className="mr-1" />
                Card
              </button>
              <button
                onClick={() => handlePayment("transfer")}
                disabled={isProcessingPayment}
                className="flex items-center px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50"
              >
                <Wallet size={16} className="mr-1" />
                Transfer
              </button>
            </div>
          ) : (
            onAction &&
            actionText && (
              <button
                onClick={() => onAction(order)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-md transition-colors"
              >
                {actionText}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderCard;

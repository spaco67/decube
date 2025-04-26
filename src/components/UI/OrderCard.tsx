import React from 'react';
import { Clock, CheckCircle, AlertCircle, CreditCard, Wallet, BanknoteIcon, DollarSign } from 'lucide-react';
import { Order, OrderStatus } from '../../types';
import { useState } from 'react';
import { useOrders } from '../../contexts/OrderContext';

interface OrderCardProps {
  order: Order;
  onAction?: (order: Order) => void;
  actionText?: string;
  showDetails?: boolean;
  showPayment?: boolean;
}

const OrderCard: React.FC<OrderCardProps> = ({ 
  order, 
  onAction,
  actionText = 'Process Order',
  showDetails = false,
  showPayment = false
}) => {
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { processPayment } = useOrders();

  const statusColors = {
    'pending': 'bg-amber-100 text-amber-800 border-amber-200',
    'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
    'ready': 'bg-green-100 text-green-800 border-green-200',
    'completed': 'bg-gray-100 text-gray-800 border-gray-200',
    'cancelled': 'bg-red-100 text-red-800 border-red-200',
  };

  const statusIcons = {
    'pending': <Clock size={16} className="text-amber-600" />,
    'in-progress': <Clock size={16} className="text-blue-600" />,
    'ready': <CheckCircle size={16} className="text-green-600" />,
    'completed': <CheckCircle size={16} className="text-gray-600" />,
    'cancelled': <AlertCircle size={16} className="text-red-600" />,
  };

  // Create a truncated or full view of items
  const itemsToShow = showDetails ? order.items : order.items.slice(0, 2);
  const hasMoreItems = !showDetails && order.items.length > 2;

  // Calculate how much time has passed since order creation
  const createdAt = new Date(order.createdAt);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60));
  
  const timeDisplay = diffInMinutes < 60 
    ? `${diffInMinutes}m ago` 
    : `${Math.floor(diffInMinutes / 60)}h ${diffInMinutes % 60}m ago`;
    
  const handlePayment = async (method: 'cash' | 'card' | 'transfer') => {
    try {
      setIsProcessingPayment(true);
      setPaymentError(null);
      setShowPaymentModal(false);
      await processPayment(order.id, method, order.totalAmount);
    } catch (error: any) {
      setPaymentError(error.message);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden transition-all hover:shadow-md">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="font-medium text-gray-800 dark:text-gray-200">Table {order.tableNumber}</span>
          <span className={`px-2 py-1 text-xs rounded-full ${statusColors[order.status]} flex items-center`}>
            {statusIcons[order.status]}
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
          <span className="text-sm text-gray-500 dark:text-gray-400">Waiter: {order.waiterName}</span>
        </div>
        
        <ul className="space-y-2 mb-4">
          {itemsToShow.map((item) => (
            <li key={item.id} className="flex justify-between text-sm">
              <div className="flex-1">
                <span className="font-medium text-gray-800 dark:text-gray-200">{item.quantity}x {item.name}</span>
                {item.notes && <p className="text-xs text-gray-500 dark:text-gray-400">{item.notes}</p>}
              </div>
              <div className="flex items-center">
                <span className={`px-2 py-0.5 text-xs rounded-full ${statusColors[item.status]} mr-2`}>
                  {item.status}
                </span>
                <span className="text-gray-700 dark:text-gray-300">₦{item.price.toFixed(2)}</span>
              </div>
            </li>
          ))}
          
          {hasMoreItems && (
            <li className="text-sm text-gray-500 dark:text-gray-400">
              + {order.items.length - 2} more items...
            </li>
          )}
        </ul>
        
        <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="font-medium text-gray-900 dark:text-white">
            Total: ₦{order.totalAmount.toFixed(2)}
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
          
          {showPayment && order.status === 'ready' && order.payment_status !== 'paid' ? (
            <div className="flex space-x-2">
              <button
                onClick={() => handlePayment('cash')}
                disabled={isProcessingPayment}
                className="flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors"
              >
                <BanknoteIcon size={16} className="mr-1" />
                Cash
              </button>
              <button
                onClick={() => handlePayment('card')}
                disabled={isProcessingPayment}
                className="flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
              >
                <CreditCard size={16} className="mr-1" />
                Card
              </button>
              <button
                onClick={() => handlePayment('transfer')}
                disabled={isProcessingPayment}
                className="flex items-center px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-md transition-colors"
              >
                <Wallet size={16} className="mr-1" />
                Transfer
              </button>
            </div>
          ) : onAction && (
            <>
              <button 
                onClick={() => onAction(order)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-md transition-colors"
              >
                {actionText}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderCard;
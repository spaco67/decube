import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { Order, OrderItem, OrderStatus, User } from "../types";
import { useAuth } from "./AuthContext";
import { supabase } from "../lib/supabase";
import { sendTransactionNotification } from "../lib/email";

interface OrderContextType {
  orders: Order[];
  createOrder: (items: OrderItem[]) => Promise<Order>;
  updateOrderStatus: (
    orderId: string,
    status: OrderStatus,
    itemIds?: string[]
  ) => Promise<void>;
  processPayment: (
    orderId: string,
    method: "cash" | "card" | "transfer",
    amount: number
  ) => Promise<void>;
  closeOrder: (orderId: string) => Promise<void>;
  getOrdersByStatus: (status: OrderStatus) => Order[];
  getOrdersByWaiter: (waiterId: string) => Order[];
  activeOrders: Order[];
  completedOrders: Order[];
  isLoading: boolean;
  error: string | null;
  refetchOrders: () => Promise<void>;
}

const OrderContext = createContext<OrderContextType>({
  orders: [],
  createOrder: async () => ({ id: "0" } as Order),
  updateOrderStatus: async () => {},
  processPayment: async () => {},
  closeOrder: async () => {},
  getOrdersByStatus: () => [],
  getOrdersByWaiter: () => [],
  activeOrders: [],
  completedOrders: [],
  isLoading: false,
  error: null,
  refetchOrders: async () => {},
});

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const processPayment = useCallback(
    async (
      orderId: string,
      method: "cash" | "card" | "transfer",
      amount: number
    ) => {
      try {
        const reference = `PAY-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`;

        const { error } = await supabase
          .from("orders")
          .update({
            payment_method: method,
            payment_status: "paid",
            payment_amount: amount,
            payment_reference: reference,
            status: "completed",
            completed_at: new Date().toISOString(),
          })
          .eq("id", orderId);

        if (error) throw error;

        // Send notification
        const { data: orderData } = await supabase
          .from("orders")
          .select(
            `
            *,
            items:order_items(*)
          `
          )
          .eq("id", orderId)
          .single();

        if (orderData) {
          const itemsList = orderData.items.map(
            (item: any) =>
              `${item.quantity}x ${item.name} (₦${item.price.toFixed(2)})`
          );

          await sendTransactionNotification(
            user?.name || "Unknown Staff",
            user?.role || "Unknown Role",
            reference,
            amount,
            itemsList,
            method
          );
        }

        // Refresh orders after payment
        await fetchOrders();
      } catch (error: any) {
        console.error("Error processing payment:", error);
        setError(`Payment processing failed: ${error.message}`);
        throw error;
      }
    },
    [user]
  );

  const refetchOrders = useCallback(async () => {
    await fetchOrders();
  }, []);

  useEffect(() => {
    if (user) {
      // Fetch initial orders
      fetchOrders();

      // Subscribe to real-time updates
      const ordersSubscription = supabase
        .channel("orders")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "orders" },
          handleOrderChange
        )
        .subscribe();

      const orderItemsSubscription = supabase
        .channel("order_items")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "order_items" },
          handleOrderItemChange
        )
        .subscribe();

      return () => {
        ordersSubscription.unsubscribe();
        orderItemsSubscription.unsubscribe();
      };
    } else {
      setOrders([]);
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log("Fetching orders...");

      // First, fetch the orders with their items
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(
          `
          id,
          waiter_id,
          status,
          total_amount,
          created_at,
          updated_at,
          completed_at,
          payment_status,
          payment_method,
          items:order_items(
            id,
            menu_item_id,
            quantity,
            price,
            status,
            notes
          )
        `
        )
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      // Get all unique menu item IDs from all orders
      const menuItemIds = new Set<string>();
      ordersData?.forEach((order) => {
        order.items?.forEach((item) => {
          if (item.menu_item_id) {
            menuItemIds.add(item.menu_item_id);
          }
        });
      });

      // Fetch menu item details in a single query
      let menuItems: any[] = [];
      if (menuItemIds.size > 0) {
        const { data: menuItemsData, error: menuItemsError } = await supabase
          .from("menu_items")
          .select("id, name, preparation_type")
          .in("id", Array.from(menuItemIds));

        if (menuItemsError) throw menuItemsError;
        menuItems = menuItemsData || [];
      }

      // Create a map for faster lookup
      const menuItemsMap = new Map();
      menuItems.forEach((item) => {
        menuItemsMap.set(item.id, item);
      });

      // Fetch waiter names for orders
      const waiterIds = new Set<string>();
      ordersData?.forEach((order) => {
        if (order.waiter_id) {
          waiterIds.add(order.waiter_id);
        }
      });

      let waiters: any[] = [];
      if (waiterIds.size > 0) {
        const { data: waitersData, error: waitersError } = await supabase
          .from("users")
          .select("id, name")
          .in("id", Array.from(waiterIds));

        if (waitersError) throw waitersError;
        waiters = waitersData || [];
      }

      // Create a map for faster lookup
      const waitersMap = new Map();
      waiters.forEach((waiter) => {
        waitersMap.set(waiter.id, waiter);
      });

      // Enhance order items with menu item details
      const enhancedOrders =
        ordersData?.map((order) => {
          const enhancedItems =
            order.items?.map((item) => {
              const menuItem = menuItemsMap.get(item.menu_item_id);
              return {
                id: item.id,
                menuItemId: item.menu_item_id,
                name: menuItem?.name || "Unknown Item",
                price: item.price,
                quantity: item.quantity,
                preparationType: menuItem?.preparation_type || "unknown",
                status: item.status || "pending",
                notes: item.notes || "",
              };
            }) || [];

          const waiter = waitersMap.get(order.waiter_id);

          return {
            id: order.id,
            waiter_id: order.waiter_id,
            waiterName: waiter?.name || "Unknown",
            status: order.status,
            items: enhancedItems,
            total: order.total_amount,
            totalAmount: order.total_amount,
            total_amount: order.total_amount,
            createdAt: new Date(order.created_at),
            created_at: order.created_at,
            updatedAt: new Date(order.updated_at),
            updated_at: order.updated_at,
            completedAt: order.completed_at
              ? new Date(order.completed_at)
              : null,
            completed_at: order.completed_at,
            payment_status: order.payment_status,
            payment_method: order.payment_method,
          };
        }) || [];

      console.log(
        `Fetched ${enhancedOrders.length} orders with enhanced items`
      );
      setOrders(enhancedOrders);
      setIsLoading(false);
    } catch (error: any) {
      console.error("Error fetching orders:", error);
      setIsLoading(false);
      setError(`Failed to fetch orders: ${error.message}`);
      setOrders([]);
    }
  };

  const handleOrderChange = (payload: any) => {
    console.log("Order change detected:", payload);

    if (payload.eventType === "INSERT") {
      // Refetch all orders to get complete data
      fetchOrders();
    } else if (payload.eventType === "UPDATE") {
      fetchOrders(); // For simplicity, just refetch all orders
    } else if (payload.eventType === "DELETE") {
      setOrders((prev) => prev.filter((order) => order.id !== payload.old.id));
    }
  };

  const handleOrderItemChange = (payload: any) => {
    console.log("Order item change detected:", payload);
    // Refetch all orders to get complete data with menu items
    fetchOrders();
  };

  const createOrder = useCallback(
    async (items: OrderItem[]): Promise<Order> => {
      try {
        setIsLoading(true);
        setError(null);

        // Insert order
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .insert([
            {
              waiter_id: user?.id,
              total_amount: items.reduce(
                (sum, item) => sum + item.price * item.quantity,
                0
              ),
            },
          ])
          .select()
          .single();

        if (orderError) throw orderError;

        // Insert order items
        const { error: itemsError } = await supabase.from("order_items").insert(
          items.map((item) => ({
            order_id: orderData.id,
            menu_item_id: item.menuItemId,
            quantity: item.quantity,
            price: item.price,
            notes: item.notes,
          }))
        );

        if (itemsError) throw itemsError;

        // Fetch the complete order with items to return
        const { data: completeOrder, error: fetchError } = await supabase
          .from("orders")
          .select(
            `
            id,
            waiter_id,
            status,
            total_amount,
            created_at,
            updated_at,
            completed_at,
            items:order_items(
              id,
              menu_item_id,
              quantity,
              price,
              status,
              notes
            )
          `
          )
          .eq("id", orderData.id)
          .single();

        if (fetchError) throw fetchError;

        // Trigger a full fetch to update the orders list
        await fetchOrders();

        setIsLoading(false);
        return completeOrder;
      } catch (error: any) {
        console.error("Error creating order:", error);
        setIsLoading(false);
        setError(`Failed to create order: ${error.message}`);
        throw error;
      }
    },
    [user]
  );

  const updateOrderStatus = useCallback(
    async (
      orderId: string,
      status: OrderStatus,
      itemIds?: string[]
    ): Promise<void> => {
      try {
        setIsLoading(true);
        setError(null);

        if (itemIds?.length) {
          // Update specific items
          const { error: itemsError } = await supabase
            .from("order_items")
            .update({ status })
            .in("id", itemIds);

          if (itemsError) throw itemsError;

          // If all items have the same status, update the order status too
          const { data: items, error: fetchError } = await supabase
            .from("order_items")
            .select("status")
            .eq("order_id", orderId);

          if (fetchError) throw fetchError;

          const allSameStatus = items?.every((item) => item.status === status);
          if (allSameStatus) {
            const { error: orderError } = await supabase
              .from("orders")
              .update({ status })
              .eq("id", orderId);

            if (orderError) throw orderError;
          }
        } else {
          // Update all items and order status
          const { error: orderError } = await supabase
            .from("orders")
            .update({ status })
            .eq("id", orderId);

          if (orderError) throw orderError;

          const { error: itemsError } = await supabase
            .from("order_items")
            .update({ status })
            .eq("order_id", orderId);

          if (itemsError) throw itemsError;
        }

        // Refetch orders to get updated data
        await fetchOrders();
        setIsLoading(false);
      } catch (error: any) {
        console.error("Error updating order status:", error);
        setIsLoading(false);
        setError(`Failed to update order status: ${error.message}`);
        throw error;
      }
    },
    []
  );

  const closeOrder = useCallback(async (orderId: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const { error } = await supabase
        .from("orders")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (error) throw error;

      // Refetch orders to get updated data
      await fetchOrders();
      setIsLoading(false);
    } catch (error: any) {
      console.error("Error closing order:", error);
      setIsLoading(false);
      setError(`Failed to close order: ${error.message}`);
      throw error;
    }
  }, []);

  const getOrdersByStatus = useCallback(
    (status: OrderStatus): Order[] => {
      return orders.filter((order) => order.status === status);
    },
    [orders]
  );

  const getOrdersByWaiter = useCallback(
    (waiterId: string): Order[] => {
      return orders.filter((order) => order.waiter_id === waiterId);
    },
    [orders]
  );

  const activeOrders = orders.filter((order) =>
    ["pending", "in-progress", "ready"].includes(order.status)
  );

  const completedOrders = orders.filter(
    (order) => order.status === "completed"
  );

  return (
    <OrderContext.Provider
      value={{
        orders,
        createOrder,
        processPayment,
        updateOrderStatus,
        closeOrder,
        getOrdersByStatus,
        getOrdersByWaiter,
        activeOrders,
        completedOrders,
        isLoading,
        error,
        refetchOrders,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => useContext(OrderContext);

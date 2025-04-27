import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOrders } from "../../contexts/OrderContext";
import { useEffect } from "react";
import { MenuItem, OrderItem } from "../../types";
import { Plus, Minus, Trash2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";

const NewOrderForm: React.FC = () => {
  const navigate = useNavigate();
  const { createOrder } = useOrders();
  const { user } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
  const [activeCategory, setActiveCategory] =
    useState<MenuItem["category"]>("food");

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .order("name");

      if (error) throw error;

      setMenuItems(
        data.map((item) => ({
          id: item.id,
          name: item.name,
          category: item.category as MenuItem["category"],
          price: item.price,
          preparationType: item.preparation_type as "kitchen" | "bar",
          quantity: 999, // Since menu_items doesn't track quantity, we'll assume available
        }))
      );
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching menu items:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const categories = [
    { id: "food", label: "Food" },
    { id: "drink", label: "Drinks" },
    { id: "dessert", label: "Desserts" },
  ];

  const filteredItems = menuItems.filter(
    (item) => item.category === activeCategory
  );

  const addItemToOrder = (menuItem: MenuItem) => {
    const existingItem = selectedItems.find(
      (item) => item.menuItemId === menuItem.id
    );

    if (existingItem) {
      setSelectedItems((items) =>
        items.map((item) =>
          item.menuItemId === menuItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setSelectedItems((items) => [
        ...items,
        {
          id: 0, // Will be set by the backend
          menuItemId: menuItem.id,
          name: menuItem.name,
          price: menuItem.price,
          quantity: 1,
          preparationType: menuItem.preparationType,
          status: "pending",
        },
      ]);
    }
  };

  const updateItemQuantity = (menuItemId: string, change: number) => {
    const menuItem = menuItems.find((item) => item.id === menuItemId);
    if (!menuItem) return;

    const existingItem = selectedItems.find(
      (item) => item.menuItemId === menuItemId
    );
    const newQuantity = (existingItem?.quantity || 0) + change;

    setSelectedItems((items) =>
      items
        .map((item) => {
          if (item.menuItemId === menuItemId) {
            return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (menuItemId: string) => {
    setSelectedItems((items) =>
      items.filter((item) => item.menuItemId !== menuItemId)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) return;
    setError(null);

    try {
      // Create the order directly without table
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          waiter_id: user?.id,
          status: "pending",
          total_amount: totalAmount,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = selectedItems.map((item) => ({
        order_id: orderData.id,
        menu_item_id: item.menuItemId,
        quantity: item.quantity,
        price: item.price,
        status: "pending",
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      navigate("/waiter");
    } catch (error: any) {
      console.error("Failed to create order:", error);
      setError(error.message || "Failed to create order. Please try again.");
    }
  };

  const totalAmount = selectedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Menu Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">
              Loading menu items...
            </p>
          </div>
        )}

        {error && (
          <div className="p-4 text-red-700 bg-red-100 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex -mb-px">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() =>
                  setActiveCategory(category.id as MenuItem["category"])
                }
                className={`py-4 px-6 text-sm font-medium ${
                  activeCategory === category.id
                    ? "border-b-2 border-teal-500 text-teal-600"
                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {category.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredItems.map((item) => (
            <button
              key={item.id}
              onClick={() => addItemToOrder(item)}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
            >
              <h3 className="font-medium text-gray-900 dark:text-white">
                {item.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                ₦{item.price.toFixed(2)}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Order Summary
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Select items to create your order
          </p>
        </div>

        <div className="p-4 space-y-4">
          {selectedItems.map((item) => (
            <div
              key={item.menuItemId}
              className="flex items-center justify-between"
            >
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {item.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  ₦{(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => updateItemQuantity(item.menuItemId, -1)}
                  className="p-1 text-gray-500 hover:text-gray-700"
                >
                  <Minus size={16} />
                </button>
                <span className="w-8 text-center">{item.quantity}</span>
                <button
                  onClick={() => updateItemQuantity(item.menuItemId, 1)}
                  className="p-1 text-gray-500 hover:text-gray-700"
                >
                  <Plus size={16} />
                </button>
                <button
                  onClick={() => removeItem(item.menuItemId)}
                  className="p-1 text-red-500 hover:text-red-700"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}

          {selectedItems.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-4">
              No items added to order
            </p>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between mb-4">
            <span className="font-medium text-gray-900 dark:text-white">
              Total
            </span>
            <span className="font-medium text-gray-900 dark:text-white">
              ₦{totalAmount.toFixed(2)}
            </span>
          </div>
          <button
            onClick={handleSubmit}
            disabled={selectedItems.length === 0}
            className={`w-full py-2 px-4 rounded-md text-white font-medium ${
              selectedItems.length > 0
                ? "bg-teal-600 hover:bg-teal-700"
                : "bg-gray-400 cursor-not-allowed"
            } transition-colors`}
          >
            Place Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewOrderForm;

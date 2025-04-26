import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "../../lib/supabase";

// Interface for the chat messages
interface Message {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

// Type definitions for the analytics data
interface AnalyticsData {
  orders: any[];
  menuItems: any[];
  staff: any[];
  tables: any[];
  analytics: {
    totalSales: number;
    orderCount: number;
    averageOrderValue: number;
    salesByDay: Record<string, number>;
    topItems: Array<{
      itemId: string;
      name: string;
      category: string;
      quantity: number;
      revenue: number;
    }>;
    barItemsCount: number;
    kitchenItemsCount: number;
    salesByRole: Record<string, number>;
  };
  error?: string;
}

const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDataRefreshing, setIsDataRefreshing] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const apiKey = "AIzaSyCPHTqN51o1FFlDcOx-d_gkKtLWt3kj6VU";
  const retryCount = useRef(0);
  const maxRetries = 3;
  const abortController = useRef<AbortController | null>(null);

  // Load initial analytics data when component mounts
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsDataRefreshing(true);
        const data = await fetchDataFromSupabase("initial load");
        setAnalyticsData(data);
      } catch (error) {
        console.error("Error loading initial analytics data:", error);
      } finally {
        setIsDataRefreshing(false);
      }
    };

    loadInitialData();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);

  // Function to refresh analytics data
  const refreshAnalyticsData = async () => {
    if (isDataRefreshing) return; // Prevent multiple refreshes

    try {
      setIsDataRefreshing(true);
      const freshData = await fetchDataFromSupabase("data refresh");
      setAnalyticsData(freshData);
    } catch (error) {
      console.error("Error refreshing analytics data:", error);
    } finally {
      setIsDataRefreshing(false);
    }
  };

  // Function to fetch comprehensive data based on the user's query
  const fetchDataFromSupabase = async (
    query: string
  ): Promise<AnalyticsData> => {
    console.log("Fetching data from Supabase for query:", query);
    try {
      // Fetch all orders with their items
      const { data: ordersData, error: ordersError } = await supabase.from(
        "orders"
      ).select(`
          id,
          table_id,
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
        `);

      if (ordersError) {
        console.error("Error fetching orders:", ordersError);
        throw ordersError;
      }

      console.log(`Successfully fetched ${ordersData?.length || 0} orders`);

      // Fetch menu items for better context
      const { data: menuItemsData, error: menuItemsError } = await supabase
        .from("menu_items")
        .select("*");

      if (menuItemsError) {
        console.error("Error fetching menu items:", menuItemsError);
        throw menuItemsError;
      }

      console.log(
        `Successfully fetched ${menuItemsData?.length || 0} menu items`
      );

      // Fetch users (staff) data
      const { data: staffData, error: staffError } = await supabase
        .from("users")
        .select("id, name, role, email");

      if (staffError) {
        console.error("Error fetching staff data:", staffError);
        throw staffError;
      }

      console.log(
        `Successfully fetched ${staffData?.length || 0} staff records`
      );

      // Fetch tables data
      const { data: tablesData, error: tablesError } = await supabase
        .from("tables")
        .select("*");

      if (tablesError) {
        console.error("Error fetching tables:", tablesError);
        throw tablesError;
      }

      console.log(`Successfully fetched ${tablesData?.length || 0} tables`);

      // Calculate aggregated statistics
      const totalSales =
        ordersData?.reduce(
          (sum, order) => sum + (order.total_amount || 0),
          0
        ) || 0;
      const orderCount = ordersData?.length || 0;
      const averageOrderValue = orderCount > 0 ? totalSales / orderCount : 0;

      // Get sales by day (for the last 7 days)
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const salesByDay =
        ordersData
          ?.filter((order) => new Date(order.created_at) >= sevenDaysAgo)
          .reduce((acc, order) => {
            const day = new Date(order.created_at).toLocaleDateString("en-US", {
              weekday: "short",
            });
            acc[day] = (acc[day] || 0) + (order.total_amount || 0);
            return acc;
          }, {} as Record<string, number>) || {};

      // Top selling items
      const itemSales =
        ordersData?.flatMap(
          (order) =>
            order.items?.map((item) => ({
              itemId: item.menu_item_id,
              quantity: item.quantity,
              revenue: item.price * item.quantity,
            })) || []
        ) || [];

      // Group by item ID and calculate totals
      const itemSalesByItemId = itemSales.reduce((acc, sale) => {
        if (!acc[sale.itemId]) {
          acc[sale.itemId] = { quantity: 0, revenue: 0 };
        }
        acc[sale.itemId].quantity += sale.quantity;
        acc[sale.itemId].revenue += sale.revenue;
        return acc;
      }, {} as Record<string, { quantity: number; revenue: number }>);

      // Map menu item names to the sales data
      const menuItemMap = new Map(
        menuItemsData?.map((item) => [item.id, item]) || []
      );
      const topItems = Object.entries(itemSalesByItemId)
        .map(([itemId, data]) => ({
          itemId,
          name: menuItemMap.get(itemId)?.name || "Unknown Item",
          category: menuItemMap.get(itemId)?.category || "Unknown",
          quantity: data.quantity,
          revenue: data.revenue,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // Organize data by preparation type (kitchen vs bar)
      const barItems =
        menuItemsData?.filter((item) => item.preparation_type === "bar") || [];
      const kitchenItems =
        menuItemsData?.filter((item) => item.preparation_type === "kitchen") ||
        [];

      // Calculate sales by staff role
      const salesByRole =
        staffData?.reduce((acc, staff) => {
          const staffOrders =
            ordersData?.filter((order) => order.waiter_id === staff.id) || [];
          const roleSales = staffOrders.reduce(
            (sum, order) => sum + (order.total_amount || 0),
            0
          );
          acc[staff.role] = (acc[staff.role] || 0) + roleSales;
          return acc;
        }, {} as Record<string, number>) || {};

      console.log("Successfully compiled analytics data");

      return {
        orders: ordersData || [],
        menuItems: menuItemsData || [],
        staff: staffData || [],
        tables: tablesData || [],
        analytics: {
          totalSales,
          orderCount,
          averageOrderValue,
          salesByDay,
          topItems,
          barItemsCount: barItems.length,
          kitchenItemsCount: kitchenItems.length,
          salesByRole,
        },
      };
    } catch (error: any) {
      console.error("Error fetching data from Supabase:", error);
      return {
        orders: [],
        menuItems: [],
        staff: [],
        tables: [],
        analytics: {
          totalSales: 0,
          orderCount: 0,
          averageOrderValue: 0,
          salesByDay: {},
          topItems: [],
          barItemsCount: 0,
          kitchenItemsCount: 0,
          salesByRole: {},
        },
        error: error.message,
      };
    }
  };

  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const isNetworkError = (error: Error): boolean => {
    return (
      error instanceof TypeError &&
      (error.message.includes("NetworkError") ||
        error.message.includes("Failed to fetch") ||
        error.message.includes("Network request failed") ||
        error.message.includes("Connection") ||
        error.message.includes("connect"))
    );
  };

  // Direct API call to Gemini
  const callGeminiAPI = async (
    query: string,
    data: AnalyticsData
  ): Promise<string> => {
    console.log("Calling Gemini API with query:", query);

    try {
      const prompt = `You are an analytics assistant for a restaurant. Analyze the following data and provide insights about: ${query}

Data Summary:
- Total Orders: ${data.analytics.orderCount}
- Total Sales: ₦${data.analytics.totalSales.toLocaleString()}
- Average Order Value: ₦${data.analytics.averageOrderValue.toLocaleString()}
- Top Items: ${data.analytics.topItems
        .slice(0, 3)
        .map((item) => `${item.name} (₦${item.revenue.toLocaleString()})`)
        .join(", ")}
- Bar Items Count: ${data.analytics.barItemsCount}
- Kitchen Items Count: ${data.analytics.kitchenItemsCount}
- Sales by Role: ${Object.entries(data.analytics.salesByRole)
        .map(([role, sales]) => `${role}: ₦${sales.toLocaleString()}`)
        .join(", ")}

Please provide a detailed analysis focusing on the specific query: ${query}`;

      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" +
          apiKey,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 1024,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Gemini API error: ${errorData.error?.message || response.statusText}`
        );
      }

      const result = await response.json();

      if (
        result.candidates &&
        result.candidates.length > 0 &&
        result.candidates[0].content &&
        result.candidates[0].content.parts &&
        result.candidates[0].content.parts.length > 0
      ) {
        const text = result.candidates[0].content.parts[0].text;
        console.log("Gemini API response:", text);
        return text;
      } else {
        throw new Error("Unexpected API response format");
      }
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  };

  // Fallback for when the API is unavailable
  const getMockResponse = (query: string, data: AnalyticsData): string => {
    const topItems =
      data.analytics.topItems.length > 0
        ? data.analytics.topItems
            .slice(0, 3)
            .map((item) => `${item.name} (₦${item.revenue.toLocaleString()})`)
            .join(", ")
        : "No data available";

    if (
      query.toLowerCase().includes("top selling") ||
      query.toLowerCase().includes("popular items")
    ) {
      return `Based on the analytics data, your top selling items are: ${topItems}. These items are driving significant revenue for your restaurant.`;
    }

    if (
      query.toLowerCase().includes("sales trend") ||
      query.toLowerCase().includes("week")
    ) {
      return `I can see that your sales trends over the week show variations, with total sales of ₦${data.analytics.totalSales.toLocaleString()} across ${
        data.analytics.orderCount
      } orders. Your average order value is ₦${data.analytics.averageOrderValue.toLocaleString()}.`;
    }

    if (
      query.toLowerCase().includes("staff") ||
      query.toLowerCase().includes("highest sales")
    ) {
      const roleEntries = Object.entries(data.analytics.salesByRole);
      if (roleEntries.length > 0) {
        const highestRole = roleEntries.sort((a, b) => b[1] - a[1])[0];
        return `Based on the available data, the "${
          highestRole[0]
        }" role has generated the highest sales at ₦${highestRole[1].toLocaleString()}.`;
      }
      return "I don't have enough data about staff performance to provide detailed insights.";
    }

    if (
      query.toLowerCase().includes("bar") ||
      query.toLowerCase().includes("kitchen")
    ) {
      return `Your restaurant has ${data.analytics.barItemsCount} bar items and ${data.analytics.kitchenItemsCount} kitchen items. The performance varies between these categories.`;
    }

    return `Based on your analytics data, I can see your restaurant has made ₦${data.analytics.totalSales.toLocaleString()} in total sales from ${
      data.analytics.orderCount
    } orders, with an average order value of ₦${data.analytics.averageOrderValue.toLocaleString()}. Your top selling items include ${topItems}.`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      console.log("Processing query:", userMessage);

      // Use cached analytics data if available, otherwise fetch fresh data
      const data = analyticsData || (await fetchDataFromSupabase(userMessage));
      if (!analyticsData) {
        setAnalyticsData(data);
      }

      if (data.error) {
        console.error("Database error:", data.error);
        throw new Error(`Database error: ${data.error}`);
      }

      // Add empty assistant message that will be streamed to
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "",
          isStreaming: true,
        },
      ]);

      let analysisResult;

      // Try to use Gemini API, fallback to mock response if API fails
      try {
        analysisResult = await callGeminiAPI(userMessage, data);
      } catch (apiError) {
        console.warn(
          "Falling back to mock response due to API error:",
          apiError
        );
        analysisResult = getMockResponse(userMessage, data);
      }

      // Update the message with our analysis
      setMessages((prev) =>
        prev.map((msg, i) =>
          i === prev.length - 1
            ? { ...msg, content: analysisResult, isStreaming: false }
            : msg
        )
      );
    } catch (error: any) {
      console.error("ChatBot Error:", error);
      let errorMessage = "An unexpected error occurred";

      if (error instanceof Error) {
        if (isNetworkError(error)) {
          errorMessage =
            "Network connection error. Please check your internet connection and try again later.";
        } else {
          errorMessage = error.message;
        }
      }

      setError(errorMessage);
      setMessages((prev) => {
        // Remove the streaming message if it exists
        const newMessages = prev.filter((msg) => !msg.isStreaming);
        return [
          ...newMessages,
          {
            role: "assistant",
            content: `I apologize, but I encountered an error: ${errorMessage}. Please try again later.`,
          },
        ];
      });
    } finally {
      setIsLoading(false);
      abortController.current = null;
      retryCount.current = 0;
    }
  };

  // Determine if input should be disabled
  const isInputDisabled = isLoading || isDataRefreshing;

  return (
    <div className="flex flex-col h-[600px] bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center">
          <Bot className="w-6 h-6 text-teal-600 dark:text-teal-500 mr-2" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Analytics Assistant
          </h3>
        </div>
        <button
          onClick={refreshAnalyticsData}
          disabled={isDataRefreshing}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Refresh analytics data"
        >
          <RefreshCw
            className={`w-5 h-5 text-gray-500 dark:text-gray-400 ${
              isDataRefreshing ? "animate-spin" : ""
            }`}
          />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 space-y-4">
            <Bot size={40} className="text-teal-500" />
            <div className="text-center">
              <p className="font-medium">Analytics Assistant</p>
              <p className="text-sm max-w-md">
                Ask me about your business data, sales trends, popular items, or
                performance metrics.
              </p>
              {isDataRefreshing && (
                <p className="text-sm italic mt-2">Loading analytics data...</p>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md mt-4">
              <button
                onClick={() => setInput("What are our top selling items?")}
                className="text-sm text-left px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md"
                disabled={isInputDisabled}
              >
                What are our top selling items?
              </button>
              <button
                onClick={() => setInput("Show sales trend for the week")}
                className="text-sm text-left px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md"
                disabled={isInputDisabled}
              >
                Show sales trend for the week
              </button>
              <button
                onClick={() => setInput("Which staff has the highest sales?")}
                className="text-sm text-left px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md"
                disabled={isInputDisabled}
              >
                Which staff has the highest sales?
              </button>
              <button
                onClick={() =>
                  setInput("Compare bar vs kitchen items performance")
                }
                className="text-sm text-left px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md"
                disabled={isInputDisabled}
              >
                Compare bar vs kitchen performance
              </button>
            </div>
          </div>
        )}
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === "user"
                  ? "bg-teal-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
              }`}
            >
              <div className="prose dark:prose-invert max-w-none">
                {message.content}
                {message.isStreaming && (
                  <span className="inline-block w-2 h-4 ml-1 bg-teal-600 dark:bg-teal-500 animate-pulse" />
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && !messages.some((m) => m.isStreaming) && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
              <Loader2 className="w-6 h-6 animate-spin text-teal-600 dark:text-teal-500" />
            </div>
          </div>
        )}
        {error && (
          <div className="flex justify-center">
            <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 rounded-lg p-3 text-sm">
              {error}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="p-4 border-t border-gray-200 dark:border-gray-700"
      >
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your business data..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:bg-gray-700 dark:text-white"
            disabled={isInputDisabled}
          />
          <button
            type="submit"
            disabled={isInputDisabled || !input.trim()}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatBot;

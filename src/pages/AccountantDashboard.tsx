import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/Layout/DashboardLayout";
import { Receipt, Clock, BarChart, Award } from "lucide-react";
import { supabase } from "../lib/supabase";

const AccountantDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalReceipts: 0,
    receiptsToday: 0,
    totalSales: 0,
    averageOrderValue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get total receipts
      const { count: totalReceipts, error: countError } = await supabase
        .from("receipts")
        .select("*", { count: "exact", head: true });

      if (countError) throw countError;

      // Get today's receipts
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { count: receiptsToday, error: todayError } = await supabase
        .from("receipts")
        .select("*", { count: "exact", head: true })
        .gte("created_at", today.toISOString());

      if (todayError) throw todayError;

      // Get sales data
      const { data: salesData, error: salesError } = await supabase
        .from("orders")
        .select("total_amount")
        .eq("payment_status", "paid");

      if (salesError) throw salesError;

      const totalSales =
        salesData?.reduce(
          (sum, order) => sum + parseFloat(order.total_amount),
          0
        ) || 0;
      const averageOrderValue =
        salesData?.length > 0 ? totalSales / salesData.length : 0;

      setStats({
        totalReceipts: totalReceipts || 0,
        receiptsToday: receiptsToday || 0,
        totalSales,
        averageOrderValue,
      });
    } catch (err: any) {
      console.error("Error fetching dashboard data:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const cards = [
    {
      title: "Total Receipts",
      value: stats.totalReceipts,
      icon: Receipt,
      color: "bg-blue-600",
      onClick: () => navigate("/accountant/receipts"),
    },
    {
      title: "Receipts Today",
      value: stats.receiptsToday,
      icon: Clock,
      color: "bg-green-600",
      onClick: () => navigate("/accountant/receipts"),
    },
    {
      title: "Total Sales",
      value: `₦${stats.totalSales.toFixed(2)}`,
      icon: BarChart,
      color: "bg-purple-600",
      onClick: () => {},
    },
    {
      title: "Avg. Order Value",
      value: `₦${stats.averageOrderValue.toFixed(2)}`,
      icon: Award,
      color: "bg-amber-600",
      onClick: () => {},
    },
  ];

  return (
    <DashboardLayout title="Accountant Dashboard">
      {error && (
        <div className="mb-4 p-4 rounded-lg bg-red-100 border border-red-200 text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map((card, index) => (
          <button
            key={index}
            onClick={card.onClick}
            className="bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg shadow-sm p-4 transition-all flex items-center overflow-hidden relative cursor-pointer"
          >
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                {card.title}
              </h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {isLoading ? "..." : card.value}
              </p>
            </div>
            <div
              className={`p-3 rounded-lg ${card.color} text-white flex items-center justify-center`}
            >
              <card.icon size={24} />
            </div>
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Receipt Management
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Welcome to the Receipt Management System. As an accountant, you can:
        </p>
        <ul className="list-disc pl-5 mb-4 text-gray-600 dark:text-gray-400 space-y-2">
          <li>View and manage all customer receipts</li>
          <li>Print receipts for customers or for record keeping</li>
          <li>Download receipts as PDF files</li>
          <li>Share receipts on social media platforms</li>
        </ul>
        <button
          onClick={() => navigate("/accountant/receipts")}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
        >
          Manage Receipts
        </button>
      </div>
    </DashboardLayout>
  );
};

export default AccountantDashboard;

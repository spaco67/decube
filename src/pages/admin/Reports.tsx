import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import StatsCard from '../../components/UI/StatsCard';
import ChatBot from '../../components/UI/ChatBot';
import { useReports } from '../../contexts/ReportsContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  DollarSign, 
  TrendingUp, 
  ShoppingBag, 
  Users,
  BarChart3,
  Calendar,
  Download
} from 'lucide-react';

const Reports: React.FC = () => {
  const [dateRange, setDateRange] = useState('week');
  const { salesData, isLoading, error, fetchSalesData } = useReports();

  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Add header
    doc.setFontSize(20);
    doc.text('Sales Report', pageWidth / 2, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, 25, { align: 'center' });

    // Add summary statistics
    if (salesData) {
      const stats = [
        ['Total Sales', `₦${salesData.totalSales.toLocaleString()}`],
        ['Total Orders', salesData.totalOrders.toString()],
        ['Average Order Value', `₦${salesData.averageOrderValue.toLocaleString()}`],
        ['Customer Count', salesData.customerCount.toString()],
      ];

      autoTable(doc, {
        head: [['Metric', 'Value']],
        body: stats,
        startY: 35,
        theme: 'grid',
      });

      // Add top items table
      const topItemsData = salesData.topItems.map(item => [
        item.name,
        item.sales.toString(),
        `₦${item.revenue.toLocaleString()}`
      ]);

      autoTable(doc, {
        head: [['Item', 'Units Sold', 'Revenue']],
        body: topItemsData,
        startY: doc.lastAutoTable.finalY + 15,
        theme: 'grid',
        headStyles: { fillColor: [0, 128, 128] },
      });

      // Add daily sales chart data
      const dailySalesData = salesData.dailySales.map(day => [
        day.day,
        `₦${day.amount.toLocaleString()}`
      ]);

      autoTable(doc, {
        head: [['Day', 'Sales']],
        body: dailySalesData,
        startY: doc.lastAutoTable.finalY + 15,
        theme: 'grid',
        headStyles: { fillColor: [0, 128, 128] },
      });
    }

    // Save the PDF
    doc.save(`sales-report-${dateRange}-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  useEffect(() => {
    fetchSalesData(dateRange as 'today' | 'week' | 'month' | 'year');
  }, [dateRange]);

  // Default data for loading state
  const dailySales = [
    { day: 'Mon', amount: 1200 * 1200 },
    { day: 'Tue', amount: 1800 * 1200 },
    { day: 'Wed', amount: 1400 * 1200 },
    { day: 'Thu', amount: 2200 * 1200 },
    { day: 'Fri', amount: 2600 * 1200 },
    { day: 'Sat', amount: 1900 * 1200 },
    { day: 'Sun', amount: 1480 * 1200 },
  ];

  const maxAmount = Math.max(...(salesData?.dailySales || dailySales).map(d => d.amount));

  return (
    <DashboardLayout title="Reports & Analytics">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">Reports</h2>
          <p className="text-gray-600 dark:text-gray-400">Overview of your business performance</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-white"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
          
          <button className="flex items-center px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors">
            <Download size={20} className="mr-2" />
            <span onClick={exportToPDF}>Export PDF</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 ${isLoading ? 'opacity-50' : ''}`}>
        {salesData ? (
          <>
            <StatsCard
              title="Total Sales"
              value={`₦${salesData.totalSales.toLocaleString()}`}
              change={salesData.salesGrowth}
              icon={<DollarSign size={20} />}
              color="green"
            />
            <StatsCard
              title="Orders"
              value={salesData.totalOrders}
              icon={<ShoppingBag size={20} />}
              color="blue"
              change={0}
            />
            <StatsCard
              title="Avg. Order Value"
              value={`₦${salesData.averageOrderValue.toLocaleString()}`}
              icon={<TrendingUp size={20} />}
              color="purple"
              change={0}
            />
            <StatsCard
              title="Customers"
              value={salesData.customerCount}
              icon={<Users size={20} />}
              color="amber"
              change={0}
            />
          </>
        ) : (
          <div className="col-span-4 text-center py-8">Loading statistics...</div>
        )}
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Daily Sales</h3>
            <BarChart3 size={20} className="text-gray-500" />
          </div>
          
          <div className="h-64 flex items-end justify-between gap-2">
            {(salesData?.dailySales || dailySales).map((data) => (
              <div key={data.day} className="flex flex-col items-center flex-1">
                <div 
                  className="w-full bg-teal-500 rounded-t"
                  style={{ 
                    height: `${(data.amount / maxAmount) * 100}%`,
                    minHeight: '20px'
                  }}
                />
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">{data.day}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Items */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Top Items</h3>
            <Calendar size={20} className="text-gray-500" />
          </div>

          <div className="space-y-4">
            {salesData?.topItems.map((item, index) => (
              <div 
                key={item.name} 
                className="flex items-center justify-between"
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 flex items-center justify-center font-medium">
                    {index + 1}
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{item.sales} orders</div>
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">₦{item.revenue.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Chatbot */}
        <div className="lg:col-span-1">
          <ChatBot />
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Reports;
import React from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import ThemeToggle from "../UI/ThemeToggle";
import {
  Calendar,
  ClipboardList,
  Clock,
  Home,
  Menu,
  Package,
  Settings,
  ChevronDown,
  Bell,
  LogOut,
  File,
  Users,
  ChevronRight,
  Receipt,
  X,
  BarChart,
  ShoppingCart,
  CreditCard,
} from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar - mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white dark:bg-gray-800 shadow-lg transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto lg:h-screen ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="px-4 py-6 bg-teal-600 dark:bg-teal-700">
            <h2 className="text-2xl font-bold text-white">DECUBE</h2>
            <p className="text-teal-100">
              {user?.role.charAt(0).toUpperCase() + user?.role.slice(1)}{" "}
              Dashboard
            </p>
          </div>

          <nav className="flex-1 px-2 py-4 overflow-y-auto">
            <div className="space-y-2">
              <Link
                to={
                  user?.role === "admin"
                    ? "/admin"
                    : user?.role === "waiter"
                    ? "/waiter"
                    : user?.role === "barman"
                    ? "/barman"
                    : user?.role === "kitchen"
                    ? "/kitchen"
                    : "/admin"
                }
                className={`flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-teal-50 dark:hover:bg-gray-700 rounded-lg transition-colors ${
                  location.pathname === "/admin" ||
                  location.pathname === "/waiter" ||
                  location.pathname === "/barman" ||
                  location.pathname === "/kitchen"
                    ? "bg-teal-50 dark:bg-gray-700 text-teal-600 dark:text-teal-400"
                    : ""
                }`}
              >
                <LayoutDashboard size={20} className="mr-3" />
                <span className="text-sm font-medium">Dashboard</span>
              </Link>

              {user?.role === "waiter" && (
                <>
                  <Link
                    to="/waiter/new-order"
                    className={`flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-teal-50 dark:hover:bg-gray-700 rounded-lg transition-colors ${
                      location.pathname === "/waiter/new-order"
                        ? "bg-teal-50 dark:bg-gray-700 text-teal-600 dark:text-teal-400"
                        : ""
                    }`}
                  >
                    <ClipboardList size={20} className="mr-3" />
                    <span className="text-sm font-medium">New Order</span>
                  </Link>
                  <Link
                    to="/waiter/orders"
                    className={`flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-teal-50 dark:hover:bg-gray-700 rounded-lg transition-colors ${
                      location.pathname === "/waiter/orders"
                        ? "bg-teal-50 dark:bg-gray-700 text-teal-600 dark:text-teal-400"
                        : ""
                    }`}
                  >
                    <Receipt size={20} className="mr-3" />
                    <span className="text-sm font-medium">My Orders</span>
                  </Link>
                </>
              )}

              {(user?.role === "barman" || user?.role === "admin") && (
                <Link
                  to="/bar-orders"
                  className={`flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-teal-50 dark:hover:bg-gray-700 rounded-lg transition-colors ${
                    location.pathname === "/bar-orders"
                      ? "bg-teal-50 dark:bg-gray-700 text-teal-600 dark:text-teal-400"
                      : ""
                  }`}
                >
                  <Wine size={20} className="mr-3" />
                  <span className="text-sm font-medium">Bar Orders</span>
                </Link>
              )}

              {(user?.role === "kitchen" || user?.role === "admin") && (
                <Link
                  to="/kitchen-orders"
                  className={`flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-teal-50 dark:hover:bg-gray-700 rounded-lg transition-colors ${
                    location.pathname === "/kitchen-orders"
                      ? "bg-teal-50 dark:bg-gray-700 text-teal-600 dark:text-teal-400"
                      : ""
                  }`}
                >
                  <Utensils size={20} className="mr-3" />
                  <span className="text-sm font-medium">Kitchen Orders</span>
                </Link>
              )}

              {user?.role === "admin" && (
                <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    Administration
                  </p>
                  <Link
                    to="/admin/staff"
                    className={`flex items-center px-4 py-3 text-gray-600 transition-colors duration-300 transform rounded-lg dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-200 hover:text-gray-700 ${
                      location.pathname === "/admin/staff"
                        ? "bg-gray-100 dark:bg-gray-800 dark:text-gray-200 text-gray-700"
                        : ""
                    }`}
                  >
                    <Users size={20} className="mr-3" />
                    <span className="mx-1">Staff Management</span>
                  </Link>
                  <Link
                    to="/admin/inventory"
                    className={`flex items-center px-4 py-3 text-gray-600 transition-colors duration-300 transform rounded-lg dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-200 hover:text-gray-700 ${
                      location.pathname === "/admin/inventory"
                        ? "bg-gray-100 dark:bg-gray-800 dark:text-gray-200 text-gray-700"
                        : ""
                    }`}
                  >
                    <Package size={20} className="mr-3" />
                    <span className="mx-1">Inventory</span>
                  </Link>
                  <Link
                    to="/admin/reports"
                    className={`flex items-center px-4 py-3 text-gray-600 transition-colors duration-300 transform rounded-lg dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-200 hover:text-gray-700 ${
                      location.pathname === "/admin/reports"
                        ? "bg-gray-100 dark:bg-gray-800 dark:text-gray-200 text-gray-700"
                        : ""
                    }`}
                  >
                    <BarChart size={20} className="mr-3" />
                    <span className="mx-1">Reports</span>
                  </Link>
                  <Link
                    to="/admin/settings"
                    className={`flex items-center px-4 py-3 text-gray-600 transition-colors duration-300 transform rounded-lg dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-200 hover:text-gray-700 ${
                      location.pathname === "/admin/settings"
                        ? "bg-gray-100 dark:bg-gray-800 dark:text-gray-200 text-gray-700"
                        : ""
                    }`}
                  >
                    <Settings size={20} className="mr-3" />
                    <span className="mx-1">Settings</span>
                  </Link>
                </div>
              )}

              {user?.role === "accountant" && (
                <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    Accountant
                  </p>
                  <Link
                    to="/accountant"
                    className={`flex items-center px-4 py-3 text-gray-600 transition-colors duration-300 transform rounded-lg dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-200 hover:text-gray-700 ${
                      location.pathname === "/accountant"
                        ? "bg-gray-100 dark:bg-gray-800 dark:text-gray-200 text-gray-700"
                        : ""
                    }`}
                  >
                    <Home size={20} className="mr-3" />
                    <span className="mx-1">Dashboard</span>
                  </Link>
                  <Link
                    to="/accountant/receipts"
                    className={`flex items-center px-4 py-3 text-gray-600 transition-colors duration-300 transform rounded-lg dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-200 hover:text-gray-700 ${
                      location.pathname === "/accountant/receipts"
                        ? "bg-gray-100 dark:bg-gray-800 dark:text-gray-200 text-gray-700"
                        : ""
                    }`}
                  >
                    <Receipt size={20} className="mr-3" />
                    <span className="mx-1">Receipts</span>
                  </Link>
                </div>
              )}
            </div>
          </nav>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <LogOut size={18} className="mr-2" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm z-10">
          <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-gray-500 hover:text-gray-600 lg:hidden focus:outline-none"
              >
                <Menu size={24} />
              </button>
              <h1 className="ml-4 lg:ml-0 text-xl font-semibold text-gray-800 dark:text-white">
                {title}
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <ThemeToggle />
              </div>
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="p-2 text-gray-500 hover:text-gray-600 focus:outline-none"
                >
                  <Bell size={20} />
                </button>
                {/* Notification dot */}
                <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full"></span>

                {/* Notification dropdown */}
                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                        Notifications
                      </h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      <div className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <p className="text-sm text-gray-800 dark:text-gray-200">
                          New order for table 5
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          2 minutes ago
                        </p>
                      </div>
                      <div className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <p className="text-sm text-gray-800 dark:text-gray-200">
                          Order #124 is ready for pickup
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          10 minutes ago
                        </p>
                      </div>
                    </div>
                    <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
                      <a
                        href="#"
                        className="text-xs text-teal-600 dark:text-teal-400 hover:underline"
                      >
                        View all notifications
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white">
                  {user?.name.charAt(0).toUpperCase()}
                </div>
                <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  {user?.name}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

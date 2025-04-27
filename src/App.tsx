import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import LoginPage from "./pages/LoginPage";
import WaiterDashboard from "./pages/WaiterDashboard";
import BarmanDashboard from "./pages/BarmanDashboard";
import KitchenDashboard from "./pages/KitchenDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AccountantDashboard from "./pages/AccountantDashboard";
import NotFound from "./pages/NotFound";
import StaffManagement from "./pages/admin/StaffManagement";
import TableManagement from "./pages/admin/TableManagement";
import Inventory from "./pages/admin/Inventory";
import Reports from "./pages/admin/Reports";
import Settings from "./pages/admin/Settings";
import BarOrders from "./pages/BarOrders";
import KitchenOrders from "./pages/KitchenOrders";
import MyOrders from "./pages/waiter/MyOrders";
import NewOrder from "./pages/waiter/NewOrder";
import ReceiptsPage from "./pages/accountant/ReceiptsPage";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route
              path="/waiter"
              element={
                <ProtectedRoute allowedRoles={["waiter", "admin"]}>
                  <WaiterDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/waiter/new-order"
              element={
                <ProtectedRoute allowedRoles={["waiter", "admin"]}>
                  <NewOrder />
                </ProtectedRoute>
              }
            />

            <Route
              path="/waiter/orders"
              element={
                <ProtectedRoute allowedRoles={["waiter", "admin"]}>
                  <MyOrders />
                </ProtectedRoute>
              }
            />

            <Route
              path="/barman"
              element={
                <ProtectedRoute allowedRoles={["barman", "admin"]}>
                  <BarmanDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/kitchen"
              element={
                <ProtectedRoute allowedRoles={["kitchen", "admin"]}>
                  <KitchenDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/bar-orders"
              element={
                <ProtectedRoute allowedRoles={["barman", "admin"]}>
                  <BarOrders />
                </ProtectedRoute>
              }
            />

            <Route
              path="/kitchen-orders"
              element={
                <ProtectedRoute allowedRoles={["kitchen", "admin"]}>
                  <KitchenOrders />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/staff"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <StaffManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/tables"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <TableManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/inventory"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <Inventory />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/reports"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <Reports />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <Settings />
                </ProtectedRoute>
              }
            />

            <Route
              path="/accountant"
              element={
                <ProtectedRoute allowedRoles={["accountant", "admin"]}>
                  <AccountantDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/accountant/receipts"
              element={
                <ProtectedRoute allowedRoles={["accountant", "admin"]}>
                  <ReceiptsPage />
                </ProtectedRoute>
              }
            />

            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

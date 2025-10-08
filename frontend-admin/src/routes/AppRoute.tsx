import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "../screens/Login";
import DashboardPage from "../screens/Dashboard";
import ForgotPasswordPage from "../screens/ForgotPassword";
import Layout from "../components/Layout";
import Inventory from "../screens/Inventory";
import Category from "@/screens/Category";
import QueuePage from "@/screens/Queue";
import UserManagementPage from "@/screens/UserManagement";
import RolesManagementPage from "@/screens/Roles";
import FinesManagement from "@/screens/Fines";
import ProtectedRoute from "./ProtectedRoute";
import IssuedItemsReportPage from "@/screens/IssuedItemsReport";
import InventoryReportPage from "@/screens/InventoryReportPage";
import FinesReportPage from "@/screens/FinesReportPage";
import NotificationSettings from "@/screens/NotificationSettings";
import SystemRestrictions from "@/screens/SystemRestrictions";
import Profile from "@/screens/Profile";
import DonationManagement from "@/screens/Donations";
import IssueManagement from "@/screens/IssueManagement";
import IssuedItemsManagement from "@/screens/IssuedItemsManagement";
import QueueDashboard from "@/screens/QueueDashboard";
import AnalyticsDashboard from "@/screens/AnalyticsDashboard";
import DefaulterReport from "@/screens/DefaulterReport";

const AppRoute = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route
            path="/"
            element={
              <Layout>
                <DashboardPage />
              </Layout>
            }
          />

          <Route
            path="/inventory"
            element={
              <Layout>
                <Inventory />
              </Layout>
            }
          />
          <Route
            path="/categories"
            element={
              <Layout>
                <Category />
              </Layout>
            }
          />
          <Route
            path="/queues"
            element={
              <Layout>
                <QueuePage />
              </Layout>
            }
          />
          <Route
            path="/users"
            element={
              <Layout>
                <UserManagementPage />
              </Layout>
            }
          />
          <Route
            path="/roles"
            element={
              <Layout>
                <RolesManagementPage />
              </Layout>
            }
          />
          <Route
            path="/fines"
            element={
              <Layout>
                <FinesManagement />
              </Layout>
            }
          />
          <Route
            path="/reports/issued-items"
            element={
              <Layout>
                <IssuedItemsReportPage />
              </Layout>
            }
          />
          <Route
            path="/reports/defaulter"
            element={
              <Layout>
                <DefaulterReport />
              </Layout>
            }
          />
          <Route
            path="/reports/inventory"
            element={
              <Layout>
                <InventoryReportPage />
              </Layout>
            }
          />
          <Route
            path="/reports/fines"
            element={
              <Layout>
                <FinesReportPage />
              </Layout>
            }
          />
          <Route
            path="/reports/queue"
            element={
              <Layout>
                <AnalyticsDashboard />
              </Layout>
            }
          />
          <Route
            path="/settings/notification"
            element={
              <Layout>
                <NotificationSettings />
              </Layout>
            }
          />
          <Route
            path="/settings/restrictions"
            element={
              <Layout>
                <SystemRestrictions />
              </Layout>
            }
          />
          <Route
            path="/settings/profile"
            element={
              <Layout>
                <Profile />
              </Layout>
            }
          />
          <Route
            path="/donations"
            element={
              <Layout>
                <DonationManagement />
              </Layout>
            }
          />
          <Route
            path="/issue-management"
            element={
              <Layout>
                <IssueManagement />
              </Layout>
            }
          />
          <Route
            path="/issued-items"
            element={
              <Layout>
                <IssuedItemsManagement />
              </Layout>
            }
          />
          <Route
            path="/queue-dashboard"
            element={
              <Layout>
                <QueueDashboard />
              </Layout>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoute;

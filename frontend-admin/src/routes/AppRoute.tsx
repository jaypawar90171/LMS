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

const AppRoute = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Layout>
              <DashboardPage />
            </Layout>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
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
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoute;

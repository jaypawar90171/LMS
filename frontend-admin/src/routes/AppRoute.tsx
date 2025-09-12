import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "../screens/Login";
import DashboardPage from "../screens/Dashboard";
import ForgotPasswordPage from "../screens/ForgotPassword";
import Layout from "../components/Layout";
import Inventory from "../screens/Inventory";

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
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoute;

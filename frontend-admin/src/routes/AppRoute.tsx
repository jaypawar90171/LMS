import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "../screens/Login";
import DashboardPage from "../screens/Dashboard";
import ForgotPasswordPage from "../screens/ForgotPassword";
import Layout from "../components/Layout";

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
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoute;

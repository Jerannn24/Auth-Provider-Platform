import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/Loginpage";
import LogoutPage from "./pages/LogoutPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import MetricsPage from "./pages/MetricsPage";
import AdminPage from "./pages/admin/AdminPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/logout" element={<LogoutPage />} />
      <Route path="/change-password" element={<ChangePasswordPage />} />
      <Route path="/metrics" element={<MetricsPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
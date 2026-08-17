import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/Loginpage";
import LogoutPage from "./pages/LogoutPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/logout" element={<LogoutPage />} />
      <Route path="/change-password" element={<ChangePasswordPage />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
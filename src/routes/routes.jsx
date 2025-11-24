import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ReportPage from "./pages/ReportIncidentPage";
import AdminDashboard from "./pages/AdminDashboard";
import { RequireAuth, RequireAdmin } from "./components/auth/RouteGuards";

export default function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/report"
          element={
            <RequireAuth>
              <ReportPage />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <RequireAdmin>
              <AdminDashboard />
            </RequireAdmin>
          }
        />
        <Route path="*" element={<LoginPage />} />
      </Routes>
    </Router>
  );
}

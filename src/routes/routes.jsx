import LandingPage from "@/pages/LandingPage";
import SignupPage from "@/pages/SignUp/page";
import LoginPage from "@/pages/Login/page";
import ReportPage from "@/pages/ReportIncidentPage";
import AdminDashboard from "@/pages/AdminDashboard";

import { RequireAdmin } from "@/components/auth/requireAdmin";
import { RequireAuth } from "@/components/auth/requireLogin";

const routes = [
  { path: "/", element: <LandingPage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/signup", element: <SignupPage /> },
  {
    path: "/report",
    element: (
      <RequireAuth>
        <ReportPage />
      </RequireAuth>
    ),
  },
  {
    path: "/admin/dashboard",
    element: (
      <RequireAdmin>
        <AdminDashboard />
      </RequireAdmin>
    ),
  },
  { path: "*", element: <LandingPage /> },
];

export default routes;

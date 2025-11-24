// src/routes/routes.jsx
import LandingPage from "@/pages/LandingPage";
import SignupPage from "@/pages/SignUp/page";
import LoginPage from "@/pages/Login/page";
import ReportPage from "@/pages/ReportIncidentPage";
import AdminDashboard from "@/pages/AdminDashboard";

import { RequireAdmin } from "@/components/auth/requireAdmin";
import { RequireAuth } from "@/components/auth/requireLogin";
import AuthListener from "@/App";

const routes = [
  {
    path: "/",
    element: (
      <AuthListener>
        <LandingPage />
      </AuthListener>
    ),
  },
  {
    path: "/login",
    element: (
      <AuthListener>
        <LoginPage />
      </AuthListener>
    ),
  },
  {
    path: "/signup",
    element: (
      <AuthListener>
        <SignupPage />
      </AuthListener>
    ),
  },
  {
    path: "/report",
    element: (
      <AuthListener>
        <RequireAuth>
          <ReportPage />
        </RequireAuth>
      </AuthListener>
    ),
  },
  {
    path: "/admin/dashboard",
    element: (
      <AuthListener>
        <RequireAdmin>
          <AdminDashboard />
        </RequireAdmin>
      </AuthListener>
    ),
  },
  {
    path: "*",
    element: (
      <AuthListener>
        <LandingPage />
      </AuthListener>
    ),
  },
];

export default routes;

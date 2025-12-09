import LandingPage from "@/pages/LandingPage";
import SignupPage from "@/pages/SignUp/page";
import LoginPage from "@/pages/Login/page";
import ReportPage from "@/pages/UserDashboard";
import AdminDashboard from "@/pages/AdminDashboard";

import UserDashboard from "@/pages/UserDashboard";

import { RequireAdmin } from "@/components/auth/requireAdmin";
import { RequireAuth } from "@/components/auth/requireLogin";

const routes = [
  { path: "/", element: <LandingPage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/signup", element: <SignupPage /> },
  {
    path: "/userdashboard",
    element: (
      <RequireAuth>
        <UserDashboard />
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

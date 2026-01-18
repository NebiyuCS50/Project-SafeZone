import LandingPage from "@/pages/LandingPage";
import SignupPage from "@/pages/SignUp/page";
import LoginPage from "@/pages/Login/page";
import AuthListener from "@/App";
import AdminDashboard from "@/pages/AdminDashboard";

import UserDashboard from "@/pages/UserDashboard";
import NotFound from "@/pages/NotFound";

import { RequireAdmin } from "@/components/auth/requireAdmin";
import { RequireAuth } from "@/components/auth/requireLogin";

import { MapVisualization } from "@/components/user/MapVisualization";
import { Layout } from "lucide-react";
import { Children } from "react";

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
    path: "/userdashboard",
    element: (
      <AuthListener>
        <RequireAuth>
          <UserDashboard />
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
    element: <NotFound />,
  },
  {
    path: "/map",
    element: <MapVisualization />,
  },
];

export default routes;

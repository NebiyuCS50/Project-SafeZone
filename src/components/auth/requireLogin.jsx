import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import Loading from "@/components/ui/Loading";

export function RequireAuth({ children }) {
  const { user, role, loading } = useAuthStore();

  if (loading) return <Loading />;
  if (!user) return <Navigate to="/" />;
  if (role === "admin") return <Navigate to="/admin/dashboard" />;

  return children;
}

import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";

export function RequireAdmin({ children }) {
  const { user, role, loading } = useAuthStore();

  if (loading) return <p>Loading...</p>;
  if (!user) return <Navigate to="/login" />;
  if (role !== "admin") return <Navigate to="/forbidden" />;

  return children;
}

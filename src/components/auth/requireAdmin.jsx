import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import Loading from "../ui/Loading";

export function RequireAdmin({ children }) {
  const { user, role, loading } = useAuthStore();

  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" />;
  if (role !== "admin") return <Navigate to="*" />;
  if (role === "admin") return children;

  return children;
}

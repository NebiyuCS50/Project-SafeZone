import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { Shield, Menu, LogOut, ChevronRight, Settings } from "lucide-react";

import { toast } from "sonner";
import AdminSidebar from "@/components/Admin/AdminSidebar";
import AdminOverview from "@/components/Admin/AdminOverview";
import { logout } from "@/firebase/auth/emailAuth";
import { useNavigate } from "react-router-dom";
import LiveIncident from "@/components/user/LiveIncident";
import UserProfile from "@/components/user/Profile";
import IncidentManagement from "@/components/Admin/IncidentManagement";
import UserManagement from "@/components/Admin/UserManagement";
import Analytics from "@/components/Admin/Analytics";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("Admin Overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Breadcrumb navigation
  const getBreadcrumb = () => {
    const path =
      activeTab === "Admin Overview"
        ? ["Dashboard", "Admin Overview"]
        : activeTab === "Incident Management"
        ? ["Dashboard", "Incidents", "Incident Management"]
        : activeTab === "User Management"
        ? ["Dashboard", "Users", "User Management"]
        : activeTab === "alerts"
        ? ["Dashboard", "Safety", "Live Alerts"]
        : activeTab === "analytics"
        ? ["Dashboard", "User Analytics", "Analytics"]
        : ["Dashboard"];
    return path;
  };

  const handleSignOut = async () => {
    await logout();
    toast.success("Signed Out", {
      description: "You have been successfully signed out.",
      duration: 500,
    });

    navigate("/");
  };

  const renderContent = () => {
    switch (activeTab) {
      case "Admin Overview":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-1">
                Admin Dashboard
              </h2>
              <p className="text-gray-600">
                Overview of safety incidents in Addis Ababa
              </p>
            </div>
            <AdminOverview />
          </div>
        );
      case "Incident Management":
        return (
          <div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Incident Management
              </h2>
              <p className="text-gray-600">Manage City Safety Incidents</p>
            </div>
            <IncidentManagement />
          </div>
        );
      case "User Management":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                User Management
              </h2>
              <p className="text-gray-600">Manage users in the system</p>
            </div>
            <UserManagement />
          </div>
        );

      case "analytics":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
              <p className="text-gray-600">User analytics and insights</p>
            </div>
            <Analytics />
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900">Page Not Found</h2>
            <p className="text-gray-600">
              The requested page could not be found.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div className="flex items-center space-x-2">
                <Shield className="w-6 h-6 text-blue-600" />
                <span className="text-lg font-semibold">SafeRoute</span>
              </div>
            </div>
            {/* Breadcrumb (desktop) */}
            <nav className="hidden md:flex items-center space-x-2 text-sm">
              {getBreadcrumb().map((item, index) => (
                <div key={index} className="flex items-center">
                  {index > 0 && (
                    <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                  )}
                  <span
                    className={
                      index === getBreadcrumb().length - 1
                        ? "text-gray-900 font-medium"
                        : "text-gray-500"
                    }
                  >
                    {item}
                  </span>
                </div>
              ))}
            </nav>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar: mobile overlay */}
        <AdminSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          sidebarOpen={mobileMenuOpen}
          setSidebarOpen={setMobileMenuOpen}
        />

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 lg:ml-0 overflow-y-auto">
          {/* Mobile Breadcrumb */}
          <nav className="md:hidden flex items-center space-x-2 text-sm mb-6">
            {getBreadcrumb().map((item, index) => (
              <div key={index} className="flex items-center">
                {index > 0 && (
                  <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                )}
                <span
                  className={
                    index === getBreadcrumb().length - 1
                      ? "text-gray-900 font-medium"
                      : "text-gray-500"
                  }
                >
                  {item}
                </span>
              </div>
            ))}
          </nav>
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

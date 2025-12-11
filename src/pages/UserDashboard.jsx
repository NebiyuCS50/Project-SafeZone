import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Menu,
  Bell,
  LogOut,
  ChevronRight,
  Map,
  Plus,
  FileText,
  User,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import { ReportIncident } from "@/components/ReportIncident";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("map");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Breadcrumb navigation
  const getBreadcrumb = () => {
    const path =
      activeTab === "map"
        ? ["Dashboard", "Map Visualization"]
        : activeTab === "report"
        ? ["Dashboard", "Incidents", "Report Incident"]
        : activeTab === "reports"
        ? ["Dashboard", "Incidents", "My Reports"]
        : activeTab === "alerts"
        ? ["Dashboard", "Safety", "Live Alerts"]
        : activeTab === "profile"
        ? ["Dashboard", "Account", "Profile"]
        : activeTab === "settings"
        ? ["Dashboard", "Account", "Settings"]
        : ["Dashboard"];
    return path;
  };

  const handleSignOut = () => {
    toast.success("Signed Out", {
      description: "You have been successfully signed out.",
    });
  };

  const renderContent = () => {
    switch (activeTab) {
      case "map":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Map Visualization
              </h2>
              <p className="text-gray-600">
                Real-time incident mapping and safe route planning
              </p>
            </div>
            <Card>
              <CardContent className="p-0">
                <div
                  className="w-full h-96 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center"
                  style={{ minHeight: "500px" }}
                >
                  <div className="text-center">
                    <Map className="w-16 h-16 text-blue-600 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Interactive Map
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Real-time incident visualization with Google Maps
                      integration
                    </p>
                    <Badge variant="secondary">Map Integration Ready</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case "report":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Report Incident
              </h2>
              <p className="text-gray-600">
                Help keep Addis Ababa safe by reporting incidents
              </p>
            </div>
            <ReportIncident />
          </div>
        );
      case "reports":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">My Reports</h2>
              <p className="text-gray-600">Incidents you have reported</p>
            </div>
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  User Reports
                </h3>
                <p className="text-gray-600 mb-4">
                  List of incidents submitted by the user
                </p>
                <Badge variant="outline">Reports Component Ready</Badge>
              </CardContent>
            </Card>
          </div>
        );
      case "alerts":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Live Alerts</h2>
              <p className="text-gray-600">
                Real-time safety alerts and notifications
              </p>
            </div>
            <Card>
              <CardContent className="text-center py-12">
                <Bell className="w-16 h-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Live Alerts
                </h3>
                <p className="text-gray-600 mb-4">
                  Real-time safety alerts and notifications
                </p>
                <Badge variant="outline">Alerts Component Ready</Badge>
              </CardContent>
            </Card>
          </div>
        );
      case "profile":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Profile</h2>
              <p className="text-gray-600">
                Manage your account settings and preferences
              </p>
            </div>
            <Card>
              <CardContent className="text-center py-12">
                <User className="w-16 h-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  User Profile
                </h3>
                <p className="text-gray-600 mb-4">
                  User profile management and statistics
                </p>
                <Badge variant="outline">Profile Component Ready</Badge>
              </CardContent>
            </Card>
          </div>
        );
      case "settings":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
              <p className="text-gray-600">
                Manage your application preferences
              </p>
            </div>
            <Card>
              <CardContent className="text-center py-12">
                <Settings className="w-16 h-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Settings
                </h3>
                <p className="text-gray-600 mb-4">
                  Application settings and preferences
                </p>
                <Badge variant="outline">Settings Component Ready</Badge>
              </CardContent>
            </Card>
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
                <span className="text-lg font-semibold">SafeZone</span>
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
              <Button variant="ghost" size="sm">
                <Bell className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar: mobile overlay */}
        <Sidebar
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

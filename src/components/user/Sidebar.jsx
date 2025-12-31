import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Map,
  Plus,
  FileText,
  Bell,
  User,
  LogOut,
  X,
  Phone,
  Ambulance,
  Flame,
  BadgeCheck,
} from "lucide-react";
import { toast } from "sonner";
import fetchUserData from "@/utils/user";
import { useEffect, useState } from "react";
import { logout } from "@/firebase/auth/emailAuth";
import { useNavigate } from "react-router-dom";

const navigation = [
  {
    title: "Dashboard",
    items: [{ title: "Map Visualization", icon: Map, href: "/dashboard/map" }],
  },
  {
    title: "Incidents",
    items: [
      { title: "Report Incident", icon: Plus, href: "/dashboard/report" },
      { title: "My Reports", icon: FileText, href: "/dashboard/reports" },
    ],
  },
  {
    title: "Safety",
    items: [{ title: "Live Alerts", icon: Bell, href: "/dashboard/alerts" }],
  },
  {
    title: "Account",
    items: [{ title: "Profile", icon: User, href: "/dashboard/profile" }],
  },
];

export default function Sidebar({
  activeTab,
  onTabChange,
  sidebarOpen,
  setSidebarOpen,
  moveDown = false,
}) {
  const [userData, setUserData] = useState({ email: "", name: "" });
  const navigate = useNavigate();

  useEffect(() => {
    async function loadUser() {
      const data = await fetchUserData();
      setUserData(data);
      console.log(moveDown);
    }
    loadUser();
  }, []);

  const handleSignOut = async () => {
    await logout();
    toast.success("Signed Out", {
      description: "You have been successfully signed out.",
    });

    navigate("/");
  };

  const handleNavClick = (tab) => {
    onTabChange(tab);
    if (setSidebarOpen) setSidebarOpen(false);
  };

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } fixed lg:relative lg:translate-x-0 z-30 w-64 h-auto bg-white shadow-lg transition-transform duration-200 ease-in-out`}
        style={moveDown ? { height: "auto", minHeight: "90vh" } : {}}
      >
        <div className="flex h-full flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2  lg:flex">
                <span className="text-lg font-semibold">
                  {" "}
                  <sup>
                    <Badge variant="secondary" className="ml-1">
                      Addis Ababa
                      <span className="relative flex h-2 w-2 ml-1">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                    </Badge>
                  </sup>
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col p-4 space-y-6 overflow-y-auto">
            {navigation.map((section) => (
              <div key={section.title}>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  {section.title}
                </h3>
                <ul className="space-y-1">
                  {section.items.map((item) => (
                    <li key={item.title}>
                      <Button
                        variant={
                          activeTab === item.href.split("/").pop()
                            ? "secondary"
                            : "ghost"
                        }
                        className="w-full justify-start h-10"
                        onClick={() =>
                          handleNavClick(item.href.split("/").pop())
                        }
                      >
                        <item.icon className="w-4 h-4 mr-3" />
                        {item.title}
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t">
            <div className="flex items-center space-x-3 justify-center mt-auto mb-auto">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{userData.name}</div>
                <div className="text-xs text-gray-500">{userData.email}</div>
              </div>
            </div>
            <div className="mt-3 p-4 border-t">
              <div>
                <div className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                  <Phone className="w-3 h-3 inline-block mr-1" />
                  Emergency Contacts
                </div>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li className="flex items-center gap-2">
                    <BadgeCheck className="w-4 h-4 text-blue-500" />
                    <span className="font-medium text-gray-800">Police:</span>
                    <a href="tel:991" className="text-blue-600 hover:underline">
                      991
                    </a>
                  </li>
                  <li className="flex items-center gap-2">
                    <Ambulance className="w-4 h-4 text-red-500" />
                    <span className="font-medium text-gray-800">
                      Ambulance:
                    </span>
                    <a href="tel:907" className="text-blue-600 hover:underline">
                      907
                    </a>
                  </li>
                  <li className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span className="font-medium text-gray-800">Fire:</span>
                    <a href="tel:939" className="text-blue-600 hover:underline">
                      939
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4 mr-3" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

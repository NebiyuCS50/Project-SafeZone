import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  MoreHorizontal,
  Shield,
  ShieldOff,
  Ban,
  CheckCircle,
  Users,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { countTotalUsers } from "@/utils/user";
import { fetchAllReports } from "@/utils/user";
import { updateUserStatus, updateUserRole } from "@/firebase/incidentReporting";
import { format } from "date-fns";
import Loading from "../ui/Loading";

function getActionDialogContent(action, user) {
  if (!action || !user) return null;

  const actionMap = {
    disable: {
      title: "Disable User",
      desc: `Are you sure you want to disable ${user.email}? This user will not be able to access their account.`,
    },
    enable: {
      title: "Enable User",
      desc: `Are you sure you want to enable ${user.email}? This user will regain access to their account.`,
    },
    promote: {
      title: "Promote to Admin",
      desc: `Are you sure you want to promote ${user.email} to admin? They will have elevated privileges.`,
    },
    demote: {
      title: "Remove Admin",
      desc: `Are you sure you want to remove admin privileges from ${user.email}? They will revert to a regular user.`,
    },
  };

  return actionMap[action] || null;
}

function openActionDialog(user, action, setActionDialog) {
  setActionDialog({
    open: true,
    user,
    action,
  });
}

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [userData, setUserData] = useState([]);
  //   const [usersWithReportCount, setUsersWithReportCount] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionDialog, setActionDialog] = useState({
    open: false,
    user: null,
    action: null,
  });

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await countTotalUsers();
        if (!response) throw new Error("Failed to fetch users");
        setUsers(
          Array.isArray(response) ? response : response ? [response] : []
        );
      } catch (error) {
        console.error("Error fetching users:", error);
        toast("Error", {
          description: "Failed to update user. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  useEffect(() => {
    async function fetchReports() {
      try {
        const reports = await fetchAllReports();
        console.log("Fetched reports:", reports);
        setUserData(
          Array.isArray(reports) ? reports : reports ? [reports] : []
        );
      } catch (error) {
        console.error("Error fetching reports:", error);
      }
    }
    fetchReports();
  }, []);

  useEffect(() => {
    console.log("users:", users);
    console.log("userData (incidents):", userData);
  }, [users, userData]);

  // Filter users based on search term
  useEffect(() => {
    const filtered = users.filter(
      (user) =>
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
    console.log("Filtered users:", filtered);
  }, [searchTerm, users]);

  // Handle user actions
  const handleUserAction = async (user, action) => {
    console.log("Updating user:", user);
    try {
      let updatedUser;
      if (action === "disable") {
        updatedUser = await updateUserStatus(user.id, false); // use sanitized email
      } else if (action === "enable") {
        updatedUser = await updateUserStatus(user.id, true);
      } else if (action === "promote") {
        updatedUser = await updateUserRole(user.id, "admin");
      } else if (action === "demote") {
        updatedUser = await updateUserRole(user.id, "user");
      }

      setUsers((prev) =>
        prev.map((u) =>
          u.email === user.email
            ? { ...updatedUser, id: user.id } // Ensure id is present
            : u
        )
      );

      toast("Success", {
        description: "User updated successfully.",
      });
    } catch (error) {
      console.error("Error updating user:", error);
      toast("Error", {
        description: "Failed to update user. Please try again.",
      });
    }

    setActionDialog({ open: false, user: null, action: null });
  };

  const highReports = users.filter((user) => {
    // Count incidents for this user
    const count = userData.filter(
      (incident) => incident.userEmail === user.email
    ).length;
    return count > 5;
  }).length;

  const stats = {
    total: users.length,
    active: users.filter((u) => u.isActive).length,
    admins: users.filter((u) => u.role === "admin").length,
    highReports, // use the calculated value
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loading text="Loading incidents..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen  bg-gray-50 p-0">
      <main className="container mx-auto  py-1">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Users
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Admins</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.admins}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                High Reports
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.highReports}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Users Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Reports</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        {searchTerm
                          ? "No users found matching your search."
                          : "No users found."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {user.name || "Unknown"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {user.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={user.isActive ? "default" : "secondary"}
                          >
                            {user.isActive ? "Active" : "Disabled"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              user.role === "admin" ? "default" : "outline"
                            }
                          >
                            {user.role === "admin" ? "Admin" : "User"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {(() => {
                              const count = userData.filter((incident) => {
                                console.log(
                                  "Comparing",
                                  user.email,
                                  incident.userEmail
                                );
                                return incident.userEmail === user.email;
                              }).length;
                              return (
                                <>
                                  <span
                                    className={
                                      count > 5
                                        ? "text-red-600 font-medium"
                                        : ""
                                    }
                                  >
                                    {count}
                                  </span>
                                  {count > 5 && (
                                    <AlertTriangle className="h-4 w-4 text-red-600" />
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-xs">
                            <Calendar className="h-3 w-3" />
                            {format(
                              new Date(user.createdAt),
                              "MMM dd, yyyy HH:mm"
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {user.isActive ? (
                                <DropdownMenuItem
                                  onClick={() =>
                                    setActionDialog({
                                      open: true,
                                      user,
                                      action: "disable",
                                    })
                                  }
                                >
                                  <Ban className="mr-2 h-4 w-4" />
                                  Disable User
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() =>
                                    setActionDialog({
                                      open: true,
                                      user,
                                      action: "enable",
                                    })
                                  }
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Enable User
                                </DropdownMenuItem>
                              )}
                              {user.role === "admin" ? (
                                <DropdownMenuItem
                                  onClick={() =>
                                    openActionDialog(
                                      user,
                                      "demote",
                                      setActionDialog
                                    )
                                  }
                                >
                                  <ShieldOff className="mr-2 h-4 w-4" />
                                  Remove Admin
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() =>
                                    openActionDialog(
                                      user,
                                      "promote",
                                      setActionDialog
                                    )
                                  }
                                >
                                  <Shield className="mr-2 h-4 w-4" />
                                  Promote to Admin
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Action Confirmation Dialog */}
        <AlertDialog
          open={actionDialog.open}
          onOpenChange={(open) => setActionDialog({ ...actionDialog, open })}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {
                  getActionDialogContent(actionDialog.action, actionDialog.user)
                    ?.title
                }
              </AlertDialogTitle>
              <AlertDialogDescription>
                {
                  getActionDialogContent(actionDialog.action, actionDialog.user)
                    ?.desc
                }
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  actionDialog.user &&
                  handleUserAction(actionDialog.user, actionDialog.action)
                }
              >
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}

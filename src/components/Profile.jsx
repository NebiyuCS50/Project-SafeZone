import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  MapPin,
  Star,
  History,
  Edit,
  Shield,
  CheckCircle,
  Clock,
  XCircle,
  Award,
  Activity,
  Mail,
  Lock,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import fetchUserData, { fetchAllReports } from "@/utils/user";
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { auth } from "@/firebase/firebase";

const INCIDENT_TYPES = {
  accident: { label: "Accident", color: "destructive" },
  traffic: { label: "Traffic Issue", color: "destructive" },
  crime: { label: "Crime/Suspicious", color: "destructive" },
  fire: { label: "Fire/Hazard", color: "destructive" },
  medical: { label: "Medical Emergency", color: "destructive" },
  disaster: { label: "Natural Disaster", color: "destructive" },
  other: { label: "Other", color: "secondary" },
};

const STATUSES = {
  pending: { label: "Pending", color: "secondary", icon: Clock },
  verified: { label: "Verified", color: "success", icon: CheckCircle },
  rejected: { label: "Rejected", color: "destructive", icon: XCircle },
};

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [userReports, setUserReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editForm, setEditForm] = useState({ name: "" });
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setLoading(true);
    try {
      const userData = await fetchUserData();
      setUser(userData);
      setEditForm({ name: userData.name || "" });

      const allReports = await fetchAllReports();

      const myReports = allReports.filter(
        (r) => r.userId === auth.currentUser.uid
      );
      setUserReports(myReports);
    } catch (error) {
      toast.error("Error loading profile");
    } finally {
      setLoading(false);
    }
  };

  // Password change handler
  const handleChangePassword = async () => {
    setPasswordLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("No user");
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        passwordForm.oldPassword
      );
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, passwordForm.newPassword);
      toast.success("Password changed successfully");
      setChangePasswordOpen(false);
      setPasswordForm({ oldPassword: "", newPassword: "" });
    } catch (error) {
      toast.error(error.message || "Error changing password");
    } finally {
      setPasswordLoading(false);
    }
  };

  // Trust score calculation
  const getTrustScore = () => {
    const total = userReports.length;
    if (total === 0) return 0;
    const verified = userReports.filter((r) => r.status === "verified").length;
    const pending = userReports.filter((r) => r.status === "pending").length;
    return ((verified + 0.5 * pending) / total) * 5;
  };

  const getTrustStars = (score) => {
    const fullStars = Math.floor(score);
    const hasHalfStar = score % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex items-center gap-1">
        {[...Array(fullStars)].map((_, i) => (
          <Star
            key={`full-${i}`}
            className="h-4 w-4 fill-yellow-400 text-yellow-400"
          />
        ))}
        {hasHalfStar && (
          <Star className="h-4 w-4 fill-yellow-200 text-yellow-400" />
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />
        ))}
        <span className="ml-2 text-sm font-medium">{score.toFixed(1)}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">
              Loading profile...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Please sign in to view your profile
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const trustScore = getTrustScore();
  const totalReports = userReports.length;
  const verifiedReports = userReports.filter(
    (r) => r.status === "verified"
  ).length;
  const pendingReports = userReports.filter(
    (r) => r.status === "pending"
  ).length;
  const rejectedReports = userReports.filter(
    (r) => r.status === "rejected"
  ).length;

  const itemsPerPage = 3;
  const totalPages = Math.max(1, Math.ceil(userReports.length / itemsPerPage));
  const paginatedReports = userReports.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getPaginationItems = () => {
    const items = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) items.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) items.push(i);
        items.push("ellipsis");
        items.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        items.push(1);
        items.push("ellipsis");
        for (let i = totalPages - 3; i <= totalPages; i++) items.push(i);
      } else {
        items.push(1);
        items.push("ellipsis");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) items.push(i);
        items.push("ellipsis");
        items.push(totalPages);
      }
    }
    return items;
  };

  return (
    <div className="space-y-6">
      {/* Basic User Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg">
                  {user.name
                    ? user.name.charAt(0).toUpperCase()
                    : user.email.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="flex items-center gap-2">
                  {user.name || "Anonymous User"}
                  {/* If you have accountType, show it here */}
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </div>
              </div>
            </div>

            <Dialog
              open={changePasswordOpen}
              onOpenChange={setChangePasswordOpen}
            >
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Lock className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change Password</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="oldPassword">Current Password</Label>
                    <Input
                      id="oldPassword"
                      type="password"
                      value={passwordForm.oldPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          oldPassword: e.target.value,
                        })
                      }
                      placeholder="Enter current password"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          newPassword: e.target.value,
                        })
                      }
                      placeholder="Enter new password"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setChangePasswordOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleChangePassword}
                      disabled={passwordLoading}
                    >
                      {passwordLoading ? "Saving..." : "Change Password"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {totalReports}
              </div>
              <div className="text-sm text-muted-foreground">Total Reports</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {verifiedReports}
              </div>
              <div className="text-sm text-muted-foreground">Verified</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {pendingReports}
              </div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {rejectedReports}
              </div>
              <div className="text-sm text-muted-foreground">Rejected</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User's Report History */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Your Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userReports.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No reports submitted yet
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {paginatedReports.map((report) => {
                      const StatusIcon = STATUSES[report.status]?.icon || Clock;
                      return (
                        <div
                          key={report.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-3">
                            <StatusIcon className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">
                                {INCIDENT_TYPES[report.incidentType]?.label ||
                                  report.incidentType}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {format(
                                  new Date(report.timestamp),
                                  "MMM dd, yyyy HH:mm"
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                STATUSES[report.status]?.color || "secondary"
                              }
                            >
                              {STATUSES[report.status]?.label || report.status}
                            </Badge>
                            {report.status === "rejected" &&
                              report.rejectionReason && (
                                <span className="text-xs text-muted-foreground">
                                  ({report.rejectionReason})
                                </span>
                              )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* ShadCN Pagination */}
                  {totalPages > 1 && (
                    <Pagination className="mt-4">
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() =>
                              setCurrentPage((p) => Math.max(1, p - 1))
                            }
                            className={
                              currentPage === 1
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer"
                            }
                          />
                        </PaginationItem>
                        {getPaginationItems().map((item, idx) =>
                          item === "ellipsis" ? (
                            <PaginationItem key={idx}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          ) : (
                            <PaginationItem key={idx}>
                              <PaginationLink
                                isActive={currentPage === item}
                                onClick={() => setCurrentPage(item)}
                                className="cursor-pointer"
                              >
                                {item}
                              </PaginationLink>
                            </PaginationItem>
                          )
                        )}
                        <PaginationItem>
                          <PaginationNext
                            onClick={() =>
                              setCurrentPage((p) => Math.min(totalPages, p + 1))
                            }
                            className={
                              currentPage === totalPages
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer"
                            }
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
        {/* Side Panel */}
        <div className="space-y-6">
          {/* Trust Score */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Trust Score
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {getTrustStars(trustScore)}
              <Progress value={(trustScore / 5) * 100} className="h-2" />
              <div className="text-sm text-muted-foreground">
                Verified and pending reports increase your score. Rejected
                reports do not.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

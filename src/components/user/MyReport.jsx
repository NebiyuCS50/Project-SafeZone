import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Search,
  Filter,
  Calendar,
  MapPin,
  AlertTriangle,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
import { useAuthStore } from "@/store/useAuthStore";
import { fetchAllReports } from "@/utils/user";
import { toast } from "sonner";

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
  pending: { label: "Pending", color: "secondary" },
  resolved: { label: "Resolved", color: "success" },
  rejected: { label: "Rejected", color: "destructive" },
};

function groupByTypeAndLocation(reports) {
  const groups = {};
  reports.forEach((r) => {
    const loc =
      typeof r.latitude === "number" && typeof r.longitude === "number"
        ? `${r.latitude.toFixed(4)},${r.longitude.toFixed(4)}`
        : r.location &&
          typeof r.location.lat === "number" &&
          typeof r.location.lng === "number"
        ? `${r.location.lat.toFixed(4)},${r.location.lng.toFixed(4)}`
        : "N/A";
    const key = `${r.incidentType}|${loc}`;
    if (!groups[key]) {
      groups[key] = { ...r, count: 1, locKey: loc };
    } else {
      groups[key].count += 1;
      // Optionally, update timestamp to the latest
      if (r.timestamp > groups[key].timestamp) {
        groups[key].timestamp = r.timestamp;
      }
    }
  });
  return Object.values(groups);
}

export default function IncidentReportsTable() {
  const [allReports, setAllReports] = useState([]);
  const [groupedReports, setGroupedReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReports, setTotalReports] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const { user } = useAuthStore();

  const itemsPerPage = 5;

  useEffect(() => {
    setLoading(true);
    fetchAllReports()
      .then((data) => {
        if (user && user.role !== "admin") {
          data = data.filter((report) => report.userId === user.uid);
        } else {
          toast.error("User not found or unauthorized");
          data = [];
        }
        setAllReports(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    let filtered = allReports;

    if (searchTerm) {
      filtered = filtered.filter((r) =>
        r.incidentType.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterType !== "all") {
      filtered = filtered.filter((r) => r.incidentType === filterType);
    }
    if (filterStatus !== "all") {
      filtered = filtered.filter((r) => r.status === filterStatus);
    }

    // Group by type and location
    const grouped = groupByTypeAndLocation(filtered);

    setTotalReports(grouped.length);
    setTotalPages(Math.max(1, Math.ceil(grouped.length / itemsPerPage)));

    const safePage = Math.min(
      currentPage,
      Math.max(1, Math.ceil(grouped.length / itemsPerPage))
    );
    setCurrentPage(safePage);

    const startIdx = (safePage - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    setGroupedReports(grouped.slice(startIdx, endIdx));
  }, [allReports, searchTerm, filterType, filterStatus, currentPage]);

  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleFilter = (type, value) => {
    if (type === "type") {
      setFilterType(value);
    } else {
      setFilterStatus(value);
    }
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const showReportDetails = (report) => {
    setSelectedReport(report);
    setShowDetails(true);
  };

  const getPaginationItems = () => {
    const items = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          items.push(i);
        }
        items.push("ellipsis");
        items.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        items.push(1);
        items.push("ellipsis");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          items.push(i);
        }
      } else {
        items.push(1);
        items.push("ellipsis");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          items.push(i);
        }
        items.push("ellipsis");
        items.push(totalPages);
      }
    }

    return items;
  };

  if (loading && groupedReports.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">
              Loading incident reports...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Incident Reports ({totalReports})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <Select
                value={filterType}
                onValueChange={(value) => handleFilter("type", value)}
              >
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(INCIDENT_TYPES).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filterStatus}
                onValueChange={(value) => handleFilter("status", value)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {Object.entries(STATUSES).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Date/Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Count</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupedReports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchTerm ||
                        filterType !== "all" ||
                        filterStatus !== "all"
                          ? "No reports found matching your criteria"
                          : "No incident reports found"}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  groupedReports.map((report) => (
                    <TableRow key={report.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-xs">
                        #{report.id.slice(-8)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            INCIDENT_TYPES[report.incidentType]?.color ||
                            "secondary"
                          }
                        >
                          {INCIDENT_TYPES[report.incidentType]?.label ||
                            report.incidentType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {typeof report.latitude === "number" &&
                          typeof report.longitude === "number"
                            ? `${report.latitude.toFixed(
                                4
                              )}, ${report.longitude.toFixed(4)}`
                            : report.location &&
                              typeof report.location.lat === "number" &&
                              typeof report.location.lng === "number"
                            ? `${report.location.lat.toFixed(
                                4
                              )}, ${report.location.lng.toFixed(4)}`
                            : "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs">
                          <Calendar className="h-3 w-3" />
                          {format(
                            new Date(report.timestamp),
                            "MMM dd, yyyy HH:mm"
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            STATUSES[report.status]?.color || "secondary"
                          }
                        >
                          {STATUSES[report.status]?.label || report.status}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline">{report.count}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => showReportDetails(report)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="pt-6">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(currentPage - 1)}
                    className={
                      currentPage === 1
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>

                {getPaginationItems().map((item, index) => (
                  <PaginationItem key={index}>
                    {item === "ellipsis" ? (
                      <PaginationEllipsis />
                    ) : (
                      <PaginationLink
                        onClick={() => handlePageChange(item)}
                        isActive={currentPage === item}
                        className="cursor-pointer"
                      >
                        {item}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePageChange(currentPage + 1)}
                    className={
                      currentPage === totalPages
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>

            <div className="text-center text-sm text-muted-foreground mt-1">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, totalReports)} of{" "}
              {totalReports} reports
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Details Modal */}
      {showDetails && selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Incident Report Details
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(false)}
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Report ID
                  </label>
                  <p className="font-mono text-xs">#{selectedReport.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Type
                  </label>
                  <div className="mt-1">
                    <Badge
                      variant={
                        INCIDENT_TYPES[selectedReport.incidentType]?.color ||
                        "secondary"
                      }
                    >
                      {INCIDENT_TYPES[selectedReport.incidentType]?.label ||
                        selectedReport.incidentType}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Status
                  </label>
                  <div className="mt-1">
                    <Badge
                      variant={
                        STATUSES[selectedReport.status]?.color || "secondary"
                      }
                    >
                      {STATUSES[selectedReport.status]?.label ||
                        selectedReport.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Date/Time
                  </label>
                  <p className="flex items-center gap-1 text-sm">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(selectedReport.timestamp), "PPP p")}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Location
                </label>
                <p className="flex items-center gap-1 text-sm mt-1">
                  <MapPin className="h-3 w-3" />
                  {typeof selectedReport?.latitude === "number" &&
                  typeof selectedReport?.longitude === "number" ? (
                    `${selectedReport.latitude}, ${selectedReport.longitude}`
                  ) : selectedReport?.location &&
                    typeof selectedReport.location.lat === "number" &&
                    typeof selectedReport.location.lng === "number" ? (
                    <span>
                      lat: {selectedReport.location.lat}, lng:{" "}
                      {selectedReport.location.lng}
                    </span>
                  ) : (
                    "N/A"
                  )}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Description
                </label>
                <p className="text-sm mt-1 bg-muted p-3 rounded-md">
                  {selectedReport.description}
                </p>
              </div>

              {selectedReport.imageUrl && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Evidence
                  </label>
                  <div className="mt-1">
                    <img
                      src={selectedReport.imageUrl}
                      alt="Incident evidence"
                      className="max-w-full h-auto rounded-md border"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

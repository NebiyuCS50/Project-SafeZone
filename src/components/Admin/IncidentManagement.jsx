import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Filter,
  Calendar as CalendarIcon,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Flame,
  Car,
  Users,
  Eye,
  Trash2,
  Image as ImageIcon,
  TrendingUp,
  Search,
  ChevronDown,
} from "lucide-react";
import { fetchAllReports } from "@/utils/user";
import { format } from "date-fns";
import { updateIncidentStatus } from "@/firebase/incidentReporting";
import { deleteIncident } from "@/firebase/incidentReporting";
import Loading from "../ui/Loading";

const INCIDENT_TYPES = {
  accident: { label: "Accident", icon: "🚗", color: "destructive" },
  traffic: { label: "Traffic Issue", icon: "🚦", color: "destructive" },
  crime: { label: "Crime/Suspicious", icon: "🚨", color: "destructive" },
  fire: { label: "Fire/Hazard", icon: "🔥", color: "destructive" },
  medical: { label: "Medical Emergency", icon: "🩺", color: "destructive" },
  natural: { label: "Natural Disaster", icon: "🌪️", color: "destructive" },
  other: { label: "Other", icon: "❓", color: "secondary" },
};

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  resolved: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
};

const statusIcons = {
  pending: Clock,
  resolved: CheckCircle,
  rejected: XCircle,
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
    const key = `${r.incidentType || r.type}|${loc}`;
    if (!groups[key]) {
      groups[key] = { ...r, count: 1, locKey: loc };
    } else {
      groups[key].count += 1;
      // If this incident is newer, replace the group object with this one (but keep count and locKey)
      const currentTimestamp = groups[key].timestamp || groups[key].date;
      const newTimestamp = r.timestamp || r.date;
      if (newTimestamp > currentTimestamp) {
        groups[key] = { ...r, count: groups[key].count, locKey: loc };
      }
    }
  });
  return Object.values(groups);
}

export default function IncidentManagement() {
  const [incidents, setIncidents] = useState([]);
  const [filteredIncidents, setFilteredIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    status: [],
    type: [],
    search: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadIncidents() {
      const reports = await fetchAllReports();
      setIncidents(reports);
    }
    loadIncidents();
  }, []);

  // Apply filters
  const applyFilters = () => {
    let filtered = incidents;

    // Status filter
    if (filters.status.length > 0) {
      filtered = filtered.filter((incident) =>
        filters.status.includes(incident.status)
      );
    }

    // Type filter
    if (filters.type.length > 0) {
      filtered = filtered.filter((incident) =>
        filters.type.includes(incident.incidentType)
      );
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (incident) =>
          incident.incidentType.toLowerCase().includes(searchLower) ||
          incident.description.toLowerCase().includes(searchLower) ||
          incident.userEmail.toLowerCase().includes(searchLower)
      );
    }
    filtered = groupByTypeAndLocation(filtered);
    setFilteredIncidents(filtered);
  };

  // Update filtered incidents when filters change
  useEffect(() => {
    applyFilters();
    setCurrentPage(1); // Reset to first page when filters change
  }, [filters, incidents]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredIncidents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedIncidents = filteredIncidents.slice(startIndex, endIndex);

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const handleStatusChange = async (incidentId, newStatus) => {
    setLoading(true);
    setError(null);
    try {
      const incident = filteredIncidents.find((i) => i.id === incidentId);
      if (!incident) return;

      const groupType = incident.incidentType || incident.type;
      const groupLoc = incident.locKey;

      // Find all matching incidents in the original array
      const toUpdate = incidents.filter((i) => {
        const loc =
          typeof i.latitude === "number" && typeof i.longitude === "number"
            ? `${i.latitude.toFixed(4)},${i.longitude.toFixed(4)}`
            : i.location &&
              typeof i.location.lat === "number" &&
              typeof i.location.lng === "number"
            ? `${i.location.lat.toFixed(4)},${i.location.lng.toFixed(4)}`
            : "N/A";
        const key = `${i.incidentType || i.type}|${loc}`;
        return key === `${groupType}|${groupLoc}`;
      });

      // Update Firestore for each incident
      await Promise.all(
        toUpdate.map((i) => updateIncidentStatus(i.id, newStatus))
      );

      // Update local state
      setIncidents((prev) =>
        prev.map((i) => {
          const loc =
            typeof i.latitude === "number" && typeof i.longitude === "number"
              ? `${i.latitude.toFixed(4)},${i.longitude.toFixed(4)}`
              : i.location &&
                typeof i.location.lat === "number" &&
                typeof i.location.lng === "number"
              ? `${i.location.lat.toFixed(4)},${i.location.lng.toFixed(4)}`
              : "N/A";
          const key = `${i.incidentType || i.type}|${loc}`;
          if (key === `${groupType}|${groupLoc}`) {
            return { ...i, status: newStatus };
          }
          return i;
        })
      );
    } catch (err) {
      setError(err.message || "Failed to update incident status.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteIncident = async (incidentId) => {
    setLoading(true);
    setError(null);
    try {
      await deleteIncident(incidentId); // Delete from Firestore
      setIncidents((prev) =>
        prev.filter((incident) => incident.id !== incidentId)
      );
      setSelectedIncident(null);
    } catch (err) {
      setError(err.message || "Failed to delete incident.");
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return "text-green-600";
    if (confidence >= 0.5) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-6">
      <div className="max-w-7xl mx-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Incidents</p>
                  <p className="text-2xl font-bold">{incidents.length}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Resolved</p>
                  <p className="text-2xl font-bold text-green-600">
                    {incidents.filter((i) => i.status === "resolved").length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {incidents.filter((i) => i.status === "pending").length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold text-red-600">
                    {incidents.filter((i) => i.status === "rejected").length}
                  </p>
                </div>
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            {/* Quick Filters */}
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search incidents..."
                    value={filters.search}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        search: e.target.value,
                      }))
                    }
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select
                  value={filters.status[0] || "all"}
                  onValueChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      status: value === "all" ? [] : [value],
                    }))
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filters.type[0] || "all"}
                  onValueChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      type: value === "all" ? [] : [value],
                    }))
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="accident">Accident</SelectItem>
                    <SelectItem value="traffic">Traffic Issue</SelectItem>
                    <SelectItem value="crime">Crime/Suspicious</SelectItem>
                    <SelectItem value="fire">Fire/Hazard</SelectItem>
                    <SelectItem value="medical">Medical Emergency</SelectItem>
                    <SelectItem value="natural">Natural Disaster</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Incidents Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto relative">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-10">
                  <div className="flex flex-col items-center">
                    <svg
                      className="animate-spin h-8 w-8 text-blue-600 mb-2"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      ></path>
                    </svg>
                    <span className="text-blue-600 font-semibold">
                      Updating status...
                    </span>
                  </div>
                </div>
              )}
              {error && (
                <div className="mb-4 text-red-600 font-semibold">{error}</div>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Type</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Count</TableHead>
                    <TableHead>Reporter</TableHead>
                    <TableHead>AI Confidence</TableHead>

                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIncidents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        <p className="text-gray-500">
                          No incidents found matching your filters.
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedIncidents.map((incident) => {
                      const StatusIcon = statusIcons[incident.status] || null;

                      return (
                        <TableRow
                          key={incident.id}
                          className="hover:bg-gray-50"
                        >
                          <TableCell>
                            <div className="flex items-center justify-center">
                              {INCIDENT_TYPES[incident.incidentType]?.icon ||
                                "❓"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {incident.incidentType}
                              </div>
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {incident.description}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                statusColors[incident.status] ||
                                "bg-gray-100 text-gray-800"
                              }
                            >
                              {StatusIcon && (
                                <StatusIcon className="h-3 w-3 mr-1" />
                              )}
                              {incident.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {typeof incident.latitude === "number" &&
                              typeof incident.longitude === "number"
                                ? `${incident.latitude.toFixed(
                                    4
                                  )}, ${incident.longitude.toFixed(4)}`
                                : incident.location &&
                                  typeof incident.location.lat === "number" &&
                                  typeof incident.location.lng === "number"
                                ? `${incident.location.lat.toFixed(
                                    4
                                  )}, ${incident.location.lng.toFixed(4)}`
                                : "N/A"}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            <div className="flex items-center gap-1 text-xs">
                              <CalendarIcon className="h-3 w-3" />
                              {format(
                                new Date(incident.timestamp),
                                "MMM dd, yyyy HH:mm"
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{incident.count}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {incident.userEmail}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-4 w-4" />
                              <span
                                className={`text-sm font-medium ${getConfidenceColor(
                                  incident.aiConfidence
                                )}`}
                              >
                                {(incident.aiConfidence * 100).toFixed(1)}%
                              </span>
                            </div>
                          </TableCell>

                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      setSelectedIncident(incident)
                                    }
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl max-h-[80vh]">
                                  <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                      {INCIDENT_TYPES[incident.incidentType]
                                        ?.icon || "❓"}
                                      {incident.incidentType}
                                    </DialogTitle>
                                    <DialogDescription>
                                      Full incident details and actions
                                    </DialogDescription>
                                  </DialogHeader>

                                  <ScrollArea className="max-h-[60vh]">
                                    <div className="space-y-4">
                                      <div>
                                        <h4 className="font-medium mb-2">
                                          Description
                                        </h4>
                                        <p className="text-gray-600">
                                          {incident.description}
                                        </p>
                                      </div>

                                      <Separator />

                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <h4 className="font-medium mb-2">
                                            Location
                                          </h4>
                                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <MapPin className="h-3 w-3" />
                                            {typeof incident.latitude ===
                                              "number" &&
                                            typeof incident.longitude ===
                                              "number"
                                              ? `${incident.latitude.toFixed(
                                                  4
                                                )}, ${incident.longitude.toFixed(
                                                  4
                                                )}`
                                              : incident.location &&
                                                typeof incident.location.lat ===
                                                  "number" &&
                                                typeof incident.location.lng ===
                                                  "number"
                                              ? `${incident.location.lat.toFixed(
                                                  4
                                                )}, ${incident.location.lng.toFixed(
                                                  4
                                                )}`
                                              : "N/A"}
                                          </div>
                                        </div>
                                        <div>
                                          <h4 className="font-medium mb-2">
                                            Date
                                          </h4>
                                          <div className="flex items-center gap-1 text-xs">
                                            <CalendarIcon className="h-3 w-3" />
                                            {format(
                                              new Date(incident.timestamp),
                                              "MMM dd, yyyy HH:mm"
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      <Separator />

                                      <div>
                                        <h4 className="font-medium mb-2">
                                          AI Analysis
                                        </h4>
                                        <div className="flex items-center gap-2">
                                          <TrendingUp className="h-4 w-4" />
                                          <span>Confidence Score: </span>
                                          <span
                                            className={`font-medium ${getConfidenceColor(
                                              incident.aiConfidence
                                            )}`}
                                          >
                                            {(
                                              incident.aiConfidence * 100
                                            ).toFixed(1)}
                                            %
                                          </span>
                                        </div>
                                      </div>

                                      <Separator />
                                      <div>
                                        <h4 className="font-medium mb-3">
                                          Uploaded Images
                                        </h4>
                                        <div className="mt-1">
                                          <img
                                            src={incident.imageUrl}
                                            alt="Incident evidence"
                                            className="max-w-full h-auto rounded-md border"
                                          />
                                        </div>
                                      </div>

                                      <Separator />

                                      <div>
                                        <h4 className="font-medium mb-3">
                                          Actions
                                        </h4>
                                        <div className="flex gap-2">
                                          <Button
                                            onClick={() =>
                                              handleStatusChange(
                                                incident.id,
                                                "resolved"
                                              )
                                            }
                                            className="bg-green-600 hover:bg-green-700"
                                          >
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Approve
                                          </Button>
                                          <Button
                                            onClick={() =>
                                              handleStatusChange(
                                                incident.id,
                                                "rejected"
                                              )
                                            }
                                            variant="destructive"
                                          >
                                            <XCircle className="h-4 w-4 mr-2" />
                                            Rejected
                                          </Button>
                                          <Button
                                            onClick={() =>
                                              handleDeleteIncident(incident.id)
                                            }
                                            variant="outline"
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                          >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  </ScrollArea>
                                </DialogContent>
                              </Dialog>

                              <Button
                                size="sm"
                                onClick={() =>
                                  handleStatusChange(incident.id, "resolved")
                                }
                                className="bg-green-600 hover:bg-green-700"
                                disabled={
                                  loading || incident.status === "resolved"
                                }
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>

                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  handleStatusChange(incident.id, "rejected")
                                }
                                disabled={
                                  incident.status === "rejected" || loading
                                }
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleDeleteIncident(incident.id)
                                }
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                disabled={loading}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          {/* Pagination Controls */}
          <div className="p-4 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  Showing {startIndex + 1} to{" "}
                  {Math.min(endIndex, filteredIncidents.length)} of{" "}
                  {filteredIncidents.length} incidents
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Items per page:</span>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) =>
                      handleItemsPerPageChange(Number(value))
                    }
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {totalPages > 1 && (
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={handlePreviousPage}
                          className={
                            currentPage === 1
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>

                      {/* Page numbers */}
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => {
                          // Show first page, last page, current page, and pages around current
                          if (
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          ) {
                            return (
                              <PaginationItem key={page}>
                                <PaginationLink
                                  onClick={() => handlePageChange(page)}
                                  isActive={currentPage === page}
                                  className="cursor-pointer"
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          }

                          // Show ellipsis for gaps
                          if (
                            (page === 2 && currentPage > 3) ||
                            (page === totalPages - 1 &&
                              currentPage < totalPages - 2)
                          ) {
                            return (
                              <PaginationItem key={page}>
                                <PaginationEllipsis />
                              </PaginationItem>
                            );
                          }

                          return null;
                        }
                      )}

                      <PaginationItem>
                        <PaginationNext
                          onClick={handleNextPage}
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
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

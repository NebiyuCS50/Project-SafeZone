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
  Filter,
  Calendar,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  Trash2,
  TrendingUp,
  Search,
  ChevronDown,
} from "lucide-react";
import { fetchAllReports } from "@/utils/user";
import { format } from "date-fns";

const statusColors = {
  Resolved: "bg-green-100 text-green-800 border-green-200",
  Rejected: "bg-red-100 text-red-800 border-red-200",
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
};

const statusIcons = {
  Resolved: CheckCircle,
  Rejected: XCircle,
  pending: Clock,
};
const INCIDENT_TYPES = {
  accident: { label: " Accident", icon: "🚗", color: "destructive" },
  traffic: { label: " Traffic Issue", icon: "🚦", color: "destructive" },
  crime: { label: " Crime/Suspicious", icon: "🚨", color: "destructive" },
  fire: { label: " Fire/Hazard", icon: "🔥", color: "destructive" },
  medical: { label: " Medical Emergency", icon: "🩺", color: "destructive" },
  disaster: { label: " Natural Disaster", icon: "🌪️", color: "destructive" },
  other: { label: "❓ Other", color: "secondary" },
};

export default function IncidentManagement() {
  const [incidents, setIncidents] = useState([]);
  const [filteredIncidents, setFilteredIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    status: [],
    type: [],
    dateRange: { from: null, to: null },
    location: "",
    search: "",
  });

  useEffect(() => {
    async function loadIncidents() {
      const reports = await fetchAllReports();
      const normalized = reports.map((r) => ({
        ...r,
        date: r.date
          ? r.date.toDate
            ? r.date.toDate()
            : new Date(r.date)
          : null,
      }));
      setIncidents(normalized);
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
        filters.type.includes(incident.type)
      );
    }

    // Date range filter
    if (filters.dateRange.from) {
      filtered = filtered.filter(
        (incident) => incident.date >= filters.dateRange.from
      );
    }
    if (filters.dateRange.to) {
      filtered = filtered.filter(
        (incident) => incident.date <= filters.dateRange.to
      );
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (incident) =>
          (incident.incidentType &&
            incident.incidentType.toLowerCase().includes(searchLower)) ||
          (incident.type &&
            incident.type.toLowerCase().includes(searchLower)) ||
          (incident.title &&
            incident.title.toLowerCase().includes(searchLower)) ||
          (incident.description &&
            incident.description.toLowerCase().includes(searchLower)) ||
          (incident.reportedBy &&
            incident.reportedBy.toLowerCase().includes(searchLower))
      );
    }
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

  const handleStatusChange = (incidentId, newStatus) => {
    setIncidents((prev) =>
      prev.map((incident) =>
        incident.id === incidentId
          ? { ...incident, status: newStatus }
          : incident
      )
    );
  };

  const handleDeleteIncident = (incidentId) => {
    setIncidents((prev) =>
      prev.filter((incident) => incident.id !== incidentId)
    );
    setSelectedIncident(null);
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return "text-green-600";
    if (confidence >= 0.5) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
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
                    {incidents.filter((i) => i.status === "Resolved").length}
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
                    {incidents.filter((i) => i.status === "Rejected").length}
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
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                <h3 className="font-semibold">Filters</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? "Hide" : "Show"} Filters
                <ChevronDown
                  className={`h-4 w-4 ml-2 transition-transform ${
                    showFilters ? "rotate-180" : ""
                  }`}
                />
              </Button>
            </div>

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
                    <SelectItem value="Resolved">Resolved</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
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
                    <SelectItem value="fire">Fire</SelectItem>
                    <SelectItem value="traffic">Traffic</SelectItem>
                    <SelectItem value="crowding">Crowding</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Date Range
                    </Label>
                    <div className="flex gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="flex-1 justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {filters.dateRange.from
                              ? filters.dateRange.from.toLocaleDateString()
                              : "Start date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={filters.dateRange.from}
                            onSelect={(date) =>
                              setFilters((prev) => ({
                                ...prev,
                                dateRange: { ...prev.dateRange, from: date },
                              }))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="flex-1 justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {filters.dateRange.to
                              ? filters.dateRange.to.toLocaleDateString()
                              : "End date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={filters.dateRange.to}
                            onSelect={(date) =>
                              setFilters((prev) => ({
                                ...prev,
                                dateRange: { ...prev.dateRange, to: date },
                              }))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() =>
                        setFilters({
                          status: [],
                          type: [],
                          dateRange: { from: null, to: null },
                          location: "",
                          search: "",
                        })
                      }
                    >
                      Clear All Filters
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Incidents Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Type</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Date</TableHead>
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
                      const StatusIcon = statusIcons[incident.status];

                      return (
                        <TableRow
                          key={incident.id}
                          className="hover:bg-gray-50"
                        >
                          <TableCell>
                            <div className="flex items-center justify-center">
                              <span className="text-xl">
                                {INCIDENT_TYPES[incident.incidentType]?.icon ||
                                  "❓"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {INCIDENT_TYPES[incident.incidentType]?.label ||
                                  incident.incidentType}
                              </div>
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {incident.description}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusColors[incident.status]}>
                              <StatusIcon className="h-3 w-3 mr-1" />
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
                              <Calendar className="h-3 w-3" />
                              {incident.timestamp
                                ? (() => {
                                    const d = new Date(incident.timestamp);
                                    return isNaN(d.getTime())
                                      ? "N/A"
                                      : format(d, "MMM dd, yyyy HH:mm");
                                  })()
                                : "N/A"}
                            </div>
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
                                      <span className="text-xl">
                                        {INCIDENT_TYPES[incident.incidentType]
                                          ?.icon || "❓"}
                                      </span>
                                      {INCIDENT_TYPES[incident.incidentType]
                                        ?.label || incident.incidentType}
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
                                          <p className="text-gray-600 flex items-center gap-2">
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
                                                  typeof incident.location
                                                    .lat === "number" &&
                                                  typeof incident.location
                                                    .lng === "number"
                                                ? `${incident.location.lat.toFixed(
                                                    4
                                                  )}, ${incident.location.lng.toFixed(
                                                    4
                                                  )}`
                                                : "N/A"}
                                            </div>
                                          </p>
                                        </div>
                                        <div>
                                          <h4 className="font-medium mb-2">
                                            Date
                                          </h4>
                                          <p className="text-gray-600 flex items-center gap-2">
                                            <div className="flex items-center gap-1 text-xs">
                                              <Calendar className="h-3 w-3" />
                                              {format(
                                                new Date(incident.timestamp),
                                                "MMM dd, yyyy HH:mm"
                                              )}
                                            </div>
                                          </p>
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
                                        <div className="grid grid-cols-2 gap-4">
                                          {incident.imageUrl && (
                                            <div>
                                              <div className="mt-1">
                                                <img
                                                  src={incident.imageUrl}
                                                  alt="Incident evidence"
                                                  className="max-w-full h-auto rounded-md border"
                                                />
                                              </div>
                                            </div>
                                          )}
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
                                                "Resolved"
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
                                                "Rejected"
                                              )
                                            }
                                            variant="destructive"
                                          >
                                            <XCircle className="h-4 w-4 mr-2" />
                                            Reject
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
                                  handleStatusChange(incident.id, "Resolved")
                                }
                                className="bg-green-600 hover:bg-green-700"
                                disabled={incident.status === "Resolved"}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>

                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  handleStatusChange(incident.id, "Rejected")
                                }
                                disabled={incident.status === "Rejected"}
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
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

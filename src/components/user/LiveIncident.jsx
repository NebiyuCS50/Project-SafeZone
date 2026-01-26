import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { Search, Filter, Calendar, MapPin, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { fetchAllReports } from "@/utils/user";
import { reverseGeocode } from "@/utils/reverseGeolocation";

const INCIDENT_TYPES = {
  accident: { label: "Accident", color: "destructive" },
  traffic: { label: "Traffic Issue", color: "destructive" },
  crime: { label: "Crime/Suspicious", color: "destructive" },
  fire: { label: "Fire/Hazard", color: "destructive" },
  medical: { label: "Medical Emergency", color: "destructive" },
  disaster: { label: "Natural Disaster", color: "destructive" },
  other: { label: "Other", color: "destructive" },
};
const STATUSES = {
  pending: {
    label: "Pending",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  resolved: {
    label: "Resolved",
    className: "bg-green-100 text-green-800 border-green-200",
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-100 text-red-800 border-red-200",
  },
};

// Group reports by location (rounded to 4 decimals)
function groupReportsByLocationAndType(reports) {
  const groups = {};
  reports.forEach((r) => {
    const loc = r.location || { lat: r.latitude, lng: r.longitude };
    if (typeof loc.lat !== "number" || typeof loc.lng !== "number") return;
    const key = `${loc.lat.toFixed(4)},${loc.lng.toFixed(4)}|${r.incidentType}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(r);
  });
  return groups;
}

export default function LiveIncident() {
  const [allReports, setAllReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [placeNames, setPlaceNames] = useState({});

  const itemsPerPage = 5;

  useEffect(() => {
    setLoading(true);
    fetchAllReports()
      .then((data) => {
        setAllReports(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function getPlaceName(lat, lng, locKey) {
    if (placeNames[locKey]) return placeNames[locKey];
    const name = await reverseGeocode(lat, lng);
    setPlaceNames((prev) => ({ ...prev, [locKey]: name }));
    return name;
  }

  // Group and filter reports
  const locationGroups = groupReportsByLocationAndType(allReports);
  let groupedRows = Object.entries(locationGroups).map(
    ([locTypeKey, group]) => {
      // Determine alert level for this location/type group
      let level = "none";
      if (group.length >= 3) level = "high";
      else if (group.length >= 2) level = "medium";
      else if (group.length >= 1) level = "low";
      // Use the first report for display info
      const first = group[0];
      // Split locTypeKey to get location and type
      const [locationKey, incidentType] = locTypeKey.split("|");
      return {
        locKey: locationKey,
        incidentType,
        count: group.length,
        alertLevel: level,
        status: first.status,
        timestamp: first.timestamp,
      };
    },
  );

  // Apply search and filters
  if (searchTerm) {
    groupedRows = groupedRows.filter((row) =>
      row.incidentType.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }
  if (filterType !== "all") {
    groupedRows = groupedRows.filter((row) => row.incidentType === filterType);
  }
  if (filterStatus !== "all") {
    groupedRows = groupedRows.filter((row) => row.status === filterStatus);
  }

  const totalReports = groupedRows.length;
  const totalPages = Math.max(1, Math.ceil(totalReports / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const paginatedRows = groupedRows.slice(startIdx, endIdx);

  useEffect(() => {
    paginatedRows.forEach((row) => {
      if (!placeNames[row.locKey]) {
        const [lat, lng] = row.locKey.split(",").map(Number);
        getPlaceName(lat, lng, row.locKey);
      }
    });
    // eslint-disable-next-line
  }, [paginatedRows]);

  const getPaginationItems = () => {
    const items = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) items.push(i);
    } else {
      if (safePage <= 3) {
        for (let i = 1; i <= 4; i++) items.push(i);
        items.push("ellipsis");
        items.push(totalPages);
      } else if (safePage >= totalPages - 2) {
        items.push(1);
        items.push("ellipsis");
        for (let i = totalPages - 3; i <= totalPages; i++) items.push(i);
      } else {
        items.push(1);
        items.push("ellipsis");
        for (let i = safePage - 1; i <= safePage + 1; i++) items.push(i);
        items.push("ellipsis");
        items.push(totalPages);
      }
    }
    return items;
  };

  if (loading && paginatedRows.length === 0) {
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
            Live Incident Alert
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
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
            {/* Filters */}
            <div className="flex gap-2">
              <Select
                value={filterType}
                onValueChange={(value) => {
                  setFilterType(value);
                  setCurrentPage(1);
                }}
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
                onValueChange={(value) => {
                  setFilterStatus(value);
                  setCurrentPage(1);
                }}
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
                  <TableHead>Location</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date/Time (Most Recent)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Alert Level</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchTerm ||
                        filterType !== "all" ||
                        filterStatus !== "all"
                          ? "No reports found matching your criteria"
                          : "No live incidents found"}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedRows.map((row) => (
                    <TableRow
                      key={`${row.locKey}|${row.incidentType}`}
                      className="hover:bg-muted/50"
                    >
                      <TableCell className="font-mono text-xs">
                        {placeNames[row.locKey] || row.locKey}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            INCIDENT_TYPES[row.incidentType]?.color ||
                            "secondary"
                          }
                        >
                          {INCIDENT_TYPES[row.incidentType]?.label ||
                            row.incidentType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs">
                          <Calendar className="h-3 w-3" />
                          {format(
                            new Date(row.timestamp),
                            "MMM dd, yyyy HH:mm",
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            STATUSES[row.status]?.className ||
                            "bg-gray-100 text-gray-800"
                          }
                        >
                          {STATUSES[row.status]?.label || row.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            row.alertLevel === "high"
                              ? "bg-red-100 text-red-800 border-red-200"
                              : row.alertLevel === "medium"
                                ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                                : row.alertLevel === "low"
                                  ? "bg-green-100 text-green-800 border-green-200"
                                  : "outline"
                          }
                        >
                          {row.alertLevel !== "none"
                            ? row.alertLevel.charAt(0).toUpperCase() +
                              row.alertLevel.slice(1)
                            : "None"}
                        </Badge>
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
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                        onClick={() => setCurrentPage(item)}
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
            <div className="text-center text-sm text-muted-foreground mt-1">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, totalReports)} of{" "}
              {totalReports} locations
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

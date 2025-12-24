import { useEffect, useState } from "react";
import { fetchAllReports } from "@/utils/user";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { getDistanceFromLatLonInKm } from "@/utils/geo";
import { useUserLocation } from "@/store/useUserLocation";

const INCIDENT_TYPES = {
  accident: { label: "Accident", color: "destructive" },
  traffic: { label: "Traffic Issue", color: "warning" },
  crime: { label: "Crime/Suspicious", color: "destructive" },
  fire: { label: "Fire/Hazard", color: "destructive" },
  medical: { label: "Medical Emergency", color: "destructive" },
  disaster: { label: "Natural Disaster", color: "destructive" },
  other: { label: "Other", color: "secondary" },
};

function groupReportsByLocation(reports) {
  const groups = {};
  reports.forEach((r) => {
    const loc = r.location || { lat: r.latitude, lng: r.longitude };
    if (typeof loc.lat !== "number" || typeof loc.lng !== "number") return;
    const key = `${loc.lat.toFixed(4)},${loc.lng.toFixed(4)}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(r);
  });
  return groups;
}

export function Notification({ radiusKm = 5 }) {
  const [grouped, setGrouped] = useState([]);
  const userLocation = useUserLocation();

  useEffect(() => {
    if (!userLocation) return;
    fetchAllReports().then((reports) => {
      // Filter reports within radius
      const nearby = reports.filter((r) => {
        const loc = r.location || { lat: r.latitude, lng: r.longitude };
        if (typeof loc.lat !== "number" || typeof loc.lng !== "number")
          return false;
        return (
          getDistanceFromLatLonInKm(
            userLocation.lat,
            userLocation.lng,
            loc.lat,
            loc.lng
          ) <= radiusKm
        );
      });
      const locationGroups = groupReportsByLocation(nearby);
      const rows = Object.entries(locationGroups).map(([locKey, group]) => {
        let level = "none";
        if (group.length >= 7) level = "high";
        else if (group.length >= 2) level = "medium";
        else if (group.length >= 1) level = "low";
        const first = group[0];
        return {
          locKey,
          alertLevel: level,
          incidentType: first.incidentType,
          timestamp: first.timestamp,
        };
      });
      setGrouped(rows.slice(0, 5));
    });
  }, [userLocation, radiusKm]);

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="h-5 w-5 text-yellow-500" />
        <span className="font-semibold">Nearby Area Alerts</span>
      </div>
      {!userLocation ? (
        <div className="text-muted-foreground text-sm">
          Getting your location...
        </div>
      ) : grouped.length === 0 ? (
        <div className="text-muted-foreground text-sm">No nearby alerts.</div>
      ) : (
        <ul className="space-y-3">
          {grouped.map((row) => (
            <li
              key={row.locKey}
              className="flex flex-col gap-1 border-b pb-2 last:border-b-0"
            >
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    INCIDENT_TYPES[row.incidentType]?.color || "secondary"
                  }
                >
                  {INCIDENT_TYPES[row.incidentType]?.label || row.incidentType}
                </Badge>
                <Badge
                  variant={
                    row.alertLevel === "high"
                      ? "destructive"
                      : row.alertLevel === "medium"
                      ? "warning"
                      : row.alertLevel === "low"
                      ? "secondary"
                      : "outline"
                  }
                >
                  {row.alertLevel !== "none"
                    ? row.alertLevel.charAt(0).toUpperCase() +
                      row.alertLevel.slice(1)
                    : "None"}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {row.locKey}
                <Calendar className="h-3 w-3 ml-2" />
                {format(new Date(row.timestamp), "MMM dd, yyyy HH:mm")}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

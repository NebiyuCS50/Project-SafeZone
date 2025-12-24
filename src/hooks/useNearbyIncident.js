import { useEffect, useState } from "react";
import { getDistanceFromLatLonInKm } from "@/utils/geo";
import { fetchAllReports } from "@/utils/user";

export function useNearbyIncidents(
  userLocation,
  radiusKm = 5,
  timeWindowMs = 24 * 60 * 60 * 1000
) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!userLocation) return;
    fetchAllReports().then((reports) => {
      const now = Date.now();
      const recent = reports.filter((r) => now - r.timestamp < timeWindowMs);
      const nearby = recent.filter((r) => {
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
      setCount(nearby.length);
    });
  }, [userLocation, radiusKm, timeWindowMs]);

  return count;
}

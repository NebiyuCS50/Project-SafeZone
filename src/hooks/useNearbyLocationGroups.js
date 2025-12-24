import { useEffect, useState } from "react";
import { fetchAllReports } from "@/utils/user";
import { getDistanceFromLatLonInKm } from "@/utils/geo";
import { useUserLocation } from "@/store/useUserLocation";

export function useNearbyLocationGroups(
  radiusKm = 5,
  timeWindowMs = 24 * 60 * 60 * 1000
) {
  const [count, setCount] = useState(0);
  const userLocation = useUserLocation();

  useEffect(() => {
    if (!userLocation) return;
    fetchAllReports().then((reports) => {
      const now = Date.now();
      const recent = reports.filter((r) => now - r.timestamp < timeWindowMs);
      // Filter only nearby incidents
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
      // Group by location
      const locationGroups = {};
      nearby.forEach((r) => {
        const loc = r.location || { lat: r.latitude, lng: r.longitude };
        const key = `${loc.lat.toFixed(4)},${loc.lng.toFixed(4)}`;
        locationGroups[key] = true;
      });
      setCount(Object.keys(locationGroups).length);
    });
  }, [userLocation, radiusKm, timeWindowMs]);

  return count;
}

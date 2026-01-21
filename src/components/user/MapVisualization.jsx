import React from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { useEffect, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";

const ADDIS_ABABA_CENTER = [9.03, 38.74];

/* TEMP safety datas */
const dangerZones = [
  [9.041, 38.761, 0.9],
  [9.012, 38.732, 0.85],
  [9.055, 38.721, 0.8],
];

const safeZones = [
  [9.031, 38.751, 0.4],
  [9.021, 38.741, 0.3],
];

/*Heat layer*/
function HeatLayer({ points, options }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !points.length) return;

    const layer = L.heatLayer(points, options);
    layer.addTo(map);

    return () => {
      map.removeLayer(layer);
    };
  }, [map, points, options]);

  return null;
}

/*Route layer*/
function RouteLayer({ routes, selectedRoute }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !routes.length) return;

    const toDeg = (rad) => (rad * 180) / Math.PI;
    const bearingDeg = (from, to) => {
      const [lat1, lng1] = from;
      const [lat2, lng2] = to;
      const y = Math.sin(((lng2 - lng1) * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180);
      const x =
        Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
        Math.sin((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.cos(((lng2 - lng1) * Math.PI) / 180);
      return (toDeg(Math.atan2(y, x)) + 360) % 360;
    };

    const polylines = [];
    const arrows = [];

    routes.forEach((r) => {
      const isSelected = r === selectedRoute;

      // "Glow" base for selected route (looks less like pencil)
      if (isSelected) {
        polylines.push(
          L.polyline(r.coords, {
            color: "#34d399",
            weight: 12,
            opacity: 0.25,
            lineCap: "round",
            lineJoin: "round",
            smoothFactor: 1.5,
          }).addTo(map)
        );
      }

      // Main route line
      polylines.push(
        L.polyline(r.coords, {
          color: isSelected ? "#10b981" : "#94a3b8",
          weight: isSelected ? 7 : 4,
          opacity: isSelected ? 0.95 : 0.6,
          dashArray: isSelected ? null : "6 10",
          lineCap: "round",
          lineJoin: "round",
          smoothFactor: 1.5,
        }).addTo(map)
      );

      // Arrow head at the end of the route
      const end = r.coords[r.coords.length - 1];
      const prev = r.coords[Math.max(0, r.coords.length - 2)];
      if (end && prev && (end[0] !== prev[0] || end[1] !== prev[1])) {
        const angle = bearingDeg(prev, end);
        const size = isSelected ? 18 : 14;
        const color = isSelected ? "#10b981" : "#64748b";

        const icon = L.divIcon({
          className: "",
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
          html: `
            <div style="
              width: 0;
              height: 0;
              border-left: ${size * 0.55}px solid transparent;
              border-right: ${size * 0.55}px solid transparent;
              border-bottom: ${size}px solid ${color};
              transform: rotate(${angle}deg);
              filter: drop-shadow(0 2px 4px rgba(0,0,0,0.25));
            "></div>
          `,
        });

        arrows.push(
          L.marker(end, {
            icon,
            interactive: false,
            keyboard: false,
          }).addTo(map)
        );
      }
    });

    // Prefer zooming to the selected route if available
    const selectedIndex = routes.findIndex((r) => r === selectedRoute);
    const targetRoute = selectedIndex !== -1 ? routes[selectedIndex] : routes[0];
    const targetLayer = targetRoute ? L.polyline(targetRoute.coords) : null;

    if (targetLayer) {
      map.fitBounds(targetLayer.getBounds(), {
        padding: [30, 30],
        maxZoom: 20, // zoom in more so roads & place names are clearer
      });
    }

    return () => {
      polylines.forEach((layer) => map.removeLayer(layer));
      arrows.forEach((marker) => map.removeLayer(marker));
    };
  }, [map, routes, selectedRoute]);

  return null;
}


/*Main component*/
export function MapVisualization() {
  const [from, setFrom]= useState("");
  const [to, setTo]= useState("");
  const [routes, setRoutes]= useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [loading, setLoading]= useState(false);

  /*GEOcoding (place lat/lang)   */
  async function geocode(place) {
    const encodedPlace = encodeURIComponent(place);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedPlace}`
    );
    const data = await res.json();
    if (!data.length) throw new Error("Location not found");
    return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
  }

  function scoreRoute(routeCoords){
    let dangerHits = 0;

    routeCoords.forEach(([lat, lng]) => {
      dangerZones.forEach(([dLat, dLng, intensity]) => {
        const distance = Math.sqrt(
          Math.pow(lat - dLat, 2) + Math.pow(lng - dLng, 2)
        ); 

        if (distance < 0.01){
          dangerHits += intensity;
        }
    });
   });
   return dangerHits;
  }
  
  /* Routing */
  async function findRoute() {
    try {
      if (!from.trim() || !to.trim()) {
        alert("Please enter both a start and destination.");
        return;
      }

      setLoading(true);
      setRoutes([]);
      setSelectedRoute(null);

      const start = await geocode( from + ", Addis Ababa");
      const end = await geocode(to +", Addis Ababa");

      // Ask OSRM for multiple alternatives (up to 3, which is the limit on some servers).
      // The public demo endpoint can rate-limit, so we try a fallback OSRM instance if needed.
      const query = `route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?alternatives=3&overview=full&geometries=geojson&steps=false`;
      const routingServers = [
        "https://router.project-osrm.org",
        "https://routing.openstreetmap.de/routed-car",
      ];

      let lastError = null;
      let data = null;

      for (const base of routingServers) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 15000);

          const res = await fetch(`${base}/${query}`, {
            signal: controller.signal,
            headers: {
              Accept: "application/json",
            },
          });
          clearTimeout(timeout);

          if (!res.ok) {
            const details = await res.text().catch(() => "");
            throw new Error(
              `Routing server error (${res.status}) from ${base}${details ? `: ${details}` : ""}`
            );
          }

          data = await res.json();
          if (data?.routes?.length) break;
          lastError = new Error(`No routes returned from ${base}`);
        } catch (e) {
          lastError = e;
        }
      }

      if (!data?.routes?.length) {
        throw (
          lastError ||
          new Error("Routing service unavailable. Please try again.")
        );
      }

      if (!data?.routes?.length) {
        throw new Error("No routes found for the selected locations.");
      }

      const seen = new Set();
      const processedRoutes = (data.routes || []).reduce((acc, r, index) => {
        const coords = r.geometry.coordinates.map(
          ([lng, lat]) => [lat, lng]
        );

        // Deduplicate identical geometry (OSRM can occasionally repeat)
        const signature = coords
          .map(([lat, lng]) => `${lat.toFixed(5)},${lng.toFixed(5)}`)
          .join("|");
        if (seen.has(signature)) return acc;
        seen.add(signature);

        const safetyScore = scoreRoute(coords);

        acc.push({
          id: index,
          coords,
          distance: (r.distance / 1000).toFixed(2),
          duration: Math.round(r.duration / 60),
          safetyScore,
        });
        return acc;
      }, []);

      processedRoutes.sort((a,b)=> a.safetyScore - b.safetyScore);

      setRoutes(processedRoutes);
      setSelectedRoute(processedRoutes[0] || null);
  } catch (error) {
    alert("Error finding route: " + error.message);
    console.error(error);
    } finally {
      setLoading(false);
      }
  }
  
  return (
    <div className="h-screen w-full flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/*Ctrl panel*/}
      <div className="z-10 px-4 pt-6 pb-3 flex justify-center">
        <div className="w-full max-w-5xl bg-white/90 backdrop-blur-md border border-slate-200 shadow-xl rounded-2xl px-5 py-4">
          <div className="flex items-start justify-between gap-3 flex-wrap md:flex-nowrap">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                Safe Route Finder
              </p>
              <h2 className="text-2xl font-semibold text-slate-900 mt-1">
                Navigate Addis with confidence
              </h2>
            </div>
            <span className="text-xs text-slate-500">
              Powered by OpenStreetMap & OSRM
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-center">
            <input
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              placeholder="From"
              className="border border-slate-200 rounded-lg py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
            />

            <input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="To"
              className="border border-slate-200 rounded-lg py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
            />

            <button
              onClick={findRoute}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 md:px-6 text-sm font-medium rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 transition disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {loading ? "Calculating..." : "Find Safest Route"}
            </button>
          </div>
        </div>
      </div>

      {/* Route list */}
      {routes.length > 0 && (
        <div className="px-4 pb-3 flex justify-center">
          <div className="w-full max-w-5xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-slate-800">
                Routes found ({routes.length})
              </h3>
              <span className="text-xs text-slate-500">Tap to highlight</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {routes.map((r, idx) => {
                const isSelected = r === selectedRoute;
                const safetyText =
                  typeof r.safetyScore === "number"
                    ? r.safetyScore.toFixed(2)
                    : r.safetyScore;
                return (
                  <button
                    key={r.id ?? idx}
                    onClick={() => setSelectedRoute(r)}
                    className={`w-full text-left rounded-xl border transition shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-slate-200 bg-white"
                    } p-4`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          Route {idx + 1}
                        </p>
                        <p className="text-xs text-slate-500">
                          Distance: {r.distance} km
                        </p>
                        <p className="text-xs text-slate-500">
                          Duration: {r.duration} min
                        </p>
                        <p className="text-xs text-slate-500">
                          Safety score: {safetyText}
                        </p>
                      </div>
                      {idx === 0 && (
                        <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-semibold px-2 py-0.5">
                          Safest
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Map */}
      <div className="flex-1 px-4 pb-4">
        <div className="h-full w-full rounded-2xl overflow-hidden border border-slate-200 shadow-md">
          <MapContainer
            center={ADDIS_ABABA_CENTER}
            zoom={13}
            scrollWheelZoom
            className="h-full w-full"
          >
            <TileLayer
              attribution="© OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* 🔴 Danger Zones */}
            <HeatLayer
              points={dangerZones}
              options={{
                radius: 30,
                blur: 20,
                maxZoom: 17,
              }}
            />

            {/* 🟢 Safe Zones */}
            <HeatLayer
              points={safeZones}
              options={{
                radius: 20,
                blur: 25,
                maxZoom: 17,
              }}
            />

            {/* Route Lines */}
            <RouteLayer routes={routes} selectedRoute={selectedRoute} />
          </MapContainer>
        </div>
      </div>
    </div>
  );
}

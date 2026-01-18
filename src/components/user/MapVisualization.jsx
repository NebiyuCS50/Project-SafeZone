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

    const layers = routes.map((r) =>
      L.polyline(r.coords, {
        color: 
        r === selectedRoute
        ? "green"
        : "gray",
        weight: r === selectedRoute ? 6 : 4,
        opacity: r === selectedRoute ? 1 : 0.6,
      }).addTo(map)
    );

    if (layers[0]) {
      map.fitBounds(layers[0].getBounds());
    }

  return () => layers.forEach(layer => map.removeLayer(layer));
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
      setLoading(true);
      setRoutes([]);
      setSelectedRoute(null);

      const start = await geocode( from + ", Addis Ababa");
      const end = await geocode(to +", Addis Ababa");

      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?alternatives=true&overview=full&geometries=geojson`
      );

      const data = await res.json();

      const processedRoutes = data.routes.map((r, index) =>{
      const coords = r.geometry.coordinates.map(
        ([lng, lat]) => [lat, lng]
      );

      const safetyScore = scoreRoute(coords);

      return {
        id: index,
        coords,
        distance: (r.distance / 1000).toFixed(2),
        duration: Math.round(r.duration / 60),
        safetyScore,
      }  
  });

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
    <div className="h-screen w-full flex flex-col">
      {/*Ctrl panel*/}
      <div className="bg-white shadow-lg p-4 z-10">
        <h2 className="text-xl font-semibold mb-4">
          Safe Route Finder
        </h2>

        <div className="flex gap-3 items-end">
          <input 
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          placeholder="From"
          className="flex-1 border rounded-md p-2"
          />

          <input
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="To"
          className="flex-1 border rounded-md p-2"
          />

          <button
          onClick={findRoute}
          disabled={loading}
          className="bg-black text-white py-2 px-6 rounded-md whitespace-nowrap"
          > 
          {loading ? "Calculating..." : "Find Safest Route"}
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1">
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
  );
}

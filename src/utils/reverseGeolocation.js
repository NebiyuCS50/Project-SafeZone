export async function reverseGeocode(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "SafeZoneApp/1.0" },
  });
  if (!res.ok) return null;
  const data = await res.json();
  // You can use display_name or address fields for more control
  return data.display_name || null;
}

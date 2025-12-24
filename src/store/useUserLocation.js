import { useState, useEffect } from "react";

export function useUserLocation() {
  const [location, setLocation] = useState(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setLocation(null)
    );
  }, []);

  return location;
}

// utils/createIncident.js

import { db } from "@/firebase/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export async function IncidentReporting({
  incidentType,
  description,
  location,
  file,
  user,
}) {
  if (!user) throw new Error("User must be logged in to report incident");

  const incidentData = {
    incidentType,
    description,
    location, // { lat, lng }
    imageUrl: file,
    timestamp: Date.now(),
    userId: user.uid,
    userEmail: user.email,
    createdAt: serverTimestamp(),
    status: "pending",
  };

  // 3️⃣ Save to Firestore
  const newIncidentRef = doc(db, "incidents", crypto.randomUUID());
  await setDoc(newIncidentRef, incidentData);

  return { id: newIncidentRef.id, ...incidentData };
}

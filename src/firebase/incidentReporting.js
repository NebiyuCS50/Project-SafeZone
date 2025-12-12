// utils/createIncident.js

import { db } from "@/firebase/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { uploadToImageKit } from "@/utils/uploadToImageKit";

export async function IncidentReporting({
  incidentType,
  description,
  location,
  file,
  user,
}) {
  if (!user) throw new Error("User must be logged in to report incident");

  let imageUrl = null;

  // 1️⃣ Upload image if provided
  if (file) {
    imageUrl = await uploadToImageKit(file);
  }

  // 2️⃣ Prepare incident object
  const incidentData = {
    incidentType,
    description,
    location, // { lat, lng }
    imageUrl,
    timestamp: Date.now(),
    userId: user.uid,
    userEmail: user.email,
    createdAt: serverTimestamp(),
  };

  // 3️⃣ Save to Firestore
  const newIncidentRef = doc(db, "incidents", crypto.randomUUID());
  await setDoc(newIncidentRef, incidentData);

  return { id: newIncidentRef.id, ...incidentData };
}

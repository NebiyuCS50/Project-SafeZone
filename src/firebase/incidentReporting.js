// utils/createIncident.js

import { db } from "@/firebase/firebase";
import {
  doc,
  setDoc,
  serverTimestamp,
  updateDoc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";

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

export async function updateIncidentStatus(id, status) {
  const ref = doc(db, "incidents", id);
  await updateDoc(ref, { status });
}
export async function deleteIncident(incidentId) {
  const ref = doc(db, "incidents", incidentId);
  await deleteDoc(ref);
}
export async function updateUserStatus(userEmail, isActive) {
  const ref = doc(db, "users", userEmail);
  await updateDoc(ref, { isActive });
  const snap = await getDoc(ref);
  return { email: userEmail, ...snap.data() };
}
export async function updateUserRole(userEmail, role) {
  const ref = doc(db, "users", userEmail);
  await updateDoc(ref, { role });
  const snap = await getDoc(ref);
  return { email: userEmail, ...snap.data() };
}

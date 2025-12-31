import { auth, db } from "@/firebase/firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";

export default async function fetchUserData() {
  const user = auth.currentUser;
  const userDocRef = user ? doc(db, "users", user.uid) : null;
  const UserDocSnap = (await userDocRef) ? getDoc(userDocRef) : null;
  const email =
    UserDocSnap && (await UserDocSnap).exists()
      ? (await UserDocSnap).data().email
      : null;
  const name =
    UserDocSnap && (await UserDocSnap).exists()
      ? (await UserDocSnap).data().name
      : null;
  return { email, name };
}

export async function fetchAllReports() {
  const querySnapshot = await getDocs(collection(db, "incidents"));
  const reports = [];
  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    reports.push({ id: docSnap.id, ...data }); // include all fields, including images
  });
  return reports;
}

export async function countActiveUsers() {
  const usersSnapshot = await getDocs(collection(db, "users"));
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  let activeCount = 0;

  usersSnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    let lastActiveMs = 0;
    if (data.lastActive?.toDate) {
      lastActiveMs = data.lastActive.toDate().getTime();
    } else if (typeof data.lastActive === "string") {
      lastActiveMs = new Date(data.lastActive).getTime();
    }
    if (lastActiveMs >= oneDayAgo) activeCount++;
  });

  return activeCount;
}

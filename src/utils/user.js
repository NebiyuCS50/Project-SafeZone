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

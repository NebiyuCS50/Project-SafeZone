import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

const auth = getAuth();
const provider = new GoogleAuthProvider();

export async function signInWithGoogle(role = "user") {
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  // Check if user already exists in Firestore
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    // Store new user in Firestore
    await setDoc(userRef, {
      email: user.email,
      name: user.displayName || "",
      phoneNumber: user.phoneNumber || null,
      role,
      createdAt: Date.now(),
      isActive: true,
      photoURL: user.photoURL || null,
      provider: "google",
    });
  }

  return user;
}

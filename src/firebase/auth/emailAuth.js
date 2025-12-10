import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

// SIGN UP
export async function signUp(
  name,
  email,
  password,
  role = "user",
  phoneNumber = null
) {
  console.log("Signing up user:", { name, email, role, phoneNumber });
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );
  const user = userCredential.user;
  if (name) {
    await updateProfile(user, {
      displayName: name || undefined,
    });
  }
  try {
    await setDoc(doc(db, "users", user.uid), {
      email,
      name,
      phoneNumber,
      role,
      createdAt: Date.now(),
    });
  } catch (error) {
    console.error("Error writing user document: ", error);
  }

  return user;
}

const LOGIN_TIMESTAMP_KEY = "lastLoginTimestamp";
// LOGIN
export async function login(email, password) {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );
  localStorage.setItem(LOGIN_TIMESTAMP_KEY, Date.now().toString());
  return userCredential.user;
}

// LOGOUT
export async function logout() {
  await signOut(auth);
  localStorage.removeItem(LOGIN_TIMESTAMP_KEY);
}
// Utility to check if session expired (returns true if expired)
export function isSessionExpired() {
  const loginTime = parseInt(localStorage.getItem(LOGIN_TIMESTAMP_KEY), 10);
  if (!loginTime) return false;
  const now = Date.now();
  const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
  return now - loginTime > threeDaysMs;
}

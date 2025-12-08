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
  await setDoc(doc(db, "users", user.uid), {
    email,
    name,
    phoneNumber,
    role,
    createdAt: Date.now(),
  });

  return user;
}

// LOGIN
export async function login(email, password) {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );
  return userCredential.user;
}

// LOGOUT
export async function logout() {
  await signOut(auth);
}

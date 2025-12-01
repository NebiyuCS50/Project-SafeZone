import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

// SIGN UP
export async function signUp(
  name,
  photoUrl,
  email,
  password,
  role = "user",
  phoneNumber = null
) {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );
  const user = userCredential.user;
  if (name || photoUrl) {
    await updateProfile(user, {
      displayName: name || undefined,
      photoURL: photoUrl || undefined,
    });
  }
  try {
    await sendEmailVerification(user);
  } catch (e) {
    console.warn("sendEmailVerification failed:", e);
  }
  await setDoc(doc(db, "users", user.uid), {
    email,
    name,
    photoUrl,
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

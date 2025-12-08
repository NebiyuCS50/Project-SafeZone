import { useEffect } from "react";
import { auth, db } from "@/firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useAuthStore } from "@/store/useAuthStore";

export default function AuthListener({ children }) {
  const { setUser, setRole, setLoading } = useAuthStore();

  useEffect(() => {
    // Start with loading = true
    setLoading(true);

    const unsub = auth.onAuthStateChanged(async (user) => {
      if (user) {
        // Set user immediately
        setUser(user);

        try {
          const ref = doc(db, "users", user.uid);

          // Try to fetch user data from Firestore
          const snap = await getDoc(ref);

          // If document exists, set role, otherwise default to null
          setRole(snap.exists() ? snap.data()?.role || null : null);
        } catch (err) {
          console.warn("Firestore fetch failed:", err);
          // Set a safe default role
          setRole(null);
        }
      } else {
        // User signed out
        setUser(null);
        setRole(null);
      }

      // Stop loading in all cases
      setLoading(false);
    });

    // Cleanup listener on unmount
    return () => unsub();
  }, [setUser, setRole, setLoading]);

  return children;
}

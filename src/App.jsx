import { useEffect } from "react";
import { auth, db } from "@/firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useAuthStore } from "@/store/useAuthStore";

export default function AuthListener({ children }) {
  const { setUser, setRole, setLoading } = useAuthStore();

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user);
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        setRole(snap.data().role);
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return children;
}

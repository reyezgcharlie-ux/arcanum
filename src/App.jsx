import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import Login from "./pages/Login.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import { Spinner } from "./components/UI.jsx";

export default function App() {
  const [user,    setUser]    = useState(undefined);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        // mark online
        try {
          await updateDoc(doc(db, "users", u.uid), {
            status: "online", lastSeen: serverTimestamp()
          });
        } catch (_) {}
      }
      setUser(u || null);
    });

    // mark offline on tab close
    const handleUnload = async () => {
      if (auth.currentUser) {
        try {
          await updateDoc(doc(db, "users", auth.currentUser.uid), {
            status: "offline", lastSeen: serverTimestamp()
          });
        } catch (_) {}
      }
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => { unsub(); window.removeEventListener("beforeunload", handleUnload); };
  }, []);

  if (user === undefined) return <Spinner />;
  if (!user) return <Login />;
  return <ChatPage user={user} />;
}

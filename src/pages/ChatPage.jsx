import { useState } from "react";
import Sidebar from "../components/Sidebar.jsx";
import ChatWindow from "../components/ChatWindow.jsx";
import { ArcanumLogo } from "../utils/icons.jsx";

export default function ChatPage({ user }) {
  const [active, setActive] = useState(null);

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0a0a0f", overflow: "hidden" }}>
      <Sidebar user={user} active={active} onSelect={setActive} />

      {!active ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, background: "#0a0a0f" }}>
          <ArcanumLogo size={68} />
          <div style={{ textAlign: "center", marginTop: 8 }}>
            <h2 style={{ fontFamily: "Georgia, serif", fontSize: 13, fontWeight: 400, color: "#c9a84c", letterSpacing: 6, marginBottom: 10 }}>ARCANUM</h2>
            <p style={{ fontSize: 10, color: "#2a2a38", letterSpacing: 3 }}>WHAT YOU SAY STAYS ENCRYPTED</p>
          </div>
        </div>
      ) : (
        <ChatWindow user={user} chat={active} onBack={() => setActive(null)} />
      )}
    </div>
  );
}

import { useState } from "react";

export function Photo({ src, initials, color, size }) {
  const [err, setErr] = useState(false);
  if (src && !err) return (
    <img src={src} alt={initials} onError={() => setErr(true)}
      style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0, display: "block", border: "1px solid rgba(201,168,76,0.15)" }}
    />
  );
  const initial = (initials || "?")[0].toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: (color || "#c9a84c") + "18",
      color: color || "#c9a84c",
      border: `1px solid ${color || "#c9a84c"}35`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 600, fontSize: size * 0.34, flexShrink: 0,
      letterSpacing: 0.5, fontFamily: "'DM Sans', sans-serif",
    }}>{initial}</div>
  );
}

export function IconBtn({ icon, onClick, title, gold, size = 34 }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} title={title}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        width: size, height: size, borderRadius: 6,
        background: h ? "rgba(201,168,76,0.08)" : "transparent",
        border: "none",
        color: h || gold ? "#c9a84c" : "#6b7280",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", transition: "all .15s", flexShrink: 0,
      }}
    >{icon}</button>
  );
}

export function TypingDots({ user }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, margin: "2px 0 6px" }}>
      <Photo src={user?.photoURL} initials={user?.displayName?.[0]} color="#c9a84c" size={26} />
      <div style={{ padding: "10px 16px", borderRadius: "0 10px 10px 10px", background: "#1c1c24", border: "1px solid #2a2a38", display: "flex", gap: 5, alignItems: "center" }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: "#c9a84c", opacity: 0.6, animation: `td 1.2s ease-in-out ${i * 0.2}s infinite` }} />
        ))}
      </div>
    </div>
  );
}

export function Spinner() {
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0a0a0f", gap: 20 }}>
      <div style={{ width: 40, height: 40, border: "2px solid #1a1a24", borderTopColor: "#c9a84c", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
    </div>
  );
}

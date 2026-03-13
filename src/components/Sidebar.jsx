import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, orderBy, getDocs, doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { getChatId, formatTime } from "../utils/chat.js";
import { Icons, ArcanumLogo } from "../utils/icons.jsx";
import { Photo, IconBtn } from "./UI.jsx";

export default function Sidebar({ user, active, onSelect }) {
  const [chats,   setChats]   = useState([]);
  const [results, setResults] = useState([]);
  const [search,  setSearch]  = useState("");

  useEffect(() => {
    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", user.uid),
      orderBy("lastMessageAt", "desc")
    );
    const unsub = onSnapshot(q, async snap => {
      const list = await Promise.all(snap.docs.map(async d => {
        const data = d.data();
        const otherId = data.participants.find(id => id !== user.uid);
        const snap2 = await getDoc(doc(db, "users", otherId));
        return { id: d.id, ...data, other: snap2.data() };
      }));
      setChats(list);
    });
    return unsub;
  }, [user.uid]);

  useEffect(() => {
    if (!search.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      const q = query(collection(db, "users"),
        where("handle", ">=", search.toLowerCase()),
        where("handle", "<=", search.toLowerCase() + "\uf8ff")
      );
      const snap = await getDocs(q);
      setResults(snap.docs.map(d => d.data()).filter(u => u.uid !== user.uid));
    }, 350);
    return () => clearTimeout(t);
  }, [search, user.uid]);

  const openByUser = (other) => {
    const id = getChatId(user.uid, other.uid);
    onSelect({ id, other, participants: [user.uid, other.uid] });
    setSearch("");
  };

  const list = search.trim() ? results : chats;

  return (
    <div style={{ width: 340, flexShrink: 0, background: "#0d0d12", borderRight: "1px solid #1a1a24", display: "flex", flexDirection: "column", height: "100vh" }}>

      {/* Header */}
      <div style={{ padding: "13px 16px", background: "#0a0a0f", borderBottom: "1px solid #1a1a24", display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 62 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ArcanumLogo size={28} />
          <div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 12, fontWeight: 400, letterSpacing: 5, color: "#c9a84c" }}>ARCANUM</div>
            <div style={{ fontSize: 8, color: "#2a2a38", letterSpacing: 2, marginTop: 1 }}>PRIVATE MESSAGING</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginRight: 4 }}>
            <Photo src={user.photoURL} initials={user.displayName?.[0]} color="#c9a84c" size={28} />
          </div>
          <IconBtn icon={Icons.logout} onClick={() => signOut(auth)} title="Cerrar sesión" />
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: "10px 14px", borderBottom: "1px solid #1a1a24" }}>
        <div style={{ background: "#16161e", border: "1px solid #22222e", borderRadius: 8, display: "flex", alignItems: "center", gap: 8, padding: "8px 12px" }}>
          <span style={{ color: "#3d3d50", display: "flex" }}>{Icons.search}</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar @handle o nombre"
            style={{ flex: 1, background: "none", fontSize: 13, color: "#e2e2e8", fontFamily: "'DM Sans', sans-serif", outline: "none", border: "none" }} />
          {search && <button onClick={() => setSearch("")} style={{ color: "#3d3d50", fontSize: 14, background: "none", border: "none", cursor: "pointer" }}>✕</button>}
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {!search && chats.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 20px", color: "#2a2a38" }}>
            <div style={{ fontSize: 32, marginBottom: 10, opacity: 0.4 }}>💬</div>
            <p style={{ fontSize: 12, letterSpacing: 1 }}>Busca un @handle para comenzar</p>
          </div>
        )}
        {search && results.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 20px", color: "#2a2a38", fontSize: 12, letterSpacing: 1 }}>Sin resultados</div>
        )}

        {list.map(item => {
          const other = item.other || item;
          const chatId = item.id || getChatId(user.uid, other.uid);
          const isSel = active?.id === chatId;

          return (
            <div key={chatId}
              onClick={() => item.other ? onSelect(item) : openByUser(item)}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", cursor: "pointer", background: isSel ? "rgba(201,168,76,0.05)" : "transparent", borderLeft: `2px solid ${isSel ? "#c9a84c" : "transparent"}`, borderBottom: "1px solid #13131a", transition: "all .12s" }}
            >
              <Photo src={other.photoURL} initials={other.displayName?.[0]} color="#c9a84c" size={46} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: isSel ? "#c9a84c" : "#d1d1d8" }}>{other.displayName}</span>
                  {item.lastMessageAt && <span style={{ fontSize: 10, color: "#3d3d50" }}>{formatTime(item.lastMessageAt?.toDate?.())}</span>}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: "#3d3d50", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 190 }}>
                    {search ? (other.handle || other.bio || "") : (item.lastMessage || other.handle || "")}
                  </span>
                  {item.unread > 0 && <div style={{ background: "#c9a84c", color: "#0a0a0f", borderRadius: "50%", minWidth: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{item.unread}</div>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ padding: "10px 16px", borderTop: "1px solid #1a1a24", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: "#1e1e28", fontSize: 9, letterSpacing: 2 }}>
        {Icons.lock}<span>WHAT YOU SAY STAYS ENCRYPTED</span>
      </div>
    </div>
  );
}

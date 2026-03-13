import { useState, useEffect, useRef } from "react";
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, setDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";
import { getChatId, formatTime, formatDate } from "../utils/chat.js";
import { Icons } from "../utils/icons.jsx";
import { Photo, IconBtn, TypingDots } from "./UI.jsx";

function Bubble({ msg, me }) {
  const mine = msg.senderId === me;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, margin: "2px 0", justifyContent: mine ? "flex-end" : "flex-start", animation: "appear .16s ease" }}>
      <div style={{
        maxWidth: "62%", padding: msg.type === "image" ? "5px 5px 6px" : "9px 13px 6px",
        borderRadius: mine ? "12px 2px 12px 12px" : "2px 12px 12px 12px",
        background: mine ? "#1a2218" : "#1c1c24",
        border: `1px solid ${mine ? "rgba(201,168,76,0.18)" : "rgba(255,255,255,0.05)"}`,
        boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
      }}>
        {msg.type === "image" && msg.imageUrl
          ? <img src={msg.imageUrl} alt="img" style={{ maxWidth: 220, maxHeight: 260, borderRadius: 8, display: "block", objectFit: "cover", cursor: "zoom-in" }} onClick={() => window.open(msg.imageUrl, "_blank")} />
          : <p style={{ fontSize: 13.5, lineHeight: 1.55, color: "#e2e2e8", marginBottom: 5, wordBreak: "break-word", fontWeight: 400 }}>{msg.text}</p>
        }
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 4, paddingRight: msg.type === "image" ? 4 : 0 }}>
          <span style={{ fontSize: 9.5, color: "#4b5563" }}>
            {msg.createdAt?.toDate ? formatTime(msg.createdAt.toDate()) : ""}
          </span>
          {mine && <span style={{ color: "#c9a84c", display: "flex", opacity: 0.8 }}>{Icons.checks}</span>}
        </div>
      </div>
    </div>
  );
}

export default function ChatWindow({ user, chat, onBack }) {
  const [messages,  setMessages]  = useState([]);
  const [text,      setText]      = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [imgPreview,setImgPreview]= useState(null);
  const [imgFile,   setImgFile]   = useState(null);
  const bottomRef = useRef();
  const fileRef   = useRef();
  const textRef   = useRef();
  const other     = chat.other;

  // Ensure chat doc
  useEffect(() => {
    setDoc(doc(db, "chats", chat.id), {
      participants:  [user.uid, other.uid],
      createdAt:     serverTimestamp(),
    }, { merge: true });
  }, [chat.id]);

  // Listen messages
  useEffect(() => {
    const q = query(collection(db, "chats", chat.id, "messages"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    });
    return unsub;
  }, [chat.id]);

  const sendMsg = async (content, type = "text") => {
    const msg = {
      text:       type === "text" ? content : "",
      imageUrl:   type === "image" ? content : null,
      senderId:   user.uid,
      senderName: user.displayName,
      type,
      createdAt:  serverTimestamp(),
    };
    await addDoc(collection(db, "chats", chat.id, "messages"), msg);
    await updateDoc(doc(db, "chats", chat.id), {
      lastMessage:   type === "text" ? content : "📷 Imagen",
      lastMessageAt: serverTimestamp(),
      participants:  [user.uid, other.uid],
    });
    setText("");
    setImgPreview(null);
    setImgFile(null);
    textRef.current?.focus();
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (imgFile) { await uploadSend(imgFile); return; }
    if (text.trim()) await sendMsg(text.trim());
  };

  const uploadSend = async (file) => {
    setUploading(true);
    const sRef = ref(storage, `chats/${chat.id}/${Date.now()}_${file.name}`);
    const task = uploadBytesResumable(sRef, file);
    task.on("state_changed",
      s => setProgress(Math.round(s.bytesTransferred / s.totalBytes * 100)),
      err => { console.error(err); setUploading(false); },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        await sendMsg(url, "image");
        setUploading(false); setProgress(0);
      }
    );
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImgFile(file);
    setImgPreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  // Group by date
  const grouped = messages.reduce((acc, msg) => {
    const d = msg.createdAt?.toDate?.() || new Date();
    const key = formatDate(d);
    if (!acc[key]) acc[key] = [];
    acc[key].push(msg);
    return acc;
  }, {});

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#0c0c11", backgroundImage: "radial-gradient(rgba(201,168,76,0.012) 1px, transparent 1px)", backgroundSize: "28px 28px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 18px", background: "#0a0a0f", borderBottom: "1px solid #1a1a24", minHeight: 62 }}>
        <button onClick={onBack} style={{ display: "none", color: "#6b7280", background: "none", border: "none", cursor: "pointer", padding: 4 }} className="back-btn">
          {Icons.back}
        </button>
        <Photo src={other.photoURL} initials={other.displayName?.[0]} color="#c9a84c" size={40} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: "#d1d1d8", marginBottom: 2 }}>{other.displayName}</div>
          <div style={{ fontSize: 11, color: other.status === "online" ? "#6db87a" : "#3d3d50", letterSpacing: 0.3 }}>
            {other.status === "online" ? "en línea" : (other.handle || "")}
          </div>
        </div>
        <div style={{ display: "flex", gap: 2 }}>
          <IconBtn icon={Icons.video} title="Videollamada" />
          <IconBtn icon={Icons.phone} title="Llamada" />
          <IconBtn icon={Icons.more}  title="Más" />
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 48px" }}>
        {Object.entries(grouped).map(([date, msgs]) => (
          <div key={date}>
            <div style={{ textAlign: "center", margin: "14px 0" }}>
              <span style={{ fontSize: 10, color: "#2a2a38", background: "#0f0f16", border: "1px solid #1a1a24", padding: "4px 16px", borderRadius: 20, letterSpacing: 2 }}>{date.toUpperCase()}</span>
            </div>
            {msgs.map(msg => <Bubble key={msg.id} msg={msg} me={user.uid} />)}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Image preview */}
      {imgPreview && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#0a0a0f", padding: "8px 16px", borderTop: "1px solid #1a1a24" }}>
          <img src={imgPreview} style={{ height: 48, borderRadius: 6, objectFit: "cover", border: "1px solid #2a2a38" }} />
          <span style={{ fontSize: 12, color: "#3d3d50", flex: 1 }}>{imgFile?.name}</span>
          <button onClick={() => { setImgPreview(null); setImgFile(null); }} style={{ color: "#6b7280", background: "none", border: "none", cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>
      )}

      {/* Upload progress */}
      {uploading && (
        <div style={{ height: 3, background: "#1a1a24", position: "relative" }}>
          <div style={{ height: "100%", width: `${progress}%`, background: "#c9a84c", transition: "width .2s" }} />
        </div>
      )}

      {/* Input */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, padding: "10px 16px 12px", background: "#0a0a0f", borderTop: "1px solid #1a1a24" }}>
        <input ref={fileRef} type="file" accept="image/*,video/*,.pdf" onChange={handleFile} style={{ display: "none" }} />
        <div style={{ display: "flex", gap: 2 }}>
          <IconBtn icon={Icons.smile}  title="Emoji" />
          <IconBtn icon={Icons.attach} onClick={() => fileRef.current?.click()} title="Adjuntar" />
        </div>
        <div style={{ flex: 1, background: "#16161e", border: "1px solid #22222e", borderRadius: 24, padding: "10px 16px", display: "flex", alignItems: "flex-end" }}>
          <textarea ref={textRef} value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Escribe un mensaje cifrado..."
            rows={1}
            disabled={uploading}
            style={{ flex: 1, fontSize: 14, color: "#e2e2e8", lineHeight: 1.45, maxHeight: 100, resize: "none", background: "none", outline: "none", border: "none", fontFamily: "'DM Sans', sans-serif" }}
          />
        </div>
        <button onClick={handleSend} disabled={uploading || (!text.trim() && !imgFile)}
          style={{
            width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
            background: (text.trim() || imgFile) ? "#c9a84c" : "#16161e",
            border: `1px solid ${(text.trim() || imgFile) ? "#c9a84c" : "#22222e"}`,
            color: (text.trim() || imgFile) ? "#0a0a0f" : "#3d3d50",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: (text.trim() || imgFile) ? "0 2px 16px rgba(201,168,76,0.3)" : "none",
            transition: "all .2s", cursor: "pointer",
          }}
          onMouseEnter={e => { if (text.trim() || imgFile) e.currentTarget.style.background = "#d4b05a"; }}
          onMouseLeave={e => { if (text.trim() || imgFile) e.currentTarget.style.background = "#c9a84c"; }}
          onMouseDown={e => e.currentTarget.style.transform = "scale(.93)"}
          onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
        >
          {(text.trim() || imgFile) ? Icons.send : Icons.mic}
        </button>
      </div>
    </div>
  );
}

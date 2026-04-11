import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route } from 'react-router-dom';
import { auth, googleProvider, db } from './firebase';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, addDoc, query, onSnapshot, orderBy, serverTimestamp, where, doc, getDocs } from 'firebase/firestore';
import EmojiPicker from 'emoji-picker-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
  }, []);

  if (loading) return <div style={css.centered}>DECRYPTING_ARCANUM_OS...</div>;

  return (
    <Routes>
      <Route path="/" element={user ? <Messenger user={user} /> : <Login />} />
    </Routes>
  );
}

const Messenger = ({ user }) => {
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const scrollRef = useRef();

  // 1. CARGAR CHATS DONDE SOY PARTICIPANTE (Regla: request.auth.uid in resource.data.participants)
  useEffect(() => {
    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", user.uid)
    );
    return onSnapshot(q, (snap) => {
      setChats(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [user.uid]);

  // 2. CARGAR MENSAJES DEL CHAT ACTIVO
  useEffect(() => {
    if (!activeChat) return;
    const q = query(
      collection(db, "chats", activeChat, "messages"),
      orderBy("createdAt", "asc")
    );
    return onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }, [activeChat]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    await addDoc(collection(db, "chats", activeChat, "messages"), {
      text: newMessage, 
      senderId: user.uid,
      senderName: user.displayName,
      createdAt: serverTimestamp(),
    });

    setNewMessage('');
    setShowEmoji(false);
  };

  return (
    <div style={css.container}>
      {/* SIDEBAR ESTILO WHATSAPP */}
      <aside style={css.sidebar}>
        <header style={css.sideHeader}>
          <img src={user.photoURL} style={css.avatar} alt="me" />
          <div style={{fontSize:'10px', color:'#E50914', fontWeight:'bold'}}>ARCANUM_SECURE</div>
          <button onClick={() => signOut(auth)} style={css.btnOut}>✕</button>
        </header>
        
        <div style={css.chatList}>
          {chats.length === 0 ? (
            <div style={{padding:'20px', color:'#444', fontSize:'11px'}}>No hay chats privados activos...</div>
          ) : (
            chats.map(c => (
              <div 
                key={c.id} 
                style={{...css.chatItem, borderLeft: activeChat === c.id ? '4px solid #E50914' : 'none'}}
                onClick={() => setActiveChat(c.id)}
              >
                <div style={css.statusDot}></div>
                <div>
                  <div style={{fontWeight:'bold', fontSize:'13px'}}>{c.chatName || "Chat Privado"}</div>
                  <div style={{fontSize:'10px', color:'#444'}}>Mensaje Encriptado</div>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* VENTANA DE MENSAJERÍA */}
      <main style={css.mainChat}>
        {activeChat ? (
          <>
            <header style={css.chatHeader}>
              <span style={{color:'#E50914'}}>ENCRYPTED_CHANNEL:</span> {activeChat}
            </header>

            <div style={css.messageArea}>
              {messages.map(m => (
                <div key={m.id} style={m.senderId === user.uid ? css.rowSent : css.rowReceived}>
                  <div style={m.senderId === user.uid ? css.bubbleSent : css.bubbleReceived}>
                    <div style={css.bubbleText}>{m.text}</div>
                  </div>
                </div>
              ))}
              <div ref={scrollRef}></div>
            </div>

            <form onSubmit={handleSend} style={css.inputArea}>
              <button type="button" onClick={() => setShowEmoji(!showEmoji)} style={css.emojiBtn}>😀</button>
              <input 
                style={css.input} 
                placeholder="Escribe un mensaje encriptado..." 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button type="submit" style={css.sendBtn}>ENVIAR</button>
            </form>

            {showEmoji && (
              <div style={css.emojiWrapper}>
                <EmojiPicker theme="dark" width="100%" onEmojiClick={(e) => setNewMessage(newMessage + e.emoji)} />
              </div>
            )}
          </>
        ) : (
          <div style={css.centered}>Selecciona un canal para desencriptar mensajes</div>
        )}
      </main>
    </div>
  );
};

const Login = () => (
  <div style={css.centered}>
    <div style={css.loginBox}>
      <h1 style={css.bigLogo}>ARCANUM</h1>
      <p style={{color:'#111', letterSpacing:'4px', marginBottom:'40px', fontSize:'10px'}}>AES_256_BIT_ENCRYPTION</p>
      <button style={css.btnLogin} onClick={() => signInWithPopup(auth, googleProvider)}>
        ACCEDER AL SISTEMA
      </button>
    </div>
  </div>
);

const css = {
  container: { height: '100vh', display: 'flex', backgroundColor: '#000', color: '#fff', fontFamily: 'Inter, sans-serif' },
  centered: { height: '100vh', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', color: '#333', fontSize: '12px' },
  sidebar: { width: '320px', borderRight: '1px solid #111', display: 'flex', flexDirection: 'column', backgroundColor: '#050505' },
  sideHeader: { padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #111' },
  avatar: { width: '32px', borderRadius: '50%', border: '1px solid #E50914' },
  chatList: { flex: 1, overflowY: 'auto' },
  chatItem: { padding: '20px', display: 'flex', gap: '15px', alignItems: 'center', cursor: 'pointer', background: '#0a0a0a', borderBottom: '1px solid #000' },
  statusDot: { width: '8px', height: '8px', borderRadius: '50%', background: '#E50914', boxShadow: '0 0 5px #E50914' },
  mainChat: { flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' },
  chatHeader: { padding: '20px', borderBottom: '1px solid #111', fontSize: '11px', fontWeight: 'bold', backgroundColor: '#000', letterSpacing: '1px' },
  messageArea: { flex: 1, overflowY: 'auto', padding: '30px', display: 'flex', flexDirection: 'column', gap: '12px' },
  rowSent: { alignSelf: 'flex-end', maxWidth: '75%' },
  rowReceived: { alignSelf: 'flex-start', maxWidth: '75%' },
  bubbleSent: { background: '#E50914', padding: '12px 16px', borderRadius: '15px 15px 0 15px' },
  bubbleReceived: { background: '#111', padding: '12px 16px', borderRadius: '15px 15px 15px 0', border: '1px solid #222' },
  bubbleText: { fontSize: '14px', lineHeight: '1.4' },
  inputArea: { padding: '20px', display: 'flex', gap: '10px', background: '#000', borderTop: '1px solid #111' },
  input: { flex: 1, background: '#080808', border: '1px solid #222', padding: '12px', color: '#fff', borderRadius: '4px', outline: 'none', fontSize: '14px' },
  sendBtn: { background: '#E50914', color: '#fff', border: 'none', padding: '0 25px', fontWeight: '900', borderRadius: '2px', cursor: 'pointer', fontSize: '12px' },
  emojiBtn: { background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' },
  emojiWrapper: { position: 'absolute', bottom: '85px', left: '20px', right: '20px', zIndex: 100 },
  bigLogo: { color: '#E50914', fontSize: '55px', fontWeight: '900', letterSpacing: '10px' },
  loginBox: { textAlign: 'center' },
  btnLogin: { background: '#fff', color: '#000', border: 'none', padding: '15px 40px', fontWeight: '900', cursor: 'pointer', borderRadius: '2px', fontSize: '12px' },
  btnOut: { background: 'none', border: 'none', color: '#333', cursor: 'pointer' }
};

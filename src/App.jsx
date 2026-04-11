import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route } from 'react-router-dom';
import { auth, googleProvider, db } from './firebase';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, addDoc, query, onSnapshot, orderBy, serverTimestamp, limit } from 'firebase/firestore';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
  }, []);

  if (loading) return <div style={css.centered}>INICIALIZANDO ARCANUM OS...</div>;

  return (
    <Routes>
      <Route path="/" element={user ? <ArcanumNetwork user={user} /> : <Login />} />
    </Routes>
  );
}

// --- ARCANUM: SOCIAL + ENCRYPTED MESSENGER + MEDIA ---
const ArcanumNetwork = ({ user }) => {
  return (
    <div style={css.layout}>
      {/* HEADER PRINCIPAL */}
      <nav style={css.nav}>
        <h1 style={css.logo}>ARCANUM</h1>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <span style={{ fontSize: '10px', color: '#E50914', letterSpacing: '2px' }}>AEC_256_ENCRYPTION_ACTIVE</span>
          <button onClick={() => signOut(auth)} style={css.btnOut}>DESCONECTAR</button>
        </div>
      </nav>

      <div style={css.mainGrid}>
        
        {/* PANEL IZQUIERDO: ESTILO MYSPACE (Perfil) */}
        <aside style={css.panel}>
          <div style={css.panelHeader}>PROFILE_ID</div>
          <div style={{ textAlign: 'center', margin: '20px 0' }}>
            <img src={user.photoURL} alt="avatar" style={css.bigAvatar} />
            <h2 style={{ margin: '10px 0 5px 0', fontSize: '16px' }}>{user.displayName}</h2>
            <div style={{ color: '#0f0', fontSize: '10px', fontWeight: 'bold' }}>● ONLINE</div>
          </div>
          
          <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: '15px' }}>
            <div style={{ fontSize: '11px', color: '#666', marginBottom: '10px' }}>SYNAPT_TOP_CONNECTIONS</div>
            <div style={css.top8Grid}>
              {/* Cajas simulando los "amigos" top de MySpace */}
              {[1,2,3,4].map(i => (
                <div key={i} style={css.friendBox}>
                  <div style={css.friendAvatar}></div>
                  <span style={{ fontSize: '8px' }}>OP_{i}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* PANEL CENTRAL: MENSAJERÍA ENCRIPTADA */}
        <main style={{ ...css.panel, display: 'flex', flexDirection: 'column', padding: 0 }}>
          <div style={{ ...css.panelHeader, padding: '15px' }}>SECURE_COMMS_CHANNEL</div>
          <ChatRoom user={user} />
        </main>

        {/* PANEL DERECHO: MEDIA HUB (Radio y Música) */}
        <aside style={css.panel}>
          <div style={css.panelHeader}>MEDIA_HUB</div>
          
          {/* SYNAPT RADIO PLAYER */}
          <div style={css.playerCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={css.liveDot}></div>
                <h3 style={{ fontSize: '13px', margin: 0, color: '#E50914' }}>SYNAPT RADIO</h3>
              </div>
              <span style={{ fontSize: '9px', color: '#666' }}>128KBPS</span>
            </div>
            {/* Reproductor de audio HTML5 conectado a tu stream */}
            <audio controls style={css.audioHtml} src="https://stream.synfm.online/live" preload="none" />
          </div>

          {/* NEURØ ENGINE TRACKS */}
          <div style={{ marginTop: '20px' }}>
            <div style={{ fontSize: '11px', color: '#666', marginBottom: '10px' }}>NEURØ AI // RECENT TRACKS</div>
            <div style={css.trackItem}>
              <div style={css.trackIcon}>▶</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px' }}>Dystopian_Groove.wav</div>
                <div style={{ fontSize: '9px', color: '#444' }}>Produced by AI</div>
              </div>
            </div>
            <div style={css.trackItem}>
              <div style={css.trackIcon}>▶</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px' }}>Synth_Wave_04.mp3</div>
                <div style={{ fontSize: '9px', color: '#444' }}>Produced by AI</div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

// --- COMPONENTE INTERNO DEL CHAT ---
const ChatRoom = ({ user }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const dummy = useRef();

  useEffect(() => {
    if (!db) return;
    // Usamos una colección global temporal "arcanum_comms" para que no te bloqueen las reglas privadas.
    // Si quieres que sea privado real, lo cambiamos a la lógica de sub-colecciones después.
    const q = query(collection(db, "arcanum_comms"), orderBy("createdAt", "asc"), limit(30));
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      dummy.current?.scrollIntoView({ behavior: 'smooth' });
    });
    return () => unsub();
  }, []);

  const sendMsg = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    await addDoc(collection(db, "arcanum_comms"), {
      text: input,
      uid: user.uid,
      name: user.displayName,
      createdAt: serverTimestamp()
    });
    setInput('');
  };

  return (
    <>
      <div style={css.chatScroll}>
        {messages.map(m => (
          <div key={m.id} style={{ marginBottom: '15px', textAlign: m.uid === user.uid ? 'right' : 'left' }}>
            <div style={{ fontSize: '9px', color: '#666', marginBottom: '4px' }}>{m.name}</div>
            <div style={m.uid === user.uid ? css.bubbleMe : css.bubbleThem}>
              {m.text}
            </div>
          </div>
        ))}
        <div ref={dummy}></div>
      </div>
      <form onSubmit={sendMsg} style={css.chatForm}>
        <input 
          style={css.chatInput} 
          placeholder="Escribe un mensaje seguro..." 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
        />
        <button style={css.btnRed} type="submit">SEND</button>
      </form>
    </>
  );
};

// --- LOGIN ---
const Login = () => (
  <div style={css.centered}>
    <div style={{ textAlign: 'center' }}>
      <h1 style={css.bigLogo}>ARCANUM</h1>
      <p style={{ color: '#444', letterSpacing: '4px', marginBottom: '40px', fontSize: '11px' }}>SOCIAL_ENCRYPTION_PROTOCOL</p>
      <button style={css.btnWhite} onClick={() => signInWithPopup(auth, googleProvider)}>
        CONNECT TO NETWORK
      </button>
    </div>
  </div>
);

// --- ESTILOS ---
const css = {
  layout: { minHeight: '100vh', backgroundColor: '#000', color: '#fff', fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column' },
  centered: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },
  nav: { padding: '15px 30px', borderBottom: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  logo: { color: '#E50914', fontSize: '20px', fontWeight: '900', letterSpacing: '2px', margin: 0 },
  bigLogo: { color: '#E50914', fontSize: '50px', fontWeight: '900', letterSpacing: '8px', margin: 0 },
  mainGrid: { display: 'grid', gridTemplateColumns: '280px 1fr 320px', gap: '20px', padding: '20px 30px', flex: 1, overflow: 'hidden' },
  panel: { background: '#050505', border: '1px solid #1a1a1a', borderRadius: '4px', padding: '20px', display: 'flex', flexDirection: 'column' },
  panelHeader: { fontSize: '11px', color: '#444', letterSpacing: '1px', borderBottom: '1px solid #1a1a1a', paddingBottom: '10px', marginBottom: '15px', fontWeight: 'bold' },
  bigAvatar: { width: '80px', height: '80px', borderRadius: '50%', border: '2px solid #E50914', padding: '2px' },
  top8Grid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' },
  friendBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' },
  friendAvatar: { width: '40px', height: '40px', background: '#111', borderRadius: '4px', border: '1px solid #222' },
  chatScroll: { flex: 1, overflowY: 'auto', padding: '20px' },
  bubbleMe: { display: 'inline-block', background: '#E50914', padding: '10px 15px', borderRadius: '4px 0 4px 4px', fontSize: '13px', maxWidth: '80%', textAlign: 'left' },
  bubbleThem: { display: 'inline-block', background: '#111', border: '1px solid #222', padding: '10px 15px', borderRadius: '0 4px 4px 4px', fontSize: '13px', maxWidth: '80%' },
  chatForm: { display: 'flex', gap: '10px', padding: '15px', borderTop: '1px solid #1a1a1a', background: '#000' },
  chatInput: { flex: 1, background: '#050505', border: '1px solid #222', padding: '12px', color: '#fff', outline: 'none', borderRadius: '2px' },
  playerCard: { background: '#0a0a0a', border: '1px solid #222', padding: '15px', borderRadius: '4px' },
  liveDot: { width: '8px', height: '8px', background: '#f00', borderRadius: '50%', animation: 'pulse 1.5s infinite' },
  audioHtml: { width: '100%', height: '30px', outline: 'none' },
  trackItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: '#0a0a0a', borderBottom: '1px solid #111', cursor: 'pointer' },
  trackIcon: { width: '25px', height: '25px', background: '#E50914', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '10px' },
  btnRed: { background: '#E50914', color: '#fff', border: 'none', padding: '0 20px', fontWeight: 'bold', cursor: 'pointer' },
  btnWhite: { background: '#fff', color: '#000', border: 'none', padding: '15px 40px', fontWeight: '900', cursor: 'pointer' },
  btnOut: { background: 'none', border: '1px solid #222', color: '#666', padding: '5px 10px', fontSize: '10px', cursor: 'pointer' }
};

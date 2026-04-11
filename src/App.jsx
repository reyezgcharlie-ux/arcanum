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

  if (loading) return <div style={css.centered}><div style={css.loader}></div></div>;

  return (
    <Routes>
      <Route path="/" element={user ? <SynaptNetwork user={user} /> : <Login />} />
    </Routes>
  );
}

const SynaptNetwork = ({ user }) => {
  // Estado para el reproductor de SYNFM
  const [currentStation, setCurrentStation] = useState({
    name: "SYNAPT Radio Live",
    genre: "Electronic / Hub",
    url: "https://stream.synfm.online/live"
  });

  // Directorio de prueba (Simulando la base de datos de synfm.online)
  const synfmDirectory = [
    { id: 1, name: "SYNAPT Radio Live", genre: "Electronic", url: "https://stream.synfm.online/live" },
    { id: 2, name: "Neon Synthwave", genre: "Retrowave", url: "https://icecast.omroep.nl/3fm-bb-mp3" }, // URLs de demo
    { id: 3, name: "Lofi Nights", genre: "Chill/Study", url: "https://play.streamafrica.net/lofi" },
    { id: 4, name: "Underground Techno", genre: "Dark", url: "https://live.hunter.fm/80s_high" },
    { id: 5, name: "Indie Rock Hits", genre: "Rock", url: "https://stream.synfm.online/live" }
  ];

  return (
    <div style={css.layout}>
      {/* HEADER DE SISTEMA */}
      <nav style={css.nav}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <h1 style={css.logo}>ARCANUM</h1>
          <span style={css.badgeRed}>BETA_NETWORK</span>
        </div>
        <div style={css.navRight}>
          <div style={css.audioVisualizer}>
            <span style={css.bar}></span><span style={css.bar}></span><span style={css.bar}></span>
          </div>
          <span style={{ fontSize: '11px', color: '#E50914', fontWeight: 'bold' }}>AEC-256 SECURE</span>
          <button onClick={() => signOut(auth)} style={css.btnOut}>LOGOUT</button>
        </div>
      </nav>

      <div style={css.mainGrid}>
        
        {/* PANEL IZQUIERDO: RETRO PROFILE */}
        <aside style={css.glassPanel}>
          <div style={css.panelHeader}>IDENTIDAD // REDWOOD CITY</div>
          <div style={css.profileContainer}>
            <div style={css.avatarGlow}>
              <img src={user.photoURL} alt="avatar" style={css.bigAvatar} />
            </div>
            <h2 style={css.userName}>{user.displayName}</h2>
            <div style={css.statusPill}>● ONLINE EN ARCANUM</div>
          </div>
          
          <div style={css.top8Section}>
            <div style={css.sectionTitle}>MI TOP 8 OPERADORES</div>
            <div style={css.top8Grid}>
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i} style={css.friendBox}>
                  <div style={css.friendAvatar}></div>
                  <span style={css.friendName}>OP_{i}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* PANEL CENTRAL: ENCRYPTED FEED */}
        <main style={{ ...css.glassPanel, padding: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ ...css.panelHeader, padding: '20px', borderBottom: '1px solid #222', background: 'rgba(229, 9, 20, 0.05)' }}>
            <span style={{ color: '#fff' }}>SALA GLOBAL ENCRIPTADA</span>
          </div>
          <ChatRoom user={user} />
        </main>

        {/* PANEL DERECHO: SYNFM DIRECTORY */}
        <aside style={css.glassPanel}>
          <div style={css.panelHeader}>SYNFM.ONLINE // MEDIA_HUB</div>
          
          {/* NOW PLAYING CARD */}
          <div style={css.nowPlayingCard}>
            <div style={css.nowPlayingHeader}>
              <div style={css.liveIndicator}></div>
              <span style={{ fontSize: '10px', color: '#E50914', fontWeight: '900' }}>NOW PLAYING</span>
            </div>
            <h3 style={css.stationTitle}>{currentStation.name}</h3>
            <p style={css.stationGenre}>{currentStation.genre}</p>
            <audio controls autoPlay style={css.audioPlayer} src={currentStation.url} />
          </div>

          {/* DIRECTORIO DE ESTACIONES */}
          <div style={css.directorySection}>
            <div style={css.sectionTitle}>EXPLORAR ESTACIONES (18K+ LIVE)</div>
            <div style={css.directoryList}>
              {synfmDirectory.map(station => (
                <div 
                  key={station.id} 
                  style={{
                    ...css.stationItem, 
                    borderLeft: currentStation.name === station.name ? '3px solid #E50914' : '3px solid transparent',
                    background: currentStation.name === station.name ? 'rgba(229, 9, 20, 0.1)' : '#0a0a0a'
                  }}
                  onClick={() => setCurrentStation(station)}
                >
                  <div style={css.playIcon}>{currentStation.name === station.name ? '❚❚' : '▶'}</div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff' }}>{station.name}</div>
                    <div style={{ fontSize: '9px', color: '#666' }}>{station.genre}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

// --- CHAT MODULE ---
const ChatRoom = ({ user }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const dummy = useRef();

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "arcanum_comms"), orderBy("createdAt", "asc"), limit(50));
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
          <div key={m.id} style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: m.uid === user.uid ? 'flex-end' : 'flex-start' }}>
            <div style={css.msgAuthor}>{m.name}</div>
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
          placeholder="Transmite un mensaje..." 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
        />
        <button style={css.btnSend} type="submit">ENVIAR</button>
      </form>
    </>
  );
};

// --- LOGIN MODULE ---
const Login = () => (
  <div style={css.centered}>
    <div style={css.loginBox}>
      <h1 style={css.loginLogo}>ARCANUM</h1>
      <p style={css.loginSubtitle}>SOCIAL NETWORK & MEDIA HUB</p>
      <button style={css.btnLogin} onClick={() => signInWithPopup(auth, googleProvider)}>
        INICIAR CONEXIÓN
      </button>
    </div>
  </div>
);

// --- CSS IN JS (NETFLIX-CORE STYLE) ---
const css = {
  layout: { minHeight: '100vh', backgroundColor: '#000', color: '#fff', fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column', backgroundImage: 'radial-gradient(circle at 50% 0%, #1a0000 0%, #000 50%)' },
  centered: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },
  nav: { padding: '20px 40px', borderBottom: '1px solid #111', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' },
  logo: { color: '#E50914', fontSize: '24px', fontWeight: '900', letterSpacing: '4px', margin: 0, textShadow: '0 0 15px rgba(229,9,20,0.4)' },
  badgeRed: { background: '#E50914', color: '#fff', fontSize: '9px', padding: '3px 6px', borderRadius: '2px', fontWeight: 'bold' },
  navRight: { display: 'flex', gap: '20px', alignItems: 'center' },
  mainGrid: { display: 'grid', gridTemplateColumns: '300px 1fr 350px', gap: '25px', padding: '30px 40px', flex: 1, overflow: 'hidden' },
  glassPanel: { background: '#050505', border: '1px solid #1a1a1a', borderRadius: '8px', padding: '25px', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' },
  panelHeader: { fontSize: '10px', color: '#666', letterSpacing: '2px', marginBottom: '20px', fontWeight: '900', textTransform: 'uppercase' },
  
  // Profile
  profileContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '30px' },
  avatarGlow: { padding: '3px', background: 'linear-gradient(45deg, #E50914, #000)', borderRadius: '50%', marginBottom: '15px', boxShadow: '0 0 20px rgba(229,9,20,0.2)' },
  bigAvatar: { width: '100px', height: '100px', borderRadius: '50%', border: '4px solid #000', display: 'block' },
  userName: { margin: '0 0 8px 0', fontSize: '18px', fontWeight: 'bold', letterSpacing: '1px' },
  statusPill: { background: 'rgba(0, 255, 0, 0.1)', color: '#0f0', border: '1px solid #0f0', padding: '4px 10px', borderRadius: '20px', fontSize: '9px', fontWeight: 'bold' },
  
  // Top 8
  top8Section: { flex: 1 },
  sectionTitle: { fontSize: '11px', color: '#fff', borderBottom: '1px solid #222', paddingBottom: '8px', marginBottom: '15px', fontWeight: 'bold' },
  top8Grid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' },
  friendBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' },
  friendAvatar: { width: '45px', height: '45px', background: '#111', borderRadius: '6px', border: '1px solid #333', transition: 'border-color 0.2s', ':hover': { borderColor: '#E50914' } },
  friendName: { fontSize: '9px', color: '#888' },

  // Chat
  chatScroll: { flex: 1, overflowY: 'auto', padding: '25px' },
  msgAuthor: { fontSize: '10px', color: '#666', marginBottom: '6px', fontWeight: 'bold' },
  bubbleMe: { background: 'linear-gradient(90deg, #E50914, #B80710)', padding: '12px 18px', borderRadius: '15px 15px 0 15px', fontSize: '14px', maxWidth: '85%', boxShadow: '0 4px 15px rgba(229,9,20,0.2)' },
  bubbleThem: { background: '#111', border: '1px solid #222', padding: '12px 18px', borderRadius: '0 15px 15px 15px', fontSize: '14px', maxWidth: '85%' },
  chatForm: { display: 'flex', padding: '20px', background: '#050505', borderTop: '1px solid #1a1a1a' },
  chatInput: { flex: 1, background: '#000', border: '1px solid #222', padding: '15px', color: '#fff', outline: 'none', borderRadius: '4px 0 0 4px', fontSize: '14px' },
  btnSend: { background: '#E50914', color: '#fff', border: 'none', padding: '0 25px', fontWeight: '900', cursor: 'pointer', borderRadius: '0 4px 4px 0', letterSpacing: '1px' },

  // Media Hub
  nowPlayingCard: { background: '#000', border: '1px solid #222', padding: '20px', borderRadius: '6px', marginBottom: '25px', position: 'relative', overflow: 'hidden' },
  nowPlayingHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' },
  liveIndicator: { width: '8px', height: '8px', background: '#E50914', borderRadius: '50%', boxShadow: '0 0 10px #E50914' },
  stationTitle: { margin: '0 0 5px 0', fontSize: '16px', color: '#fff' },
  stationGenre: { margin: '0 0 15px 0', fontSize: '11px', color: '#666' },
  audioPlayer: { width: '100%', height: '40px', outline: 'none' },
  directorySection: { flex: 1, display: 'flex', flexDirection: 'column' },
  directoryList: { overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '5px' },
  stationItem: { display: 'flex', alignItems: 'center', gap: '15px', padding: '12px', borderRadius: '4px', cursor: 'pointer', transition: 'background 0.2s' },
  playIcon: { width: '30px', height: '30px', background: '#111', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#E50914', border: '1px solid #222' },

  // Misc
  audioVisualizer: { display: 'flex', gap: '3px', alignItems: 'flex-end', height: '15px' },
  bar: { width: '3px', background: '#E50914', animation: 'bounce 1s infinite alternate' },
  btnOut: { background: 'transparent', color: '#666', border: '1px solid #333', padding: '8px 15px', fontSize: '10px', cursor: 'pointer', borderRadius: '2px', fontWeight: 'bold' },
  loginBox: { textAlign: 'center', background: '#050505', padding: '60px', border: '1px solid #1a1a1a', borderRadius: '8px' },
  loginLogo: { color: '#E50914', fontSize: '60px', fontWeight: '900', letterSpacing: '12px', margin: '0 0 10px 0', textShadow: '0 0 20px rgba(229,9,20,0.3)' },
  loginSubtitle: { color: '#666', letterSpacing: '4px', fontSize: '12px', marginBottom: '40px' },
  btnLogin: { background: '#fff', color: '#000', border: 'none', padding: '15px 40px', fontWeight: '900', cursor: 'pointer', fontSize: '14px', borderRadius: '2px' },
  loader: { width: '40px', height: '40px', border: '3px solid #111', borderTopColor: '#E50914', borderRadius: '50%', animation: 'spin 1s linear infinite' }
};

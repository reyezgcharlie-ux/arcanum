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

  if (loading) return <div className="loading-screen">SINCRONIZANDO NODOS...</div>;

  return (
    <>
      <ArcanumStyles />
      <Routes>
        <Route path="/" element={user ? <SynaptNetwork user={user} /> : <Login />} />
      </Routes>
    </>
  );
}

const SynaptNetwork = ({ user }) => {
  const [stations, setStations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentStation, setCurrentStation] = useState({ id: 'synapt-main', name: "SYNAPT Radio", genre: "MAIN HUB", url: "https://stream.synfm.online/live" });
  
  // Estado elevado para los mensajes y usuarios activos
  const [messages, setMessages] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);

  // Carga de API de Radio
  useEffect(() => {
    fetch('https://de1.api.radio-browser.info/json/stations/search?limit=100&order=clickcount&reverse=true&hidebroken=true')
      .then(res => res.json())
      .then(data => {
        const liveStations = data.filter(s => s.url_resolved).map(s => ({
          id: s.stationuuid,
          name: s.name.substring(0, 25).trim(),
          genre: (s.tags.split(',')[0] || "GLOBAL").toUpperCase(),
          url: s.url_resolved
        }));
        setStations([{ id: 'synapt-main', name: "SYNAPT Radio", genre: "MAIN HUB", url: "https://stream.synfm.online/live" }, ...liveStations]);
      }).catch(err => console.error("Error API:", err));
  }, []);

  // Filtro de Búsqueda
  const filteredStations = stations.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.genre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Lógica de Chat y extracción de Usuarios Activos
  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "public_feed"), orderBy("createdAt", "asc"), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMessages(msgs);
      
      // Extraer usuarios únicos para el panel izquierdo
      const uniqueUsers = [];
      const map = new Map();
      for (const msg of msgs) {
        if (!map.has(msg.uid)) {
          map.set(msg.uid, true);
          uniqueUsers.push({ uid: msg.uid, name: msg.name, photo: msg.photo || null });
        }
      }
      setActiveUsers(uniqueUsers.reverse());
    });
    return () => unsub();
  }, []);

  return (
    <div className="os-layout">
      {/* NAVBAR */}
      <nav className="top-nav">
        <div className="brand-group">
          <h1 className="brand-logo">ARCANUM</h1>
          <span className="badge">LIVE_NETWORK</span>
        </div>
        <div className="nav-controls">
          <div className="visualizer">
            <div className="bar"></div><div className="bar"></div><div className="bar"></div>
          </div>
          <span className="secure-text">AEC-256 SECURE</span>
          <button className="btn-outline" onClick={() => signOut(auth)}>DESCONECTAR</button>
        </div>
      </nav>

      <div className="main-grid">
        {/* PANEL IZQUIERDO: PERFIL Y RADAR */}
        <aside className="glass-panel profile-panel">
          <div className="panel-header">IDENTIDAD OPERATIVA</div>
          <div className="profile-info">
            <img src={user.photoURL} alt="avatar" className="main-avatar" />
            <h2 className="user-name">{user.displayName}</h2>
            <div className="status-pill">● ONLINE</div>
          </div>
          
          <div className="top8-container">
            <div className="panel-header">RADAR DE OPERADORES ({activeUsers.length})</div>
            <div className="top8-grid">
              {activeUsers.length === 0 && <span style={{fontSize:'9px', color:'#666'}}>Escaneando frecuencias...</span>}
              {activeUsers.map((u, i) => (
                <div key={i} className="top8-card">
                  <div className="top8-avatar" style={{backgroundImage: `url(${u.photo || 'https://via.placeholder.com/40/111/E50914'})`}}></div>
                  <span className="top8-name">{u.name.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* PANEL CENTRAL: FEED MULTIMEDIA */}
        <main className="glass-panel chat-panel">
          <div className="panel-header" style={{ borderBottom: '1px solid #1a1a1a', paddingBottom: '15px' }}>
            FEED GLOBAL PÚBLICO
          </div>
          <ChatRoom user={user} messages={messages} />
        </main>

        {/* PANEL DERECHO: DIRECTORIO SYNFM CON BUSCADOR */}
        <aside className="glass-panel media-panel">
          <div className="panel-header">SYNFM.ONLINE // MEDIA HUB</div>
          
          <div className="player-card">
            <div className="now-playing-badge">
              <div className="live-dot"></div>
              <span>TRANSMITIENDO</span>
            </div>
            <h3 className="station-name">{currentStation.name}</h3>
            <p className="station-genre">{currentStation.genre}</p>
            <audio controls autoPlay className="audio-player" src={currentStation.url} />
          </div>

          <div style={{padding: '0 20px 10px 20px'}}>
            <input 
              className="search-input" 
              placeholder="Buscar señal o género..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="directory-list custom-scroll">
            {filteredStations.map((station, index) => (
              <div 
                key={station.id + index} 
                className={`station-item ${currentStation.url === station.url ? 'active-station' : ''}`}
                onClick={() => setCurrentStation(station)}
              >
                <div className="play-btn">{currentStation.url === station.url ? '||' : '▶'}</div>
                <div className="station-info">
                  <div className="station-title">{station.name || "Unknown Station"}</div>
                  <div className="station-sub">{station.genre}</div>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
};

// --- CHAT CON SOPORTE MULTIMEDIA ---
const ChatRoom = ({ user, messages }) => {
  const [input, setInput] = useState('');
  const dummy = useRef();

  useEffect(() => {
    dummy.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMsg = async (e, forceText = null) => {
    if (e) e.preventDefault();
    const textToSend = forceText || input;
    if (!textToSend.trim()) return;
    
    try {
      await addDoc(collection(db, "public_feed"), {
        text: textToSend,
        uid: user.uid,
        name: user.displayName,
        photo: user.photoURL,
        createdAt: serverTimestamp()
      });
      setInput('');
    } catch (error) {
      console.error(error);
    }
  };

  const handleSendImage = () => {
    const url = prompt("Pega el enlace de la imagen (URL):");
    if (url) sendMsg(null, url);
  };

  // Detector de imágenes para renderizarlas en el chat
  const renderContent = (text) => {
    const isImage = text.match(/\.(jpeg|jpg|gif|png|webp)(\?.*)?$/i) != null;
    if (isImage) {
      return <img src={text} alt="media compartida" className="chat-image" />;
    }
    return text;
  };

  return (
    <div className="chat-wrapper">
      <div className="chat-feed custom-scroll">
        {messages.length === 0 && <div style={{textAlign:'center', color:'#444', fontSize:'11px'}}>Sin transmisiones...</div>}
        {messages.map(m => (
          <div key={m.id} className={`message-row ${m.uid === user.uid ? 'me' : 'them'}`}>
            <div className="msg-author">{m.name}</div>
            <div className="msg-bubble">{renderContent(m.text)}</div>
          </div>
        ))}
        <div ref={dummy}></div>
      </div>
      <form onSubmit={(e) => sendMsg(e)} className="chat-input-area">
        <button type="button" onClick={handleSendImage} className="btn-media" title="Enviar Foto">📷</button>
        <input 
          className="chat-input" 
          placeholder="Transmite mensaje o URL de imagen..." 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
        />
        <button className="btn-send" type="submit">ENVIAR</button>
      </form>
    </div>
  );
};

const Login = () => (
  <div className="login-screen">
    <div className="login-card">
      <h1 className="login-logo">ARCANUM</h1>
      <p className="login-sub">SYNAPT_NETWORK_GATEWAY</p>
      <button className="btn-login" onClick={() => signInWithPopup(auth, googleProvider)}>
        INICIAR SESIÓN DE RED
      </button>
    </div>
  </div>
);

// CSS MEJORADO
const ArcanumStyles = () => (
  <style>{`
    :root {
      --bg-color: #000000;
      --panel-bg: #070707;
      --border-color: #1a1a1a;
      --accent-red: #E50914;
      --text-main: #ffffff;
      --text-muted: #666666;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body { background-color: var(--bg-color); color: var(--text-main); font-family: 'Inter', system-ui, sans-serif; overflow: hidden; background-image: radial-gradient(circle at top, #110000 0%, #000 60%); }

    .loading-screen, .login-screen { height: 100vh; display: flex; align-items: center; justify-content: center; }

    .login-card { text-align: center; background: var(--panel-bg); padding: 60px; border: 1px solid var(--border-color); border-radius: 4px; box-shadow: 0 0 40px rgba(229,9,20,0.1); }
    .login-logo { font-size: 50px; font-weight: 900; color: var(--accent-red); letter-spacing: 10px; margin-bottom: 10px; text-shadow: 0 0 15px rgba(229,9,20,0.4); }
    .login-sub { color: var(--text-muted); letter-spacing: 4px; font-size: 11px; margin-bottom: 40px; }
    .btn-login { background: var(--text-main); color: var(--bg-color); border: none; padding: 15px 40px; font-weight: 900; cursor: pointer; border-radius: 2px; }

    .os-layout { height: 100vh; display: flex; flex-direction: column; }
    .top-nav { padding: 15px 30px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.8); backdrop-filter: blur(10px); }
    .brand-group { display: flex; align-items: center; gap: 15px; }
    .brand-logo { color: var(--accent-red); font-size: 24px; font-weight: 900; letter-spacing: 2px; }
    .badge { background: var(--accent-red); color: #fff; font-size: 9px; padding: 4px 8px; font-weight: bold; border-radius: 2px; }
    
    .nav-controls { display: flex; align-items: center; gap: 20px; }
    .secure-text { font-size: 10px; color: var(--text-muted); font-weight: bold; letter-spacing: 1px; }
    .btn-outline { background: transparent; border: 1px solid var(--border-color); color: var(--text-muted); padding: 6px 12px; cursor: pointer; font-size: 10px; }

    .main-grid { display: grid; grid-template-columns: 300px 1fr 340px; gap: 20px; padding: 20px 30px; flex: 1; overflow: hidden; }
    .glass-panel { background: rgba(7,7,7,0.8); border: 1px solid var(--border-color); border-radius: 6px; display: flex; flex-direction: column; overflow: hidden; backdrop-filter: blur(10px); }
    .panel-header { font-size: 10px; font-weight: bold; color: var(--text-muted); letter-spacing: 2px; padding: 20px; text-transform: uppercase; }

    .profile-info { display: flex; flex-direction: column; align-items: center; padding: 0 20px 20px 20px; border-bottom: 1px solid var(--border-color); }
    .main-avatar { width: 90px; height: 90px; border-radius: 50%; border: 2px solid var(--accent-red); padding: 3px; margin-bottom: 15px; background: #000; object-fit: cover; }
    .user-name { font-size: 16px; font-weight: 900; margin-bottom: 8px; letter-spacing: 1px; text-align: center; }
    .status-pill { border: 1px solid #0f0; color: #0f0; background: rgba(0,255,0,0.05); font-size: 9px; padding: 4px 12px; border-radius: 20px; font-weight: bold; }

    .top8-container { flex: 1; display: flex; flex-direction: column; overflow-y: auto; }
    .top8-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; padding: 0 20px 20px 20px; }
    .top8-card { display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; }
    .top8-avatar { width: 50px; height: 50px; background-color: #111; background-size: cover; background-position: center; border: 1px solid #333; border-radius: 4px; transition: 0.2s; }
    .top8-card:hover .top8-avatar { border-color: var(--accent-red); box-shadow: 0 0 10px rgba(229,9,20,0.3); }
    .top8-name { font-size: 9px; color: var(--text-muted); font-family: monospace; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }

    .chat-wrapper { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
    .chat-feed { flex: 1; padding: 20px; overflow-y: auto; }
    .message-row { display: flex; flex-direction: column; margin-bottom: 20px; }
    .message-row.me { align-items: flex-end; }
    .message-row.them { align-items: flex-start; }
    .msg-author { font-size: 9px; color: var(--text-muted); margin-bottom: 6px; font-weight: bold; text-transform: uppercase; }
    .msg-bubble { padding: 12px 18px; font-size: 13px; line-height: 1.5; max-width: 85%; word-wrap: break-word; }
    .me .msg-bubble { background: linear-gradient(135deg, #E50914, #B80710); color: #fff; border-radius: 12px 12px 0 12px; box-shadow: 0 5px 15px rgba(229,9,20,0.2); }
    .them .msg-bubble { background: #111; border: 1px solid var(--border-color); color: #fff; border-radius: 0 12px 12px 12px; }
    .chat-image { max-width: 100%; border-radius: 4px; border: 1px solid #333; margin-top: 5px; }

    .chat-input-area { display: flex; background: #000; border-top: 1px solid var(--border-color); padding: 15px; gap: 5px; }
    .btn-media { background: #111; border: 1px solid #333; color: #fff; padding: 0 15px; border-radius: 2px 0 0 2px; cursor: pointer; transition: 0.2s; }
    .btn-media:hover { background: #222; }
    .chat-input { flex: 1; background: #050505; border: 1px solid #222; border-left: none; color: #fff; padding: 12px 15px; outline: none; font-size: 13px; }
    .btn-send { background: var(--accent-red); color: #fff; border: none; padding: 0 25px; font-weight: 900; cursor: pointer; border-radius: 0 2px 2px 0; font-size: 12px; }

    .media-panel { padding-bottom: 0; }
    .player-card { background: #000; border: 1px solid var(--border-color); margin: 0 20px 15px 20px; padding: 20px; border-radius: 4px; box-shadow: inset 0 0 20px rgba(0,0,0,0.5); }
    .now-playing-badge { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; color: var(--accent-red); font-size: 9px; font-weight: 900; letter-spacing: 1px; }
    .live-dot { width: 6px; height: 6px; background: var(--accent-red); border-radius: 50%; animation: pulse 1.5s infinite; }
    .station-name { font-size: 14px; margin-bottom: 4px; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .station-genre { font-size: 10px; color: var(--text-muted); margin-bottom: 15px; }
    .audio-player { width: 100%; height: 35px; outline: none; }

    .search-input { width: 100%; background: #000; border: 1px solid #222; padding: 10px; color: #fff; border-radius: 4px; font-size: 11px; outline: none; }
    .search-input:focus { border-color: var(--accent-red); }

    .directory-list { flex: 1; overflow-y: auto; padding: 0 20px 20px 20px; display: flex; flex-direction: column; gap: 8px; }
    .station-item { display: flex; align-items: center; gap: 12px; padding: 10px; background: transparent; border: 1px solid transparent; border-radius: 4px; cursor: pointer; transition: 0.2s; }
    .station-item:hover { background: #111; border-color: #222; }
    .active-station { border-left: 3px solid var(--accent-red); background: #0a0a0a; border-color: #1a1a1a; }
    .play-btn { width: 28px; height: 28px; background: #111; display: flex; justify-content: center; align-items: center; border-radius: 50%; font-size: 9px; color: #fff; border: 1px solid #333; }
    .active-station .play-btn { color: var(--accent-red); border-color: var(--accent-red); background: #220000; }
    .station-title { font-size: 11px; font-weight: bold; margin-bottom: 2px; }
    .station-sub { font-size: 9px; color: var(--text-muted); }

    .custom-scroll::-webkit-scrollbar { width: 4px; }
    .custom-scroll::-webkit-scrollbar-track { background: transparent; }
    .custom-scroll::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
    .custom-scroll::-webkit-scrollbar-thumb:hover { background: var(--accent-red); }

    .visualizer { display: flex; gap: 3px; align-items: flex-end; height: 12px; }
    .bar { width: 3px; background: var(--accent-red); animation: bounce 0.8s infinite alternate; }
    .bar:nth-child(2) { animation-delay: 0.2s; }
    .bar:nth-child(3) { animation-delay: 0.4s; }

    @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(229,9,20,0.4); } 70% { box-shadow: 0 0 0 4px rgba(229,9,20,0); } 100% { box-shadow: 0 0 0 0 rgba(229,9,20,0); } }
    @keyframes bounce { 0% { height: 30%; } 100% { height: 100%; } }
  `}</style>
);

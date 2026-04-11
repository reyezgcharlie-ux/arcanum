import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route } from 'react-router-dom';
import { auth, googleProvider, db } from './firebase';
import { 
  signInWithPopup, 
  onAuthStateChanged, 
  signOut, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile 
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  query, 
  onSnapshot, 
  orderBy, 
  serverTimestamp, 
  limit, 
  doc, 
  setDoc 
} from 'firebase/firestore';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => { 
      setUser(u); 
      setLoading(false); 
    });
  }, []);

  if (loading) return <div className="loading-screen">ENCRIPTANDO CONEXIÓN...</div>;

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
  const [currentStation, setCurrentStation] = useState({ id: 'synapt', name: "SYNAPT Radio", genre: "HUB", url: "https://stream.synfm.online/live" });
  
  const [messages, setMessages] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  
  const [activeTab, setActiveTab] = useState('CHAT'); 
  const [activeView, setActiveView] = useState('GLOBAL'); 
  const [privateTarget, setPrivateTarget] = useState(null);
  
  const [syncedMovie, setSyncedMovie] = useState(null);
  const [adminMovieUrl, setAdminMovieUrl] = useState('');
  const [localHideMovie, setLocalHideMovie] = useState(false);

  // CONTROL MAESTRO: Solo tú tienes acceso a las funciones de ElFilme
  const isAdmin = user.email === 'reyezgcharlie@gmail.com';

  // CARGA DE RADIO 100% EN ESPAÑOL
  useEffect(() => {
    // Filtramos por idioma "spanish" y aumentamos el límite a 200 estaciones
    fetch('https://de1.api.radio-browser.info/json/stations/search?language=spanish&limit=200&order=clickcount&reverse=true&hidebroken=true')
      .then(res => res.json())
      .then(data => {
        const liveStations = data.filter(s => s.url_resolved).map(s => ({
          id: s.stationuuid, 
          name: s.name.substring(0, 25), 
          genre: (s.tags.split(',')[0] || "GLOBAL").toUpperCase(), 
          url: s.url_resolved
        }));
        setStations([{ id: 'synapt', name: "SYNAPT Radio Live", genre: "MAIN HUB", url: "https://stream.synfm.online/live" }, ...liveStations]);
      }).catch(err => console.error(err));
  }, []);

  const filteredStations = stations.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.genre.toLowerCase().includes(searchQuery.toLowerCase()));

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "public_feed"), orderBy("createdAt", "asc"), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMessages(msgs);
      const uniqueUsers = []; const map = new Map();
      for (const msg of msgs) {
        if (!map.has(msg.uid) && msg.uid !== user.uid) {
          map.set(msg.uid, true);
          uniqueUsers.push({ uid: msg.uid, name: msg.name, photo: msg.photo });
        }
      }
      setActiveUsers(uniqueUsers.reverse());
    });
    return () => unsub();
  }, [user.uid]);

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(doc(db, "system", "elfilme_sync"), (docSnap) => {
      if (docSnap.exists()) {
        const movieData = docSnap.data();
        if (movieData.isPlaying) {
          setSyncedMovie(movieData);
          setLocalHideMovie(false);
        } else {
          setSyncedMovie(null);
        }
      }
    });
    return () => unsub();
  }, []);

  const handleLaunchMovie = async () => {
    if (!isAdmin || !adminMovieUrl.trim()) return;
    await setDoc(doc(db, "system", "elfilme_sync"), {
      url: adminMovieUrl,
      isPlaying: true,
      startedAt: serverTimestamp(),
      adminId: user.uid
    });
    setAdminMovieUrl('');
  };

  const stopMovieGlobal = async () => {
    if (!isAdmin) return;
    await setDoc(doc(db, "system", "elfilme_sync"), { isPlaying: false });
  };

  const openPrivateChat = (targetUser) => {
    setPrivateTarget(targetUser);
    setActiveView('PRIVATE');
    setActiveTab('CHAT'); 
  };

  const isIframe = syncedMovie?.url.includes('vidsrc') || syncedMovie?.url.includes('youtube') || syncedMovie?.url.includes('embed');

  return (
    <div className="os-layout">
      <nav className="top-nav">
        <div className="brand-group">
          <h1 className="brand-logo">ARCANUM</h1>
          <span className="badge">ADMIN_OS</span>
        </div>
        <div className="nav-controls">
          <button className="btn-outline" onClick={() => signOut(auth)}>SALIR</button>
        </div>
      </nav>

      <div className="main-container">
        
        <aside className={`glass-panel side-panel ${activeTab === 'RADAR' ? 'mobile-active' : 'mobile-hidden'}`}>
          <div className="panel-header">OPERADOR: {user.displayName}</div>
          <div className="profile-info">
            <img src={user.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.email}`} alt="avatar" className="main-avatar" />
            <div className="status-pill">● ONLINE</div>
          </div>
          
          <div className="top8-container custom-scroll">
            <div className="panel-header">RADAR DE OPERADORES ({activeUsers.length})</div>
            <div className="top8-grid">
              {activeUsers.map((u, i) => (
                <div key={i} className="top8-card" onClick={() => openPrivateChat(u)}>
                  <div className="top8-avatar" style={{backgroundImage: `url(${u.photo || `https://api.dicebear.com/7.x/identicon/svg?seed=${u.uid}`})`}}>
                    <div className="online-dot-mini"></div>
                  </div>
                  <span className="top8-name">{u.name?.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <main className={`glass-panel chat-panel ${activeTab === 'CHAT' ? 'mobile-active' : 'mobile-hidden'}`}>
          <div className="center-header">
            {activeView === 'GLOBAL' ? <span>FEED GLOBAL SYNAPT</span> : <span style={{color:'#E50914'}}>DM: {privateTarget?.name}</span>}
            {activeView === 'PRIVATE' && <button className="btn-micro" onClick={() => setActiveView('GLOBAL')}>VOLVER</button>}
          </div>

          {isAdmin && activeView === 'GLOBAL' && (
            <div className="admin-cinema-bar">
              <input 
                className="cinema-input" 
                placeholder="URL vidsrc o .mp4..." 
                value={adminMovieUrl} 
                onChange={(e) => setAdminMovieUrl(e.target.value)} 
              />
              <button className="btn-cinema-launch" onClick={handleLaunchMovie}>TRANSMITIR</button>
              {syncedMovie?.isPlaying && <button className="btn-cinema-stop" onClick={stopMovieGlobal}>OFF</button>}
            </div>
          )}

          {syncedMovie?.isPlaying && !localHideMovie && (
            <div className="cinema-viewport">
              <div className="cinema-header">
                <span style={{color:'#E50914', fontSize:'10px', fontWeight:'bold'}}>● TRANSMISIÓN ELFILME</span>
                <button className="btn-micro" onClick={() => setLocalHideMovie(true)}>OCULTAR</button>
              </div>
              <div className="player-wrapper">
                {isIframe ? (
                  <iframe src={syncedMovie.url} className="video-element" allowFullScreen frameBorder="0"></iframe>
                ) : (
                  <video src={syncedMovie.url} controls autoPlay className="video-element"></video>
                )}
              </div>
            </div>
          )}
          
          {syncedMovie?.isPlaying && localHideMovie && (
            <div className="cinema-hidden-notice">
              <span>Cine en vivo (Oculto)</span>
              <button className="btn-micro" onClick={() => setLocalHideMovie(false)}>VER</button>
            </div>
          )}

          <div className="dynamic-area">
            {activeView === 'GLOBAL' ? <ChatRoom user={user} messages={messages} isPrivate={false} /> : <ChatRoom user={user} targetUser={privateTarget} isPrivate={true} />}
          </div>
        </main>

        <aside className={`glass-panel side-panel ${activeTab === 'RADIO' ? 'mobile-active' : 'mobile-hidden'}`}>
          <div className="panel-header">SYNFM.ONLINE</div>
          <div className="player-card">
            <h3 className="station-name">{currentStation.name}</h3>
            <audio controls autoPlay className="audio-player" src={currentStation.url} />
          </div>
          <div style={{padding: '0 15px 10px 15px'}}>
            <input className="search-input" placeholder="Buscar radio en español..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className="directory-list custom-scroll">
            {filteredStations.map((station, index) => (
              <div key={station.id + index} className={`station-item ${currentStation.url === station.url ? 'active-station' : ''}`} onClick={() => setCurrentStation(station)}>
                <div className="play-btn">{currentStation.url === station.url ? '||' : '▶'}</div>
                <div className="station-info">
                  <div className="station-title">{station.name}</div>
                  <div className="station-sub">{station.genre}</div>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <div className="mobile-nav">
        <button className={`nav-tab ${activeTab === 'RADAR' ? 'active-tab' : ''}`} onClick={() => setActiveTab('RADAR')}>👤 RADAR</button>
        <button className={`nav-tab ${activeTab === 'CHAT' ? 'active-tab' : ''}`} onClick={() => setActiveTab('CHAT')}>💬 CHAT</button>
        <button className={`nav-tab ${activeTab === 'RADIO' ? 'active-tab' : ''}`} onClick={() => setActiveTab('RADIO')}>📻 RADIO</button>
      </div>
    </div>
  );
};

const ChatRoom = ({ user, messages: globalMessages, targetUser, isPrivate }) => {
  const [input, setInput] = useState('');
  const [privateMessages, setPrivateMessages] = useState([]);
  const dummy = useRef();
  const chatId = isPrivate ? [user.uid, targetUser.uid].sort().join('_') : 'public_feed';

  useEffect(() => {
    if (!isPrivate || !db) return;
    const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "asc"), limit(50));
    const unsub = onSnapshot(q, (snap) => setPrivateMessages(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, [chatId, isPrivate]);

  const displayMessages = isPrivate ? privateMessages : globalMessages;
  useEffect(() => { dummy.current?.scrollIntoView({ behavior: 'smooth' }); }, [displayMessages]);

  const sendMsg = async (e, forceText = null) => {
    if (e) e.preventDefault();
    const textToSend = forceText || input;
    if (!textToSend.trim()) return;
    try {
      const msgData = { text: textToSend, uid: user.uid, name: user.displayName || "OP", photo: user.photoURL, createdAt: serverTimestamp() };
      if (isPrivate) {
        await addDoc(collection(db, "chats", chatId, "messages"), msgData);
        await setDoc(doc(db, "chats", chatId), { participants: [user.uid, targetUser.uid] }, { merge: true });
      } else {
        await addDoc(collection(db, "public_feed"), msgData);
      }
      setInput('');
    } catch (error) { console.error(error); }
  };

  const handleSendImage = () => {
    const url = prompt("Enlace de imagen:");
    if (url) sendMsg(null, url);
  };

  return (
    <div className="chat-wrapper">
      <div className="chat-feed custom-scroll">
        {displayMessages?.map(m => (
          <div key={m.id} className={`message-row ${m.uid === user.uid ? 'me' : 'them'}`}>
            <div className="msg-author">{m.name}</div>
            <div className="msg-bubble">
              {m.text.match(/\.(jpeg|jpg|gif|png|webp)(\?.*)?$/i) ? <img src={m.text} alt="media" className="chat-image" /> : m.text}
            </div>
          </div>
        ))}
        <div ref={dummy}></div>
      </div>
      <form onSubmit={(e) => sendMsg(e)} className="chat-input-area">
        <button type="button" onClick={handleSendImage} className="btn-media">📷</button>
        <input className="chat-input" placeholder="Mensaje..." value={input} onChange={(e) => setInput(e.target.value)} />
        <button className="btn-send" type="submit">►</button>
      </form>
    </div>
  );
};

const Login = () => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleEmailAuth = async (e) => {
    e.preventDefault(); setError('');
    try {
      if (isLoginView) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCred.user, { displayName: username, photoURL: `https://api.dicebear.com/7.x/identicon/svg?seed=${email}` });
        window.location.reload();
      }
    } catch (err) { setError("ERROR DE ACCESO"); }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <h1 className="login-logo">ARCANUM</h1>
        <form onSubmit={handleEmailAuth} className="email-auth-form">
          {!isLoginView && <input type="text" placeholder="Nombre" className="auth-input" value={username} onChange={e => setUsername(e.target.value)} required />}
          <input type="email" placeholder="Email" className="auth-input" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Clave" className="auth-input" value={password} onChange={e => setPassword(e.target.value)} required />
          {error && <div className="auth-error">{error}</div>}
          <button type="submit" className="btn-auth-submit">{isLoginView ? 'ENTRAR' : 'REGISTRAR'}</button>
        </form>
        <div className="auth-divider"><span>O</span></div>
        <button className="btn-login-google" onClick={() => signInWithPopup(auth, googleProvider)}>GOOGLE LOGIN</button>
        <div className="auth-toggle"><span onClick={() => setIsLoginView(!isLoginView)}>{isLoginView ? 'Crear cuenta' : 'Ya tengo cuenta'}</span></div>
      </div>
    </div>
  );
};

const ArcanumStyles = () => (
  <style>{`
    :root { --bg-color: #000; --panel-bg: #070707; --border-color: #1a1a1a; --accent-red: #E50914; --text-main: #fff; --text-muted: #666; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background-color: var(--bg-color); color: var(--text-main); font-family: 'Inter', sans-serif; overflow: hidden; }

    .loading-screen, .login-screen { height: 100vh; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle at top, #110000 0%, #000 60%); }
    .login-card { text-align: center; background: var(--panel-bg); padding: 40px; border: 1px solid var(--border-color); width: 100%; max-width: 380px; }
    .login-logo { font-size: 32px; font-weight: 900; color: var(--accent-red); letter-spacing: 5px; margin-bottom: 30px; }
    .email-auth-form { display: flex; flex-direction: column; gap: 10px; }
    .auth-input { background: #000; border: 1px solid var(--border-color); color: #fff; padding: 12px; outline: none; }
    .btn-auth-submit { background: var(--accent-red); color: #fff; border: none; padding: 12px; font-weight: bold; cursor: pointer; }
    .btn-login-google { background: #fff; color: #000; border: none; padding: 12px; font-weight: bold; width: 100%; cursor: pointer; }
    .auth-divider { display: flex; align-items: center; margin: 15px 0; color: var(--text-muted); font-size: 10px; }
    .auth-divider::before, .auth-divider::after { content: ''; flex: 1; border-bottom: 1px solid var(--border-color); }
    .auth-toggle { margin-top: 15px; font-size: 11px; color: var(--text-muted); cursor: pointer; text-decoration: underline; }

    .os-layout { height: 100vh; display: flex; flex-direction: column; }
    .top-nav { padding: 10px 20px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; background: #000; }
    .brand-logo { color: var(--accent-red); font-size: 18px; font-weight: 900; letter-spacing: 2px; }
    .badge { background: var(--accent-red); color: #fff; font-size: 8px; padding: 2px 5px; border-radius: 2px; margin-left: 10px; }
    .btn-outline { background: transparent; border: 1px solid var(--border-color); color: var(--text-muted); padding: 5px 10px; font-size: 10px; cursor: pointer; }

    .main-container { flex: 1; display: flex; flex-direction: column; overflow: hidden; position: relative; }
    .glass-panel { background: var(--panel-bg); display: flex; flex-direction: column; flex: 1; }
    .mobile-hidden { display: none !important; }
    .mobile-active { display: flex !important; }
    .panel-header { font-size: 9px; font-weight: bold; color: var(--text-muted); padding: 15px; border-bottom: 1px solid var(--border-color); text-transform: uppercase; letter-spacing: 1px; }

    .admin-cinema-bar { display: flex; background: #110000; border-bottom: 1px solid var(--accent-red); padding: 8px; gap: 5px; }
    .cinema-input { flex: 1; background: #000; border: 1px solid var(--accent-red); color: #fff; padding: 8px; font-size: 11px; outline: none; }
    .btn-cinema-launch { background: var(--accent-red); color: #fff; border: none; padding: 0 10px; font-weight: bold; font-size: 10px; cursor: pointer; }
    .btn-cinema-stop { background: #000; color: var(--accent-red); border: 1px solid var(--accent-red); padding: 0 10px; font-size: 10px; cursor: pointer; }

    .cinema-viewport { display: flex; flex-direction: column; background: #000; }
    .cinema-header { display: flex; justify-content: space-between; padding: 5px 15px; align-items: center; background: #0a0a0a; border-bottom: 1px solid #222; }
    .player-wrapper { position: relative; width: 100%; padding-top: 56.25%; }
    .video-element { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
    .cinema-hidden-notice { padding: 10px; text-align: center; background: #111; font-size: 10px; color: var(--text-muted); display: flex; justify-content: center; gap: 10px; align-items: center; }
    .btn-micro { background: transparent; border: 1px solid #333; color: #aaa; font-size: 9px; padding: 4px 8px; cursor: pointer; border-radius: 2px; }

    .chat-wrapper { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
    .chat-feed { flex: 1; padding: 15px; overflow-y: auto; }
    .message-row { display: flex; flex-direction: column; margin-bottom: 15px; }
    .message-row.me { align-items: flex-end; }
    .msg-author { font-size: 8px; color: var(--text-muted); margin-bottom: 3px; font-weight: bold; }
    .msg-bubble { padding: 10px 14px; font-size: 14px; line-height: 1.4; max-width: 85%; }
    .me .msg-bubble { background: var(--accent-red); color: #fff; border-radius: 10px 10px 0 10px; }
    .them .msg-bubble { background: #111; border: 1px solid var(--border-color); border-radius: 0 10px 10px 10px; }
    .chat-image { max-width: 100%; border-radius: 4px; margin-top: 5px; }

    .chat-input-area { display: flex; background: #000; border-top: 1px solid var(--border-color); padding: 10px; gap: 5px; }
    .chat-input { flex: 1; background: #050505; border: 1px solid #222; color: #fff; padding: 10px; outline: none; }
    .btn-send { background: var(--accent-red); color: #fff; border: none; padding: 0 15px; cursor: pointer; }

    .mobile-nav { display: flex; background: #000; border-top: 1px solid #222; height: 55px; }
    .nav-tab { flex: 1; background: transparent; border: none; color: #444; font-size: 10px; font-weight: bold; cursor: pointer; }
    .active-tab { color: var(--accent-red); border-top: 2px solid var(--accent-red); background: #050505; }

    .top8-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; padding: 15px; }
    .top8-card { display: flex; flex-direction: column; align-items: center; gap: 5px; cursor: pointer; }
    .top8-avatar { width: 42px; height: 42px; background-size: cover; border-radius: 50%; border: 1px solid #222; position: relative; }
    .online-dot-mini { position: absolute; bottom: 0; right: 0; width: 8px; height: 8px; background: #0f0; border-radius: 50%; border: 1.5px solid #000; }
    .top8-name { font-size: 8px; color: var(--text-muted); }

    .player-card { background: #000; border: 1px solid var(--border-color); margin: 15px; padding: 15px; }
    .station-name { font-size: 13px; font-weight: bold; margin-bottom: 10px; }
    .audio-player { width: 100%; height: 30px; }
    .directory-list { flex: 1; overflow-y: auto; padding: 0 15px; display: flex; flex-direction: column; gap: 5px; }
    .station-item { display: flex; align-items: center; gap: 10px; padding: 8px; background: #050505; border-radius: 3px; cursor: pointer; }
    .active-station { border-left: 2px solid var(--accent-red); }
    .station-title { font-size: 10px; font-weight: bold; }

    @media (min-width: 900px) {
      .mobile-nav { display: none; }
      .main-container { display: grid; grid-template-columns: 260px 1fr 300px; gap: 15px; padding: 15px; }
      .mobile-hidden { display: flex !important; }
      .glass-panel { border-radius: 5px; border: 1px solid var(--border-color); }
    }
  `}</style>
);

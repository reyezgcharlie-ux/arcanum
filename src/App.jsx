import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route } from 'react-router-dom';
import { auth, googleProvider, db } from './firebase';
import { signInWithPopup, onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { collection, addDoc, query, onSnapshot, orderBy, serverTimestamp, limit, doc, setDoc } from 'firebase/firestore';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
  }, []);

  if (loading) return <div className="loading-screen">INICIALIZANDO SISTEMA...</div>;

  return (
    <>
      <ArcanumStyles />
      <Routes>
        <Route path="/" element={user ? <SynaptNetwork user={user} /> : <Login />} />
      </Routes>
    </>
  );
}

// --- MAIN OS INTERFACE (MOBILE FIRST) ---
const SynaptNetwork = ({ user }) => {
  const [stations, setStations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentStation, setCurrentStation] = useState({ id: 'synapt', name: "SYNAPT Radio", genre: "HUB", url: "https://stream.synfm.online/live" });
  
  const [messages, setMessages] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  
  // Estados de navegación e interfaz
  const [activeTab, setActiveTab] = useState('CHAT'); // Mobile tabs: 'RADAR', 'CHAT', 'RADIO'
  const [activeView, setActiveView] = useState('GLOBAL'); // 'GLOBAL', 'PRIVATE'
  const [privateTarget, setPrivateTarget] = useState(null);
  
  // Estados del Cine (ElFilme Sync)
  const [syncedMovie, setSyncedMovie] = useState(null);
  const [adminMovieUrl, setAdminMovieUrl] = useState('');
  const [localHideMovie, setLocalHideMovie] = useState(false); // Para que el usuario oculte la película localmente

  const isAdmin = true; // Aquí puedes poner: user.uid === 'TU_UID_AQUI'

  // Cargar API de Radio
  useEffect(() => {
    fetch('https://de1.api.radio-browser.info/json/stations/search?limit=60&order=clickcount&reverse=true&hidebroken=true')
      .then(res => res.json())
      .then(data => {
        const liveStations = data.filter(s => s.url_resolved).map(s => ({
          id: s.stationuuid, name: s.name.substring(0, 25), genre: (s.tags.split(',')[0] || "GLOBAL").toUpperCase(), url: s.url_resolved
        }));
        setStations([{ id: 'synapt', name: "SYNAPT Radio Live", genre: "MAIN HUB", url: "https://stream.synfm.online/live" }, ...liveStations]);
      }).catch(err => console.error(err));
  }, []);

  const filteredStations = stations.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.genre.toLowerCase().includes(searchQuery.toLowerCase()));

  // Escuchar Feed y Usuarios
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

  // Escuchar EVENTOS DE CINE (ElFilme Sync)
  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(doc(db, "system", "elfilme_sync"), (docSnap) => {
      if (docSnap.exists()) {
        const movieData = docSnap.data();
        if (movieData.isPlaying) {
          setSyncedMovie(movieData);
          setLocalHideMovie(false); // Mostrar si hay nueva peli
        } else {
          setSyncedMovie(null);
        }
      }
    });
    return () => unsub();
  }, []);

  // Función Admin: Lanzar URL (Soporta vidsrc embed o mp4)
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
    setActiveTab('CHAT'); // Cambiar a la pestaña chat en mobile
  };

  // Función para determinar si el link es Iframe (vidsrc) o Video nativo (mp4)
  const isIframe = syncedMovie?.url.includes('vidsrc') || syncedMovie?.url.includes('youtube') || syncedMovie?.url.includes('embed');

  return (
    <div className="os-layout">
      {/* NAVBAR TOP */}
      <nav className="top-nav">
        <div className="brand-group">
          <h1 className="brand-logo">ARCANUM</h1>
        </div>
        <div className="nav-controls">
          <span className="secure-text desktop-only">AEC-256 SECURE</span>
          <button className="btn-outline" onClick={() => signOut(auth)}>SALIR</button>
        </div>
      </nav>

      {/* CONTENEDOR PRINCIPAL */}
      <div className="main-container">
        
        {/* PANEL IZQUIERDO: RADAR (Oculto en móvil a menos que sea la pestaña activa) */}
        <aside className={`glass-panel side-panel ${activeTab === 'RADAR' ? 'mobile-active' : 'mobile-hidden'}`}>
          <div className="panel-header">IDENTIDAD OPERATIVA</div>
          <div className="profile-info">
            <img src={user.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.email}`} alt="avatar" className="main-avatar" />
            <h2 className="user-name">{user.displayName}</h2>
            <div className="status-pill">● ONLINE</div>
          </div>
          
          <div className="top8-container custom-scroll">
            <div className="panel-header">RADAR ({activeUsers.length})</div>
            <div className="top8-grid">
              {activeUsers.length === 0 && <span style={{fontSize:'10px', color:'#666'}}>Buscando...</span>}
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

        {/* PANEL CENTRAL: CHAT Y CINE */}
        <main className={`glass-panel chat-panel ${activeTab === 'CHAT' ? 'mobile-active' : 'mobile-hidden'}`}>
          
          {/* HEADER DEL CANAL */}
          <div className="center-header">
            {activeView === 'GLOBAL' && <span>FEED GLOBAL</span>}
            {activeView === 'PRIVATE' && (
              <div style={{display:'flex', justifyContent:'space-between', width:'100%'}}>
                <span style={{color:'#E50914'}}>DM: {privateTarget?.name.toUpperCase()}</span>
                <button className="btn-micro" onClick={() => setActiveView('GLOBAL')}>VOLVER</button>
              </div>
            )}
          </div>

          {/* ADMIN CINEMA CONTROL (Solo visible para Admin) */}
          {isAdmin && activeView === 'GLOBAL' && (
            <div className="admin-cinema-bar">
              <input 
                className="cinema-input" 
                placeholder="Pega URL vidsrc o .mp4 para transmitir a todos..." 
                value={adminMovieUrl} 
                onChange={(e) => setAdminMovieUrl(e.target.value)} 
              />
              <button className="btn-cinema-launch" onClick={handleLaunchMovie}>TRANSMITIR</button>
              {syncedMovie?.isPlaying && <button className="btn-cinema-stop" onClick={stopMovieGlobal}>DETENER</button>}
            </div>
          )}

          {/* ELFILME.COM PLAYER (Split Screen Visual) */}
          {syncedMovie?.isPlaying && !localHideMovie && (
            <div className="cinema-viewport">
              <div className="cinema-header">
                <span style={{color:'#E50914', fontSize:'10px', fontWeight:'bold'}}>● ELFILME EN VIVO</span>
                <button className="btn-micro" onClick={() => setLocalHideMovie(true)}>OCULTAR VISUAL</button>
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
          
          {/* AVISO SI EL CINE ESTÁ OCULTO LOCALMENTE */}
          {syncedMovie?.isPlaying && localHideMovie && (
            <div className="cinema-hidden-notice">
              <span>Cine en reproducción oculta.</span>
              <button className="btn-micro" onClick={() => setLocalHideMovie(false)}>RESTAURAR VISUAL</button>
            </div>
          )}

          {/* CHAT ÁREA */}
          <div className="dynamic-area">
            {activeView === 'GLOBAL' && <ChatRoom user={user} messages={messages} isPrivate={false} />}
            {activeView === 'PRIVATE' && <ChatRoom user={user} targetUser={privateTarget} isPrivate={true} />}
          </div>
        </main>

        {/* PANEL DERECHO: RADIO (Oculto en móvil a menos que sea la pestaña activa) */}
        <aside className={`glass-panel side-panel ${activeTab === 'RADIO' ? 'mobile-active' : 'mobile-hidden'}`}>
          <div className="panel-header">SYNFM.ONLINE</div>
          <div className="player-card">
            <div className="now-playing-badge"><div className="live-dot"></div><span>TRANSMITIENDO</span></div>
            <h3 className="station-name">{currentStation.name}</h3>
            <p className="station-genre">{currentStation.genre}</p>
            <audio controls autoPlay className="audio-player" src={currentStation.url} />
          </div>
          <div style={{padding: '0 15px 10px 15px'}}>
            <input className="search-input" placeholder="Buscar señal..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className="directory-list custom-scroll">
            {filteredStations.map((station, index) => (
              <div key={station.id + index} className={`station-item ${currentStation.url === station.url ? 'active-station' : ''}`} onClick={() => setCurrentStation(station)}>
                <div className="play-btn">{currentStation.url === station.url ? '||' : '▶'}</div>
                <div className="station-info">
                  <div className="station-title">{station.name || "Unknown"}</div>
                  <div className="station-sub">{station.genre}</div>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {/* MOBILE BOTTOM NAVIGATION (Solo visible en pantallas pequeñas) */}
      <div className="mobile-nav">
        <button className={`nav-tab ${activeTab === 'RADAR' ? 'active-tab' : ''}`} onClick={() => setActiveTab('RADAR')}>
          👤 RADAR
        </button>
        <button className={`nav-tab ${activeTab === 'CHAT' ? 'active-tab' : ''}`} onClick={() => setActiveTab('CHAT')}>
          💬 FEED
        </button>
        <button className={`nav-tab ${activeTab === 'RADIO' ? 'active-tab' : ''}`} onClick={() => setActiveTab('RADIO')}>
          📻 SYNFM
        </button>
      </div>
    </div>
  );
};

// --- CHAT MODULE ---
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
    const url = prompt("Pega URL de la imagen:");
    if (url) sendMsg(null, url);
  };

  const renderContent = (text) => {
    if (text.match(/\.(jpeg|jpg|gif|png|webp)(\?.*)?$/i)) return <img src={text} alt="media" className="chat-image" />;
    return text;
  };

  return (
    <div className="chat-wrapper">
      <div className="chat-feed custom-scroll">
        {displayMessages?.length === 0 && <div style={{textAlign:'center', color:'#444', fontSize:'11px', marginTop:'20px'}}>Canal seguro. Inicia transmisión.</div>}
        {displayMessages?.map(m => (
          <div key={m.id} className={`message-row ${m.uid === user.uid ? 'me' : 'them'}`}>
            <div className="msg-author">{m.name}</div>
            <div className="msg-bubble">{renderContent(m.text)}</div>
          </div>
        ))}
        <div ref={dummy}></div>
      </div>
      <form onSubmit={(e) => sendMsg(e)} className="chat-input-area">
        <button type="button" onClick={handleSendImage} className="btn-media">📷</button>
        <input className="chat-input" placeholder={isPrivate ? `DM a ${targetUser.name}...` : "Escribe al global..."} value={input} onChange={(e) => setInput(e.target.value)} />
        <button className="btn-send" type="submit">►</button>
      </form>
    </div>
  );
};

// --- LOGIN MODULE ---
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
        if (!username.trim()) { setError("Se requiere Nombre."); return; }
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCred.user, { displayName: username, photoURL: `https://api.dicebear.com/7.x/identicon/svg?seed=${email}` });
        window.location.reload();
      }
    } catch (err) { setError("ACCESO DENEGADO."); }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <h1 className="login-logo">ARCANUM</h1>
        <p className="login-sub">SYNAPT_NETWORK</p>
        <form onSubmit={handleEmailAuth} className="email-auth-form">
          {!isLoginView && <input type="text" placeholder="Nombre Operador" className="auth-input" value={username} onChange={e => setUsername(e.target.value)} required />}
          <input type="email" placeholder="Correo" className="auth-input" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Clave" className="auth-input" value={password} onChange={e => setPassword(e.target.value)} required />
          {error && <div className="auth-error">{error}</div>}
          <button type="submit" className="btn-auth-submit">{isLoginView ? 'INICIAR SESIÓN' : 'REGISTRAR'}</button>
        </form>
        <div className="auth-divider"><span>O</span></div>
        <button className="btn-login-google" onClick={() => signInWithPopup(auth, googleProvider)}>GOOGLE LOGIN</button>
        <div className="auth-toggle"><span onClick={() => setIsLoginView(!isLoginView)}>{isLoginView ? 'Crear cuenta' : 'Ya tengo cuenta'}</span></div>
      </div>
    </div>
  );
};

// --- ESTILOS RESPONSIVE (MOBILE-FIRST) ---
const ArcanumStyles = () => (
  <style>{`
    :root { --bg-color: #000; --panel-bg: #070707; --border-color: #1a1a1a; --accent-red: #E50914; --text-main: #fff; --text-muted: #666; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background-color: var(--bg-color); color: var(--text-main); font-family: 'Inter', system-ui, sans-serif; overflow: hidden; }

    /* Commons */
    .btn-micro { background: transparent; border: 1px solid #333; color: #aaa; font-size: 9px; padding: 4px 8px; cursor: pointer; border-radius: 2px; }
    .btn-micro:hover { background: #222; color: #fff; }
    .custom-scroll::-webkit-scrollbar { width: 3px; }
    .custom-scroll::-webkit-scrollbar-thumb { background: #333; border-radius: 5px; }

    /* Login */
    .loading-screen, .login-screen { height: 100vh; display: flex; align-items: center; justify-content: center; background-image: radial-gradient(circle at top, #110000 0%, #000 60%); padding: 20px;}
    .login-card { text-align: center; background: var(--panel-bg); padding: 40px 30px; border: 1px solid var(--border-color); border-radius: 4px; width: 100%; max-width: 400px; }
    .login-logo { font-size: 35px; font-weight: 900; color: var(--accent-red); letter-spacing: 5px; margin-bottom: 5px; }
    .login-sub { color: var(--text-muted); font-size: 10px; margin-bottom: 30px; }
    .email-auth-form { display: flex; flex-direction: column; gap: 10px; }
    .auth-input { background: #000; border: 1px solid var(--border-color); color: #fff; padding: 12px; outline: none; font-size: 14px; }
    .btn-auth-submit, .btn-login-google { padding: 12px; font-weight: bold; cursor: pointer; border: none; font-size: 13px; }
    .btn-auth-submit { background: var(--accent-red); color: #fff; }
    .btn-login-google { background: #fff; color: #000; }
    .auth-divider { display: flex; align-items: center; margin: 15px 0; color: var(--text-muted); font-size: 10px; }
    .auth-divider::before, .auth-divider::after { content: ''; flex: 1; border-bottom: 1px solid var(--border-color); }
    .auth-error { color: var(--accent-red); font-size: 11px; margin-bottom: 5px; }
    .auth-toggle { margin-top: 15px; font-size: 11px; color: var(--text-muted); text-decoration: underline; cursor: pointer;}

    /* Main OS Layout (Mobile Default) */
    .os-layout { height: 100vh; display: flex; flex-direction: column; }
    .top-nav { padding: 10px 15px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; background: #000; z-index: 10; }
    .brand-logo { color: var(--accent-red); font-size: 18px; font-weight: 900; letter-spacing: 2px; }
    .nav-controls { display: flex; align-items: center; gap: 10px; }
    .desktop-only { display: none; }
    .btn-outline { background: transparent; border: 1px solid var(--border-color); color: var(--text-muted); padding: 5px 10px; font-size: 10px; }

    /* Contenedor Flex Mobile */
    .main-container { flex: 1; display: flex; flex-direction: column; overflow: hidden; position: relative; background: #000;}
    
    .glass-panel { background: var(--panel-bg); display: flex; flex-direction: column; overflow: hidden; flex: 1;}
    .mobile-hidden { display: none !important; }
    .mobile-active { display: flex !important; width: 100%; height: 100%; }

    .panel-header { font-size: 10px; font-weight: bold; color: var(--text-muted); padding: 15px; border-bottom: 1px solid var(--border-color); }

    /* Admin Cinema Bar */
    .admin-cinema-bar { display: flex; background: #110000; border-bottom: 1px solid var(--accent-red); padding: 10px; gap: 5px;}
    .cinema-input { flex: 1; background: #000; border: 1px solid var(--accent-red); color: #fff; padding: 8px; font-size: 11px; outline: none; }
    .btn-cinema-launch { background: var(--accent-red); color: #fff; border: none; padding: 0 10px; font-weight: bold; font-size: 10px; }
    .btn-cinema-stop { background: transparent; border: 1px solid var(--accent-red); color: var(--accent-red); padding: 0 10px; font-size: 10px; }

    /* Cinema Viewport (Split screen) */
    .cinema-viewport { display: flex; flex-direction: column; border-bottom: 1px solid #333; background: #000; }
    .cinema-header { display: flex; justify-content: space-between; padding: 8px 15px; align-items: center; background: #0a0a0a; }
    .player-wrapper { position: relative; width: 100%; padding-top: 56.25%; /* Aspect Ratio 16:9 */ }
    .video-element { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: #000; }
    .cinema-hidden-notice { padding: 10px; text-align: center; background: #111; border-bottom: 1px solid #333; font-size: 11px; color: var(--text-muted); display: flex; justify-content: center; gap: 15px; align-items: center;}

    /* Dinámica Chat */
    .dynamic-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
    .center-header { font-size: 10px; font-weight: bold; color: var(--text-muted); padding: 10px 15px; border-bottom: 1px solid var(--border-color); display: flex; align-items: center; background: #050505; }
    
    .chat-wrapper { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
    .chat-feed { flex: 1; padding: 15px; overflow-y: auto; display: flex; flex-direction: column; }
    .message-row { display: flex; flex-direction: column; margin-bottom: 15px; }
    .message-row.me { align-items: flex-end; }
    .message-row.them { align-items: flex-start; }
    .msg-author { font-size: 9px; color: var(--text-muted); margin-bottom: 4px; font-weight: bold; }
    .msg-bubble { padding: 10px 14px; font-size: 14px; line-height: 1.4; max-width: 90%; word-wrap: break-word; }
    .me .msg-bubble { background: var(--accent-red); color: #fff; border-radius: 12px 12px 0 12px; }
    .them .msg-bubble { background: #111; border: 1px solid var(--border-color); color: #fff; border-radius: 0 12px 12px 12px; }
    .chat-image { max-width: 100%; border-radius: 4px; border: 1px solid #333; margin-top: 5px; }

    .chat-input-area { display: flex; background: #000; border-top: 1px solid var(--border-color); padding: 10px; gap: 5px; }
    .btn-media { background: #111; border: 1px solid #333; color: #fff; padding: 0 15px; border-radius: 4px; }
    .chat-input { flex: 1; background: #050505; border: 1px solid #222; color: #fff; padding: 10px; outline: none; font-size: 14px; border-radius: 4px;}
    .btn-send { background: var(--accent-red); color: #fff; border: none; padding: 0 20px; font-weight: 900; border-radius: 4px; font-size: 14px; }

    /* Tabs Móviles Bottom Nav */
    .mobile-nav { display: flex; background: #000; border-top: 1px solid #222; height: 60px; z-index: 10; }
    .nav-tab { flex: 1; background: transparent; border: none; color: #666; font-size: 11px; font-weight: bold; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; }
    .active-tab { color: var(--accent-red); border-top: 2px solid var(--accent-red); background: #0a0a0a; }

    /* Perfil & Radar */
    .profile-info { display: flex; flex-direction: column; align-items: center; padding: 15px; border-bottom: 1px solid var(--border-color); }
    .main-avatar { width: 70px; height: 70px; border-radius: 50%; border: 2px solid var(--accent-red); padding: 2px; margin-bottom: 10px; }
    .user-name { font-size: 14px; font-weight: bold; margin-bottom: 5px; }
    .status-pill { border: 1px solid #0f0; color: #0f0; background: rgba(0,255,0,0.05); font-size: 9px; padding: 2px 10px; border-radius: 20px; }
    .top8-container { flex: 1; overflow-y: auto; }
    .top8-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; padding: 15px; }
    .top8-card { display: flex; flex-direction: column; align-items: center; gap: 5px; }
    .top8-avatar { width: 45px; height: 45px; background-color: #111; background-size: cover; background-position: center; border-radius: 50%; position: relative; }
    .online-dot-mini { position: absolute; bottom: 0; right: 0; width: 10px; height: 10px; background: #0f0; border-radius: 50%; border: 2px solid #000; }
    .top8-name { font-size: 9px; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%;}

    /* Radio Media Panel */
    .player-card { background: #000; border: 1px solid var(--border-color); margin: 15px; padding: 15px; border-radius: 4px; }
    .now-playing-badge { display: flex; align-items: center; gap: 5px; margin-bottom: 8px; color: var(--accent-red); font-size: 9px; font-weight: bold; }
    .live-dot { width: 6px; height: 6px; background: var(--accent-red); border-radius: 50%; animation: pulse 1.5s infinite; }
    .station-name { font-size: 14px; margin-bottom: 4px; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .station-genre { font-size: 10px; color: var(--text-muted); margin-bottom: 10px; }
    .audio-player { width: 100%; height: 35px; }
    .search-input { width: 100%; background: #000; border: 1px solid #222; padding: 10px; color: #fff; border-radius: 4px; font-size: 12px; outline: none; }
    .directory-list { flex: 1; overflow-y: auto; padding: 0 15px 15px 15px; display: flex; flex-direction: column; gap: 8px; }
    .station-item { display: flex; align-items: center; gap: 10px; padding: 10px; background: #050505; border: 1px solid #111; border-radius: 4px; }
    .active-station { border-left: 3px solid var(--accent-red); background: #0a0a0a; }
    .play-btn { width: 25px; height: 25px; background: #111; display: flex; justify-content: center; align-items: center; border-radius: 50%; font-size: 9px; color: #fff; }
    .active-station .play-btn { color: var(--accent-red); background: #220000; }
    .station-title { font-size: 11px; font-weight: bold; }
    .station-sub { font-size: 9px; color: var(--text-muted); }

    /* DESKTOP OVERRIDES */
    @media (min-width: 900px) {
      .mobile-nav { display: none; }
      .desktop-only { display: block; }
      .main-container { display: grid; grid-template-columns: 280px 1fr 320px; gap: 20px; padding: 20px; background: transparent; }
      .glass-panel { border-radius: 8px; border: 1px solid var(--border-color); }
      .mobile-hidden { display: flex !important; }
      .side-panel { width: auto; height: auto; }
      .top8-grid { grid-template-columns: repeat(3, 1fr); }
    }
  `}</style>
);

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

// --- MAIN OS INTERFACE ---
const SynaptNetwork = ({ user }) => {
  const [stations, setStations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentStation, setCurrentStation] = useState({ id: 'synapt-main', name: "SYNAPT Radio", genre: "MAIN HUB", url: "https://stream.synfm.online/live" });
  
  const [messages, setMessages] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  
  // NUEVOS ESTADOS: Navegación y Sync de Cine
  const [activeView, setActiveView] = useState('GLOBAL'); // 'GLOBAL', 'PRIVATE', 'CINEMA'
  const [privateTarget, setPrivateTarget] = useState(null);
  const [syncedMovie, setSyncedMovie] = useState(null);

  // PRIVILEGIOS DE ADMIN (Cambia esto a tu lógica, por ahora está activo para que lo pruebes)
  const isAdmin = true; 

  // Catálogo de prueba de ElFilme.com
  const elFilmeCatalog = [
    { id: 'm1', title: "CYBER_HEIST", img: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=200&h=300&fit=crop", vid: "https://www.w3schools.com/html/mov_bbb.mp4" },
    { id: 'm2', title: "NEON_NIGHTS", img: "https://images.unsplash.com/photo-1573453051140-189ce9d25519?w=200&h=300&fit=crop", vid: "https://www.w3schools.com/html/mov_bbb.mp4" },
    { id: 'm3', title: "VOID_WALKER", img: "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=200&h=300&fit=crop", vid: "https://www.w3schools.com/html/mov_bbb.mp4" },
    { id: 'm4', title: "SYNAPT_DOC", img: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200&h=300&fit=crop", vid: "https://www.w3schools.com/html/mov_bbb.mp4" }
  ];

  // Cargar API de Radio Mundial
  useEffect(() => {
    fetch('https://de1.api.radio-browser.info/json/stations/search?limit=100&order=clickcount&reverse=true&hidebroken=true')
      .then(res => res.json())
      .then(data => {
        const liveStations = data.filter(s => s.url_resolved).map(s => ({
          id: s.stationuuid, name: s.name.substring(0, 25).trim(), genre: (s.tags.split(',')[0] || "GLOBAL").toUpperCase(), url: s.url_resolved
        }));
        setStations([{ id: 'synapt-main', name: "SYNAPT Radio Live", genre: "MAIN HUB", url: "https://stream.synfm.online/live" }, ...liveStations]);
      }).catch(err => console.error(err));
  }, []);

  const filteredStations = stations.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.genre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Escuchar Feed Global y extraer usuarios activos
  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "public_feed"), orderBy("createdAt", "asc"), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMessages(msgs);
      
      const uniqueUsers = [];
      const map = new Map();
      for (const msg of msgs) {
        if (!map.has(msg.uid) && msg.uid !== user.uid) { // No incluirte a ti mismo en el radar
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
          setActiveView('CINEMA'); // Fuerza a todos a ver la película
        } else {
          setActiveView('GLOBAL'); // Devuelve a todos al chat
          setSyncedMovie(null);
        }
      }
    });
    return () => unsub();
  }, []);

  // Función Admin: Lanzar Película para todos
  const playMovieGlobal = async (movie) => {
    if (!isAdmin) return;
    await setDoc(doc(db, "system", "elfilme_sync"), {
      ...movie,
      isPlaying: true,
      startedAt: serverTimestamp(),
      adminId: user.uid
    });
  };

  const stopMovieGlobal = async () => {
    if (!isAdmin) return;
    await setDoc(doc(db, "system", "elfilme_sync"), { isPlaying: false });
  };

  const openPrivateChat = (targetUser) => {
    setPrivateTarget(targetUser);
    setActiveView('PRIVATE');
  };

  return (
    <div className="os-layout">
      <nav className="top-nav">
        <div className="brand-group">
          <h1 className="brand-logo">ARCANUM</h1>
          <span className="badge">LIVE_NETWORK</span>
        </div>
        <div className="nav-controls">
          <div className="visualizer"><div className="bar"></div><div className="bar"></div><div className="bar"></div></div>
          <span className="secure-text">AEC-256 SECURE</span>
          <button className="btn-outline" onClick={() => signOut(auth)}>DESCONECTAR</button>
        </div>
      </nav>

      <div className="main-grid">
        {/* PANEL IZQUIERDO: PERFIL Y RADAR */}
        <aside className="glass-panel profile-panel">
          <div className="panel-header">IDENTIDAD OPERATIVA</div>
          <div className="profile-info">
            <img src={user.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.email}`} alt="avatar" className="main-avatar" />
            <h2 className="user-name">{user.displayName}</h2>
            <div className="status-pill">● ONLINE</div>
          </div>
          
          <div className="top8-container custom-scroll">
            <div className="panel-header">RADAR ({activeUsers.length}) - CLICK PARA DM</div>
            <div className="top8-grid">
              {activeUsers.length === 0 && <span style={{fontSize:'9px', color:'#666'}}>Buscando...</span>}
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

        {/* PANEL CENTRAL: FEED / PRIVATE CHAT / ELFILME SYNC */}
        <main className="glass-panel chat-panel">
          {/* HEADER DEL PANEL CENTRAL */}
          <div className="center-header">
            {activeView === 'GLOBAL' && <span>FEED GLOBAL PÚBLICO</span>}
            {activeView === 'PRIVATE' && (
              <div style={{display:'flex', justifyContent:'space-between', width:'100%'}}>
                <span style={{color:'#E50914'}}>ENCRYPTED P2P: {privateTarget?.name.toUpperCase()}</span>
                <button className="btn-micro" onClick={() => setActiveView('GLOBAL')}>VOLVER AL FEED</button>
              </div>
            )}
            {activeView === 'CINEMA' && <span style={{color:'#0f0'}}>ELFILME.COM // EMISIÓN SINCRONIZADA</span>}
          </div>

          {/* CARRUSEL ELFILME (Solo visible en Feed Global) */}
          {activeView === 'GLOBAL' && (
            <div className="elfilme-carousel">
              <div className="carousel-title">ELFILME.COM // ESTRENOS DE RED</div>
              <div className="movie-row custom-scroll">
                {elFilmeCatalog.map(movie => (
                  <div key={movie.id} className="movie-poster" style={{backgroundImage: `url(${movie.img})`}} onClick={() => playMovieGlobal(movie)}>
                    <div className="movie-overlay">{isAdmin ? '▶ LANZAR GLOBAL' : 'CERRADO'}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ÁREA DINÁMICA */}
          <div className="dynamic-area">
            {activeView === 'GLOBAL' && <ChatRoom user={user} messages={messages} collectionName="public_feed" />}
            {activeView === 'PRIVATE' && <ChatRoom user={user} targetUser={privateTarget} isPrivate={true} />}
            {activeView === 'CINEMA' && (
              <div className="cinema-mode">
                <h2 style={{color:'#fff', marginBottom:'10px'}}>{syncedMovie?.title}</h2>
                <video src={syncedMovie?.vid} controls autoPlay className="cinema-player"></video>
                {isAdmin && <button className="btn-stop-sync" onClick={stopMovieGlobal}>DETENER TRANSMISIÓN GLOBAL</button>}
                {!isAdmin && <p style={{color:'#666', fontSize:'11px', marginTop:'10px'}}>El administrador está controlando la reproducción.</p>}
              </div>
            )}
          </div>
        </main>

        {/* PANEL DERECHO: DIRECTORIO SYNFM */}
        <aside className="glass-panel media-panel">
          <div className="panel-header">SYNFM.ONLINE // MEDIA HUB</div>
          <div className="player-card">
            <div className="now-playing-badge"><div className="live-dot"></div><span>TRANSMITIENDO</span></div>
            <h3 className="station-name">{currentStation.name}</h3>
            <p className="station-genre">{currentStation.genre}</p>
            <audio controls autoPlay className="audio-player" src={currentStation.url} />
          </div>
          <div style={{padding: '0 20px 10px 20px'}}>
            <input className="search-input" placeholder="Buscar señal..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className="directory-list custom-scroll">
            {filteredStations.map((station, index) => (
              <div key={station.id + index} className={`station-item ${currentStation.url === station.url ? 'active-station' : ''}`} onClick={() => setCurrentStation(station)}>
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

// --- CHAT MODULE (GLOBAL & PRIVATE) ---
const ChatRoom = ({ user, messages: globalMessages, targetUser, isPrivate }) => {
  const [input, setInput] = useState('');
  const [privateMessages, setPrivateMessages] = useState([]);
  const dummy = useRef();

  // Si es privado, generar un ID de sala único entre los dos UIDs
  const chatId = isPrivate ? [user.uid, targetUser.uid].sort().join('_') : 'public_feed';

  useEffect(() => {
    if (!isPrivate || !db) return;
    const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "asc"), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      setPrivateMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [chatId, isPrivate]);

  const displayMessages = isPrivate ? privateMessages : globalMessages;

  useEffect(() => { dummy.current?.scrollIntoView({ behavior: 'smooth' }); }, [displayMessages]);

  const sendMsg = async (e, forceText = null) => {
    if (e) e.preventDefault();
    const textToSend = forceText || input;
    if (!textToSend.trim()) return;
    
    try {
      const msgData = {
        text: textToSend, uid: user.uid, name: user.displayName || "Operador", photo: user.photoURL, createdAt: serverTimestamp()
      };

      if (isPrivate) {
        // Enviar a subcolección de chat privado
        await addDoc(collection(db, "chats", chatId, "messages"), msgData);
        // Asegurar que los participantes estén en el documento padre para cumplir tus reglas
        await setDoc(doc(db, "chats", chatId), { participants: [user.uid, targetUser.uid] }, { merge: true });
      } else {
        await addDoc(collection(db, "public_feed"), msgData);
      }
      setInput('');
    } catch (error) { console.error(error); }
  };

  const handleSendImage = () => {
    const url = prompt("Pega el enlace de la imagen (URL válida):");
    if (url) sendMsg(null, url);
  };

  const renderContent = (text) => {
    if (text.match(/\.(jpeg|jpg|gif|png|webp)(\?.*)?$/i)) return <img src={text} alt="media" className="chat-image" />;
    return text;
  };

  return (
    <div className="chat-wrapper">
      <div className="chat-feed custom-scroll">
        {displayMessages?.length === 0 && <div style={{textAlign:'center', color:'#444', fontSize:'11px'}}>Canal seguro establecido. Inicia transmisión.</div>}
        {displayMessages?.map(m => (
          <div key={m.id} className={`message-row ${m.uid === user.uid ? 'me' : 'them'}`}>
            <div className="msg-author">{m.name}</div>
            <div className="msg-bubble">{renderContent(m.text)}</div>
          </div>
        ))}
        <div ref={dummy}></div>
      </div>
      <form onSubmit={(e) => sendMsg(e)} className="chat-input-area">
        <button type="button" onClick={handleSendImage} className="btn-media" title="Enviar Foto">📷</button>
        <input className="chat-input" placeholder={isPrivate ? `Cifrando a ${targetUser.name}...` : "Transmite al global..."} value={input} onChange={(e) => setInput(e.target.value)} />
        <button className="btn-send" type="submit">ENVIAR</button>
      </form>
    </div>
  );
};

// --- LOGIN (SIN CAMBIOS, YA ESTÁ PERFECTO) ---
const Login = () => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isLoginView) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        if (!username.trim()) { setError("REQ_ERROR: Se requiere Nombre."); return; }
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
        <p className="login-sub">SYNAPT_NETWORK_GATEWAY</p>
        <form onSubmit={handleEmailAuth} className="email-auth-form">
          {!isLoginView && <input type="text" placeholder="Nombre Operador" className="auth-input" value={username} onChange={e => setUsername(e.target.value)} required />}
          <input type="email" placeholder="Correo Encriptado" className="auth-input" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Código de Acceso" className="auth-input" value={password} onChange={e => setPassword(e.target.value)} required />
          {error && <div className="auth-error">{error}</div>}
          <button type="submit" className="btn-auth-submit">{isLoginView ? 'INICIAR SESIÓN' : 'REGISTRAR'}</button>
        </form>
        <div className="auth-divider"><span>O</span></div>
        <button className="btn-login-google" onClick={() => signInWithPopup(auth, googleProvider)}>CONEXIÓN VÍA GOOGLE</button>
        <div className="auth-toggle"><span onClick={() => setIsLoginView(!isLoginView)}>{isLoginView ? '¿Nuevo? Solicitar acceso' : '¿Ya tienes credenciales? Iniciar sesión'}</span></div>
      </div>
    </div>
  );
};

// --- ESTILOS MAESTROS ACTUALIZADOS ---
const ArcanumStyles = () => (
  <style>{`
    :root { --bg-color: #000; --panel-bg: #070707; --border-color: #1a1a1a; --accent-red: #E50914; --text-main: #fff; --text-muted: #666; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background-color: var(--bg-color); color: var(--text-main); font-family: 'Inter', system-ui, sans-serif; overflow: hidden; background-image: radial-gradient(circle at top, #110000 0%, #000 60%); }

    /* Login */
    .loading-screen, .login-screen { height: 100vh; display: flex; align-items: center; justify-content: center; }
    .login-card { text-align: center; background: var(--panel-bg); padding: 50px 60px; border: 1px solid var(--border-color); border-radius: 4px; box-shadow: 0 0 40px rgba(229,9,20,0.1); width: 100%; max-width: 420px; }
    .login-logo { font-size: 45px; font-weight: 900; color: var(--accent-red); letter-spacing: 10px; margin-bottom: 5px; text-shadow: 0 0 15px rgba(229,9,20,0.4); }
    .login-sub { color: var(--text-muted); letter-spacing: 3px; font-size: 10px; margin-bottom: 35px; }
    .email-auth-form { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
    .auth-input { background: #000; border: 1px solid var(--border-color); color: #fff; padding: 14px; outline: none; border-radius: 2px; font-size: 13px; font-family: monospace; }
    .auth-input:focus { border-color: var(--accent-red); }
    .btn-auth-submit { background: var(--accent-red); color: #fff; border: none; padding: 15px; font-weight: 900; cursor: pointer; border-radius: 2px; letter-spacing: 1px; transition: 0.2s; font-size: 12px;}
    .auth-error { color: var(--accent-red); font-size: 11px; font-weight: bold; margin-bottom: 5px; text-align: left; }
    .auth-divider { display: flex; align-items: center; margin: 20px 0; color: var(--text-muted); font-size: 10px; font-weight: bold; }
    .auth-divider::before, .auth-divider::after { content: ''; flex: 1; border-bottom: 1px solid var(--border-color); }
    .auth-divider span { padding: 0 10px; }
    .btn-login-google { background: #fff; color: #000; border: none; padding: 15px; font-weight: 900; cursor: pointer; border-radius: 2px; width: 100%; font-size: 12px;}
    .auth-toggle { margin-top: 25px; font-size: 11px; color: var(--text-muted); cursor: pointer; text-decoration: underline; }
    .auth-toggle:hover { color: #fff; }

    /* Layout General */
    .os-layout { height: 100vh; display: flex; flex-direction: column; }
    .top-nav { padding: 15px 30px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.8); backdrop-filter: blur(10px); }
    .brand-group { display: flex; align-items: center; gap: 15px; }
    .brand-logo { color: var(--accent-red); font-size: 24px; font-weight: 900; letter-spacing: 2px; }
    .badge { background: var(--accent-red); color: #fff; font-size: 9px; padding: 4px 8px; font-weight: bold; border-radius: 2px; }
    .nav-controls { display: flex; align-items: center; gap: 20px; }
    .secure-text { font-size: 10px; color: var(--text-muted); font-weight: bold; letter-spacing: 1px; }
    .btn-outline { background: transparent; border: 1px solid var(--border-color); color: var(--text-muted); padding: 6px 12px; cursor: pointer; font-size: 10px; transition: 0.2s;}
    .btn-outline:hover { color: #fff; border-color: var(--accent-red); }
    .main-grid { display: grid; grid-template-columns: 300px 1fr 340px; gap: 20px; padding: 20px 30px; flex: 1; overflow: hidden; }
    .glass-panel { background: rgba(7,7,7,0.8); border: 1px solid var(--border-color); border-radius: 6px; display: flex; flex-direction: column; overflow: hidden; backdrop-filter: blur(10px); }
    .panel-header { font-size: 10px; font-weight: bold; color: var(--text-muted); letter-spacing: 2px; padding: 20px; text-transform: uppercase; }

    /* Radar y Perfil */
    .profile-info { display: flex; flex-direction: column; align-items: center; padding: 0 20px 20px 20px; border-bottom: 1px solid var(--border-color); }
    .main-avatar { width: 90px; height: 90px; border-radius: 50%; border: 2px solid var(--accent-red); padding: 3px; margin-bottom: 15px; background: #000; object-fit: cover; }
    .user-name { font-size: 16px; font-weight: 900; margin-bottom: 8px; letter-spacing: 1px; text-align: center; }
    .status-pill { border: 1px solid #0f0; color: #0f0; background: rgba(0,255,0,0.05); font-size: 9px; padding: 4px 12px; border-radius: 20px; font-weight: bold; }
    .top8-container { flex: 1; display: flex; flex-direction: column; overflow-y: auto; }
    .top8-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; padding: 0 20px 20px 20px; }
    .top8-card { display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; }
    .top8-avatar { width: 50px; height: 50px; background-color: #111; background-size: cover; background-position: center; border: 1px solid #333; border-radius: 4px; transition: 0.2s; position: relative; }
    .online-dot-mini { position: absolute; bottom: -3px; right: -3px; width: 10px; height: 10px; background: #0f0; border-radius: 50%; border: 2px solid #000; }
    .top8-card:hover .top8-avatar { border-color: var(--accent-red); box-shadow: 0 0 10px rgba(229,9,20,0.3); transform: scale(1.05); }
    .top8-name { font-size: 9px; color: var(--text-muted); font-family: monospace; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }

    /* Feed Central & ElFilme Sync */
    .chat-panel { position: relative; }
    .center-header { font-size: 10px; font-weight: bold; color: var(--text-muted); letter-spacing: 2px; padding: 20px; border-bottom: 1px solid var(--border-color); display: flex; align-items: center; background: rgba(0,0,0,0.5); }
    .btn-micro { background: transparent; border: 1px solid #333; color: #aaa; font-size: 8px; padding: 3px 8px; cursor: pointer; border-radius: 2px; }
    .btn-micro:hover { background: #222; color: #fff; }
    
    .elfilme-carousel { background: #050505; border-bottom: 1px solid var(--border-color); padding: 15px 20px; }
    .carousel-title { font-size: 9px; color: var(--accent-red); font-weight: bold; margin-bottom: 10px; letter-spacing: 1px; }
    .movie-row { display: flex; gap: 15px; overflow-x: auto; padding-bottom: 10px; }
    .movie-poster { min-width: 100px; height: 140px; background-size: cover; background-position: center; border-radius: 4px; border: 1px solid #222; cursor: pointer; position: relative; transition: 0.2s; }
    .movie-poster:hover { border-color: var(--accent-red); transform: translateY(-2px); }
    .movie-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; opacity: 0; transition: 0.2s; font-size: 9px; font-weight: bold; text-align: center; padding: 10px; color: #fff;}
    .movie-poster:hover .movie-overlay { opacity: 1; }
    
    .dynamic-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
    .cinema-mode { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #000; padding: 20px; text-align: center; }
    .cinema-player { width: 100%; max-width: 600px; border: 1px solid #333; border-radius: 4px; box-shadow: 0 10px 30px rgba(229,9,20,0.1); }
    .btn-stop-sync { margin-top: 20px; background: transparent; border: 1px solid var(--accent-red); color: var(--accent-red); padding: 10px 20px; font-size: 10px; font-weight: bold; cursor: pointer; transition: 0.2s; }
    .btn-stop-sync:hover { background: var(--accent-red); color: #fff; }

    /* Chat Core */
    .chat-wrapper { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
    .chat-feed { flex: 1; padding: 20px; overflow-y: auto; }
    .message-row { display: flex; flex-direction: column; margin-bottom: 20px; }
    .message-row.me { align-items: flex-end; }
    .message-row.them { align-items: flex-start; }
    .msg-author { font-size: 9px; color: var(--text-muted); margin-bottom: 6px; font-weight: bold; text-transform: uppercase; }
    .msg-bubble { padding: 12px 18px; font-size: 13px; line-height: 1.5; max-width: 85%; word-wrap: break-word; }
    .me .msg-bubble { background: linear-gradient(135deg, #E50914, #B80710); color: #fff; border-radius: 12px 12px 0 12px; }
    .them .msg-bubble { background: #111; border: 1px solid var(--border-color); color: #fff; border-radius: 0 12px 12px 12px; }
    .chat-image { max-width: 100%; border-radius: 4px; border: 1px solid #333; margin-top: 5px; }

    .chat-input-area { display: flex; background: #000; border-top: 1px solid var(--border-color); padding: 15px; gap: 5px; }
    .btn-media { background: #111; border: 1px solid #333; color: #fff; padding: 0 15px; border-radius: 2px 0 0 2px; cursor: pointer; transition: 0.2s; }
    .btn-media:hover { background: #222; }
    .chat-input { flex: 1; background: #050505; border: 1px solid #222; border-left: none; color: #fff; padding: 12px 15px; outline: none; font-size: 13px; }
    .btn-send { background: var(--accent-red); color: #fff; border: none; padding: 0 25px; font-weight: 900; cursor: pointer; border-radius: 0 2px 2px 0; font-size: 12px; }

    /* Media Panel */
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

    /* Scrollbars & Animations */
    .custom-scroll::-webkit-scrollbar { width: 4px; height: 4px; }
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

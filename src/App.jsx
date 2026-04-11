import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { auth, googleProvider, db } from './firebase';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, addDoc, query, onSnapshot, orderBy, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import EmojiPicker from 'emoji-picker-react';

// --- COMPONENTE PRINCIPAL ---
const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div style={css.centered}>Sincronizando Arcanum...</div>;

  return (
    <Routes>
      <Route path="/" element={user ? <Dashboard user={user} /> : <Login />} />
    </Routes>
  );
};

// --- PANEL DE CONTROL (DASHBOARD) ---
const Dashboard = ({ user }) => {
  const [text, setText] = useState('');
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);

  // Sincronización con Firestore en tiempo real
  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "notes"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      setNotes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleSaveNote = async () => {
    if (!newNote.trim()) return;
    try {
      await addDoc(collection(db, "notes"), {
        text: newNote,
        createdAt: serverTimestamp(),
        userId: user.uid,
        userName: user.displayName
      });
      setNewNote('');
    } catch (e) { console.error("Error al guardar:", e); }
  };

  const deleteNote = async (id) => {
    try {
      await deleteDoc(doc(db, "notes", id));
    } catch (e) { console.error("Error al borrar:", e); }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text);
    alert("¡Copiado al portapapeles!");
  };

  return (
    <div style={css.container}>
      <nav style={css.nav}>
        <h1 style={css.logo}>ARCANUM</h1>
        <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:'12px', fontWeight:'bold'}}>{user.displayName}</div>
            <span style={{fontSize:'10px', color:'#E50914'}}>SYNAPT_ADMIN</span>
          </div>
          <img src={user.photoURL} alt="u" style={css.avatar} />
          <button onClick={() => signOut(auth)} style={css.btnOut}>SALIR</button>
        </div>
      </nav>

      <main style={css.grid}>
        {/* COLUMNA IZQUIERDA: EDITOR EDITORIAL */}
        <section style={css.card}>
          <div style={css.cardHeader}>
            <h3 style={css.redTitle}>EDITOR EDITORIAL 9:16</h3>
            <button style={css.btnSmall} onClick={() => setText('')}>LIMPIAR TODO</button>
          </div>
          <textarea 
            style={css.textarea} 
            placeholder="Pega el contenido generado por IA aquí..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div style={css.flexGap}>
            <button style={css.btnGrey} onClick={() => setShowEmoji(!showEmoji)}>😀</button>
            <button style={css.btnRed} onClick={copyToClipboard}>COPIAR BLOQUE</button>
          </div>
          {showEmoji && (
            <div style={{marginTop:'15px', animation:'appear 0.3s ease'}}>
              <EmojiPicker theme="dark" width="100%" onEmojiClick={(e) => setText(text + e.emoji)} />
            </div>
          )}
        </section>

        {/* COLUMNA DERECHA: STATS Y NOTAS */}
        <aside style={{display:'flex', flexDirection:'column', gap:'25px'}}>
          
          <section style={css.card}>
            <h3 style={css.whiteTitle}>ESTADO DEL ECOSISTEMA</h3>
            <div style={css.statsGrid}>
              <div style={css.statBox}>
                <span style={css.statLabel}>NOTAS CLOUD</span>
                <span style={css.statValue}>{notes.length}</span>
              </div>
              <div style={css.statBox}>
                <span style={css.statLabel}>NEURO AI</span>
                <span style={{...css.statValue, color:'#0f0'}}>ON</span>
              </div>
              <div style={css.statBox}>
                <span style={css.statLabel}>D1 DB</span>
                <span style={{...css.statValue, color:'#0f0'}}>ACT</span>
              </div>
            </div>
          </section>

          <section style={css.card}>
            <h3 style={css.whiteTitle}>NOTAS Y PROMPTS</h3>
            <div style={{display:'flex', gap:'8px', marginBottom:'20px'}}>
              <input 
                style={css.input} 
                placeholder="Nueva idea rápida..." 
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSaveNote()}
              />
              <button style={css.btnRed} onClick={handleSaveNote}>+</button>
            </div>
            <div style={css.scrollArea}>
              {notes.map(n => (
                <div key={n.id} style={css.noteCard}>
                  <p style={{fontSize:'13px', lineHeight:'1.5'}}>{n.text}</p>
                  <button onClick={() => deleteNote(n.id)} style={css.delBtn}>BORRAR</button>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </main>

      <footer style={css.footer}>
        SYNAPT NETWORK © 2026 | Powered by Neuro AI Music Ecosystem
      </footer>
    </div>
  );
};

// --- PANTALLA DE ACCESO (LOGIN) ---
const Login = () => (
  <div style={css.centered}>
    <div style={css.loginCard}>
      <h1 style={css.bigLogo}>ARCANUM</h1>
      <p style={{color:'#444', marginBottom:'40px', letterSpacing:'2px', fontSize:'12px'}}>SYSTEM_ACCESS_ONLY</p>
      <button style={css.btnLogin} onClick={() => signInWithPopup(auth, googleProvider)}>
        ENTRAR CON GOOGLE
      </button>
    </div>
  </div>
);

// --- ESTILOS (NETFLIX-CORE) ---
const css = {
  container: { minHeight: '100vh', backgroundColor: '#000', color: '#fff', fontFamily: "'Inter', sans-serif" },
  centered: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },
  nav: { display: 'flex', justifyContent: 'space-between', padding: '15px 4%', borderBottom: '1px solid #111', position: 'sticky', top: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 100 },
  logo: { color: '#E50914', fontSize: '24px', fontWeight: '900', letterSpacing: '2px' },
  bigLogo: { color: '#E50914', fontSize: '50px', fontWeight: '900', letterSpacing: '8px', marginBottom: '5px' },
  grid: { display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '25px', padding: '30px 4%', maxWidth: '1400px', margin: '0 auto' },
  card: { background: '#0a0a0a', padding: '24px', borderRadius: '4px', border: '1px solid #1a1a1a' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
  textarea: { width: '100%', height: '420px', background: '#050505', color: '#fff', border: '1px solid #222', padding: '15px', borderRadius: '4px', resize: 'none', outline: 'none', fontSize: '15px' },
  input: { flex: 1, background: '#050505', color: '#fff', border: '1px solid #222', padding: '12px', borderRadius: '4px', outline: 'none' },
  btnRed: { background: '#E50914', color: '#fff', border: 'none', padding: '12px 24px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '2px' },
  btnGrey: { background: '#222', color: '#fff', border: 'none', padding: '12px 20px', cursor: 'pointer', borderRadius: '2px' },
  btnSmall: { background: 'none', border: 'none', color: '#444', fontSize: '10px', cursor: 'pointer' },
  btnLogin: { background: '#fff', color: '#000', border: 'none', padding: '15px 40px', fontWeight: '900', cursor: 'pointer', borderRadius: '2px' },
  btnOut: { background: 'none', border: '1px solid #222', color: '#666', padding: '5px 12px', cursor: 'pointer', fontSize: '10px' },
  avatar: { width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #E50914' },
  statsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' },
  statBox: { background: '#050505', padding: '15px', border: '1px solid #111', textAlign: 'center' },
  statLabel: { display: 'block', fontSize: '9px', color: '#444', marginBottom: '5px' },
  statValue: { fontSize: '14px', fontWeight: 'bold', color: '#E50914' },
  scrollArea: { maxHeight: '400px', overflowY: 'auto' },
  noteCard: { background: '#050505', borderLeft: '3px solid #E50914', padding: '15px', marginBottom: '10px', borderTop: '1px solid #111' },
  delBtn: { background: 'none', border: 'none', color: '#E50914', fontSize: '10px', cursor: 'pointer', marginTop: '10px', padding: 0 },
  redTitle: { color: '#E50914', fontSize: '13px', fontWeight: '900' },
  whiteTitle: { color: '#fff', fontSize: '13px', fontWeight: '900', marginBottom: '20px' },
  flexGap: { display: 'flex', gap: '10px' },
  footer: { textAlign: 'center', padding: '80px 0', color: '#222', fontSize: '10px', fontWeight: 'bold' },
  loginCard: { textAlign: 'center' }
};

export default App;

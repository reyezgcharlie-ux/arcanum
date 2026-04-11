import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { auth, googleProvider, db } from './firebase';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, addDoc, query, onSnapshot, orderBy, serverTimestamp } from 'firebase/firestore';
import EmojiPicker from 'emoji-picker-react';

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={css.centered}>Iniciando Arcanum...</div>;

  return (
    <Routes>
      <Route path="/" element={user ? <Dashboard user={user} /> : <Login />} />
    </Routes>
  );
};

const Dashboard = ({ user }) => {
  const [text, setText] = useState('');
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);

  // Cargar notas en tiempo real
  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "notes"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setNotes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const handleSaveNote = async () => {
    if (!newNote.trim()) return;
    try {
      await addDoc(collection(db, "notes"), {
        text: newNote,
        createdAt: serverTimestamp(),
        user: user.displayName
      });
      setNewNote('');
    } catch (e) { alert("Error al guardar: " + e.message); }
  };

  const copyText = () => {
    navigator.clipboard.writeText(text);
    alert("Copiado al portapapeles");
  };

  return (
    <div style={css.container}>
      <nav style={css.nav}>
        <h1 style={css.logo}>ARCANUM</h1>
        <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
          <img src={user.photoURL} style={css.avatar} alt="u" />
          <button onClick={() => signOut(auth)} style={css.btnOut}>SALIR</button>
        </div>
      </nav>

      <main style={css.grid}>
        {/* BLOQUE 1: EDITOR EDITORIAL */}
        <section style={css.card}>
          <div style={css.cardHeader}>
            <h3 style={css.redTitle}>EDITOR EDITORIAL 9:16</h3>
            <span style={css.badge}>Live</span>
          </div>
          <textarea 
            style={css.textarea} 
            placeholder="Pega el contenido generado por IA aquí..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div style={css.flexGap}>
            <button style={css.btnGrey} onClick={() => setShowEmoji(!showEmoji)}>😀</button>
            <button style={css.btnRed} onClick={copyText}>COPIAR BLOQUE</button>
            <button style={css.btnGrey} onClick={() => setText('')}>LIMPIAR</button>
          </div>
          {showEmoji && <div style={{marginTop:'10px'}}><EmojiPicker theme="dark" width="100%" onEmojiClick={(e)=>setText(text + e.emoji)} /></div>}
        </section>

        {/* BLOQUE 2: PROMPTS Y NOTAS */}
        <section style={css.card}>
          <h3 style={css.whiteTitle}>NOTAS Y PROMPTS</h3>
          <div style={{display:'flex', gap:'5px', marginBottom:'20px'}}>
            <input 
              style={css.input} 
              placeholder="Nueva idea rápida..." 
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
            />
            <button style={css.btnRed} onClick={handleSaveNote}>+</button>
          </div>
          <div style={css.scrollArea}>
            {notes.map(n => (
              <div key={n.id} style={css.noteCard}>
                <p style={{fontSize:'13px', lineHeight:'1.4'}}>{n.text}</p>
                <small style={{color:'#444', fontSize:'10px'}}>SYNAPT_SYSTEM_LOG</small>
              </div>
            ))}
          </div>
        </section>
      </main>
      <footer style={css.footer}>SYNAPT Network © 2026 | Neuro AI Music Ecosystem</footer>
    </div>
  );
};

const Login = () => (
  <div style={css.centered}>
    <div style={css.loginCard}>
      <h1 style={css.bigLogo}>ARCANUM</h1>
      <p style={{color:'#666', marginBottom:'30px'}}>ADMIN_ACCESS_ONLY</p>
      <button style={css.btnLogin} onClick={() => signInWithPopup(auth, googleProvider)}>
        ENTRAR CON GOOGLE
      </button>
    </div>
  </div>
);

// --- ESTILOS (Netflix-Core & Branding) ---
const css = {
  container: { minHeight: '100vh', backgroundColor: '#000', color: '#fff', fontFamily: 'Inter, sans-serif' },
  centered: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', color: '#fff' },
  nav: { display: 'flex', justifyContent: 'space-between', padding: '15px 4%', borderBottom: '1px solid #1a1a1a' },
  logo: { color: '#E50914', fontSize: '24px', fontWeight: '900', letterSpacing: '2px' },
  bigLogo: { color: '#E50914', fontSize: '48px', fontWeight: '900', letterSpacing: '5px', marginBottom: '10px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '25px', padding: '30px 4%' },
  card: { background: '#0a0a0a', padding: '20px', borderRadius: '4px', border: '1px solid #1a1a1a' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
  textarea: { width: '100%', height: '300px', background: '#000', color: '#fff', border: '1px solid #333', padding: '12px', borderRadius: '4px', resize: 'none', marginBottom: '15px', outline: 'none' },
  input: { flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '10px', borderRadius: '4px', outline: 'none' },
  btnRed: { background: '#E50914', color: '#fff', border: 'none', padding: '10px 20px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '2px' },
  btnGrey: { background: '#222', color: '#fff', border: 'none', padding: '10px 15px', cursor: 'pointer', borderRadius: '2px' },
  btnLogin: { background: '#fff', color: '#000', border: 'none', padding: '15px 30px', fontWeight: '900', cursor: 'pointer', borderRadius: '2px', width: '100%' },
  btnOut: { background: 'none', border: '1px solid #333', color: '#666', padding: '5px 10px', cursor: 'pointer', fontSize: '12px' },
  avatar: { width: '32px', height: '32px', borderRadius: '50%' },
  badge: { fontSize: '10px', background: '#E50914', padding: '2px 6px', borderRadius: '2px', fontWeight: 'bold' },
  scrollArea: { maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' },
  noteCard: { background: '#000', borderLeft: '3px solid #E50914', padding: '12px', marginBottom: '10px', borderTop: '1px solid #1a1a1a' },
  redTitle: { color: '#E50914', fontSize: '14px', fontWeight: 'bold' },
  whiteTitle: { color: '#fff', fontSize: '14px', fontWeight: 'bold', marginBottom: '15px' },
  flexGap: { display: 'flex', gap: '10px' },
  footer: { textAlign: 'center', padding: '50px', color: '#222', fontSize: '10px', letterSpacing: '1px' },
  loginCard: { textAlign: 'center', background: '#000', padding: '50px', border: '1px solid #1a1a1a', borderRadius: '4px' }
};

export default App;

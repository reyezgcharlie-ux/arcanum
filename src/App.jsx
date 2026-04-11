import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { auth, googleProvider, db } from './firebase';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, addDoc, query, onSnapshot, orderBy, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import EmojiPicker from 'emoji-picker-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
  }, []);

  if (loading) return <div style={css.centered}>RESTABLECIENDO ARCANUM OS...</div>;

  return (
    <Routes>
      <Route path="/" element={user ? <Dashboard user={user} /> : <Login />} />
    </Routes>
  );
}

const Dashboard = ({ user }) => {
  const [text, setText] = useState('');
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);

  // Firma personalizada para SYNAPT (Se pega automáticamente al copiar)
  const signature = `\n\n---\n📲 SYNAPT Network\nTelegram: @synapt_news\nWeb: synfm.online`;

  // Carga tus prompts personales desde Firestore
  useEffect(() => {
    if (!db || !user) return;
    const q = query(collection(db, "users", user.uid, "notes"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setNotes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [user]);

  const saveNote = async () => {
    if (!newNote.trim()) return;
    try {
      await addDoc(collection(db, "users", user.uid, "notes"), {
        content: newNote,
        createdAt: serverTimestamp()
      });
      setNewNote('');
    } catch (e) { console.error("Error al guardar:", e); }
  };

  const copyWithSignature = () => {
    navigator.clipboard.writeText(text + signature);
    alert("Copiado con firma SYNAPT");
  };

  return (
    <div style={css.container}>
      <nav style={css.nav}>
        <h1 style={css.logo}>ARCANUM</h1>
        <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:'12px', fontWeight:'bold'}}>{user.displayName}</div>
            <span style={{fontSize:'10px', color:'#E50914'}}>NETWORK_LEAD</span>
          </div>
          <button onClick={() => signOut(auth)} style={css.btnOut}>LOGOUT</button>
        </div>
      </nav>

      <main style={css.grid}>
        {/* LADO IZQUIERDO: ESTACIÓN DE TRABAJO (EDITOR) */}
        <section style={css.card}>
          <div style={css.cardHeader}>
            <h3 style={css.redTitle}>ESTACIÓN EDITORIAL 9:16</h3>
            <button style={css.btnSmall} onClick={() => setText('')}>VACIAR</button>
          </div>
          <textarea 
            style={css.textarea} 
            placeholder="Pega el contenido de la IA aquí..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div style={css.flexGap}>
            <button style={css.btnGrey} onClick={() => setShowEmoji(!showEmoji)}>😀</button>
            <button style={css.btnRed} onClick={copyWithSignature}>COPIAR CON FIRMA</button>
          </div>
          {showEmoji && <div style={{marginTop:'15px'}}><EmojiPicker theme="dark" width="100%" onEmojiClick={(e)=>setText(text + e.emoji)} /></div>}
        </section>

        {/* LADO DERECHO: BASE DE DATOS DE PROMPTS */}
        <aside style={css.card}>
          <h3 style={css.whiteTitle}>PROMPTS & CONFIGURACIÓN</h3>
          <div style={{display:'flex', gap:'8px', marginBottom:'20px'}}>
            <input 
              style={css.input} 
              placeholder="Guardar instrucción de IA..." 
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && saveNote()}
            />
            <button style={css.btnRed} onClick={saveNote}>+</button>
          </div>
          <div style={css.scrollArea}>
            {notes.map(n => (
              <div key={n.id} style={css.noteCard}>
                <p style={{fontSize:'13px', whiteSpace:'pre-wrap'}}>{n.content}</p>
                <button onClick={() => deleteDoc(doc(db, "users", user.uid, "notes", n.id))} style={css.delBtn}>BORRAR</button>
              </div>
            ))}
          </div>
        </aside>
      </main>
      <footer style={css.footer}>SYNAPT_NETWORK_SYSTEM_2026</footer>
    </div>
  );
};

const Login = () => (
  <div style={css.centered}>
    <div style={css.loginBox}>
      <h1 style={css.bigLogo}>ARCANUM</h1>
      <button style={css.btnLogin} onClick={() => signInWithPopup(auth, googleProvider)}>ACCEDER</button>
    </div>
  </div>
);

const css = {
  container: { minHeight: '100vh', backgroundColor: '#000', color: '#fff', fontFamily: 'Inter, sans-serif' },
  centered: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },
  nav: { display: 'flex', justifyContent: 'space-between', padding: '15px 4%', borderBottom: '1px solid #111' },
  logo: { color: '#E50914', fontSize: '24px', fontWeight: '900', letterSpacing: '2px' },
  bigLogo: { color: '#E50914', fontSize: '50px', fontWeight: '900', letterSpacing: '8px' },
  grid: { display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '25px', padding: '30px 4%' },
  card: { background: '#0a0a0a', padding: '24px', borderRadius: '4px', border: '1px solid #1a1a1a' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
  textarea: { width: '100%', height: '450px', background: '#000', color: '#fff', border: '1px solid #222', padding: '15px', borderRadius: '4px', outline: 'none', fontSize: '15px', resize:'none' },
  input: { flex: 1, background: '#000', color: '#fff', border: '1px solid #222', padding: '12px', borderRadius: '4px', outline: 'none' },
  btnRed: { background: '#E50914', color: '#fff', border: 'none', padding: '10px 20px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '2px' },
  btnGrey: { background: '#222', color: '#fff', border: 'none', padding: '10px 15px', cursor: 'pointer', borderRadius: '2px' },
  btnSmall: { background: 'none', border: 'none', color: '#333', fontSize: '10px', cursor: 'pointer' },
  btnLogin: { background: '#fff', color: '#000', border: 'none', padding: '15px 40px', fontWeight: '900', cursor: 'pointer' },
  btnOut: { background: 'none', border: 'none', color: '#444', fontSize: '10px', cursor: 'pointer' },
  scrollArea: { maxHeight: '500px', overflowY: 'auto' },
  noteCard: { background: '#050505', borderLeft: '3px solid #E50914', padding: '15px', marginBottom: '10px', borderTop: '1px solid #111' },
  delBtn: { background: 'none', border: 'none', color: '#E50914', fontSize: '10px', cursor: 'pointer', marginTop: '10px' },
  redTitle: { color: '#E50914', fontSize: '12px', fontWeight: 'bold' },
  whiteTitle: { color: '#fff', fontSize: '12px', fontWeight: 'bold', marginBottom: '20px' },
  flexGap: { display: 'flex', gap: '10px' },
  footer: { textAlign: 'center', padding: '60px', color: '#111', fontSize: '10px' },
  loginBox: { textAlign: 'center' }
};

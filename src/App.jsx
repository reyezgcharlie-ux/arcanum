import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { auth, googleProvider, db } from './firebase'; // Asegúrate que tu firebase.js esté bien
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, addDoc, query, onSnapshot, orderBy, deleteDoc, doc } from 'firebase/firestore';
import EmojiPicker from 'emoji-picker-react';

// --- ESTILOS UNIFICADOS ARCANUM (Netflix-Core) ---
const styles = {
  container: { minHeight: '100vh', backgroundColor: '#000', color: '#fff', fontFamily: "'Inter', sans-serif" },
  nav: { display: 'flex', justifyContent: 'space-between', padding: '15px 4%', borderBottom: '1px solid #222', alignItems: 'center' },
  main: { padding: '30px 4%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '30px' },
  card: { background: '#141414', padding: '20px', borderRadius: '8px', border: '1px solid #333', marginBottom: '20px' },
  textarea: { width: '100%', minHeight: '200px', background: '#000', border: '1px solid #444', color: '#fff', padding: '12px', borderRadius: '4px', fontSize: '14px' },
  btnRed: { backgroundColor: '#E50914', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' },
  noteItem: { background: '#1a1a1a', padding: '12px', borderRadius: '6px', marginBottom: '10px', borderLeft: '3px solid #E50914', position: 'relative' }
};

// --- COMPONENTE DASHBOARD (Todo integrado) ---
const Dashboard = ({ user }) => {
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');

  // Sincronizar Notas con Firebase
  useEffect(() => {
    const q = query(collection(db, "notes"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setNotes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const saveNote = async () => {
    if (!newNote.trim()) return;
    await addDoc(collection(db, "notes"), { text: newNote, userId: user.uid, createdAt: new Date() });
    setNewNote('');
  };

  return (
    <div style={styles.container}>
      <nav style={styles.nav}>
        <h2 style={{ color: '#E50914', fontWeight: '900' }}>ARCANUM</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{fontSize: '12px', color: '#666'}}>{user.displayName}</span>
          <button style={{ ...styles.btnRed, padding: '5px 10px' }} onClick={() => signOut(auth)}>SALIR</button>
        </div>
      </nav>

      <div style={styles.main}>
        {/* COLUMNA 1: EDITOR DE NOTICIAS */}
        <section style={styles.card}>
          <h3 style={{marginBottom: '15px'}}>Editor Editorial SYNAPT</h3>
          <textarea 
            style={styles.textarea} 
            placeholder="Pega aquí el contenido de la IA..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
            <button style={{ ...styles.btnRed, backgroundColor: '#333' }} onClick={() => setShowEmoji(!showEmoji)}>😀</button>
            <button style={styles.btnRed} onClick={() => { navigator.clipboard.writeText(text); alert("Copiado!"); }}>COPIAR BLOQUE</button>
          </div>
          {showEmoji && <div style={{ marginTop: '15px' }}><EmojiPicker theme="dark" onEmojiClick={(e) => setText(text + e.emoji)} width="100%" /></div>}
        </section>

        {/* COLUMNA 2: NOTAS EN LA NUBE */}
        <section style={styles.card}>
          <h3 style={{marginBottom: '15px'}}>Prompts & Notas Rápidas</h3>
          <input 
            style={{...styles.textarea, minHeight: '40px', marginBottom: '10px'}} 
            placeholder="Escribe una idea..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
          />
          <button style={{...styles.btnRed, width: '100%', marginBottom: '20px'}} onClick={saveNote}>GUARDAR NOTA</button>
          
          <div style={{maxHeight: '300px', overflowY: 'auto'}}>
            {notes.map(n => (
              <div key={n.id} style={styles.noteItem}>
                <p style={{fontSize: '13px'}}>{n.text}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

// --- COMPONENTE LOGIN ---
const Login = () => (
  <div style={{ ...styles.container, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
    <div style={{ ...styles.card, textAlign: 'center', padding: '50px' }}>
      <h1 style={{ color: '#E50914', fontSize: '40px', fontWeight: '900', marginBottom: '20px' }}>ARCANUM</h1>
      <button 
        style={{ ...styles.btnRed, backgroundColor: '#fff', color: '#000', width: '100%', fontWeight: 'bold' }}
        onClick={() => signInWithPopup(auth, googleProvider)}
      >
        ENTRAR CON GOOGLE
      </button>
    </div>
  </div>
);

// --- APP PRINCIPAL ---
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
  }, []);

  if (loading) return <div style={{...styles.container, display:'flex', justifyContent:'center', alignItems:'center'}}>Cargando...</div>;

  return (
    <Routes>
      <Route path="/" element={user ? <Dashboard user={user} /> : <Login />} />
    </Routes>
  );
}

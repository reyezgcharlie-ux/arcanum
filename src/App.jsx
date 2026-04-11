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
    const unsub = onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
    return () => unsub();
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
  const [isSaving, setIsSaving] = useState(false);

  // FIRMA PERSONALIZADA (SYNAPT NETWORK)
  const signature = `\n\n---\n📲 SYNAPT Network\nTelegram: @synapt_news\nWeb: synfm.online`;

  // 1. CARGA DE NOTAS (Sincronizada con tus reglas de /users/{uid}/notes)
  useEffect(() => {
    if (!db || !user) return;
    const notesRef = collection(db, "users", user.uid, "notes");
    const q = query(notesRef, orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snap) => {
      setNotes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
      console.error("Error en Snapshot:", error);
    });
    
    return () => unsubscribe();
  }, [user]);

  // 2. FUNCIÓN DE GUARDADO COMPLETA
  const saveNote = async () => {
    if (!newNote.trim() || isSaving) return;
    setIsSaving(true);
    
    try {
      const userNotesRef = collection(db, "users", user.uid, "notes");
      await addDoc(userNotesRef, {
        content: newNote,
        createdAt: serverTimestamp(),
        author: user.displayName
      });
      setNewNote('');
    } catch (e) {
      console.error("Error al guardar en Firestore:", e);
      alert("Error de permisos: Asegúrate de que en la consola de Firebase la colección 'users' permita escritura para tu UID.");
    } finally {
      setIsSaving(false);
    }
  };

  const copyWithSignature = () => {
    navigator.clipboard.writeText(text + signature);
    alert("Copiado con firma SYNAPT");
  };

  const deleteItem = async (noteId) => {
    try {
      await deleteDoc(doc(db, "users", user.uid, "notes", noteId));
    } catch (e) {
      console.error("Error al eliminar:", e);
    }
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
        {/* LADO IZQUIERDO: ESTACIÓN EDITORIAL */}
        <section style={css.card}>
          <div style={css.cardHeader}>
            <h3 style={css.redTitle}>GENERADOR EDITORIAL 9:16</h3>
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

        {/* LADO DERECHO: DATABASE DE PROMPTS */}
        <aside style={css.card}>
          <div style={css.cardHeader}>
            <h3 style={css.whiteTitle}>PROMPTS & CLOUD DATA</h3>
            {isSaving && <span style={{fontSize:'9px', color:'#E50914'}}>GUARDANDO...</span>}
          </div>
          <div style={{display:'flex', gap:'8px', marginBottom:'20px'}}>
            <input 
              style={css.input} 
              placeholder="Nueva instrucción maestra..." 
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && saveNote()}
            />
            <button 
              style={{...css.btnRed, opacity: isSaving ? 0.5 : 1}} 
              onClick={saveNote}
              disabled={isSaving}
            >
              +
            </button>
          </div>
          <div style={css.scrollArea}>
            {notes.length === 0 ? (
              <p style={{fontSize:'11px', color:'#333'}}>No hay prompts guardados en tu nube.</p>
            ) : (
              notes.map(n => (
                <div key={n.id} style={css.noteCard}>
                  <p style={{fontSize:'13px', whiteSpace:'pre-wrap'}}>{n.content}</p>
                  <button onClick={() => deleteItem(n.id)} style={css.delBtn}>BORRAR</button>
                </div>
              ))
            )}
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
  nav: { display: 'flex', justifyContent: 'space-between', padding: '15px 4%', borderBottom: '1px solid #111', background: '#000', position: 'sticky', top: 0, zIndex: 10 },
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
  whiteTitle: { color: '#fff', fontSize: '12px', fontWeight: 'bold' },
  flexGap: { display: 'flex', gap: '10px' },
  footer: { textAlign: 'center', padding: '60px', color: '#111', fontSize: '10px' },
  loginBox: { textAlign: 'center' }
};

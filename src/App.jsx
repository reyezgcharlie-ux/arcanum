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

  if (loading) return <div style={css.centered}>RESTORING_ARCANUM_SYSTEM...</div>;

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

  // FIRMA PERSONALIZADA PARA TUS REDES
  const signature = `\n\n---\n📲 SYNAPT Network\nTelegram: @synapt_news\nWeb: synfm.online`;

  // CARGAR TUS PROMPTS/NOTAS (Asegúrate de tener la colección 'users' creada)
  useEffect(() => {
    if (!db || !user) return;
    // Usamos la colección 'users' para que cumpla tu regla: allow read: if request.auth != null;
    const q = query(collection(db, "users", user.uid, "notes"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setNotes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [user]);

  const saveNote = async () => {
    if (!newNote.trim()) return;
    try {
      // Guardamos dentro de tu UID para que tus reglas permitan la escritura
      await addDoc(collection(db, "users", user.uid, "notes"), {
        content: newNote,
        createdAt: serverTimestamp()
      });
      setNewNote('');
    } catch (e) { alert("Error al guardar: Revisa los permisos de Firestore"); }
  };

  const copyWithSignature = () => {
    navigator.clipboard.writeText(text + signature);
    alert("Contenido + Firma SYNAPT copiado.");
  };

  return (
    <div style={css.container}>
      <nav style={css.nav}>
        <h1 style={css.logo}>ARCANUM</h1>
        <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
          <div style={{textAlign:'right', lineHeight:'1'}}>
            <div style={{fontSize:'12px', fontWeight:'bold'}}>{user.displayName}</div>
            <span style={{fontSize:'10px', color:'#E50914'}}>NETWORK_LEAD</span>
          </div>
          <button onClick={() => signOut(auth)} style={css.btnOut}>LOGOUT</button>
        </div>
      </nav>

      <main style={css.grid}>
        {/* BLOQUE 1: EDITOR DE NOTICIAS 9:16 */}
        <section style={css.card}>
          <div style={css.cardHeader}>
            <h3 style={css.redTitle}>GENERADOR EDITORIAL</h3>
            <button style={css.btnSmall} onClick={() => setText('')}>LIMPIAR</button>
          </div>
          <textarea 
            style={css.textarea} 
            placeholder="Pega aquí el resultado de la IA para formatear..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div style={css.flexGap}>
            <button style={css.btnGrey} onClick={() => setShowEmoji(!showEmoji)}>😀</button>
            <button style={css.btnRed} onClick={copyWithSignature}>COPIAR CON FIRMA</button>
          </div>
          {showEmoji && <div style={{marginTop:'15px'}}><EmojiPicker theme="dark" width="100%" onEmojiClick={(e)=>setText(text + e.emoji)} /></div>}
        </section>

        {/* BLOQUE 2: CLOUD PROMPTS & IDEAS */}
        <aside style={{display:'flex', flexDirection:'column', gap:'20px'}}>
          <section style={css.card}>
            <h3 style={css.whiteTitle}>PROMPTS GUARDADOS</h3>
            <div style={{display:'flex', gap:'5px', marginBottom:'20px'}}>
              <input 
                style={css.input} 
                placeholder="Guarda un prompt ganador..." 
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
                  <button onClick={() => deleteDoc(doc(db, "users", user.uid, "notes", n.id))} style={css.delBtn}>ELIMINAR</button>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </main>
      <footer style={css.footer}>SYNAPT_NETWORK_SYSTEM_2026 | Powered by Neuro AI</footer>
    </div>
  );
};

const Login = () => (
  <div style={css.centered}>
    <div style={css.loginBox}>
      <h1 style={css.bigLogo}>ARCANUM</h1>
      <button style={css.btnLogin} onClick={() => signInWithPopup(auth, googleProvider)}>BYPASS ACCESS</button>
    </div>
  </div>
);

const css = {
  container: { minHeight: '100vh', backgroundColor: '#000', color: '#fff', fontFamily: 'Inter, sans-serif' },
  centered: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },
  nav: { display: 'flex', justifyContent: 'space-between', padding: '15px 4%', borderBottom: '1px solid #111' },
  logo: { color: '#E50914', fontSize: '24px', fontWeight: '900', letterSpacing: '2px' },
  bigLogo: { color: '#E50914', fontSize: '50px', fontWeight: '900', letterSpacing: '10px' },
  grid: { display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '25px', padding: '30px 4%' },
  card: { background: '#0a0a0a', padding: '24px', borderRadius: '4px', border: '1px solid #1a1a1a' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
  textarea: { width: '100%', height: '400px', background: '#000', color: '#fff', border: '1px solid #222', padding: '15px', borderRadius: '4px', outline: 'none', fontSize: '15px' },
  input: { flex: 1, background: '#000', color: '#fff', border: '1px solid #222', padding: '12px', borderRadius: '4px', outline: 'none' },
  btnRed: { background: '#E50914', color: '#fff', border: 'none', padding: '10px 20px', fontWeight: 'bold', cursor: 'pointer' },
  btnGrey: { background: '#222', color: '#fff', border: 'none', padding: '10px 15px', cursor: 'pointer' },
  btnSmall: { background: 'none', border: 'none', color: '#333', fontSize: '10px', cursor: 'pointer' },
  btnLogin: { background: '#fff', color: '#000', border: 'none', padding: '15px 40px', fontWeight: '900', cursor: 'pointer' },
  btnOut: { background: 'none', border: 'none', color: '#444', fontSize: '10px', cursor: 'pointer' },
  scrollArea: { maxHeight: '450px', overflowY: 'auto' },
  noteCard: { background: '#000', borderLeft: '3px solid #E50914', padding: '15px', marginBottom: '10px', borderTop: '1px solid #111' },
  delBtn: { background: 'none', border: 'none', color: '#E50914', fontSize: '10px', cursor: 'pointer', marginTop: '10px' },
  redTitle: { color: '#E50914', fontSize: '12px', fontWeight: 'bold' },
  whiteTitle: { color: '#fff', fontSize: '12px', fontWeight: 'bold', marginBottom: '20px' },
  flexGap: { display: 'flex', gap: '10px' },
  footer: { textAlign: 'center', padding: '60px', color: '#111', fontSize: '10px' },
  loginBox: { textAlign: 'center' }
};

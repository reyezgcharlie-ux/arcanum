import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { auth, googleProvider, db } from './firebase';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import EmojiPicker from 'emoji-picker-react';

// --- ESTILOS SISTEMA ARCANUM ---
const styles = {
  container: { minHeight: '100vh', backgroundColor: '#000', color: '#fff', fontFamily: "'Inter', sans-serif" },
  nav: { display: 'flex', justifyContent: 'space-between', padding: '20px 4%', borderBottom: '1px solid #222', alignItems: 'center' },
  main: { padding: '40px 4%' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '30px' },
  card: { background: '#141414', padding: '24px', borderRadius: '8px', border: '1px solid #333', transition: '0.3s' },
  input: { width: '100%', background: '#222', border: '1px solid #444', color: '#fff', padding: '12px', borderRadius: '4px', marginBottom: '10px' },
  textarea: { width: '100%', minHeight: '150px', background: '#222', border: '1px solid #444', color: '#fff', padding: '12px', borderRadius: '4px', fontFamily: 'monospace' },
  btnRed: { backgroundColor: '#E50914', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' },
  tag: { fontSize: '10px', backgroundColor: '#333', padding: '2px 8px', borderRadius: '10px', textTransform: 'uppercase', color: '#E50914', fontWeight: 'bold' }
};

// --- COMPONENTE: EDITOR DE NOTICIAS ---
const ContentEditor = () => {
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text);
    alert("¡Contenido copiado al portapapeles!");
  };

  return (
    <div style={styles.card}>
      <div style={{display:'flex', justifyContent:'space-between', marginBottom:'15px'}}>
        <h3>Creador de Editorial</h3>
        <span style={styles.tag}>Live Preview</span>
      </div>
      <textarea 
        style={styles.textarea} 
        placeholder="Escribe tu noticia o pega el script de la IA aquí..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div style={{display:'flex', gap:'10px', marginTop:'10px'}}>
        <button style={{...styles.btnRed, backgroundColor:'#333'}} onClick={() => setShowEmoji(!showEmoji)}>
          {showEmoji ? 'Cerrar Emojis' : '😀 Emojis'}
        </button>
        <button style={styles.btnRed} onClick={copyToClipboard}>Copiar Bloque de Código</button>
      </div>
      {showEmoji && (
        <div style={{marginTop:'15px'}}>
          <EmojiPicker theme="dark" onEmojiClick={(emoji) => setText(text + emoji.emoji)} width="100%" />
        </div>
      )}
    </div>
  );
};

// --- COMPONENTE: ESTADO DE PROYECTOS ---
const ProjectStatus = ({ name, status, color }) => (
  <div style={{...styles.card, borderLeft: `4px solid ${color}`}}>
    <h4 style={{marginBottom:'5px'}}>{name}</h4>
    <p style={{fontSize:'12px', color:'#b3b3b3'}}>Estado: <span style={{color}}>{status}</span></p>
  </div>
);

// --- VISTA PRINCIPAL (DASHBOARD) ---
const Dashboard = ({ user }) => (
  <div style={styles.container}>
    <nav style={styles.nav}>
      <h2 style={{color:'#E50914', letterSpacing:'2px'}}>ARCANUM</h2>
      <div style={{display:'flex', alignItems:'center', gap:'20px'}}>
        <span style={{fontSize:'14px'}}>{user.displayName}</span>
        <button style={{...styles.btnRed, padding:'5px 12px', fontSize:'12px'}} onClick={() => signOut(auth)}>Salir</button>
      </div>
    </nav>

    <main style={styles.main}>
      <h1 className="fade-in">Panel de Control</h1>
      <p style={{color:'#b3b3b3'}}>Gestionando SYNAPT Network & Neuro AI</p>

      <div style={styles.grid}>
        <ContentEditor />
        
        <div style={{display:'flex', flexDirection:'column', gap:'20px'}}>
          <h3>Ecosistema</h3>
          <ProjectStatus name="Neuro AI Music" status="Online / Firebase Active" color="#E50914" />
          <ProjectStatus name="ElFilme.com" status="Cloudflare Worker: Active" color="#fff" />
          <ProjectStatus name="SYNAPT Radio" status="18k Stations Live" color="#E50914" />
        </div>
      </div>
    </main>
  </div>
);

// --- COMPONENTE DE LOGIN ---
const Login = () => (
  <div style={{...styles.container, display:'flex', justifyContent:'center', alignItems:'center'}}>
    <div style={{...styles.card, textAlign:'center', padding:'60px'}}>
      <h1 style={{color:'#E50914', fontSize:'45px', fontWeight:'800', marginBottom:'10px'}}>ARCANUM</h1>
      <p style={{color:'#b3b3b3', marginBottom:'30px'}}>Inicia sesión con tu cuenta de administrador</p>
      <button 
        style={{...styles.btnRed, backgroundColor:'#fff', color:'#000', width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px'}}
        onClick={() => signInWithPopup(auth, googleProvider)}
      >
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="20" alt="G"/>
        Entrar con Google
      </button>
    </div>
  </div>
);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
    return () => unsubscribe();
  }, []);

  if (loading) return <div style={{...styles.container, display:'flex', justifyContent:'center', alignItems:'center'}}>Iniciando Sistemas...</div>;

  return (
    <Routes>
      <Route path="/" element={user ? <Dashboard user={user} /> : <Login />} />
    </Routes>
  );
}

export default App;

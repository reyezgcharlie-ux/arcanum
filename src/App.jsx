import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { auth, googleProvider } from './firebase';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';

// --- ESTILOS NETFLIX-CORE ---
const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#000',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Inter', sans-serif",
  },
  card: {
    background: 'rgba(0, 0, 0, 0.75)',
    padding: '60px',
    borderRadius: '4px',
    width: '100%',
    maxWidth: '450px',
    textAlign: 'center',
    border: '1px solid #333'
  },
  btnGoogle: {
    backgroundColor: '#fff',
    color: '#000',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '20px',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px'
  },
  btnSignOut: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    backgroundColor: '#E50914',
    color: '#fff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '600'
  }
};

// --- COMPONENTE DE LOGIN ---
const Login = () => {
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error al entrar:", error);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={{ color: '#E50914', fontSize: '40px', marginBottom: '30px', fontWeight: '800' }}>ARCANUM</h1>
        <p style={{ color: '#b3b3b3', marginBottom: '20px' }}>Inicia sesión para gestionar SYNAPT Network</p>
        <button onClick={handleLogin} style={styles.btnGoogle}>
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" width="20"/>
          Continuar con Google
        </button>
      </div>
    </div>
  );
};

// --- COMPONENTE DEL PANEL (DASHBOARD) ---
const Dashboard = ({ user }) => {
  return (
    <div style={styles.container}>
      <button style={styles.btnSignOut} onClick={() => signOut(auth)}>Cerrar Sesión</button>
      <h1 className="fade-in">Bienvenido, {user.displayName}</h1>
      <p style={{ color: '#E50914', marginTop: '10px' }}>Acceso concedido a Arcanum Ecosystem</p>
      
      <div style={{ marginTop: '40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{ background: '#141414', padding: '20px', borderRadius: '4px', borderLeft: '4px solid #E50914' }}>
          <h3>Neuro AI</h3>
          <p style={{ fontSize: '12px', color: '#b3b3b3' }}>Módulo de Música Activo</p>
        </div>
        <div style={{ background: '#141414', padding: '20px', borderRadius: '4px', borderLeft: '4px solid #fff' }}>
          <h3>Cloudflare</h3>
          <p style={{ fontSize: '12px', color: '#b3b3b3' }}>Worker Status: Online</p>
        </div>
      </div>
    </div>
  );
};

// --- APP PRINCIPAL CON LÓGICA DE ESTADO ---
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div style={styles.container}>Cargando Arcanum...</div>;

  return (
    <Routes>
      <Route path="/" element={user ? <Dashboard user={user} /> : <Login />} />
    </Routes>
  );
}

export default App;

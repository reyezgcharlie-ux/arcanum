import React, { useState, useEffect } from 'react';
import { auth, googleProvider } from './firebase';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';

// Importamos los componentes que creamos arriba
import Editor from './components/Editor';
import Notes from './components/Notes';
import Player from './components/Player';
import Stats from './components/Stats';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div style={{ height: '100vh', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>Iniciando Arcanum...</div>;

  if (!user) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', backgroundImage: 'radial-gradient(circle, #1a0000 0%, #000 100%)' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ color: '#E50914', fontSize: '50px', fontWeight: '900', letterSpacing: '5px', marginBottom: '20px' }}>ARCANUM</h1>
          <button 
            onClick={() => signInWithPopup(auth, googleProvider)}
            style={{ background: '#E50914', color: '#fff', padding: '15px 40px', border: 'none', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px', fontSize: '16px' }}
          >
            ENTRAR AL PANEL
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#000', minHeight: '100vh', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      {/* Barra de Navegación */}
      <nav style={{ padding: '15px 4%', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #222', backgroundColor: 'rgba(0,0,0,0.9)', position: 'sticky', top: 0, zIndex: 100 }}>
        <h2 style={{ color: '#E50914', fontWeight: '900', margin: 0 }}>ARCANUM</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <img src={user.photoURL} alt="profile" style={{ width: '30px', borderRadius: '50%' }} />
          <button onClick={() => signOut(auth)} style={{ background: 'none', color: '#E50914', border: '1px solid #E50914', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>SALIR</button>
        </div>
      </nav>
      
      {/* Contenido Principal */}
      <main style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px', padding: '30px 4%' }}>
        {/* Columna Izquierda: Trabajo Pesado */}
        <section>
          <Editor />
          <Player />
        </section>

        {/* Columna Derecha: Información y Notas */}
        <aside>
          <Notes userId={user.uid} />
          <Stats />
        </aside>
      </main>

      <footer style={{ textAlign: 'center', padding: '40px', color: '#333', fontSize: '12px' }}>
        SYNAPT NETWORK © 2026 | Powered by Neuro AI
      </footer>
    </div>
  );
}

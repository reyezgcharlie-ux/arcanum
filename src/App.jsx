import React, { useState, Suspense, lazy } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import EmojiPicker from 'emoji-picker-react';

// Estilos rápidos para el contenedor principal
const containerStyle = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px',
  textAlign: 'center',
  animation: 'appear 0.8s ease-out'
};

const buttonStyle = {
  backgroundColor: '#E50914',
  color: 'white',
  border: 'none',
  padding: '12px 24px',
  borderRadius: '4px',
  fontSize: '16px',
  fontWeight: '600',
  cursor: 'pointer',
  marginTop: '20px',
  transition: 'transform 0.2s ease'
};

// Componente de Ejemplo: Home
const Home = () => (
  <div style={containerStyle}>
    <h1 style={{ fontSize: '3rem', marginBottom: '10px', fontWeight: '800' }}>ARCANUM</h1>
    <p style={{ color: '#B3B3B3', maxWidth: '400px' }}>
      Bienvenido al ecosistema digital de SYNAPT Network. 
      Explora contenido exclusivo y herramientas de IA.
    </p>
    <Link to="/tools">
      <button style={buttonStyle} onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'} onMouseOut={(e) => e.target.style.transform = 'scale(1)'}>
        Empezar ahora
      </button>
    </Link>
  </div>
);

// Componente de Ejemplo: Herramientas (Con el Selector de Emojis que instalaste)
const Tools = () => {
  const [showEmoji, setShowEmoji] = useState(false);
  
  return (
    <div style={containerStyle}>
      <h2 style={{ marginBottom: '20px' }}>Herramientas Arcanum</h2>
      <button 
        style={{...buttonStyle, backgroundColor: '#333'}} 
        onClick={() => setShowEmoji(!showEmoji)}
      >
        {showEmoji ? 'Cerrar Selector' : 'Probar Emoji Picker'}
      </button>
      
      {showEmoji && (
        <div style={{ marginTop: '20px', animation: 'slideIn 0.3s ease' }}>
          <EmojiPicker theme="dark" />
        </div>
      )}
      
      <Link role="button" to="/" style={{ color: '#E50914', marginTop: '30px', textDecoration: 'none', fontWeight: 'bold' }}>
        ← Volver al Inicio
      </Link>
    </div>
  );
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/tools" element={<Tools />} />
      {/* Aquí puedes añadir más rutas como /login o /profile más adelante */}
    </Routes>
  );
}

export default App;

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'

// Inyección de estilos globales (Netflix-Core & Branding SYNAPT)
const style = document.createElement('style')
style.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');

  *, *::before, *::after { 
    box-sizing: border-box; 
    margin: 0; 
    padding: 0; 
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  html, body, #root { 
    height: 100%; 
    width: 100%;
    background-color: #000000; /* Fondo negro absoluto */
    color: #ffffff;           /* Texto blanco puro */
    font-family: 'Inter', sans-serif; 
    overflow-x: hidden;
  }

  /* Scrollbar Minimalista estilo Streaming */
  ::-webkit-scrollbar { 
    width: 4px; 
  }
  ::-webkit-scrollbar-track {
    background: #000000;
  }
  ::-webkit-scrollbar-thumb { 
    background: #E50914; /* Rojo Netflix/SYNAPT */
    border-radius: 10px; 
  }

  /* Animaciones de Interfaz */
  @keyframes appear { 
    from { opacity: 0; transform: translateY(8px); } 
    to { opacity: 1; transform: translateY(0); } 
  }
  
  @keyframes slideIn { 
    from { opacity: 0; transform: translateX(20px); } 
    to { opacity: 1; transform: translateX(0); } 
  }

  @keyframes spin { 
    to { transform: rotate(360deg); } 
  }

  /* Clase de utilidad para entradas suaves */
  .fade-in {
    animation: appear 0.5s ease forwards;
  }
`
document.head.appendChild(style)

// Renderizado con soporte para React Router 7
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)

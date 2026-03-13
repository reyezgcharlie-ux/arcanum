import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

const style = document.createElement('style')
style.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; font-family: 'DM Sans', sans-serif; }
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.15); border-radius: 3px; }
  @keyframes appear { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
  @keyframes td { 0%,80%,100%{transform:translateY(0);opacity:.3} 40%{transform:translateY(-5px);opacity:1} }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes slideIn { from{opacity:0;transform:translateX(16px)} to{opacity:1;transform:translateX(0)} }
`
document.head.appendChild(style)

createRoot(document.getElementById('root')).render(
  <StrictMode><App /></StrictMode>
)

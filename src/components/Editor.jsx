import React, { useState } from 'react';
import EmojiPicker from 'emoji-picker-react';

export default function Editor() {
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(text);
    alert("¡Copiado para tus redes!");
  };

  return (
    <div style={{ background: '#141414', padding: '20px', borderRadius: '8px', border: '1px solid #333' }}>
      <h3 style={{ color: '#E50914', marginBottom: '15px' }}>Editor Editorial SYNAPT</h3>
      <textarea 
        style={{ width: '100%', minHeight: '200px', background: '#000', color: '#fff', border: '1px solid #444', padding: '15px', borderRadius: '4px', fontFamily: 'monospace' }}
        placeholder="Pega el contenido de la IA aquí..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
        <button onClick={() => setShowEmoji(!showEmoji)} style={{ background: '#333', color: '#fff', border: 'none', padding: '10px', cursor: 'pointer' }}>😀</button>
        <button onClick={copy} style={{ background: '#E50914', color: '#fff', border: 'none', padding: '10px', fontWeight: 'bold', cursor: 'pointer', flex: 1 }}>COPIAR BLOQUE</button>
      </div>
      {showEmoji && <div style={{ marginTop: '10px' }}><EmojiPicker theme="dark" width="100%" onEmojiClick={(e) => setText(text + e.emoji)} /></div>}
    </div>
  );
}

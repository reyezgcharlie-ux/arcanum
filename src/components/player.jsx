import React, { useState } from 'react';

export default function Player() {
  return (
    <div style={{ background: '#141414', padding: '20px', borderRadius: '8px', border: '1px solid #333', marginTop: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <div style={{ width: '50px', height: '50px', background: '#E50914', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>N</div>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: 0 }}>Neuro AI Stream</h4>
          <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>Sintonizando frecuencia SYNAPT...</p>
        </div>
        <button style={{ background: '#fff', border: 'none', borderRadius: '50%', width: '35px', height: '35px', cursor: 'pointer', fontWeight: 'bold' }}>▶</button>
      </div>
    </div>
  );
}

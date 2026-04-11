import React from 'react';

export default function Stats() {
  const platforms = [
    { name: 'SYNAPT Radio', status: 'Online', users: '18k+' },
    { name: 'ElFilme.com', status: 'Active', users: 'Cloudflare D1' },
    { name: 'Neuro System', status: 'Ready', users: 'Vercel' }
  ];

  return (
    <div style={{ marginTop: '20px' }}>
      <h3 style={{ marginBottom: '15px', fontSize: '14px', color: '#E50914' }}>ESTADO DEL ECOSISTEMA</h3>
      {platforms.map((p, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #222' }}>
          <span style={{ fontSize: '13px' }}>{p.name}</span>
          <span style={{ fontSize: '11px', color: '#0f0', fontWeight: 'bold' }}>{p.status}</span>
        </div>
      ))}
    </div>
  );
}

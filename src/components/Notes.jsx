import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, query, onSnapshot, orderBy, deleteDoc, doc } from 'firebase/firestore';

export default function Notes({ userId }) {
  const [notes, setNotes] = useState([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    const q = query(collection(db, "notes"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      setNotes(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const add = async () => {
    if (!input.trim()) return;
    await addDoc(collection(db, "notes"), { text: input, userId, createdAt: new Date() });
    setInput('');
  };

  return (
    <div style={{ background: '#141414', padding: '20px', borderRadius: '8px', border: '1px solid #333' }}>
      <h3 style={{ marginBottom: '15px' }}>Prompts & Notas</h3>
      <input 
        style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid #444', color: '#fff' }}
        value={input} onChange={(e) => setInput(e.target.value)} placeholder="Nueva idea..." 
      />
      <button onClick={add} style={{ width: '100%', marginTop: '10px', background: '#fff', color: '#000', fontWeight: 'bold', border: 'none', padding: '8px' }}>GUARDAR</button>
      <div style={{ marginTop: '20px', maxHeight: '300px', overflowY: 'auto' }}>
        {notes.map(n => (
          <div key={n.id} style={{ borderLeft: '3px solid #E50914', padding: '10px', background: '#0a0a0a', marginBottom: '5px', fontSize: '13px' }}>
            {n.text}
          </div>
        ))}
      </div>
    </div>
  );
}

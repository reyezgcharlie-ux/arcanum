import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route } from 'react-router-dom';
import { auth, googleProvider, db } from './firebase';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, addDoc, query, onSnapshot, orderBy, serverTimestamp, limit } from 'firebase/firestore';
import EmojiPicker from 'emoji-picker-react';

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
  }, []);

  if (loading) return <div style={css.centered}>Initializing Arcanum Network...</div>;

  return (
    <Routes>
      <Route path="/" element={user ? <ChatRoom user={user} /> : <Login />} />
    </Routes>
  );
};

const ChatRoom = ({ user }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const dummy = useRef();

  // 1. Real-time Message Sync
  useEffect(() => {
    const q = query(collection(db, "messages"), orderBy("createdAt", "asc"), limit(50));
    const unsubscribe = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      dummy.current?.scrollIntoView({ behavior: 'smooth' });
    });
    return () => unsubscribe();
  }, []);

  // 2. Send Message Logic
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    await addDoc(collection(db, "messages"), {
      text: newMessage,
      createdAt: serverTimestamp(),
      uid: user.uid,
      displayName: user.displayName,
      photoURL: user.photoURL
    });

    setNewMessage('');
    setShowEmoji(false);
  };

  return (
    <div style={css.container}>
      <nav style={css.nav}>
        <h1 style={css.logo}>ARCANUM <span style={{fontSize:'10px', color:'#666'}}>V2.0_LIVE</span></h1>
        <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
          <img src={user.photoURL} alt="p" style={css.avatar} />
          <button onClick={() => signOut(auth)} style={css.btnOut}>LOGOUT</button>
        </div>
      </nav>

      <main style={css.chatBox}>
        <div style={css.messageList}>
          {messages.map(msg => (
            <div key={msg.id} style={msg.uid === user.uid ? css.sent : css.received}>
              <div style={css.msgInfo}>
                {msg.uid !== user.uid && <span style={css.msgName}>{msg.displayName}</span>}
              </div>
              <div style={msg.uid === user.uid ? css.bubbleSent : css.bubbleReceived}>
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={dummy}></div>
        </div>

        <form onSubmit={sendMessage} style={css.inputArea}>
          <button type="button" onClick={() => setShowEmoji(!showEmoji)} style={css.emojiBtn}>😀</button>
          <input 
            style={css.chatInput} 
            value={newMessage} 
            onChange={(e) => setNewMessage(e.target.value)} 
            placeholder="Type a message..."
          />
          <button type="submit" style={css.sendBtn}>SEND</button>
        </form>
        
        {showEmoji && (
          <div style={css.emojiContainer}>
            <EmojiPicker theme="dark" onEmojiClick={(e) => setNewMessage(newMessage + e.emoji)} width="100%" />
          </div>
        )}
      </main>
    </div>
  );
};

const Login = () => (
  <div style={css.centered}>
    <div style={css.loginCard}>
      <h1 style={css.bigLogo}>ARCANUM</h1>
      <p style={{color:'#444', marginBottom:'30px', fontSize:'12px'}}>DECRYPTING_ACCESS...</p>
      <button style={css.btnLogin} onClick={() => signInWithPopup(auth, googleProvider)}>LOGIN WITH GOOGLE</button>
    </div>
  </div>
);

const css = {
  container: { height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#000', color: '#fff', fontFamily: 'Inter, sans-serif' },
  centered: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', color: '#fff' },
  nav: { display: 'flex', justifyContent: 'space-between', padding: '10px 4%', borderBottom: '1px solid #111', alignItems: 'center' },
  logo: { color: '#E50914', fontWeight: '900', letterSpacing: '2px' },
  bigLogo: { color: '#E50914', fontSize: '50px', fontWeight: '900', letterSpacing: '8px' },
  chatBox: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' },
  messageList: { flex: 1, overflowY: 'auto', padding: '20px 4%', display: 'flex', flexDirection: 'column', gap: '15px' },
  sent: { alignSelf: 'flex-end', maxWidth: '70%', textAlign: 'right' },
  received: { alignSelf: 'flex-start', maxWidth: '70%' },
  bubbleSent: { background: '#E50914', padding: '10px 15px', borderRadius: '15px 15px 0 15px', fontSize: '14px', color: '#fff' },
  bubbleReceived: { background: '#1a1a1a', padding: '10px 15px', borderRadius: '15px 15px 15px 0', fontSize: '14px', border: '1px solid #333' },
  msgName: { fontSize: '10px', color: '#666', marginBottom: '4px', display: 'block' },
  inputArea: { display: 'flex', padding: '20px 4%', background: '#0a0a0a', gap: '10px', borderTop: '1px solid #111' },
  chatInput: { flex: 1, background: '#000', border: '1px solid #222', padding: '12px', color: '#fff', borderRadius: '4px', outline: 'none' },
  sendBtn: { background: '#E50914', color: '#fff', border: 'none', padding: '0 20px', fontWeight: '900', cursor: 'pointer', borderRadius: '4px' },
  emojiBtn: { background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' },
  emojiContainer: { position: 'absolute', bottom: '80px', left: '4%', right: '4%', zIndex: 100 },
  avatar: { width: '30px', borderRadius: '50%', border: '1px solid #E50914' },
  btnOut: { background: 'none', border: 'none', color: '#444', fontSize: '10px', cursor: 'pointer' },
  loginCard: { textAlign: 'center' },
  btnLogin: { background: '#fff', color: '#000', border: 'none', padding: '15px 30px', fontWeight: '900', cursor: 'pointer' }
};

export default App;

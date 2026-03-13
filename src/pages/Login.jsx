import { useState } from "react";
import {
  signInWithPopup, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, updateProfile,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "../firebase";
import { ArcanumLogo } from "../utils/icons.jsx";

const saveUser = async (user, handle, bio = "") => {
  await setDoc(doc(db, "users", user.uid), {
    uid:         user.uid,
    displayName: user.displayName || handle,
    handle:      handle || "@" + (user.displayName || "user").toLowerCase().replace(/\s/g, ""),
    email:       user.email,
    photoURL:    user.photoURL || null,
    bio,
    status:      "online",
    lastSeen:    serverTimestamp(),
    createdAt:   serverTimestamp(),
  }, { merge: true });
};

export default function Login() {
  const [mode,     setMode]     = useState("login");
  const [name,     setName]     = useState("");
  const [handle,   setHandle]   = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleGoogle = async () => {
    setError(""); setLoading(true);
    try {
      const r = await signInWithPopup(auth, googleProvider);
      const h = "@" + r.user.displayName.toLowerCase().replace(/\s/g, "");
      await saveUser(r.user, h);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const handleEmail = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      if (mode === "register") {
        if (!handle.startsWith("@")) { setError("El handle debe comenzar con @"); setLoading(false); return; }
        const r = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(r.user, { displayName: name });
        await saveUser({ ...r.user, displayName: name }, handle);
      } else {
        const r = await signInWithEmailAndPassword(auth, email, password);
        await saveUser(r.user, null);
      }
   } catch (e) {
  console.error("ARCANUM ERROR:", e);
  const codes = {
    "auth/email-already-in-use": "Este email ya está registrado",
    "auth/invalid-email": "Email inválido",
    "auth/weak-password": "La contraseña debe tener al menos 6 caracteres",
    "auth/user-not-found": "Usuario no encontrado",
    "auth/wrong-password": "Contraseña incorrecta",
    "auth/too-many-requests": "Demasiados intentos. Espera unos minutos",
    "auth/network-request-failed": "Error de red. Verifica tu conexión",
    "permission-denied": "Error de permisos en Firestore. Verifica las reglas",
  };
  setError(codes[e.code] || e.code || e.message || "Error desconocido");
}
    setLoading(false);
  };

  return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0f", backgroundImage: "radial-gradient(ellipse at 30% 40%, rgba(201,168,76,0.04) 0%, transparent 60%)" }}>
      <div style={{ width: "100%", maxWidth: 380, padding: "0 20px" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <ArcanumLogo size={52} />
          </div>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 400, letterSpacing: 8, color: "#c9a84c", marginBottom: 6 }}>ARCANUM</h1>
          <p style={{ fontSize: 10, color: "#2a2a38", letterSpacing: 3 }}>WHAT YOU SAY STAYS ENCRYPTED</p>
        </div>

        {/* Card */}
        <div style={{ background: "#0d0d12", border: "1px solid #1e1e28", borderRadius: 12, padding: "28px 24px" }}>

          {/* Google */}
          <button onClick={handleGoogle} disabled={loading}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "11px 16px", background: "#16161e", border: "1px solid #2a2a38", borderRadius: 8, color: "#d1d1d8", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "background .15s", marginBottom: 20, fontFamily: "'DM Sans', sans-serif" }}
            onMouseEnter={e => e.currentTarget.style.background = "#1e1e2a"}
            onMouseLeave={e => e.currentTarget.style.background = "#16161e"}
          >
            <svg width="17" height="17" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continuar con Google
          </button>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, color: "#2a2a38", fontSize: 11, letterSpacing: 1 }}>
            <div style={{ flex: 1, height: 1, background: "#1e1e28" }} /><span>O</span><div style={{ flex: 1, height: 1, background: "#1e1e28" }} />
          </div>

          {/* Form */}
          <form onSubmit={handleEmail} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {mode === "register" && (
              <>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre completo" required
                  style={{ background: "#16161e", border: "1px solid #2a2a38", borderRadius: 8, padding: "11px 14px", color: "#d1d1d8", fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", transition: "border-color .2s" }}
                  onFocus={e => e.target.style.borderColor = "#c9a84c"}
                  onBlur={e => e.target.style.borderColor = "#2a2a38"}
                />
                <input value={handle} onChange={e => setHandle(e.target.value)} placeholder="@tu_handle" required
                  style={{ background: "#16161e", border: "1px solid #2a2a38", borderRadius: 8, padding: "11px 14px", color: "#d1d1d8", fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", transition: "border-color .2s" }}
                  onFocus={e => e.target.style.borderColor = "#c9a84c"}
                  onBlur={e => e.target.style.borderColor = "#2a2a38"}
                />
              </>
            )}
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required
              style={{ background: "#16161e", border: "1px solid #2a2a38", borderRadius: 8, padding: "11px 14px", color: "#d1d1d8", fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", transition: "border-color .2s" }}
              onFocus={e => e.target.style.borderColor = "#c9a84c"}
              onBlur={e => e.target.style.borderColor = "#2a2a38"}
            />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña" required minLength={6}
              style={{ background: "#16161e", border: "1px solid #2a2a38", borderRadius: 8, padding: "11px 14px", color: "#d1d1d8", fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", transition: "border-color .2s" }}
              onFocus={e => e.target.style.borderColor = "#c9a84c"}
              onBlur={e => e.target.style.borderColor = "#2a2a38"}
            />

            {error && <div style={{ background: "rgba(220,53,69,.1)", border: "1px solid rgba(220,53,69,.25)", borderRadius: 6, padding: "8px 12px", color: "#f87171", fontSize: 12 }}>{error}</div>}

            <button type="submit" disabled={loading}
              style={{ background: "#c9a84c", color: "#0a0a0f", padding: "12px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", marginTop: 4, letterSpacing: 1, fontFamily: "'DM Sans', sans-serif", transition: "opacity .15s" }}
              onMouseEnter={e => e.currentTarget.style.opacity = ".88"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
              {loading ? "..." : mode === "login" ? "INICIAR SESIÓN" : "CREAR CUENTA"}
            </button>
          </form>

          <p style={{ textAlign: "center", fontSize: 12, color: "#3d3d50", marginTop: 16 }}>
            {mode === "login" ? "¿Sin cuenta?" : "¿Ya tienes cuenta?"}{" "}
            <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
              style={{ color: "#c9a84c", fontSize: 12, cursor: "pointer", background: "none", border: "none", fontFamily: "'DM Sans', sans-serif", textDecoration: "underline" }}>
              {mode === "login" ? "Regístrate" : "Inicia sesión"}
            </button>
          </p>
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: "#1e1e28", fontSize: 10, letterSpacing: 2 }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          END-TO-END ENCRYPTED
        </div>
      </div>
    </div>
  );
}

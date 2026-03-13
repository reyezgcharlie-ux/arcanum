import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAHBetL12-jRB21BTjkeufPYzhpeg-6K9w",
  authDomain: "neuro-ai-music.firebaseapp.com",
  projectId: "neuro-ai-music",
  storageBucket: "neuro-ai-music.firebasestorage.app",
  messagingSenderId: "472873480624",
  appId: "1:472873480624:web:53b452a2cedba4021be675",
  databaseURL: "https://neuro-ai-music-default-rtdb.firebaseio.com",
};

const app = initializeApp(firebaseConfig);

export const auth    = getAuth(app);
export const db      = getFirestore(app);
export const storage = getStorage(app);
export const rtdb    = getDatabase(app);
export const googleProvider = new GoogleAuthProvider();

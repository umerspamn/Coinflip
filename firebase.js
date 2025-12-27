import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getDatabase,
  ref,
  set,
  onValue,
  serverTimestamp,
  onDisconnect
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Keep config here so it’s not duplicated across files
const firebaseConfig = {
  apiKey: "AIzaSyAwlWUvMOBfz2pTh18MqpDsVk3Hl-xPmJQ",
  authDomain: "coinflip-97336.firebaseapp.com",
  databaseURL: "https://coinflip-97336-default-rtdb.firebaseio.com",
  projectId: "coinflip-97336",
  storageBucket: "coinflip-97336.firebasestorage.app",
  messagingSenderId: "1026597403544",
  appId: "1:1026597403544:web:f204ff9806ca73b7ecc9ed",
  measurementId: "G-D45WX8RGCW"
};

// Initialize EXACTLY ONCE
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

// Re-export Firebase funcs you use elsewhere (so you don't import gstatic everywhere)
export { signInAnonymously, onAuthStateChanged, ref, set, onValue, serverTimestamp, onDisconnect };
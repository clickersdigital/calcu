import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

// Reemplaza con tus credenciales reales de la consola de Firebase
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCmTg9t1ms476VgSBXU-9iKm8FXbBiRGGM",
  authDomain: "aplicaciones-pro.firebaseapp.com",
  databaseURL: "https://aplicaciones-pro-default-rtdb.firebaseio.com",
  projectId: "aplicaciones-pro",
  storageBucket: "aplicaciones-pro.firebasestorage.app",
  messagingSenderId: "411494786325",
  appId: "1:411494786325:web:578fab112dae029d63f51c"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
// Firebase Configuration
// Nota: In production, usa variabili d'ambiente per le credenziali
// Crea un file .env.local con:
// REACT_APP_FIREBASE_API_KEY=...
// REACT_APP_FIREBASE_AUTH_DOMAIN=...
// etc.

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const env = import.meta.env;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || env.REACT_APP_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID || env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID || env.REACT_APP_FIREBASE_APP_ID,
};

const hasFirebaseConfig = Object.values(firebaseConfig).every(Boolean);

// Initialize Firebase
const app = hasFirebaseConfig ? initializeApp(firebaseConfig) : null;

// Initialize Auth
export const auth = app ? getAuth(app) : null;

// Initialize Firestore
export const db = app ? getFirestore(app) : null;

export const firebaseConfigReady = hasFirebaseConfig;

export default app;

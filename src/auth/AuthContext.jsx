import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  OAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { auth, firebaseConfigReady } from '../firebase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Listen to auth state changes
  useEffect(() => {
    if (!firebaseConfigReady || !auth) {
      setLoading(false);
      setError('Configurazione Firebase mancante. Aggiungi le variabili ambiente su Vercel per attivare il login.');
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const isAdmin = user?.email === '1cianiraffaella@gmail.com';

  // Google Sign-In
  const signInWithGoogle = async () => {
    try {
      if (!auth) throw new Error('Firebase Auth non configurato');
      setError(null);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Apple Sign-In
  const signInWithApple = async () => {
    try {
      if (!auth) throw new Error('Firebase Auth non configurato');
      setError(null);
      const provider = new OAuthProvider('apple.com');
      provider.addScope('email');
      provider.addScope('name');
      await signInWithPopup(auth, provider);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Microsoft Sign-In
  const signInWithMicrosoft = async () => {
    try {
      if (!auth) throw new Error('Firebase Auth non configurato');
      setError(null);
      const provider = new OAuthProvider('microsoft.com');
      provider.setCustomParameters({
        prompt: 'select_account',
      });
      await signInWithPopup(auth, provider);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Email/Password Sign-Up
  const signUpWithEmail = async (email, password) => {
    try {
      if (!auth) throw new Error('Firebase Auth non configurato');
      setError(null);
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Email/Password Sign-In
  const signInWithEmail = async (email, password) => {
    try {
      if (!auth) throw new Error('Firebase Auth non configurato');
      setError(null);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Sign Out
  const logout = async () => {
    try {
      if (!auth) return;
      setError(null);
      await signOut(auth);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const value = {
    user,
    loading,
    error,
    firebaseConfigReady,
    isAdmin,
    signInWithGoogle,
    signInWithApple,
    signInWithMicrosoft,
    signUpWithEmail,
    signInWithEmail,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

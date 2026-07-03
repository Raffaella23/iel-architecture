import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import './LoginScreen.css';

export default function LoginScreen() {
  const { signInWithGoogle, signInWithApple, signInWithMicrosoft, signInWithEmail, signUpWithEmail, error } = useAuth();
  const [mode, setMode] = useState('oauth'); // 'oauth' or 'email'
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
    } catch (err) {
      console.error('Google sign-in error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithApple();
    } catch (err) {
      console.error('Apple sign-in error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMicrosoftSignIn = async () => {
    try {
      setLoading(true);
      await signInWithMicrosoft();
    } catch (err) {
      console.error('Microsoft sign-in error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setEmailError('');

    if (!email || !password) {
      setEmailError('Email e password sono obbligatori');
      return;
    }

    try {
      setLoading(true);
      if (isSignUp) {
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err) {
      setEmailError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-container">
        <div className="login-header">
          <div className="login-iel">IEL</div>
          <div className="login-sub">for Architecture</div>
          <div className="login-divider" />
        </div>

        {mode === 'oauth' ? (
          <div className="login-oauth">
            <h1 className="login-title">Accedi al progetto</h1>
            <p className="login-body">Scegli il metodo di accesso che preferisci</p>

            {error && <div className="login-error">{error}</div>}

            <div className="oauth-buttons">
              <button
                className="oauth-btn oauth-google"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <span className="oauth-icon">??</span>
                <span>Google</span>
              </button>

              <button
                className="oauth-btn oauth-apple"
                onClick={handleAppleSignIn}
                disabled={loading}
              >
                <span className="oauth-icon">??</span>
                <span>Apple</span>
              </button>

              <button
                className="oauth-btn oauth-microsoft"
                onClick={handleMicrosoftSignIn}
                disabled={loading}
              >
                <span className="oauth-icon">?</span>
                <span>Microsoft</span>
              </button>
            </div>

            <div className="login-divider-text">
              <span>o</span>
            </div>

            <button
              className="email-toggle-btn"
              onClick={() => setMode('email')}
              disabled={loading}
            >
              Accedi con email
            </button>
          </div>
        ) : (
          <div className="login-email">
            <h1 className="login-title">{isSignUp ? 'Crea un account' : 'Accedi con email'}</h1>

            {emailError && <div className="login-error">{emailError}</div>}

            <form onSubmit={handleEmailSubmit} className="email-form">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="email-input"
                disabled={loading}
              />

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="email-input"
                disabled={loading}
              />

              <button
                type="submit"
                className="email-submit-btn"
                disabled={loading}
              >
                {loading ? '...' : isSignUp ? 'Crea account' : 'Accedi'}
              </button>
            </form>

            <button
              className="email-toggle-link"
              onClick={() => setIsSignUp(!isSignUp)}
              disabled={loading}
            >
              {isSignUp ? 'Hai già un account? Accedi' : 'Non hai un account? Registrati'}
            </button>

            <button
              className="back-btn"
              onClick={() => {
                setMode('oauth');
                setEmail('');
                setPassword('');
                setEmailError('');
              }}
              disabled={loading}
            >
              ? Torna ai metodi di accesso
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

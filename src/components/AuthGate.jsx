import React, { useState, useEffect } from 'react'

// 🔑 Codice di accesso progetto — cambialo quando vuoi
const ACCESS_CODE = 'villa127'

export default function AuthGate({ children }) {
  const [authenticated, setAuthenticated] = useState(false)
  const [checked, setChecked] = useState(false)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('iel_auth')
    if (saved === 'ok') setAuthenticated(true)
    setChecked(true)
  }, [])

  useEffect(() => {
    document.body.style.overflow = authenticated ? '' : 'hidden'
    document.body.style.touchAction = authenticated ? '' : 'none'
    return () => {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
    }
  }, [authenticated])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (code.trim().toLowerCase() === ACCESS_CODE.toLowerCase()) {
      localStorage.setItem('iel_auth', 'ok')
      setAuthenticated(true)
    } else {
      setError('Codice non valido, riprova.')
    }
  }

  if (!checked) return null

  if (!authenticated) {
    return (
      <div className="auth-gate">
        <div className="auth-card">
          <div className="auth-card__eyebrow">IEL — Accesso riservato</div>
          <h1 className="auth-card__title">Benvenuti</h1>
          <p className="auth-card__sub">
            Inserite email e codice progetto ricevuto dall'architetto per accedere.
          </p>
          <form className="auth-form" onSubmit={handleSubmit}>
            <input className="auth-input" type="email" placeholder="Email"
              value={email} onChange={e => setEmail(e.target.value)} required />
            <input className="auth-input" type="text" placeholder="Codice progetto"
              value={code} onChange={e => setCode(e.target.value)} required />
            {error && <div className="auth-error">{error}</div>}
            <button className="auth-submit" type="submit">Entra</button>
          </form>
        </div>
      </div>
    )
  }

  return children
}

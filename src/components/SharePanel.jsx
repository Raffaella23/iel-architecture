import React, { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

export default function SharePanel({ projectTitle, projectSubtitle }) {
  const [copied, setCopied] = useState(false)
  const url = window.location.href

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: select text
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: projectTitle,
          text: projectSubtitle,
          url,
        })
      } catch {}
    } else {
      handleCopy()
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      padding: '32px 24px',
      background: '#111111',
      borderLeft: '1px solid #2a2a2a',
      width: '280px',
      flexShrink: 0,
    }}>

      {/* Project info */}
      <div>
        <div style={{
          fontSize: '10px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: '#c8a96e',
          marginBottom: '8px',
          fontWeight: 500,
        }}>
          IEL for Architecture
        </div>
        <h1 style={{
          fontFamily: 'DM Serif Display, Georgia, serif',
          fontSize: '22px',
          fontWeight: 400,
          color: '#f0ece4',
          lineHeight: 1.3,
          marginBottom: '8px',
        }}>
          {projectTitle}
        </h1>
        <p style={{
          fontSize: '13px',
          color: '#7a7570',
          lineHeight: 1.6,
        }}>
          {projectSubtitle}
        </p>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: '#2a2a2a' }} />

      {/* QR Code */}
      <div>
        <div style={{
          fontSize: '10px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: '#7a7570',
          marginBottom: '16px',
          fontWeight: 500,
        }}>
          Scansiona per aprire
        </div>
        <div style={{
          background: '#f0ece4',
          padding: '16px',
          borderRadius: '4px',
          display: 'inline-block',
        }}>
          <QRCodeSVG
            value={url}
            size={160}
            bgColor="#f0ece4"
            fgColor="#0a0a0a"
            level="M"
          />
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: '#2a2a2a' }} />

      {/* Share button */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button
          onClick={handleShare}
          style={{
            width: '100%',
            padding: '12px',
            background: '#c8a96e',
            color: '#0a0a0a',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 500,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={e => e.target.style.opacity = '0.85'}
          onMouseLeave={e => e.target.style.opacity = '1'}
        >
          Condividi esperienza
        </button>

        <button
          onClick={handleCopy}
          style={{
            width: '100%',
            padding: '10px',
            background: 'transparent',
            border: '1px solid #2a2a2a',
            color: copied ? '#c8a96e' : '#7a7570',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 400,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            transition: 'all 0.2s',
          }}
        >
          {copied ? '✓ Link copiato' : 'Copia link'}
        </button>
      </div>

      {/* Footer */}
      <div style={{
        marginTop: 'auto',
        paddingTop: '16px',
        borderTop: '1px solid #2a2a2a',
        fontSize: '10px',
        color: '#3a3a3a',
        letterSpacing: '0.06em',
      }}>
        Powered by IEL Core · RC XRArch
      </div>
    </div>
  )
}

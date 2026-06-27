import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { QRCodeSVG } from 'qrcode.react';
import ModelViewer from './components/ModelViewer';
import MaterialSelector from './components/MaterialSelector';
import './App.css';

const MATERIALS = [
  { id: 'travertino', label: 'Travertino', color: '#D4C5A9' },
  { id: 'cemento', label: 'Cemento', color: '#9B9B9B' },
  { id: 'rovere', label: 'Rovere', color: '#8B6914' },
];

const SHARE_URL = window.location.href;

export default function App() {
  const [activeMaterial, setActiveMaterial] = useState(MATERIALS[0]);
  const [showQR, setShowQR] = useState(false);
  const [shared, setShared] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'IEL for Architecture',
          text: 'Esplora questo progetto in 3D interattivo',
          url: SHARE_URL,
        });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch (e) {
        setShowQR(true);
      }
    } else {
      setShowQR(v => !v);
    }
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <span className="iel-wordmark">IEL</span>
          <span className="iel-sub">for Architecture</span>
        </div>
        <div className="header-right">
          <span className="project-label">Villa 127/C — Noicattaro</span>
        </div>
      </header>

      {/* 3D Canvas */}
      <div className="canvas-wrapper">
        <Canvas
          camera={{ position: [4, 3, 4], fov: 45 }}
          shadows
          dpr={[1, 2]}
        >
          <ambientLight intensity={0.4} />
          <directionalLight
            position={[5, 8, 5]}
            intensity={1.2}
            castShadow
            shadow-mapSize={[1024, 1024]}
          />
          <ModelViewer activeMaterial={activeMaterial} />
          <ContactShadows
            position={[0, -1.5, 0]}
            opacity={0.35}
            scale={8}
            blur={2}
          />
          <Environment preset="apartment" />
          <OrbitControls
            enablePan={false}
            minDistance={2}
            maxDistance={10}
            minPolarAngle={0.2}
            maxPolarAngle={Math.PI / 2}
          />
        </Canvas>

        {/* Touch hint */}
        <div className="touch-hint">
          <span>↻ Ruota · Pizzica per zoom</span>
        </div>
      </div>

      {/* Material selector */}
      <MaterialSelector
        materials={MATERIALS}
        active={activeMaterial}
        onChange={setActiveMaterial}
      />

      {/* Bottom bar */}
      <footer className="footer">
        <div className="project-info">
          <p className="project-name">Villa unifamiliare</p>
          <p className="project-detail">Ristrutturazione · 1970s · 280 m²</p>
        </div>
        <button
          className={`share-btn ${shared ? 'shared' : ''}`}
          onClick={handleShare}
        >
          {shared ? '✓ Condiviso' : 'Condividi'}
        </button>
      </footer>

      {/* QR Modal */}
      {showQR && (
        <div className="qr-overlay" onClick={() => setShowQR(false)}>
          <div className="qr-panel" onClick={e => e.stopPropagation()}>
            <p className="qr-label">Scansiona per aprire</p>
            <QRCodeSVG
              value={SHARE_URL}
              size={200}
              bgColor="#ffffff"
              fgColor="#0a0a0a"
              level="M"
            />
            <p className="qr-url">{SHARE_URL}</p>
            <button className="qr-close" onClick={() => setShowQR(false)}>Chiudi</button>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import './App.css';
import { getDesignSuggestions } from './lib/annotationAI';
import { buildLycheePrompt } from './lib/lycheePrompt';

// ── SCENE DATA ──────────────────────────────────────────────────────────────
const SCENES = [
  {
    id: 'intro',
    image: '/edificio2.png',
    label: 'Il Progetto',
    title: 'Villa 127/C',
    subtitle: 'Noicattaro · Puglia',
    body: 'Una villa degli anni \'70 che diventa residenza contemporanea. Ogni scelta preserva la memoria del luogo mentre costruisce il futuro.',
    replay: null,
    mood: false,
  },
  {
    id: 'vision',
    image: '/edificio1.png',
    label: 'La Visione',
    title: 'Luce e sezione',
    subtitle: 'Vista tramonto · Sezione trasversale',
    body: 'Tre livelli che dialogano con il paesaggio pugliese. Il piano interrato emerge, il piano rialzato si apre, il piano primo vola.',
    replay: 'La sezione mostra come ogni livello abbia una relazione diversa con l\'esterno — dal seminterrato raccolto alla terrazza aperta sul cielo.',
    mood: false,
  },
  {
    id: 'piano1',
    image: null,
    images: ['/piano_primo_v1.png', '/piano_primo_v2.png'],
    label: 'Il Piano',
    title: 'Planimetria Piano 1',
    subtitle: 'Confronta le varianti · Scorri lo slider',
    body: 'Camera padronale con cabina armadio, due camere ragazzi, palestra indipendente. La grande terrazza recuperata diventa il cuore della vita familiare.',
    replay: 'La vetrata a tutta altezza nasce da un gesto preciso: liberare uno spazio che era stato chiuso nel tempo. Dove c\'era un balcone murato, oggi entra la luce.',
    mood: true,
  },
  {
    id: 'materiali',
    image: '/edificio2.png',
    label: 'I Materiali',
    title: 'Palette materica',
    subtitle: 'Travertino · Rovere · Microcemento',
    body: 'Tre materiali. Una coerenza. Il travertino richiama la pietra pugliese, il rovere porta calore, il microcemento dà rigore contemporaneo.',
    replay: 'La scelta dei materiali non è estetica — è climatica. Il travertino accumula calore di giorno e lo rilascia di notte.',
    mood: false,
  },
  {
    id: 'interrato',
    image: '/PlaceholderPianoInterrato.png',
    label: 'Interrato',
    title: 'Piano Interrato',
    subtitle: 'Spazi di servizio · Zona hobby · Cantina',
    body: 'Il piano interrato si trasforma in spazio vissuto. Dalla cantina alla zona hobby con biliardo, ogni ambiente ha luce naturale grazie ai pozzi di luce perimetrali.',
    replay: 'Il seminterrato non è uno spazio residuale — è il fondamento della casa. La scelta di portare luce naturale qui cambia la qualità di vita di tutti i piani.',
    mood: false,
  },
  {
    id: 'prospetto_est',
    image: '/Placeholderprospettoest.png',
    label: 'Prospetto Est',
    title: 'Facciata Est',
    subtitle: 'Vista giardino · Sistemazione a verde',
    body: 'La facciata est si apre sul giardino terrazzato. Le vetrate a tutta altezza creano un dialogo continuo tra interno ed esterno, tra pietra locale e verde mediterraneo.',
    replay: 'Ogni albero è posizionato per dare ombra in estate senza bloccare il sole invernale. Il progetto del verde è parte integrante dell\'architettura.',
    mood: false,
  },
  {
    id: 'prospetto_ovest',
    image: '/PlaceholderProspettoOvest.png',
    label: 'Prospetto Ovest',
    title: 'Facciata Ovest',
    subtitle: 'Ingresso principale · Pietra locale',
    body: 'La pietra calcarea locale domina la facciata ovest. Un gesto sobrio e radicato nel territorio, che racconta l\'identità pugliese senza folklore.',
    replay: 'La scelta della pietra locale non è nostalgia — è sostenibilità. Materiale estratto a pochi chilometri, lavorato da artigiani del territorio.',
    mood: false,
  },
  {
    id: 'prospetto_sud',
    image: '/PlaceholderProspettosud.png',
    label: 'Prospetto Sud',
    title: 'Facciata Sud',
    subtitle: 'Vista principale · Fronte strada',
    body: 'Il fronte sud è il biglietto da visita della villa. La composizione volumetrica racconta la stratificazione interna — tre livelli, tre modi di abitare.',
    replay: 'Il prospetto sud bilancia chiusura e apertura: la pietra protegge, il vetro invita. Una soglia tra il mondo e la vostra casa.',
    mood: false,
  },
  {
    id: 'sezione1',
    image: '/Placeholdersez1.png',
    label: 'Sezione A',
    title: 'Sezione Trasversale A',
    subtitle: 'Dal seminterrato alla terrazza',
    body: 'La sezione rivela l\'anima della casa. La scala diventa elemento scultoreo, il camino è il cuore del soggiorno doppia altezza, la piscina si integra nel giardino.',
    replay: 'La doppia altezza del soggiorno non è un lusso — è un sistema di ventilazione naturale. L\'aria calda sale, quella fresca entra dal basso. Zero climatizzazione artificiale in primavera e autunno.',
    mood: false,
  },
  {
    id: 'sezione2',
    image: '/Placeholdersez2.png',
    label: 'Sezione B',
    title: 'Sezione Trasversale B',
    subtitle: 'Cantina · Living · Terrazza',
    body: 'La seconda sezione mostra la cantina interrata, il living aperto sul paesaggio e la terrazza che si prolunga nel giardino terrazzato con ulivo secolare.',
    replay: 'L\'ulivo esistente era il primo vincolo del progetto. Tutta la casa è stata progettata per preservarlo e valorizzarlo come elemento compositivo.',
    mood: false,
  },
  {
    id: 'vista',
    image: '/PlaceholderVistaprospettica.png',
    label: 'Vista 3D',
    title: 'Vista Prospettica',
    subtitle: 'Render · Luce naturale',
    body: 'La vista tridimensionale mostra la villa nel suo paesaggio. Pietra, vetro e verde si fondono in una composizione che appartiene alla Puglia e al tempo presente.',
    replay: 'Questo render mostra la villa come sarà — non come appare oggi. È un impegno verso una visione condivisa tra voi e il progetto.',
    mood: false,
  },
];

const MOODS = [
  { id: 'giorno',   label: '☀️ Giorno',   filter: 'brightness(1.1) saturate(1.0)' },
  { id: 'tramonto', label: '🌇 Tramonto', filter: 'brightness(0.9) saturate(1.3) sepia(0.2)' },
  { id: 'notte',    label: '🌙 Notte',    filter: 'brightness(0.45) saturate(0.8) hue-rotate(200deg)' },
];

const PINS = [
  { emoji: '❤️', label: 'Mi piace' },
  { emoji: '💡', label: 'Idea' },
  { emoji: '🤔', label: 'Da rivedere' },
];

const SHARE_URL = window.location.href;
const CLIENT_NAME = 'Gabriele e Ludovica';
const PROJECT_NAME = 'Villa 127/C — Noicattaro';

// ── COMPARE SLIDER ──────────────────────────────────────────────────────────
function CompareSlider({ images }) {
  const [pos, setPos] = useState(50);
  const ref = useRef(null);
  const dragging = useRef(false);

  const getPos = useCallback((clientX) => {
    const rect = ref.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setPos((x / rect.width) * 100);
  }, []);

  useEffect(() => {
    const up   = () => { dragging.current = false; };
    const move = (e) => {
      if (!dragging.current) return;
      getPos(e.touches ? e.touches[0].clientX : e.clientX);
    };
    window.addEventListener('mouseup', up);
    window.addEventListener('touchend', up);
    window.addEventListener('mousemove', move);
    window.addEventListener('touchmove', move, { passive: true });
    return () => {
      window.removeEventListener('mouseup', up);
      window.removeEventListener('touchend', up);
      window.removeEventListener('mousemove', move);
      window.removeEventListener('touchmove', move);
    };
  }, [getPos]);

  const start = (e) => {
    dragging.current = true;
    getPos(e.touches ? e.touches[0].clientX : e.clientX);
  };

  return (
    <div className="compare-wrap" ref={ref} onMouseDown={start} onTouchStart={start}>
      <img src={images[0]} alt="variante A" className="compare-img compare-back" />
      <div className="compare-front" style={{ width: `${pos}%` }}>
        <img src={images[1]} alt="variante B" className="compare-img" />
      </div>
      <div className="compare-handle" style={{ left: `${pos}%` }}>
        <div className="compare-line" />
        <div className="compare-knob">⇔</div>
      </div>
      <div className="compare-labels">
        <span className="compare-tag left">Variante A</span>
        <span className="compare-tag right">Variante B</span>
      </div>
    </div>
  );
}

// ── DREAM PINS ──────────────────────────────────────────────────────────────
function DreamPins({ sceneId, pins, onPin }) {
  const scenePins = pins[sceneId] || {};
  return (
    <div className="pins-bar">
      <span className="pins-label">Come vi sentite?</span>
      <div className="pins-row">
        {PINS.map(p => (
          <button
            key={p.emoji}
            className={`pin-btn ${scenePins[p.emoji] ? 'active' : ''}`}
            onClick={() => onPin(sceneId, p.emoji)}
            title={p.label}
          >
            <span className="pin-emoji">{p.emoji}</span>
            {scenePins[p.emoji] > 0 && (
              <span className="pin-count">{scenePins[p.emoji]}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── WELCOME SCREEN ──────────────────────────────────────────────────────────
function WelcomeScreen({ onStart }) {
  return (
    <div className="welcome-screen">
      <div className="welcome-content">
        <div className="welcome-iel">IEL</div>
        <div className="welcome-sub">for Architecture</div>
        <div className="welcome-divider" />
        <h1 className="welcome-title">Benvenuti,<br />{CLIENT_NAME}.</h1>
        <p className="welcome-body">
          Questa è la vostra futura casa.<br />
          Oggi esplorerete le decisioni progettuali<br />
          che cambieranno il modo in cui vivrete questo spazio.
        </p>
        <p className="welcome-project">{PROJECT_NAME}</p>
        <button className="welcome-btn" onClick={onStart}>
          Inizia il percorso →
        </button>
      </div>
      <div className="welcome-bg-glow" />
    </div>
  );
}

// ── DECISION SUMMARY ────────────────────────────────────────────────────────
function DecisionSummary({ pins, comments, onRestart }) {
  const allPins = SCENES.flatMap(s => {
    const sp = pins[s.id] || {};
    return Object.entries(sp).flatMap(([emoji, count]) =>
      count > 0 ? [{ scene: s.title, emoji, count }] : []
    );
  });

  const liked  = allPins.filter(p => p.emoji === '❤️');
  const ideas  = allPins.filter(p => p.emoji === '💡');
  const doubts = allPins.filter(p => p.emoji === '🤔');

  const allComments = SCENES.flatMap(s =>
    (comments[s.id] || []).map(c => ({ scene: s.title, text: c }))
  );

  const hasAnything = allPins.length > 0 || allComments.length > 0;

  return (
    <div className="summary-screen">
      <div className="summary-header">
        <span className="iel-wordmark">IEL</span>
        <span className="iel-sub">for Architecture</span>
      </div>
      <div className="summary-content">
        <h2 className="summary-title">Il vostro percorso</h2>
        <p className="summary-sub">{PROJECT_NAME}</p>

        {!hasAnything && (
          <p className="summary-empty">
            Esplorate il progetto e lasciate le vostre reazioni — qui troverete il riepilogo.
          </p>
        )}

        {liked.length > 0 && (
          <div className="summary-group">
            <div className="summary-group-label">❤️ Avete apprezzato</div>
            {liked.map((p, i) => (
              <div key={i} className="summary-item">{p.scene}</div>
            ))}
          </div>
        )}

        {doubts.length > 0 && (
          <div className="summary-group">
            <div className="summary-group-label">🤔 Avete dubbi su</div>
            {doubts.map((p, i) => (
              <div key={i} className="summary-item">{p.scene}</div>
            ))}
          </div>
        )}

        {ideas.length > 0 && (
          <div className="summary-group">
            <div className="summary-group-label">💡 Le vostre idee</div>
            {ideas.map((p, i) => (
              <div key={i} className="summary-item">{p.scene}</div>
            ))}
          </div>
        )}

        {allComments.length > 0 && (
          <div className="summary-group">
            <div className="summary-group-label">💬 Le vostre note</div>
            {allComments.map((c, i) => (
              <div key={i} className="summary-item">
                <span className="summary-item-scene">{c.scene} —</span> {c.text}
              </div>
            ))}
          </div>
        )}

        <button className="summary-send-btn">
          📩 Invia il feedback all'architetto
        </button>
        <button className="summary-restart" onClick={onRestart}>
          ← Torna al progetto
        </button>
      </div>
    </div>
  );
}

// ── MAIN APP ────────────────────────────────────────────────────────────────
export default function App() {
  const [phase, setPhase] = useState('welcome');
  const [activeScene, setActiveScene] = useState(0);
  const [activeMood, setActiveMood] = useState(MOODS[0]);
  const [pins, setPins] = useState({});
  const [replayOpen, setReplayOpen] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState({});
  const [commentOpen, setCommentOpen] = useState(false);
  const [shared, setShared] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const scene = SCENES[activeScene];

  useEffect(() => {
    setImageLoaded(false);
    setReplayOpen(false);
    setCommentOpen(false);
  }, [activeScene]);

  const handlePin = (sceneId, emoji) => {
    setPins(prev => ({
      ...prev,
      [sceneId]: {
        ...prev[sceneId],
        [emoji]: ((prev[sceneId] || {})[emoji] || 0) + 1,
      }
    }));
  };

  const handleComment = () => {
    if (!comment.trim()) return;
    const text = comment.trim();
    setComments(prev => ({
      ...prev,
      [scene.id]: [...(prev[scene.id] || []), text]
    }));
    setComment('');

    // Invio silenzioso all'architetto — invisibile al cliente.
    // Se fallisce (rete, funzione non ancora attiva) non blocca l'esperienza cliente.
    getDesignSuggestions(text, scene).then(({ reasoning, proposals }) => {
      const lycheePrompt = buildLycheePrompt(scene, text, proposals);
      fetch('/api/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sceneTitle: scene.title,
          sceneSubtitle: scene.subtitle,
          annotationText: text,
          reasoning,
          proposals,
          lycheePrompt,
        }),
      }).catch(() => {});
    }).catch(() => {});
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Villa 127/C — IEL for Architecture',
          text: 'Esplora il progetto in modo interattivo',
          url: SHARE_URL,
        });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch { setShowQR(true); }
    } else {
      setShowQR(v => !v);
    }
  };

  const sceneComments = comments[scene.id] || [];
  const isLastScene = activeScene === SCENES.length - 1;

  if (phase === 'welcome') return <WelcomeScreen onStart={() => setPhase('explore')} />;
  if (phase === 'summary') return (
    <DecisionSummary
      pins={pins}
      comments={comments}
      onRestart={() => { setPhase('explore'); setActiveScene(0); }}
    />
  );

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <span className="iel-wordmark">IEL</span>
          <span className="iel-sub">for Architecture</span>
        </div>
        <div className="header-right-row">
          <button className="summary-btn" onClick={() => setPhase('summary')}>Riepilogo</button>
          <button className={`share-btn-sm ${shared ? 'shared' : ''}`} onClick={handleShare}>
            {shared ? '✓' : '↑'}
          </button>
        </div>
      </header>

      <nav className="scene-nav">
        {SCENES.map((s, i) => (
          <button
            key={s.id}
            className={`nav-dot ${i === activeScene ? 'active' : ''}`}
            onClick={() => setActiveScene(i)}
          >
            <span className="nav-label">{s.label}</span>
          </button>
        ))}
      </nav>

      <div className="scene-wrap">
        {scene.images ? (
          <CompareSlider images={scene.images} />
        ) : (
          <div className="scene-img-wrap">
            <img
              key={scene.image}
              src={scene.image}
              alt={scene.title}
              className={`scene-img ${imageLoaded ? 'loaded' : ''}`}
              style={scene.mood ? { filter: activeMood.filter } : {}}
              onLoad={() => setImageLoaded(true)}
            />
            {!imageLoaded && <div className="img-skeleton" />}
          </div>
        )}

        {scene.mood && (
          <div className="mood-bar">
            {MOODS.map(m => (
              <button
                key={m.id}
                className={`mood-btn ${activeMood.id === m.id ? 'active' : ''}`}
                onClick={() => setActiveMood(m)}
              >{m.label}</button>
            ))}
          </div>
        )}
      </div>

      <div className="scene-info">
        <div className="scene-text">
          <p className="scene-subtitle">{scene.subtitle}</p>
          <h2 className="scene-title">{scene.title}</h2>
          <p className="scene-body">{scene.body}</p>
        </div>

        <div className="action-row">
          {scene.replay && (
            <button className="action-btn" onClick={() => setReplayOpen(v => !v)}>
              🧠 Perché questa scelta
            </button>
          )}
          <button className="action-btn" onClick={() => setCommentOpen(v => !v)}>
            💬 Commenta
          </button>
          {isLastScene && (
            <button className="action-btn action-btn-gold" onClick={() => setPhase('summary')}>
              ✓ Vedi riepilogo
            </button>
          )}
        </div>

        {replayOpen && scene.replay && (
          <div className="replay-panel">
            <p className="replay-title">Decision Replay</p>
            <p className="replay-text">{scene.replay}</p>
          </div>
        )}

        {commentOpen && (
          <div className="comment-panel">
            <div className="comment-input-row">
              <input
                className="comment-input"
                placeholder="Lasciate una nota su questa scena..."
                value={comment}
                onChange={e => setComment(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleComment()}
              />
              <button className="comment-send" onClick={handleComment}>→</button>
            </div>
            {sceneComments.length > 0 && (
              <div className="comment-list">
                {sceneComments.map((c, i) => (
                  <div key={i} className="comment-item">💬 {c}</div>
                ))}
              </div>
            )}
          </div>
        )}

        <DreamPins sceneId={scene.id} pins={pins} onPin={handlePin} />
      </div>

      {showQR && (
        <div className="qr-overlay" onClick={() => setShowQR(false)}>
          <div className="qr-panel" onClick={e => e.stopPropagation()}>
            <p className="qr-label">Scansionate per aprire</p>
            <QRCodeSVG value={SHARE_URL} size={180} bgColor="#ffffff" fgColor="#0a0a0a" level="M" />
            <p className="qr-url">{SHARE_URL}</p>
            <button className="qr-close" onClick={() => setShowQR(false)}>Chiudi</button>
          </div>
        </div>
      )}
    </div>
  );
}

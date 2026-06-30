import { useState, useEffect, useRef, useCallback } from "react";
import "./App.css";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const ARCHITECT_EMAIL = "cianiraffaella@gmail.com";
const CLIENT_NAME = "Gabriele e Ludovica";
const PROJECT_NAME = "Villa 127/C — Noicattaro";
const SESSION_NAME = "VISIONE";

// ─── PROJECT DNA ──────────────────────────────────────────────────────────────
const DNA_STORAGE_KEY = "iel_villa127c_dna";

function emptyDNA() {
  return {
    progetto: PROJECT_NAME,
    cliente: CLIENT_NAME,
    creato: new Date().toISOString(),
    stile: [],
    materiali: [],
    luce: [],
    privacy: [],
    outdoor: [],
    funzioni_richieste: [],
    elementi_rifiutati: [],
    decisioni_raw: {},
    reazioni: {},
    intenzioni_validate: [], // [{ area, intent_label, design_intent, ts }]
  };
}

function loadDNA() {
  try {
    const raw = localStorage.getItem(DNA_STORAGE_KEY);
    if (raw) return { ...emptyDNA(), ...JSON.parse(raw) };
  } catch {}
  return emptyDNA();
}
function saveDNA(dna) {
  try { localStorage.setItem(DNA_STORAGE_KEY, JSON.stringify(dna)); } catch {}
}
function appendToDNA(dna, decision, choiceKey) {
  const opt = choiceKey === "A" ? decision.optionA : decision.optionB;
  const next = { ...dna, decisioni_raw: { ...dna.decisioni_raw, [decision.id]: choiceKey } };
  for (const cat of opt.dnaTags) {
    if (!next[cat.field]) next[cat.field] = [];
    if (!next[cat.field].includes(cat.value)) next[cat.field] = [...next[cat.field], cat.value];
  }
  return next;
}
function setReaction(dna, decisionId, emoji) {
  return { ...dna, reazioni: { ...dna.reazioni, [decisionId]: emoji } };
}
function addValidatedIntent(dna, entry) {
  return { ...dna, intenzioni_validate: [...dna.intenzioni_validate, entry] };
}

const REACTIONS = [
  { emoji: "😍", label: "Mi piace molto", needsFollowup: false },
  { emoji: "🤔", label: "Ho dei dubbi", needsFollowup: true },
  { emoji: "❌", label: "Non mi convince", needsFollowup: true },
];

// Opzioni rapide per la conversazione AI dopo un disegno
const QUICK_INTENTS = [
  "Più privacy",
  "Più luce naturale",
  "Disposizione arredi migliore",
  "Più verde",
  "Costo più contenuto",
  "Altro…",
];

// ─── HOTSPOT MAP — zone predefinite per immagine, MVP ────────────────────────
// coordinate in percentuale rispetto all'immagine (x0-x1, y0-y1)
const HOTSPOTS = {
  piano_terra: [
    { name: "cucina", x0: 0.32, y0: 0.30, x1: 0.62, y1: 0.55 },
    { name: "living", x0: 0.55, y0: 0.55, x1: 0.92, y1: 0.95 },
    { name: "pranzo", x0: 0.78, y0: 0.30, x1: 1.0, y1: 0.58 },
    { name: "zona notte ospiti", x0: 0.0, y0: 0.0, x1: 0.32, y1: 0.55 },
  ],
  piano_primo: [
    { name: "camera padronale", x0: 0.0, y0: 0.0, x1: 0.45, y1: 0.5 },
    { name: "bagno", x0: 0.0, y0: 0.5, x1: 0.3, y1: 0.85 },
    { name: "zona living primo piano", x0: 0.45, y0: 0.3, x1: 1.0, y1: 1.0 },
  ],
};

function getHotspotName(decisionId, x, y) {
  const zones = HOTSPOTS[decisionId];
  if (!zones) return "questa zona";
  const hit = zones.find((z) => x >= z.x0 && x <= z.x1 && y >= z.y0 && y <= z.y1);
  return hit ? hit.name : "questa zona";
}

// ─── DECISIONS ────────────────────────────────────────────────────────────────
const DECISIONS = [
  {
    id: "piano_terra",
    session: "I",
    title: "Il Piano Terra",
    question: "Quale materia abita lo spazio del giorno?",
    subtitle: "Stessa planimetria, due trattamenti — cucina, living, pranzo",
    imageA: "/piano_terra1.png",
    imageB: "/piano_terra2.png",
    optionA: {
      label: "Versione I",
      tag: "Marmo continuo · Pareti bianche · Linee nette",
      description: "Superfici in marmo Calacatta.\nContinuità cromatica totale.\nNessuna interruzione materica.",
      dnaTags: [
        { field: "stile", value: "minimale e rarefatto" },
        { field: "materiali", value: "marmo continuo, superfici bianche" },
      ],
    },
    optionB: {
      label: "Versione II",
      tag: "Cemento e legno · Toni caldi · Texture a vista",
      description: "Cemento a vista, rovere naturale.\nLuce calda d'accento.\nMaterico, vissuto, stratificato.",
      dnaTags: [
        { field: "stile", value: "materico e contemporaneo" },
        { field: "materiali", value: "cemento a vista, rovere naturale" },
      ],
    },
  },
  {
    id: "piano_primo",
    session: "II",
    title: "Il Piano Primo",
    question: "La zona notte segue la stessa logica?",
    subtitle: "Stessa distribuzione, due trattamenti — coerenza o contrasto col piano terra",
    imageA: "/piano_primo_v1.png",
    imageB: "/piano_primo_v2.png",
    optionA: {
      label: "Versione I",
      tag: "Coerente col piano terra · Stesso linguaggio",
      description: "La zona notte prosegue\nil linguaggio del piano terra.\nUnità materica su tutta la casa.",
      dnaTags: [
        { field: "stile", value: "coerenza verticale tra i piani" },
        { field: "funzioni_richieste", value: "continuità materica piano terra/primo" },
      ],
    },
    optionB: {
      label: "Versione II",
      tag: "Carattere proprio · Atmosfera distinta",
      description: "Il piano primo si stacca.\nUna palette più intima.\nLa zona notte ha una voce propria.",
      dnaTags: [
        { field: "stile", value: "carattere distinto per la zona notte" },
        { field: "privacy", value: "separazione percettiva tra giorno e notte" },
      ],
    },
  },
];

const PLACEHOLDERS = [
  { id: "sezione_longitudinale", session: "III", kind: "SEZIONI", title: "Sezione Longitudinale", subtitle: "Altezze interne, relazione tra i piani, rapporto con il terreno." },
  { id: "sezione_trasversale", session: "III", kind: "SEZIONI", title: "Sezione Trasversale", subtitle: "Profondità della casa, distribuzione verticale degli ambienti." },
  { id: "prospetto_nord", session: "IV", kind: "PROSPETTI", title: "Prospetto Nord", subtitle: "Facciata principale, ingresso, rapporto con la strada." },
  { id: "prospetto_sud", session: "IV", kind: "PROSPETTI", title: "Prospetto Sud", subtitle: "Affaccio giardino, aperture verso il sole." },
  { id: "prospetto_est", session: "IV", kind: "PROSPETTI", title: "Prospetto Est", subtitle: "Fianco laterale, luce del mattino." },
  { id: "prospetto_ovest", session: "IV", kind: "PROSPETTI", title: "Prospetto Ovest", subtitle: "Fianco laterale, luce della sera." },
  { id: "piano_interrato", session: "V", kind: "VOLUMI", title: "Piano Interrato", subtitle: "Cantina, locali tecnici, eventuali spazi accessori." },
  { id: "giardino", session: "VI", kind: "ESTERNI", title: "Giardino e Pertinenze", subtitle: "Verde, percorsi, relazione tra costruito e paesaggio." },
];

// ─── AI: interpretazione micro-conversazione ─────────────────────────────────
async function interpretIntent({ area, quickIntent, freeNote }) {
  const systemPrompt = `Sei Project Intelligence di IEL, un sistema che trasforma le indicazioni di un cliente in intenzioni architettoniche validate.
Ricevi: l'area della casa segnata dal cliente, l'intento rapido scelto (o "Altro"), e una nota libera opzionale.
Genera UNA frase in italiano, in prima persona plurale empatica ("Capisco che vorreste...", "Ho capito che desiderate..."), che interpreta l'intenzione in termini architettonici concreti.
Rispondi SOLO con un oggetto JSON valido, senza markdown.
Formato: { "interpretation": "..." }`;

  const userPrompt = `Area segnata: ${area}
Intento rapido: ${quickIntent}
Nota libera del cliente: ${freeNote || "(nessuna)"}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  const data = await response.json();
  const text = data.content?.[0]?.text || "{}";
  try { return JSON.parse(text.replace(/```json|```/g, "").trim()); }
  catch { return { interpretation: `Capisco che per ${area} vorreste: ${quickIntent}${freeNote ? ` — ${freeNote}` : ""}.` }; }
}

async function generatePromptDraft(dna) {
  const systemPrompt = `Sei Project Intelligence di IEL, motore di decisione per progetti architettonici.
Ricevi un Project DNA strutturato (preferenze accumulate, reazioni, intenzioni validate dal cliente) e generi una BOZZA di prompt per Lychee Studio (generatore di render AI), in inglese, tecnico, pronto per essere modificato da un architetto prima dell'invio.
Rispondi SOLO con un oggetto JSON valido, senza markdown.
Formato:
{
  "design_intent": "ragionamento architettonico in italiano, 3-4 frasi",
  "lychee_prompt_draft": "prompt tecnico in inglese per Lychee Studio",
  "open_questions": ["...", "..."],
  "confidence": 75
}`;
  const userPrompt = `Project DNA attuale:\n${JSON.stringify(dna, null, 2)}\n\nGenera design intent e bozza prompt Lychee.`;
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  const data = await response.json();
  const text = data.content?.[0]?.text || "{}";
  try { return JSON.parse(text.replace(/```json|```/g, "").trim()); }
  catch { return null; }
}

// ─── HOOKS ────────────────────────────────────────────────────────────────────
function useInView(threshold = 0.2) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

function useParallax(externalRef) {
  const internalRef = useRef(null);
  const ref = externalRef || internalRef;
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    function onScroll() {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const vh = window.innerHeight;
      const center = rect.top + rect.height / 2;
      const p = (center - vh / 2) / (vh / 2 + rect.height / 2);
      setProgress(Math.max(-1, Math.min(1, p)));
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [ref]);
  return [ref, progress];
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth <= 768 : false);
  useEffect(() => {
    function onResize() { setIsMobile(window.innerWidth <= 768); }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return isMobile;
}

// ─── SMART IMAGE — forwardRef per permettere a DrawLayer di misurarla ───────
const Img = ({ src, fallback, alt, className, style, imgRef }) => {
  const [s, set] = useState(src);
  return (
    <img ref={imgRef} src={s} alt={alt} className={className} style={style}
      onError={() => { if (fallback && s !== fallback) set(fallback); }} />
  );
};

// ─── PROJECT INTELLIGENCE CARD — la micro-conversazione AI ──────────────────
// stati: "intent" (scegli cosa) -> "thinking" -> "confirm" (conferma interpretazione) -> "saved"
function ProjectIntelligenceCard({ area, onClose, onValidated }) {
  const [stage, setStage] = useState("intent");
  const [quickIntent, setQuickIntent] = useState(null);
  const [freeNote, setFreeNote] = useState("");
  const [interpretation, setInterpretation] = useState("");
  const [editing, setEditing] = useState(false);

  const pickIntent = async (intent) => {
    setQuickIntent(intent);
    if (intent === "Altro…") return; // aspetta la nota libera, poi submit manuale
    await runInterpretation(intent, "");
  };

  const submitFree = async () => {
    if (!freeNote.trim()) return;
    await runInterpretation(quickIntent || "Altro", freeNote);
  };

  const runInterpretation = async (intent, note) => {
    setStage("thinking");
    const minWait = new Promise((r) => setTimeout(r, 1400));
    const aiCall = interpretIntent({ area, quickIntent: intent, freeNote: note });
    const [, result] = await Promise.all([minWait, aiCall]);
    setInterpretation(result.interpretation);
    setStage("confirm");
  };

  const confirm = () => {
    onValidated({
      area,
      intent_label: quickIntent,
      design_intent: interpretation,
      ts: new Date().toISOString(),
    });
    setStage("saved");
    setTimeout(onClose, 1900);
  };

  return (
    <div className="pi-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="pi-card">
        <div className="pi-header">
          <span className="pi-brand">Project Intelligence</span>
          <button className="pi-close" onClick={onClose}>✕</button>
        </div>

        {stage === "intent" && (
          <>
            <p className="pi-noticed">Ho notato che hai segnato <strong>{area}</strong>.</p>
            <p className="pi-ask">Cosa vorresti migliorare qui?</p>
            <div className="pi-quick-grid">
              {QUICK_INTENTS.map((intent) => (
                <button
                  key={intent}
                  className={`pi-quick-btn ${quickIntent === intent ? "active" : ""}`}
                  onClick={() => pickIntent(intent)}
                >
                  {intent}
                </button>
              ))}
            </div>
            {quickIntent === "Altro…" && (
              <div className="pi-free-row">
                <input
                  className="pi-free-input"
                  placeholder="Scrivi cosa vorresti cambiare…"
                  value={freeNote}
                  onChange={(e) => setFreeNote(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") submitFree(); }}
                  autoFocus
                />
                <button className="pi-free-submit" onClick={submitFree}>→</button>
              </div>
            )}
          </>
        )}

        {stage === "thinking" && (
          <div className="pi-thinking">
            <div className="pi-thinking-icon">🧠</div>
            <p className="pi-thinking-text">Sto interpretando la vostra intenzione progettuale…</p>
            <div className="pi-thinking-bar"><div className="pi-thinking-fill" /></div>
          </div>
        )}

        {stage === "confirm" && (
          <>
            <p className="pi-noticed">Ho notato che hai segnato <strong>{area}</strong>.</p>
            {editing ? (
              <textarea
                className="pi-edit-textarea"
                value={interpretation}
                onChange={(e) => setInterpretation(e.target.value)}
                rows={3}
                autoFocus
              />
            ) : (
              <p className="pi-interpretation">{interpretation}</p>
            )}
            <div className="pi-confirm-actions">
              <button className="pi-btn-edit" onClick={() => setEditing((v) => !v)}>
                {editing ? "Fatto" : "✏ Modifica"}
              </button>
              <button className="pi-btn-confirm" onClick={confirm}>✓ Corretto</button>
            </div>
          </>
        )}

        {stage === "saved" && (
          <div className="pi-saved">
            <div className="pi-saved-check">✓</div>
            <p className="pi-saved-title">Aggiunto al Project DNA</p>
            <div className="pi-saved-detail">
              <span className="pi-saved-area">Area: {area}</span>
              <span className="pi-saved-intent">+ {quickIntent === "Altro…" ? freeNote : quickIntent}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── DRAW LAYER — overlay trasparente DIRETTAMENTE sopra l'immagine ─────────
function DrawLayer({ decisionId, imageRef, onMark }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const lastPoint = useRef(null);

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;
    const rect = img.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = "#c9a96e";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowColor = "rgba(201,169,110,0.6)";
    ctx.shadowBlur = 6;
  }, [imageRef]);

  useEffect(() => {
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [resize]);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const point = e.touches ? e.touches[0] : e;
    return {
      x: point.clientX - rect.left,
      y: point.clientY - rect.top,
    };
  };

  const start = (e) => {
    e.preventDefault();
    drawing.current = true;
    const p = getPos(e);
    lastPoint.current = p;
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };
  const move = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const p = getPos(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastPoint.current = p;
  };
  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    const canvas = canvasRef.current;
    const p = lastPoint.current;
    if (p) {
      const xPct = p.x / canvas.width;
      const yPct = p.y / canvas.height;
      const area = getHotspotName(decisionId, xPct, yPct);
      onMark(area);
    }
    // pulisce dopo un istante per lasciare vedere il segno
    setTimeout(() => {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }, 900);
  };

  return (
    <canvas
      ref={canvasRef}
      className="draw-layer-canvas"
      onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
      onTouchStart={start} onTouchMove={move} onTouchEnd={end}
    />
  );
}

// ─── REACTION BAR — con follow-up AI per reazioni dubbiose/negative ─────────
function ReactionBar({ decisionId, dna, onReact, onOpenIntelligence }) {
  const current = dna.reazioni[decisionId];
  const handle = (r) => {
    onReact(decisionId, r.emoji);
    if (r.needsFollowup) onOpenIntelligence("questa scelta");
  };
  return (
    <div className="reaction-bar">
      <span className="reaction-label">Come vi fa sentire questa scelta?</span>
      <div className="reaction-buttons">
        {REACTIONS.map((r) => (
          <button key={r.emoji} className={`reaction-btn ${current === r.emoji ? "active" : ""}`}
            onClick={() => handle(r)} title={r.label}>
            {r.emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── PROGRESS ─────────────────────────────────────────────────────────────────
function ProgressBar({ choices }) {
  const count = Object.keys(choices).length;
  const pct = (count / DECISIONS.length) * 100;
  return (
    <div className="progress-wrap">
      <div className="progress-inner">
        <span className="progress-session">{SESSION_NAME}</span>
        <div className="progress-track"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
        <span className="progress-count">{count}/{DECISIONS.length}</span>
      </div>
    </div>
  );
}

// ─── HERO ─────────────────────────────────────────────────────────────────────
function Hero({ onStart }) {
  const [v, setV] = useState(false);
  const [heroRef, progress] = useParallax();
  useEffect(() => { setTimeout(() => setV(true), 80); }, []);
  return (
    <section ref={heroRef} className="hero">
      <div className="hero-grid-bg" style={{ transform: `translateY(${progress * 120}px) scale(${1 + Math.abs(progress) * 0.22}) rotateX(${progress * 4}deg)` }} />
      <div className={`hero-body ${v ? "vis" : ""}`}>
        <div className="eyebrow">IEL · Project Intelligence</div>
        <h1 className="hero-h1">Villa<br />127/C</h1>
        <p className="hero-place">Noicattaro, Puglia · RC XRArch</p>
        <p className="hero-copy">
          Benvenuti, {CLIENT_NAME}.<br />
          Non state guardando immagini.<br />
          State conversando con il progetto.
        </p>
        <button className="btn-primary" onClick={onStart}>Inizia l'esperienza →</button>
        <div className="hero-meta">sessione VISIONE · Project Intelligence attiva</div>
      </div>
      <div className="scroll-hint">↓</div>
    </section>
  );
}

function LiveBuildNotice() {
  const [ref, inView] = useInView(0.3);
  return (
    <section ref={ref} className={`notice-section ${inView ? "in-view" : ""}`}>
      <div className="notice-inner">
        <div className="notice-icon">◐</div>
        <h3 className="notice-title">Un edificio che si costruisce con voi</h3>
        <p className="notice-body">
          Toccate, scegliete, disegnate sulle immagini. Ogni segno apre una breve
          conversazione con <strong>Project Intelligence</strong>, che interpreta la
          vostra intenzione e la trasforma in conoscenza architettonica validata.
          <br /><br />
          Il modello 3D si configurerà progressivamente su questa conoscenza —
          non state guardando un render statico, state costruendo il prossimo.
        </p>
      </div>
    </section>
  );
}

// ─── DESKTOP COMPARE CARD ─────────────────────────────────────────────────────
function CompareCard({ decision, onChoice, choices, dna, onReact, onOpenIntelligence }) {
  const [ref, inView] = useInView(0.15);
  const [, progress] = useParallax(ref);
  const chosen = choices[decision.id];
  const [hov, setHov] = useState(null);
  const imgRefA = useRef(null);
  const imgRefB = useRef(null);

  const baseScale = 1.22 - Math.abs(progress) * 0.22;
  const shiftA = progress * 54;
  const shiftB = progress * -54;
  const rotA = progress * 2.2;
  const rotB = progress * -2.2;

  return (
    <section ref={ref} className={`compare-section ${inView ? "in-view" : ""}`}>
      <div className="compare-header">
        <div className="session-tag">VISIONE · {decision.session}</div>
        <h2 className="decision-h2">{decision.title}</h2>
        <p className="decision-q">{decision.question}</p>
        <p className="decision-sub">{decision.subtitle}</p>
        <p className="draw-hint">✎ Tocca e disegna sull'immagine per segnalare un'area</p>
      </div>

      <div className="compare-grid">
        {["A", "B"].map((key) => {
          const o = key === "A" ? decision.optionA : decision.optionB;
          const img = key === "A" ? decision.imageA : decision.imageB;
          const shift = key === "A" ? shiftA : shiftB;
          const rot = key === "A" ? rotA : rotB;
          const imgRef = key === "A" ? imgRefA : imgRefB;
          return (
            <div key={key} className="compare-col">
              <div
                className={`compare-card ${chosen === key ? "chosen" : ""} ${hov === key ? "hov" : ""}`}
                onMouseEnter={() => setHov(key)}
                onMouseLeave={() => setHov(null)}
              >
                <div className="compare-img-wrap">
                  <Img
                    imgRef={imgRef}
                    src={img}
                    alt={o.label}
                    className="compare-img"
                    style={{ transform: `scale(${baseScale}) translateY(${shift}px) rotateZ(${rot}deg)` }}
                  />
                  <DrawLayer
                    decisionId={decision.id}
                    imageRef={imgRef}
                    onMark={(area) => onOpenIntelligence(area)}
                  />
                  <div className="compare-img-overlay" />
                  {chosen === key && <div className="compare-chosen-badge">✓ Scelto</div>}
                  <button className="compare-choose-overlay" onClick={() => onChoice(decision.id, key)}>
                    {chosen === key ? "✓ Versione scelta" : "Scegli questa versione"}
                  </button>
                </div>
                <div className="compare-label-block">
                  <span className="compare-option-name">{o.label}</span>
                  <span className="compare-option-tag">{o.tag}</span>
                  <span className="compare-option-desc">{o.description}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <ReactionBar decisionId={decision.id} dna={dna} onReact={onReact} onOpenIntelligence={onOpenIntelligence} />

      {chosen && <div className="confirmed-bar">Aggiunto al Project DNA — scorri per continuare ↓</div>}
    </section>
  );
}

// ─── MOBILE SWIPE COMPARE — fix gesture, draw layer overlay ─────────────────
function MobileCompareCard({ decision, onChoice, choices, dna, onReact, onOpenIntelligence }) {
  const [ref, inView] = useInView(0.15);
  const chosen = choices[decision.id];
  const [active, setActive] = useState("A");
  const imgRef = useRef(null);
  const touchStart = useRef(null);
  const stageRef = useRef(null);

  const onTouchStart = (e) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() };
  };
  const onTouchEnd = (e) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    const dt = Date.now() - touchStart.current.t;
    // swipe orizzontale veloce e dominante rispetto al verticale
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5 && dt < 600) {
      setActive((prev) => (prev === "A" ? "B" : "A"));
    }
    touchStart.current = null;
  };

  const opt = active === "A" ? decision.optionA : decision.optionB;
  const img = active === "A" ? decision.imageA : decision.imageB;

  return (
    <section ref={ref} className={`mcompare-section ${inView ? "in-view" : ""}`}>
      <div className="mcompare-header">
        <div className="session-tag">VISIONE · {decision.session}</div>
        <h2 className="decision-h2">{decision.title}</h2>
        <p className="decision-q">{decision.question}</p>
        <p className="draw-hint">✎ Disegna col dito per segnalare un'area</p>
      </div>

      <div className="mcompare-stage" ref={stageRef}>
        <div className="mcompare-swipe-zone" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <Img imgRef={imgRef} src={img} alt={opt.label} className="mcompare-img" />
        </div>
        <DrawLayer decisionId={decision.id} imageRef={imgRef} onMark={(area) => onOpenIntelligence(area)} />
        <div className="mcompare-img-overlay" />

        <div className="mcompare-dots">
          <span className={`mdot ${active === "A" ? "on" : ""}`} onClick={() => setActive("A")} />
          <span className={`mdot ${active === "B" ? "on" : ""}`} onClick={() => setActive("B")} />
        </div>
        <div className="mcompare-swipe-hint">← swipe →</div>
        <div className="mcompare-label">
          <span className="mcompare-name">{opt.label}</span>
          <span className="mcompare-tag">{opt.tag}</span>
        </div>
      </div>

      <p className="mcompare-desc">{opt.description}</p>

      <button className={`mcompare-choose ${chosen === active ? "chosen" : ""}`} onClick={() => onChoice(decision.id, active)}>
        {chosen === active ? "✓ Versione scelta" : `Scegli ${opt.label} →`}
      </button>

      <ReactionBar decisionId={decision.id} dna={dna} onReact={onReact} onOpenIntelligence={onOpenIntelligence} />

      {chosen && <div className="confirmed-bar">Aggiunto al Project DNA ↓</div>}
    </section>
  );
}

function PlaceholderCard({ item }) {
  const [ref, inView] = useInView(0.2);
  return (
    <section ref={ref} className={`placeholder-section ${inView ? "in-view" : ""}`}>
      <div className="placeholder-inner">
        <div className="placeholder-kind">{item.kind} · VISIONE {item.session}</div>
        <h3 className="placeholder-title">{item.title}</h3>
        <p className="placeholder-sub">{item.subtitle}</p>
        <div className="placeholder-frame"><span className="placeholder-frame-label">In arrivo</span></div>
      </div>
    </section>
  );
}

// ─── DNA + AI ENGINE ──────────────────────────────────────────────────────────
function DNAEngine({ choices, dna, sent, onSend }) {
  const [ref, inView] = useInView(0.08);
  const [aiOutput, setAiOutput] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [promptDraft, setPromptDraft] = useState("");
  const [editingPrompt, setEditingPrompt] = useState(false);
  const allDone = Object.keys(choices).length === DECISIONS.length;

  const runAI = useCallback(async () => {
    if (aiOutput || loading) return;
    setLoading(true); setError(false);
    try {
      const result = await generatePromptDraft(dna);
      setAiOutput(result);
      if (result?.lychee_prompt_draft) setPromptDraft(result.lychee_prompt_draft);
    } catch { setError(true); } finally { setLoading(false); }
  }, [dna, aiOutput, loading]);

  useEffect(() => { if (allDone && inView && !aiOutput && !loading) runAI(); }, [allDone, inView, aiOutput, loading, runAI]);

  const handleSend = () => {
    const dateStr = new Date().toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
    const dnaLines = DECISIONS.map((d) => {
      const choice = choices[d.id];
      if (!choice) return `⏳ ${d.title}: non scelto`;
      const opt = choice === "A" ? d.optionA : d.optionB;
      const reaction = dna.reazioni[d.id] ? ` ${dna.reazioni[d.id]}` : "";
      return `✅ ${d.title}: ${opt.label} — ${opt.tag}${reaction}`;
    }).join("\n");

    const dnaCategories = ["stile", "materiali", "luce", "privacy", "outdoor", "funzioni_richieste"]
      .filter((cat) => dna[cat]?.length)
      .map((cat) => `${cat.toUpperCase()}: ${dna[cat].join(", ")}`)
      .join("\n");

    const intentLines = dna.intenzioni_validate.length
      ? dna.intenzioni_validate.map((v) => `• [${v.area}] ${v.design_intent}`).join("\n")
      : "(nessuna intenzione validata)";

    const body = [
      `DECISION DNA — ${PROJECT_NAME}`, `Cliente: ${CLIENT_NAME}`, `Data: ${dateStr}`, `Sessione: ${SESSION_NAME}`, ``,
      `═══════════════════════════════════════`, `DECISIONI E REAZIONI`, `═══════════════════════════════════════`, ``,
      dnaLines, ``,
      `═══════════════════════════════════════`, `PROJECT DNA — sintesi accumulata`, `═══════════════════════════════════════`, ``,
      dnaCategories || "(nessuna categoria ancora popolata)", ``,
      `═══════════════════════════════════════`, `INTENZIONI VALIDATE (Project Intelligence)`, `═══════════════════════════════════════`, ``,
      intentLines, ``,
      ...(aiOutput ? [
        `═══════════════════════════════════════`, `DESIGN INTENT`, `═══════════════════════════════════════`, ``,
        aiOutput.design_intent || "", ``,
      ] : []),
      `═══════════════════════════════════════`, `PROMPT LYCHEE STUDIO (revisionato dall'architetto)`, `═══════════════════════════════════════`, ``,
      promptDraft || "(da generare)", ``,
      `═══════════════════════════════════════`, `Prossima sessione: MATERIA`, ``,
      `Generato da IEL · RC XRArch`,
    ].join("\n");

    const subject = `[IEL] Decision DNA · Villa 127/C · ${CLIENT_NAME}`;
    window.open(`mailto:${ARCHITECT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_blank");
    onSend();
  };

  return (
    <section ref={ref} className={`dna-section ${inView ? "in-view" : ""}`}>
      <div className="dna-inner">
        <div className="dna-eyebrow">Decision DNA · {SESSION_NAME}</div>
        <h2 className="dna-h2">Il vostro profilo progettuale</h2>
        <p className="dna-meta">{CLIENT_NAME} · {new Date().toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}</p>

        <div className="dna-list">
          {DECISIONS.map((d, i) => {
            const choice = choices[d.id];
            const opt = choice === "A" ? d.optionA : choice === "B" ? d.optionB : null;
            const reaction = dna.reazioni[d.id];
            return (
              <div key={d.id} className={`dna-row ${choice ? "confirmed" : "pending"}`} style={{ animationDelay: `${i * 0.1}s` }}>
                <span className="dna-row-icon">{choice ? "✅" : "⏳"}</span>
                <div className="dna-row-body">
                  <span className="dna-row-session">VISIONE · {d.session}</span>
                  <span className="dna-row-title">{d.title}</span>
                  {opt ? (
                    <>
                      <span className="dna-row-choice">{opt.label} {reaction || ""}</span>
                      <span className="dna-row-tag">{opt.tag}</span>
                    </>
                  ) : <span className="dna-row-missing">Non ancora scelto</span>}
                </div>
              </div>
            );
          })}
        </div>

        {dna.intenzioni_validate.length > 0 && (
          <div className="dna-intents-summary">
            <span className="dna-intents-label">{dna.intenzioni_validate.length} intenzioni validate da Project Intelligence</span>
            <div className="dna-intents-list">
              {dna.intenzioni_validate.map((v, i) => (
                <div key={i} className="dna-intent-chip">
                  <span className="dna-intent-chip-area">{v.area}</span>
                  <span className="dna-intent-chip-text">{v.design_intent}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {allDone && (
          <div className="ai-output-block">
            {loading && (
              <div className="ai-loading">
                <div className="ai-spinner" />
                <span>Project Intelligence sta elaborando il DNA…</span>
              </div>
            )}
            {error && <div className="ai-error">DNA registrato. L'analisi AI non è disponibile in questo momento.</div>}
            {aiOutput && !loading && (
              <div className="ai-panels">
                <div className="ai-panel">
                  <div className="ai-panel-label">Design Intent</div>
                  <p className="ai-panel-text">{aiOutput.design_intent}</p>
                </div>
                <div className="ai-panel ai-panel-code">
                  <div className="ai-panel-label">
                    Prompt Lychee Studio
                    <span className="ai-panel-badge">{editingPrompt ? "In modifica" : "Bozza — modificabile"}</span>
                  </div>
                  {editingPrompt ? (
                    <textarea className="ai-prompt-editor" value={promptDraft} onChange={(e) => setPromptDraft(e.target.value)} rows={6} />
                  ) : (
                    <p className="ai-panel-prompt">{promptDraft}</p>
                  )}
                  <button className="ai-edit-toggle" onClick={() => setEditingPrompt((v) => !v)}>
                    {editingPrompt ? "Conferma modifiche" : "Modifica prompt →"}
                  </button>
                </div>
                {aiOutput.open_questions?.length > 0 && (
                  <div className="ai-panel">
                    <div className="ai-panel-label">Domande ancora aperte</div>
                    <ul className="ai-questions">{aiOutput.open_questions.map((q, i) => <li key={i}>{q}</li>)}</ul>
                  </div>
                )}
                {aiOutput.confidence && (
                  <div className="ai-confidence">
                    <span>Chiarezza progettuale</span>
                    <div className="ai-conf-bar"><div className="ai-conf-fill" style={{ width: `${aiOutput.confidence}%` }} /></div>
                    <span>{aiOutput.confidence}%</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {!allDone && <p className="dna-incomplete">↑ Torna su e completa le {DECISIONS.length - Object.keys(choices).length} scelte mancanti.</p>}

        {allDone && !sent && (
          <button className="btn-primary btn-send" onClick={handleSend} disabled={loading}>
            {loading ? "Elaborazione in corso…" : "Invia il DNA all'architetto →"}
          </button>
        )}

        {sent && (
          <div className="sent-block">
            <div className="sent-star">✦</div>
            <p className="sent-title">Inviato a RC XRArch</p>
            <p className="sent-body">
              Raffaella riceverà il Project DNA completo, con tutte le intenzioni<br />
              validate da Project Intelligence e il prompt per la prossima iterazione.<br />
              <strong>Prossima sessione: MATERIA</strong>
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [started, setStarted] = useState(false);
  const [choices, setChoices] = useState({});
  const [dna, setDna] = useState(loadDNA);
  const [sent, setSent] = useState(false);
  const [piArea, setPiArea] = useState(null); // se non null, mostra ProjectIntelligenceCard
  const isMobile = useIsMobile();
  const firstRef = useRef(null);

  const handleStart = () => {
    setStarted(true);
    setTimeout(() => firstRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const handleChoice = (id, opt) => {
    setChoices((p) => ({ ...p, [id]: opt }));
    const decision = DECISIONS.find((d) => d.id === id);
    setDna((prev) => { const next = appendToDNA(prev, decision, opt); saveDNA(next); return next; });
  };

  const handleReact = (decisionId, emoji) => {
    setDna((prev) => { const next = setReaction(prev, decisionId, emoji); saveDNA(next); return next; });
  };

  const handleValidated = (entry) => {
    setDna((prev) => { const next = addValidatedIntent(prev, entry); saveDNA(next); return next; });
  };

  return (
    <div className="app">
      <Hero onStart={handleStart} />

      {started && (
        <>
          <div className="progress-sticky"><ProgressBar choices={choices} /></div>

          <div ref={firstRef}>
            <LiveBuildNotice />

            {DECISIONS.map((d) =>
              isMobile ? (
                <MobileCompareCard key={d.id} decision={d} onChoice={handleChoice} choices={choices} dna={dna}
                  onReact={handleReact} onOpenIntelligence={setPiArea} />
              ) : (
                <CompareCard key={d.id} decision={d} onChoice={handleChoice} choices={choices} dna={dna}
                  onReact={handleReact} onOpenIntelligence={setPiArea} />
              )
            )}

            {PLACEHOLDERS.map((p) => <PlaceholderCard key={p.id} item={p} />)}
          </div>

          <DNAEngine choices={choices} dna={dna} sent={sent} onSend={() => setSent(true)} />
        </>
      )}

      {piArea && (
        <ProjectIntelligenceCard
          area={piArea}
          onClose={() => setPiArea(null)}
          onValidated={handleValidated}
        />
      )}
    </div>
  );
}

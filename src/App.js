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
    sessioni_completate: [],
    stile: [],
    materiali: [],
    luce: [],
    privacy: [],
    outdoor: [],
    funzioni_richieste: [],
    elementi_rifiutati: [],
    decisioni_raw: {},
    reazioni: {},      // id decisione -> emoji
    annotazioni: {},   // id immagine -> [{ nota, hasDrawing }]
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
    if (!next[cat.field].includes(cat.value)) {
      next[cat.field] = [...next[cat.field], cat.value];
    }
  }
  return next;
}

function setReaction(dna, decisionId, emoji) {
  return { ...dna, reazioni: { ...dna.reazioni, [decisionId]: emoji } };
}

function setAnnotation(dna, imageKey, payload) {
  return { ...dna, annotazioni: { ...dna.annotazioni, [imageKey]: payload } };
}

// ─── REACTIONS ────────────────────────────────────────────────────────────────
const REACTIONS = [
  { emoji: "😍", label: "Mi piace molto" },
  { emoji: "🤔", label: "Ho dei dubbi" },
  { emoji: "❌", label: "Non mi convince" },
];

// ─── DECISIONS ────────────────────────────────────────────────────────────────
const DECISIONS = [
  {
    id: "piano_terra",
    session: "I",
    title: "Il Piano Terra",
    question: "Quale materia abita lo spazio del giorno?",
    subtitle: "Stessa planimetria, due trattamenti — cucina, living, pranzo",
    layout: "compare",
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
    layout: "compare",
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

// Placeholder strutturali — set completo
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

// ─── AI: PROMPT GENERATOR ─────────────────────────────────────────────────────
async function generatePromptDraft(dna) {
  const systemPrompt = `Sei l'AI di IEL, motore di decisione per progetti architettonici.
Ricevi un Project DNA strutturato (preferenze accumulate del cliente, comprese reazioni emotive e annotazioni libere) e generi una BOZZA di prompt per Lychee Studio (generatore di render AI), in inglese, tecnico, pronto per essere modificato da un architetto prima dell'invio.
Rispondi SOLO con un oggetto JSON valido, senza markdown, senza backtick.
Formato:
{
  "design_intent": "ragionamento architettonico in italiano, 3-4 frasi",
  "lychee_prompt_draft": "prompt tecnico in inglese per Lychee Studio",
  "open_questions": ["...", "..."],
  "confidence": 75
}`;

  const userPrompt = `Project DNA attuale:
${JSON.stringify(dna, null, 2)}

Genera design intent e bozza prompt Lychee.`;

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
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold }
    );
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
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 768 : false
  );
  useEffect(() => {
    function onResize() { setIsMobile(window.innerWidth <= 768); }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return isMobile;
}

// ─── SMART IMAGE ──────────────────────────────────────────────────────────────
function Img({ src, fallback, alt, className, style }) {
  const [s, set] = useState(src);
  return (
    <img
      src={s} alt={alt} className={className} style={style}
      onError={() => { if (fallback && s !== fallback) set(fallback); }}
    />
  );
}

// ─── DRAW + NOTE OVERLAY — disegno col dito + commento, per immagine ─────────
function DrawAnnotate({ imageKey, dna, onSave }) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(dna.annotazioni[imageKey]?.nota || "");
  const [hasDrawing, setHasDrawing] = useState(!!dna.annotazioni[imageKey]?.hasDrawing);
  const drawing = useRef(false);

  const getCtx = () => canvasRef.current?.getContext("2d");

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const rect = wrap.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    const ctx = getCtx();
    if (ctx) {
      ctx.strokeStyle = "#c9a96e";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [open, resizeCanvas]);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const point = e.touches ? e.touches[0] : e;
    return { x: point.clientX - rect.left, y: point.clientY - rect.top };
  };

  const start = (e) => {
    e.preventDefault();
    drawing.current = true;
    const { x, y } = getPos(e);
    const ctx = getCtx();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  const move = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const { x, y } = getPos(e);
    const ctx = getCtx();
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawing(true);
  };
  const end = () => { drawing.current = false; };

  const clear = () => {
    const ctx = getCtx();
    if (ctx && canvasRef.current) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    setHasDrawing(false);
  };

  const save = () => {
    onSave(imageKey, { nota: note, hasDrawing });
    setOpen(false);
  };

  const existing = dna.annotazioni[imageKey];

  if (!open) {
    return (
      <button className="annotate-trigger" onClick={() => setOpen(true)}>
        <span className="annotate-icon">✎</span>
        {existing && (existing.nota || existing.hasDrawing)
          ? "Modifica la tua nota"
          : "Disegna o scrivi una nota"}
      </button>
    );
  }

  return (
    <div className="annotate-panel">
      <div className="annotate-canvas-wrap" ref={wrapRef}>
        <canvas
          ref={canvasRef}
          className="annotate-canvas"
          onMouseDown={start}
          onMouseMove={move}
          onMouseUp={end}
          onMouseLeave={end}
          onTouchStart={start}
          onTouchMove={move}
          onTouchEnd={end}
        />
        <span className="annotate-hint">Disegna col dito o col mouse →</span>
      </div>
      <textarea
        className="annotate-note"
        placeholder="Aggiungi una nota — qualcosa che non rientra nelle domande…"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
      />
      <div className="annotate-actions">
        <button className="annotate-clear" onClick={clear}>Cancella segno</button>
        <button className="annotate-save" onClick={save}>Salva nota →</button>
      </div>
    </div>
  );
}

// ─── REACTION BAR ─────────────────────────────────────────────────────────────
function ReactionBar({ decisionId, dna, onReact }) {
  const current = dna.reazioni[decisionId];
  return (
    <div className="reaction-bar">
      <span className="reaction-label">Come ti fa sentire questa scelta?</span>
      <div className="reaction-buttons">
        {REACTIONS.map((r) => (
          <button
            key={r.emoji}
            className={`reaction-btn ${current === r.emoji ? "active" : ""}`}
            onClick={() => onReact(decisionId, r.emoji)}
            title={r.label}
          >
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
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
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
      <div
        className="hero-grid-bg"
        style={{ transform: `translateY(${progress * 90}px) scale(${1 + Math.abs(progress) * 0.15})` }}
      />
      <div className={`hero-body ${v ? "vis" : ""}`}>
        <div className="eyebrow">IEL · Interactive Experience Layer</div>
        <h1 className="hero-h1">Villa<br />127/C</h1>
        <p className="hero-place">Noicattaro, Puglia · RC XRArch</p>
        <p className="hero-copy">
          Benvenuti, {CLIENT_NAME}.<br />
          Ogni scelta che farete da qui in poi<br />
          costruisce il progetto, passo dopo passo.
        </p>
        <button className="btn-primary" onClick={onStart}>
          Inizia l'esperienza →
        </button>
        <div className="hero-meta">sessione VISIONE · 2 decisioni</div>
      </div>
      <div className="scroll-hint">↓</div>
    </section>
  );
}

// ─── LIVE BUILD NOTICE ────────────────────────────────────────────────────────
function LiveBuildNotice() {
  const [ref, inView] = useInView(0.3);
  return (
    <section ref={ref} className={`notice-section ${inView ? "in-view" : ""}`}>
      <div className="notice-inner">
        <div className="notice-icon">◐</div>
        <h3 className="notice-title">Un edificio che si costruisce con voi</h3>
        <p className="notice-body">
          Le immagini che vedrete da qui in avanti sono una base di partenza, non il
          progetto finale. Ogni scelta — piano terra, piano primo, sezioni,
          prospetti, interrato, giardino — viene registrata nel <strong>Project DNA</strong> della villa.
          <br /><br />
          Quando avrete completato le decisioni principali, il modello 3D si
          configurerà automaticamente su ciò che avete scelto insieme a Raffaella.
          Potete anche disegnare col dito direttamente sulle immagini, o lasciare
          una nota libera — tutto arriva all'architetto.
        </p>
      </div>
    </section>
  );
}

// ─── MOBILE SWIPE COMPARE — schermo intero, swipe per cambiare versione ─────
function MobileCompareCard({ decision, onChoice, choices, dna, onReact, onAnnotate }) {
  const [ref, inView] = useInView(0.15);
  const chosen = choices[decision.id];
  const [active, setActive] = useState("A"); // quale versione è in primo piano
  const touchStartX = useRef(null);

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) setActive((prev) => (prev === "A" ? "B" : "A"));
    touchStartX.current = null;
  };

  const opt = active === "A" ? decision.optionA : decision.optionB;
  const img = active === "A" ? decision.imageA : decision.imageB;
  const imageKey = `${decision.id}_${active}`;

  return (
    <section ref={ref} className={`mcompare-section ${inView ? "in-view" : ""}`}>
      <div className="mcompare-header">
        <div className="session-tag">VISIONE · {decision.session}</div>
        <h2 className="decision-h2">{decision.title}</h2>
        <p className="decision-q">{decision.question}</p>
      </div>

      <div
        className="mcompare-stage"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <Img src={img} alt={opt.label} className="mcompare-img" />
        <div className="mcompare-img-overlay" />

        <div className="mcompare-dots">
          <span className={`mdot ${active === "A" ? "on" : ""}`} onClick={() => setActive("A")} />
          <span className={`mdot ${active === "B" ? "on" : ""}`} onClick={() => setActive("B")} />
        </div>

        <div className="mcompare-swipe-hint">← swipe per confrontare →</div>

        <div className="mcompare-label">
          <span className="mcompare-name">{opt.label}</span>
          <span className="mcompare-tag">{opt.tag}</span>
        </div>
      </div>

      <p className="mcompare-desc">{opt.description}</p>

      <button
        className={`mcompare-choose ${chosen === active ? "chosen" : ""}`}
        onClick={() => onChoice(decision.id, active)}
      >
        {chosen === active ? "✓ Versione scelta" : `Scegli ${opt.label} →`}
      </button>

      <ReactionBar decisionId={decision.id} dna={dna} onReact={onReact} />
      <DrawAnnotate imageKey={imageKey} dna={dna} onSave={onAnnotate} />

      {chosen && <div className="confirmed-bar">Aggiunto al Project DNA ↓</div>}
    </section>
  );
}

// ─── DESKTOP COMPARE CARD ─────────────────────────────────────────────────────
function CompareCard({ decision, onChoice, choices, dna, onReact, onAnnotate }) {
  const [ref, inView] = useInView(0.15);
  const [, progress] = useParallax(ref);
  const chosen = choices[decision.id];
  const [hov, setHov] = useState(null);

  // parallax + zoom più marcato
  const baseScale = 1.14 - Math.abs(progress) * 0.14;
  const shiftA = progress * 36;
  const shiftB = progress * -36;

  return (
    <section ref={ref} className={`compare-section ${inView ? "in-view" : ""}`}>
      <div className="compare-header">
        <div className="session-tag">VISIONE · {decision.session}</div>
        <h2 className="decision-h2">{decision.title}</h2>
        <p className="decision-q">{decision.question}</p>
        <p className="decision-sub">{decision.subtitle}</p>
      </div>

      <div className="compare-grid">
        {["A", "B"].map((key, idx) => {
          const o = key === "A" ? decision.optionA : decision.optionB;
          const img = key === "A" ? decision.imageA : decision.imageB;
          const shift = key === "A" ? shiftA : shiftB;
          const imageKey = `${decision.id}_${key}`;
          return (
            <div key={key} className="compare-col">
              <button
                className={`compare-card ${chosen === key ? "chosen" : ""} ${hov === key ? "hov" : ""}`}
                onMouseEnter={() => setHov(key)}
                onMouseLeave={() => setHov(null)}
                onClick={() => onChoice(decision.id, key)}
              >
                <div className="compare-img-wrap">
                  <Img
                    src={img}
                    alt={o.label}
                    className="compare-img"
                    style={{ transform: `scale(${baseScale}) translateY(${shift}px)` }}
                  />
                  <div className="compare-img-overlay" />
                  {chosen === key && <div className="compare-chosen-badge">✓ Scelto</div>}
                </div>
                <div className="compare-label-block">
                  <span className="compare-option-name">{o.label}</span>
                  <span className="compare-option-tag">{o.tag}</span>
                  <span className="compare-option-desc">{o.description}</span>
                </div>
              </button>
              <DrawAnnotate imageKey={imageKey} dna={dna} onSave={onAnnotate} />
              {idx === 0 && <div className="compare-vs-desktop">o</div>}
            </div>
          );
        })}
      </div>

      <ReactionBar decisionId={decision.id} dna={dna} onReact={onReact} />

      {chosen && <div className="confirmed-bar">Aggiunto al Project DNA — scorri per continuare ↓</div>}
    </section>
  );
}

// ─── PLACEHOLDER CARD ─────────────────────────────────────────────────────────
function PlaceholderCard({ item }) {
  const [ref, inView] = useInView(0.2);
  return (
    <section ref={ref} className={`placeholder-section ${inView ? "in-view" : ""}`}>
      <div className="placeholder-inner">
        <div className="placeholder-kind">{item.kind} · VISIONE {item.session}</div>
        <h3 className="placeholder-title">{item.title}</h3>
        <p className="placeholder-sub">{item.subtitle}</p>
        <div className="placeholder-frame">
          <span className="placeholder-frame-label">In arrivo</span>
        </div>
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
    setLoading(true);
    setError(false);
    try {
      const result = await generatePromptDraft(dna);
      setAiOutput(result);
      if (result?.lychee_prompt_draft) setPromptDraft(result.lychee_prompt_draft);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [dna, aiOutput, loading]);

  useEffect(() => {
    if (allDone && inView && !aiOutput && !loading) runAI();
  }, [allDone, inView, aiOutput, loading, runAI]);

  const annotationEntries = Object.entries(dna.annotazioni || {}).filter(
    ([, v]) => v && (v.nota || v.hasDrawing)
  );
  const reactionEntries = Object.entries(dna.reazioni || {});

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

    const annotationLines = annotationEntries.length
      ? annotationEntries.map(([key, v]) => {
          const parts = [];
          if (v.hasDrawing) parts.push("[disegno presente]");
          if (v.nota) parts.push(`"${v.nota}"`);
          return `• ${key}: ${parts.join(" ")}`;
        }).join("\n")
      : "(nessuna annotazione libera)";

    const body = [
      `DECISION DNA — ${PROJECT_NAME}`,
      `Cliente: ${CLIENT_NAME}`,
      `Data: ${dateStr}`,
      `Sessione: ${SESSION_NAME}`,
      ``,
      `═══════════════════════════════════════`,
      `DECISIONI E REAZIONI`,
      `═══════════════════════════════════════`,
      ``,
      dnaLines,
      ``,
      `═══════════════════════════════════════`,
      `PROJECT DNA — sintesi accumulata`,
      `═══════════════════════════════════════`,
      ``,
      dnaCategories || "(nessuna categoria ancora popolata)",
      ``,
      `═══════════════════════════════════════`,
      `NOTE E DISEGNI DEL CLIENTE`,
      `═══════════════════════════════════════`,
      ``,
      annotationLines,
      ``,
      ...(aiOutput ? [
        `═══════════════════════════════════════`,
        `DESIGN INTENT`,
        `═══════════════════════════════════════`,
        ``,
        aiOutput.design_intent || "",
        ``,
      ] : []),
      `═══════════════════════════════════════`,
      `PROMPT LYCHEE STUDIO (revisionato dall'architetto)`,
      `═══════════════════════════════════════`,
      ``,
      promptDraft || "(da generare)",
      ``,
      `═══════════════════════════════════════`,
      `Prossima sessione: MATERIA`,
      ``,
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
        <p className="dna-meta">
          {CLIENT_NAME} · {new Date().toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}
        </p>

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
                  ) : (
                    <span className="dna-row-missing">Non ancora scelto</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {annotationEntries.length > 0 && (
          <div className="dna-annotations-summary">
            <span className="dna-annotations-label">
              {annotationEntries.length} {annotationEntries.length === 1 ? "nota lasciata" : "note lasciate"} sulle immagini
            </span>
          </div>
        )}

        {allDone && (
          <div className="ai-output-block">
            {loading && (
              <div className="ai-loading">
                <div className="ai-spinner" />
                <span>IEL AI sta elaborando il Project DNA…</span>
              </div>
            )}

            {error && (
              <div className="ai-error">DNA registrato. L'analisi AI non è disponibile in questo momento.</div>
            )}

            {aiOutput && !loading && (
              <div className="ai-panels">
                <div className="ai-panel">
                  <div className="ai-panel-label">Design Intent</div>
                  <p className="ai-panel-text">{aiOutput.design_intent}</p>
                </div>

                <div className="ai-panel ai-panel-code">
                  <div className="ai-panel-label">
                    Prompt Lychee Studio
                    <span className="ai-panel-badge">
                      {editingPrompt ? "In modifica" : "Bozza — modificabile"}
                    </span>
                  </div>
                  {editingPrompt ? (
                    <textarea
                      className="ai-prompt-editor"
                      value={promptDraft}
                      onChange={(e) => setPromptDraft(e.target.value)}
                      rows={6}
                    />
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
                    <ul className="ai-questions">
                      {aiOutput.open_questions.map((q, i) => <li key={i}>{q}</li>)}
                    </ul>
                  </div>
                )}

                {aiOutput.confidence && (
                  <div className="ai-confidence">
                    <span>Chiarezza progettuale</span>
                    <div className="ai-conf-bar">
                      <div className="ai-conf-fill" style={{ width: `${aiOutput.confidence}%` }} />
                    </div>
                    <span>{aiOutput.confidence}%</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {!allDone && (
          <p className="dna-incomplete">
            ↑ Torna su e completa le {DECISIONS.length - Object.keys(choices).length} scelte mancanti.
          </p>
        )}

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
              Raffaella riceverà il Project DNA, le vostre reazioni, le note<br />
              lasciate sulle immagini e il prompt per la prossima iterazione.<br />
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
  const isMobile = useIsMobile();
  const firstRef = useRef(null);

  const handleStart = () => {
    setStarted(true);
    setTimeout(() => firstRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const handleChoice = (id, opt) => {
    setChoices((p) => ({ ...p, [id]: opt }));
    const decision = DECISIONS.find((d) => d.id === id);
    setDna((prev) => {
      const next = appendToDNA(prev, decision, opt);
      saveDNA(next);
      return next;
    });
  };

  const handleReact = (decisionId, emoji) => {
    setDna((prev) => {
      const next = setReaction(prev, decisionId, emoji);
      saveDNA(next);
      return next;
    });
  };

  const handleAnnotate = (imageKey, payload) => {
    setDna((prev) => {
      const next = setAnnotation(prev, imageKey, payload);
      saveDNA(next);
      return next;
    });
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
                <MobileCompareCard
                  key={d.id}
                  decision={d}
                  onChoice={handleChoice}
                  choices={choices}
                  dna={dna}
                  onReact={handleReact}
                  onAnnotate={handleAnnotate}
                />
              ) : (
                <CompareCard
                  key={d.id}
                  decision={d}
                  onChoice={handleChoice}
                  choices={choices}
                  dna={dna}
                  onReact={handleReact}
                  onAnnotate={handleAnnotate}
                />
              )
            )}

            {PLACEHOLDERS.map((p) => (
              <PlaceholderCard key={p.id} item={p} />
            ))}
          </div>

          <DNAEngine choices={choices} dna={dna} sent={sent} onSend={() => setSent(true)} />
        </>
      )}
    </div>
  );
}

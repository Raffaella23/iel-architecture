import { useState, useEffect, useRef, useCallback } from "react";
import "./App.css";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const ARCHITECT_EMAIL = "cianiraffaella@gmail.com";
const CLIENT_NAME = "Gabriele e Ludovica";
const PROJECT_NAME = "Villa 127/C — Noicattaro";
const SESSION_NAME = "VISIONE";

// ─── PROJECT DNA SCHEMA ───────────────────────────────────────────────────────
// Questo oggetto cresce sessione dopo sessione (Visione → Materia → Luce → Dettaglio → Firma)
// Ogni categoria è un array: ogni scelta aggiunge un elemento, non sovrascrive.
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
    decisioni_raw: {}, // id decisione -> "A" | "B"
  };
}

function loadDNA() {
  try {
    const raw = localStorage.getItem(DNA_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return emptyDNA();
}

function saveDNA(dna) {
  try { localStorage.setItem(DNA_STORAGE_KEY, JSON.stringify(dna)); } catch {}
}

// Aggiunge il contributo di una decisione al Project DNA, in append, mai sovrascrivendo
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

// ─── DECISIONS — ancorate alle immagini reali, stesso confronto concettuale ──
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

// ─── AI: PROMPT GENERATOR DA PROJECT DNA ─────────────────────────────────────
async function generatePromptDraft(dna) {
  const systemPrompt = `Sei l'AI di IEL, motore di decisione per progetti architettonici.
Ricevi un Project DNA strutturato (preferenze accumulate del cliente) e generi una BOZZA di prompt per Lychee Studio (generatore di render AI), in inglese, tecnico, pronto per essere modificato da un architetto prima dell'invio.
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

// Parallax reale: calcola quanto la sezione è scrollata e restituisce un valore -1..1
// Accetta un ref esterno opzionale così può condividere lo stesso nodo DOM di useInView
function useParallax(externalRef) {
  const internalRef = useRef(null);
  const ref = externalRef || internalRef;
  const [progress, setProgress] = useState(0); // -1 (sopra) .. 0 (centro) .. 1 (sotto)
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

// ─── PROGRESS BAR ─────────────────────────────────────────────────────────────
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

// ─── HERO — con parallax sul background grid ─────────────────────────────────
function Hero({ onStart }) {
  const [v, setV] = useState(false);
  const [heroRef, progress] = useParallax();
  useEffect(() => { setTimeout(() => setV(true), 80); }, []);

  return (
    <section ref={heroRef} className="hero">
      <div
        className="hero-grid-bg"
        style={{ transform: `translateY(${progress * 60}px) scale(${1 + Math.abs(progress) * 0.08})` }}
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

// ─── LIVE BUILD NOTICE — spiega che il 3D si costruirà man mano ─────────────
function LiveBuildNotice() {
  const [ref, inView] = useInView(0.3);
  return (
    <section ref={ref} className={`notice-section ${inView ? "in-view" : ""}`}>
      <div className="notice-inner">
        <div className="notice-icon">◐</div>
        <h3 className="notice-title">Un edificio che si costruisce con voi</h3>
        <p className="notice-body">
          Le immagini che vedrete da qui in avanti sono una base di partenza, non il
          progetto finale. Ogni scelta che farete — piano terra, piano primo, sezioni,
          prospetti — viene registrata nel <strong>Project DNA</strong> della villa.
          <br /><br />
          Quando avrete completato le decisioni principali, il modello 3D si
          configurerà automaticamente sulla base di ciò che avete scelto insieme
          a Raffaella. Non state guardando un render statico — state costruendo
          il prossimo, passo dopo passo.
        </p>
      </div>
    </section>
  );
}

// ─── COMPARE CARD — con parallax cinematico vero ─────────────────────────────
function CompareCard({ decision, onChoice, choices }) {
  const [ref, inView] = useInView(0.15);
  const [, progress] = useParallax(ref); // condivide lo stesso nodo DOM di useInView
  const chosen = choices[decision.id];
  const [hov, setHov] = useState(null);

  // zoom scale legato allo scroll: immagini si "aprono" leggermente mentre la sezione è a centro schermo
  const baseScale = 1.08 - Math.abs(progress) * 0.08;
  const shiftA = progress * 18;
  const shiftB = progress * -18;

  return (
    <section ref={ref} className={`compare-section ${inView ? "in-view" : ""}`}>
      <div className="compare-header">
        <div className="session-tag">VISIONE · {decision.session}</div>
        <h2 className="decision-h2">{decision.title}</h2>
        <p className="decision-q">{decision.question}</p>
        <p className="decision-sub">{decision.subtitle}</p>
      </div>

      <div className="compare-grid">
        {/* OPTION A */}
        <button
          className={`compare-card ${chosen === "A" ? "chosen" : ""} ${hov === "A" ? "hov" : ""}`}
          onMouseEnter={() => setHov("A")}
          onMouseLeave={() => setHov(null)}
          onClick={() => { onChoice(decision.id, "A"); setZoomed("A"); }}
        >
          <div className="compare-img-wrap">
            <Img
              src={decision.imageA}
              alt={decision.optionA.label}
              className="compare-img"
              style={{ transform: `scale(${baseScale}) translateY(${shiftA}px)` }}
            />
            <div className="compare-img-overlay" />
            {chosen === "A" && <div className="compare-chosen-badge">✓ Scelto</div>}
          </div>
          <div className="compare-label-block">
            <span className="compare-option-name">{decision.optionA.label}</span>
            <span className="compare-option-tag">{decision.optionA.tag}</span>
            <span className="compare-option-desc">{decision.optionA.description}</span>
          </div>
        </button>

        <div className="compare-vs">o</div>

        {/* OPTION B */}
        <button
          className={`compare-card ${chosen === "B" ? "chosen" : ""} ${hov === "B" ? "hov" : ""}`}
          onMouseEnter={() => setHov("B")}
          onMouseLeave={() => setHov(null)}
          onClick={() => { onChoice(decision.id, "B"); setZoomed("B"); }}
        >
          <div className="compare-img-wrap">
            <Img
              src={decision.imageB}
              alt={decision.optionB.label}
              className="compare-img"
              style={{ transform: `scale(${baseScale}) translateY(${shiftB}px)` }}
            />
            <div className="compare-img-overlay" />
            {chosen === "B" && <div className="compare-chosen-badge">✓ Scelto</div>}
          </div>
          <div className="compare-label-block">
            <span className="compare-option-name">{decision.optionB.label}</span>
            <span className="compare-option-tag">{decision.optionB.tag}</span>
            <span className="compare-option-desc">{decision.optionB.description}</span>
          </div>
        </button>
      </div>

      {chosen && (
        <div className="confirmed-bar">
          Aggiunto al Project DNA — scorri per continuare ↓
        </div>
      )}
    </section>
  );
}

// ─── SECTION/PROSPETTO PLACEHOLDER — pronto per quando carichi i file ───────
function PlaceholderCard({ kind, title, subtitle }) {
  const [ref, inView] = useInView(0.2);
  return (
    <section ref={ref} className={`placeholder-section ${inView ? "in-view" : ""}`}>
      <div className="placeholder-inner">
        <div className="placeholder-kind">{kind}</div>
        <h3 className="placeholder-title">{title}</h3>
        <p className="placeholder-sub">{subtitle}</p>
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

  const handleSend = () => {
    const dateStr = new Date().toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
    const dnaLines = DECISIONS.map((d) => {
      const choice = choices[d.id];
      if (!choice) return `⏳ ${d.title}: non scelto`;
      const opt = choice === "A" ? d.optionA : d.optionB;
      return `✅ ${d.title}: ${opt.label} — ${opt.tag}`;
    }).join("\n");

    const dnaCategories = ["stile", "materiali", "luce", "privacy", "outdoor", "funzioni_richieste"]
      .filter((cat) => dna[cat]?.length)
      .map((cat) => `${cat.toUpperCase()}: ${dna[cat].join(", ")}`)
      .join("\n");

    const body = [
      `DECISION DNA — ${PROJECT_NAME}`,
      `Cliente: ${CLIENT_NAME}`,
      `Data: ${dateStr}`,
      `Sessione: ${SESSION_NAME}`,
      ``,
      `═══════════════════════════════════════`,
      `DECISIONI`,
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
            return (
              <div key={d.id} className={`dna-row ${choice ? "confirmed" : "pending"}`} style={{ animationDelay: `${i * 0.1}s` }}>
                <span className="dna-row-icon">{choice ? "✅" : "⏳"}</span>
                <div className="dna-row-body">
                  <span className="dna-row-session">VISIONE · {d.session}</span>
                  <span className="dna-row-title">{d.title}</span>
                  {opt ? (
                    <>
                      <span className="dna-row-choice">{opt.label}</span>
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

                {/* PROMPT EDITABILE DALL'ARCHITETTO */}
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
                  <button
                    className="ai-edit-toggle"
                    onClick={() => setEditingPrompt((v) => !v)}
                  >
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
              Raffaella riceverà il Project DNA, il Design Intent e il prompt<br />
              revisionato per la prossima iterazione in Lychee Studio.<br />
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

  return (
    <div className="app">
      <Hero onStart={handleStart} />

      {started && (
        <>
          <div className="progress-sticky"><ProgressBar choices={choices} /></div>

          <div ref={firstRef}>
            <LiveBuildNotice />

            {DECISIONS.map((d) => (
              <CompareCard key={d.id} decision={d} onChoice={handleChoice} choices={choices} />
            ))}

            <PlaceholderCard
              kind="VISIONE · III"
              title="Sezione Longitudinale"
              subtitle="Verrà mostrata qui non appena disponibile — mostrerà le altezze interne e la relazione tra i piani."
            />
            <PlaceholderCard
              kind="VISIONE · IV"
              title="Prospetto Principale"
              subtitle="Verrà mostrato qui non appena disponibile — definirà il rapporto pieni/vuoti sulla facciata."
            />
          </div>

          <DNAEngine choices={choices} dna={dna} sent={sent} onSend={() => setSent(true)} />
        </>
      )}
    </div>
  );
}

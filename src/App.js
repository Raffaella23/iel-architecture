import { useState, useEffect, useRef, useCallback } from "react";
import "./App.css";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const ARCHITECT_EMAIL = "cianiraffaella@gmail.com";
const CLIENT_NAME = "Gabriele e Ludovica";
const PROJECT_NAME = "Villa 127/C — Noicattaro";
const SESSION_NAME = "VISIONE";

// ─── DECISIONS ────────────────────────────────────────────────────────────────
const DECISIONS = [
  {
    id: "stile_casa",
    session: "I",
    title: "L'Anima della Casa",
    question: "Quale versione vi appartiene?",
    subtitle: "Stessa planimetria. Due mondi diversi.",
    layout: "compare", // special layout: side by side images
    imageA: "/piano_terra1.png",
    imageB: "/piano_terra2.png",
    optionA: {
      label: "Calacatta",
      tag: "Marmo bianco · Linee nette · Lusso freddo",
      description: "Superfici continue.\nBianco assoluto.\nPrecisione senza calore.",
      intent: "eleganza rarefatta, materiali freddi e pregiati, perfezione geometrica",
    },
    optionB: {
      label: "Terra",
      tag: "Toni naturali · Luce calda · Materia vissuta",
      description: "Cemento, legno, pietra.\nLuce che scalda.\nUna casa che si tocca.",
      intent: "calore materico, materiali naturali, atmosfera avvolgente",
    },
  },
  {
    id: "spazio",
    session: "II",
    title: "Lo Spazio",
    question: "Come volete vivere il piano terra?",
    subtitle: "Interiorità o apertura verso l'esterno?",
    layout: "standard",
    image: "/piano_terra2.png",
    imageCaption: "Piano Terra · Zona giorno",
    optionA: {
      label: "Dentro",
      tag: "Interni ottimizzati · Ogni metro pensato",
      description: "Focus sugli spazi interni.\nIl lusso dell'ordine.\nNessuno spazio sprecato.",
      intent: "ottimizzazione degli interni, spazi ben definiti e funzionali",
    },
    optionB: {
      label: "Fuori",
      tag: "Terrazza integrata · Vita all'aperto",
      description: "La vita si estende\nverso la terrazza.\nDentro e fuori dialogano.",
      intent: "connessione indoor-outdoor, terrazza come spazio abitabile",
    },
  },
  {
    id: "ingresso",
    session: "III",
    title: "L'Ingresso",
    question: "Il primo piano ha una voce propria?",
    subtitle: "Continuità o autonomia della zona notte?",
    layout: "standard",
    image: "/piano_primo_v1.png",
    imageFallback: "/piano_terra2.png",
    imageCaption: "Piano Primo · Zona notte",
    optionA: {
      label: "Un tutto",
      tag: "Flusso unico · Casa come organismo",
      description: "Un unico percorso.\nLa casa come sistema continuo.\nUn solo respiro.",
      intent: "continuità spaziale, flussi interni fluidi",
    },
    optionB: {
      label: "Due mondi",
      tag: "Ingresso indipendente · Rifugio separato",
      description: "Il primo piano\nha il suo ingresso.\nLa zona notte diventa un appartamento.",
      intent: "ingresso indipendente al primo piano, zona notte autonoma e privata",
    },
  },
  {
    id: "luce",
    session: "IV",
    title: "La Luce",
    question: "Come entra il cielo nella casa?",
    subtitle: "Luce controllata o confine che scompare?",
    layout: "standard",
    image: "/edificio1.png",
    imageFallback: "/piano_terra1.png",
    imageCaption: "Prospetto · Aperture",
    optionA: {
      label: "Misurata",
      tag: "Finestre tradizionali · Luce drammatica",
      description: "La luce è ospite controllato.\nDirezionata, drammatica.\nContrasti forti.",
      intent: "aperture tradizionali, luce direzionata e drammatica",
    },
    optionB: {
      label: "Totale",
      tag: "Vetrate a scomparsa · Dentro/fuori spariscono",
      description: "Vetrate a tutta altezza.\nInfissi a scomparsa.\nIl confine non esiste più.",
      intent: "vetrate a tutta altezza con infissi a scomparsa, massima permeabilità visiva",
    },
  },
  {
    id: "materiale",
    session: "V",
    title: "Il Materiale",
    question: "Cosa toccate ogni giorno?",
    subtitle: "Superfici continue o calore naturale?",
    layout: "standard",
    image: "/edificio2.png",
    imageFallback: "/piano_terra2.png",
    imageCaption: "Vista Esterna",
    optionA: {
      label: "Continuo",
      tag: "Cemento · Resina · Pietra levigata",
      description: "Una sola pelle.\nCemento, resina, pietra.\nLa perfezione della continuità.",
      intent: "materiali continui e omogenei, cemento resina pietra levigata",
    },
    optionB: {
      label: "Naturale",
      tag: "Rovere · Legno · Materiali che invecchiano bene",
      description: "Rovere naturale, legno.\nMateriali che raccontano il tempo.\nCalore autentico.",
      intent: "materiali naturali e caldi, rovere legno, estetica che migliora col tempo",
    },
  },
];

// ─── AI: DESIGN INTENT + LYCHEE PROMPT GENERATOR ────────────────────────────
async function generateDesignIntelligence(choices) {
  const decisionSummary = DECISIONS.map((d) => {
    const choice = choices[d.id];
    if (!choice) return null;
    const opt = choice === "A" ? d.optionA : d.optionB;
    return `- ${d.title}: "${opt.label}" — ${opt.intent}`;
  })
    .filter(Boolean)
    .join("\n");

  const systemPrompt = `Sei l'AI di IEL (Interactive Experience Layer), uno strumento professionale per studi di architettura.
Il tuo compito è trasformare le scelte di un cliente in tre output strutturati:
1. DESIGN INTENT: ragionamento architettonico (3-4 frasi, tono professionale, italiano)
2. CLIENT SUMMARY: riassunto leggibile per il cliente (tono caldo, italiano)
3. LYCHEE PROMPT: prompt ottimizzato per generazione AI di immagini architetturali (inglese, stile Lychee Studio)

Rispondi SOLO con un oggetto JSON valido, senza markdown, senza backtick, senza testo fuori dal JSON.
Formato esatto:
{
  "design_intent": "...",
  "client_summary": "...",
  "lychee_prompt": "...",
  "open_questions": ["...", "..."],
  "confidence": 85
}`;

  const userPrompt = `Progetto: ${PROJECT_NAME}
Clienti: ${CLIENT_NAME}
Sessione: ${SESSION_NAME}

Decisioni del cliente:
${decisionSummary}

Genera i tre output richiesti.`;

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
  try {
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch {
    return null;
  }
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

// ─── SMART IMAGE ──────────────────────────────────────────────────────────────
function Img({ src, fallback, alt, className, onClick }) {
  const [s, set] = useState(src);
  return (
    <img
      src={s} alt={alt} className={className} onClick={onClick}
      onError={() => { if (fallback && s !== fallback) set(fallback); }}
    />
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
  useEffect(() => { setTimeout(() => setV(true), 80); }, []);
  return (
    <section className="hero">
      <div className="hero-grid-bg" />
      <div className={`hero-body ${v ? "vis" : ""}`}>
        <div className="eyebrow">IEL · Interactive Experience Layer</div>
        <h1 className="hero-h1">Villa<br />127/C</h1>
        <p className="hero-place">Noicattaro, Puglia · RC XRArch</p>
        <p className="hero-copy">
          Benvenuti, {CLIENT_NAME}.<br />
          Cinque decisioni. Dieci minuti.<br />
          Il progetto prende la vostra forma.
        </p>
        <button className="btn-primary" onClick={onStart}>
          Inizia l'esperienza →
        </button>
        <div className="hero-meta">5 scelte · nessun testo · solo tap</div>
      </div>
      <div className="scroll-hint">↓</div>
    </section>
  );
}

// ─── COMPARE CARD (Decisione I — side by side) ────────────────────────────────
function CompareCard({ decision, onChoice, choices }) {
  const [ref, inView] = useInView(0.15);
  const chosen = choices[decision.id];
  const [hov, setHov] = useState(null);

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
          onClick={() => onChoice(decision.id, "A")}
        >
          <div className="compare-img-wrap">
            <Img src={decision.imageA} alt={decision.optionA.label} className="compare-img" />
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
          onClick={() => onChoice(decision.id, "B")}
        >
          <div className="compare-img-wrap">
            <Img src={decision.imageB} alt={decision.optionB.label} className="compare-img" />
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
          Scelta registrata nel DNA — scorri per continuare ↓
        </div>
      )}
    </section>
  );
}

// ─── STANDARD DECISION CARD ───────────────────────────────────────────────────
function DecisionCard({ decision, index, onChoice, choices }) {
  const [ref, inView] = useInView(0.2);
  const [hov, setHov] = useState(null);
  const chosen = choices[decision.id];
  const isEven = index % 2 === 0;

  return (
    <section
      ref={ref}
      className={`std-section ${inView ? "in-view" : ""} ${isEven ? "img-left" : "img-right"}`}
    >
      <div className="std-image-col">
        <Img
          src={decision.image}
          fallback={decision.imageFallback}
          alt={decision.imageCaption || decision.title}
          className={`std-image ${inView ? "img-vis" : ""}`}
        />
        <div className="std-image-overlay" />
        {decision.imageCaption && (
          <div className="std-image-caption">{decision.imageCaption}</div>
        )}
      </div>

      <div className={`std-content ${inView ? "content-vis" : ""}`}>
        <div className="session-tag">VISIONE · {decision.session}</div>
        <h2 className="decision-h2">{decision.title}</h2>
        <p className="decision-q">{decision.question}</p>
        <p className="decision-sub">{decision.subtitle}</p>

        <div className="std-choices">
          {["A", "B"].map((opt) => {
            const o = opt === "A" ? decision.optionA : decision.optionB;
            return (
              <button
                key={opt}
                className={`std-choice ${chosen === opt ? "chosen" : ""} ${hov === opt ? "hov" : ""}`}
                onMouseEnter={() => setHov(opt)}
                onMouseLeave={() => setHov(null)}
                onClick={() => onChoice(decision.id, opt)}
              >
                <div className="std-choice-top">
                  <span className="std-choice-label">{o.label}</span>
                  {chosen === opt && <span className="std-check">✓</span>}
                </div>
                <span className="std-choice-tag">{o.tag}</span>
                <span className="std-choice-desc">{o.description}</span>
              </button>
            );
          })}
        </div>

        {chosen && (
          <div className="confirmed-bar">Registrato — scorri per continuare ↓</div>
        )}
      </div>
    </section>
  );
}

// ─── DNA + AI OUTPUT ──────────────────────────────────────────────────────────
function DNAEngine({ choices, sent, onSend }) {
  const [ref, inView] = useInView(0.08);
  const [aiOutput, setAiOutput] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const allDone = Object.keys(choices).length === DECISIONS.length;

  const runAI = useCallback(async () => {
    if (aiOutput || loading) return;
    setLoading(true);
    setError(false);
    try {
      const result = await generateDesignIntelligence(choices);
      setAiOutput(result);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [choices, aiOutput, loading]);

  useEffect(() => {
    if (allDone && inView && !aiOutput && !loading) runAI();
  }, [allDone, inView, aiOutput, loading, runAI]);

  const handleSend = () => {
    const dateStr = new Date().toLocaleDateString("it-IT", {
      day: "numeric", month: "long", year: "numeric",
    });

    const dnaLines = DECISIONS.map((d) => {
      const choice = choices[d.id];
      if (!choice) return `⏳ ${d.title}: non scelto`;
      const opt = choice === "A" ? d.optionA : d.optionB;
      return `✅ ${d.title}: ${opt.label} — ${opt.tag}`;
    }).join("\n");

    const body = [
      `DECISION DNA — ${PROJECT_NAME}`,
      `Cliente: ${CLIENT_NAME}`,
      `Data: ${dateStr}`,
      `Sessione: ${SESSION_NAME}`,
      ``,
      `═══════════════════════════════════════`,
      `DECISION DNA`,
      `═══════════════════════════════════════`,
      ``,
      dnaLines,
      ``,
      ...(aiOutput ? [
        `═══════════════════════════════════════`,
        `DESIGN INTENT`,
        `═══════════════════════════════════════`,
        ``,
        aiOutput.design_intent || "",
        ``,
        `═══════════════════════════════════════`,
        `PROMPT LYCHEE STUDIO`,
        `═══════════════════════════════════════`,
        ``,
        aiOutput.lychee_prompt || "",
        ``,
        ...(aiOutput.open_questions?.length ? [
          `═══════════════════════════════════════`,
          `DOMANDE APERTE`,
          `═══════════════════════════════════════`,
          ``,
          ...aiOutput.open_questions.map((q) => `• ${q}`),
          ``,
        ] : []),
      ] : []),
      `═══════════════════════════════════════`,
      `Prossima sessione: MATERIA`,
      ``,
      `Generato da IEL · RC XRArch`,
    ].join("\n");

    const subject = `[IEL] Decision DNA · Villa 127/C · ${CLIENT_NAME}`;
    window.open(
      `mailto:${ARCHITECT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
      "_blank"
    );
    onSend();
  };

  return (
    <section ref={ref} className={`dna-section ${inView ? "in-view" : ""}`}>
      <div className="dna-inner">
        {/* HEADER */}
        <div className="dna-eyebrow">Decision DNA · {SESSION_NAME}</div>
        <h2 className="dna-h2">Il vostro profilo progettuale</h2>
        <p className="dna-meta">
          {CLIENT_NAME} · {new Date().toLocaleDateString("it-IT", {
            day: "numeric", month: "long", year: "numeric",
          })}
        </p>

        {/* DNA LIST */}
        <div className="dna-list">
          {DECISIONS.map((d, i) => {
            const choice = choices[d.id];
            const opt = choice === "A" ? d.optionA : choice === "B" ? d.optionB : null;
            return (
              <div
                key={d.id}
                className={`dna-row ${choice ? "confirmed" : "pending"}`}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
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

        {/* AI OUTPUT */}
        {allDone && (
          <div className="ai-output-block">
            {loading && (
              <div className="ai-loading">
                <div className="ai-spinner" />
                <span>IEL AI sta elaborando il vostro profilo…</span>
              </div>
            )}

            {error && (
              <div className="ai-error">
                DNA registrato. L'analisi AI non è disponibile in questo momento.
              </div>
            )}

            {aiOutput && !loading && (
              <div className="ai-panels">
                {/* DESIGN INTENT */}
                <div className="ai-panel">
                  <div className="ai-panel-label">Design Intent</div>
                  <p className="ai-panel-text">{aiOutput.design_intent}</p>
                </div>

                {/* CLIENT SUMMARY */}
                {aiOutput.client_summary && (
                  <div className="ai-panel ai-panel-warm">
                    <div className="ai-panel-label">Per voi</div>
                    <p className="ai-panel-text">{aiOutput.client_summary}</p>
                  </div>
                )}

                {/* LYCHEE PROMPT */}
                <div className="ai-panel ai-panel-code">
                  <div className="ai-panel-label">
                    Prompt Lychee Studio
                    <span className="ai-panel-badge">Pronto per la generazione</span>
                  </div>
                  <p className="ai-panel-prompt">{aiOutput.lychee_prompt}</p>
                </div>

                {/* OPEN QUESTIONS */}
                {aiOutput.open_questions?.length > 0 && (
                  <div className="ai-panel">
                    <div className="ai-panel-label">Domande ancora aperte</div>
                    <ul className="ai-questions">
                      {aiOutput.open_questions.map((q, i) => (
                        <li key={i}>{q}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* CONFIDENCE */}
                {aiOutput.confidence && (
                  <div className="ai-confidence">
                    <span>Chiarezza progettuale</span>
                    <div className="ai-conf-bar">
                      <div
                        className="ai-conf-fill"
                        style={{ width: `${aiOutput.confidence}%` }}
                      />
                    </div>
                    <span>{aiOutput.confidence}%</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ACTIONS */}
        {!allDone && (
          <p className="dna-incomplete">
            ↑ Torna su e completa le {DECISIONS.length - Object.keys(choices).length} scelte mancanti.
          </p>
        )}

        {allDone && !sent && (
          <button
            className="btn-primary btn-send"
            onClick={handleSend}
            disabled={loading}
          >
            {loading ? "Elaborazione in corso…" : "Invia il DNA all'architetto →"}
          </button>
        )}

        {sent && (
          <div className="sent-block">
            <div className="sent-star">✦</div>
            <p className="sent-title">Inviato a RC XRArch</p>
            <p className="sent-body">
              Raffaella riceverà il vostro Decision DNA, il Design Intent<br />
              e il prompt per la prossima iterazione in Lychee Studio.<br />
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
  const [sent, setSent] = useState(false);
  const firstRef = useRef(null);

  const handleStart = () => {
    setStarted(true);
    setTimeout(() => firstRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const handleChoice = (id, opt) => setChoices((p) => ({ ...p, [id]: opt }));

  return (
    <div className="app">
      <Hero onStart={handleStart} />

      {started && (
        <>
          <div className="progress-sticky">
            <ProgressBar choices={choices} />
          </div>

          <div ref={firstRef}>
            {DECISIONS.map((d, i) =>
              d.layout === "compare" ? (
                <CompareCard
                  key={d.id}
                  decision={d}
                  onChoice={handleChoice}
                  choices={choices}
                />
              ) : (
                <DecisionCard
                  key={d.id}
                  decision={d}
                  index={i}
                  onChoice={handleChoice}
                  choices={choices}
                />
              )
            )}
          </div>

          <DNAEngine
            choices={choices}
            sent={sent}
            onSend={() => setSent(true)}
          />
        </>
      )}
    </div>
  );
}

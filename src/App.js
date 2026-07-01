import { useState, useEffect, useRef, useCallback } from "react";
import "./App.css";

/* ─────────────────────────────────────────────
   CONFIG
───────────────────────────────────────────── */
const ARCHITECT_EMAIL = "cianiraffaella@gmail.com";
const CLIENT_NAME = "Gabriele e Ludovica";
const PROJECT_NAME = "Villa 127/C — Noicattaro";
const SESSION_NAME = "VISIONE";

/* ─────────────────────────────────────────────
   DNA STORAGE
───────────────────────────────────────────── */
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
    intenzioni_validate: [],
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
  try {
    localStorage.setItem(DNA_STORAGE_KEY, JSON.stringify(dna));
  } catch {}
}

function appendToDNA(dna, decision, choiceKey) {
  const opt = choiceKey === "A" ? decision.optionA : decision.optionB;

  const next = {
    ...dna,
    decisioni_raw: { ...dna.decisioni_raw, [decision.id]: choiceKey },
  };

  for (const cat of opt.dnaTags) {
    if (!next[cat.field]) next[cat.field] = [];
    if (!next[cat.field].includes(cat.value)) {
      next[cat.field] = [...next[cat.field], cat.value];
    }
  }

  return next;
}

/* ─────────────────────────────────────────────
   MOBILE DETECT
───────────────────────────────────────────── */
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return isMobile;
}

/* ─────────────────────────────────────────────
   APP
───────────────────────────────────────────── */
export default function App() {
  const [started, setStarted] = useState(false);
  const [choices, setChoices] = useState({});
  const [dna, setDna] = useState(loadDNA);
  const isMobile = useIsMobile();
  const firstRef = useRef(null);

  const handleChoice = (id, opt) => {
    setChoices((p) => ({ ...p, [id]: opt }));
  };

  return (
    <div className="app">

      {/* HERO */}
      <section className="hero">
        <div className="hero-content">
          <h1>Villa 127/C</h1>
          <p>Architectural Intelligence Interface</p>

          <button
            className="cta"
            onClick={() => {
              setStarted(true);
              setTimeout(() => {
                firstRef.current?.scrollIntoView({ behavior: "smooth" });
              }, 100);
            }}
          >
            Inizia esperienza
          </button>
        </div>
      </section>

      {/* CONTENT */}
      {started && (
        <div ref={firstRef} className="content">

          <div className="card">
            <h2>Piano Terra</h2>
            <p>Scegli la direzione progettuale</p>

            <div className="buttons">
              <button onClick={() => handleChoice("piano_terra", "A")}>
                Marmo / Minimal
              </button>

              <button onClick={() => handleChoice("piano_terra", "B")}>
                Legno / Materico
              </button>
            </div>
          </div>

          <div className="dna">
            <h3>Project DNA</h3>
            <pre>{JSON.stringify(dna, null, 2)}</pre>
          </div>

        </div>
      )}

    </div>
  );
}
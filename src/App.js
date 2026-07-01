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
function ProjectIntelligenceCard({ area, anchorX, anchorY, onClose, onValidated }) {
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

  const CARD_W = 320;
  const CARD_H = 360;
  const MARGIN = 16;
  const cardLeft = Math.max(MARGIN, Math.min((anchorX||window.innerWidth/2) - CARD_W/2, window.innerWidth - CARD_W - MARGIN));
  const spaceBelow = window.innerHeight - (anchorY||window.innerHeight/2) - MARGIN;
  const cardTop = spaceBelow > CARD_H + 20
    ? (anchorY||window.innerHeight/2) + 14
    : (anchorY||window.innerHeight/2) - CARD_H - 14;

  return (
    <div className="pi-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="pi-card" style={{ top: Math.max(MARGIN, cardTop), left: cardLeft }}>
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
function DrawLayer({ decisionId, imageRef, onMark }) { // onMark(area, {x,y})
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
      // position the PI card near the draw point on screen
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const anchorX = canvasRect.left + p.x;
      const anchorY = canvasRect.top + p.y;
      onMark(area, { x: anchorX, y: anchorY });
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
    if (r.needsFollowup) onOpenIntelligence("questa scelta", null);
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
// ─── WEBGL SHADER BACKGROUND ─────────────────────────────────────────────────
function ShaderBg() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function syncSize() {
      const w = canvas.clientWidth || 1280;
      const h = canvas.clientHeight || 720;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    }
    const ro = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(syncSize)
      : null;
    if (ro) ro.observe(canvas);
    syncSize();

    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) return;

    const vs = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main(){v_texCoord=a_position*.5+.5;gl_Position=vec4(a_position,0.,1.);}`;

    const fs = `precision highp float;
uniform float u_time;uniform vec2 u_resolution;uniform vec2 u_mouse;
varying vec2 v_texCoord;
float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);f=f*f*(3.-2.*f);
float a=hash(i),b=hash(i+vec2(1,0)),c=hash(i+vec2(0,1)),d=hash(i+vec2(1,1));
return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}
void main(){
vec2 uv=v_texCoord;
vec2 mouse=u_mouse/u_resolution;
vec2 grid=fract(uv*10.);
float gridLine=smoothstep(0.,.02,grid.x)*smoothstep(1.,.98,grid.x)*smoothstep(0.,.02,grid.y)*smoothstep(1.,.98,grid.y);
float n=noise(uv*3.+u_time*.1);
vec3 c1=vec3(.05,.05,.07),c2=vec3(.12,.11,.1),accent=vec3(.77,.64,.47);
vec3 col=mix(c1,c2,n);
float dist=distance(uv,mouse);
col+=accent*smoothstep(.4,.0,dist)*.15;
col=mix(col,col+.02,1.-gridLine);
gl_FragColor=vec4(col,1.);}`;

    function cs(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    }
    const prog = gl.createProgram();
    gl.attachShader(prog, cs(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, cs(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(prog, "a_position");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
    const uTime = gl.getUniformLocation(prog, "u_time");
    const uRes  = gl.getUniformLocation(prog, "u_resolution");
    const uMouse= gl.getUniformLocation(prog, "u_mouse");

    let mouse = { x: canvas.width / 2, y: canvas.height / 2 };
    const onMouse = (e) => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      mouse.x = ((e.clientX - rect.left) / rect.width) * canvas.width;
      mouse.y = (1 - (e.clientY - rect.top) / rect.height) * canvas.height;
    };
    window.addEventListener("mousemove", onMouse);

    let raf;
    function render(t) {
      syncSize();
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform1f(uTime, t * 0.001);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(render);
    }
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMouse);
      if (ro) ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.7, display: "block" }}
    />
  );
}

// ─── THREE.JS MONOLITH ────────────────────────────────────────────────────────
function MonolithCanvas() {
  const mountRef = useRef(null);
  useEffect(() => {
    const el = mountRef.current;
    if (!el || !window.THREE) return;
    const THREE = window.THREE;
    const w = el.clientWidth || 400;
    const h = el.clientHeight || 600;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
    camera.position.z = 5;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    el.appendChild(renderer.domElement);

    const geo = new THREE.BoxGeometry(2, 3, 0.5);
    const mat = new THREE.MeshPhongMaterial({ color: 0x1a1a1a, shininess: 100, specular: 0xc5a377, flatShading: true, transparent: true, opacity: 0.8 });
    const monolith = new THREE.Mesh(geo, mat);
    scene.add(monolith);

    const wireGeo = new THREE.BoxGeometry(2.2, 3.2, 0.7);
    const wireMat = new THREE.MeshBasicMaterial({ color: 0xc5a377, wireframe: true, transparent: true, opacity: 0.2 });
    const wireframe = new THREE.Mesh(wireGeo, wireMat);
    scene.add(wireframe);

    scene.add(new THREE.AmbientLight(0xffffff, 0.2));
    const pl = new THREE.PointLight(0xc5a377, 1);
    pl.position.set(5, 5, 5);
    scene.add(pl);
    const pl2 = new THREE.PointLight(0x4444ff, 0.5);
    pl2.position.set(-5, -5, 2);
    scene.add(pl2);

    let mouseX = 0, mouseY = 0;
    const onMouse = (e) => {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", onMouse);

    let raf;
    function animate() {
      raf = requestAnimationFrame(animate);
      monolith.rotation.y += 0.005;
      monolith.rotation.x += 0.002;
      wireframe.rotation.y += 0.005;
      wireframe.rotation.x += 0.002;
      monolith.position.x += (mouseX * 0.5 - monolith.position.x) * 0.05;
      monolith.position.y += (mouseY * 0.5 - monolith.position.y) * 0.05;
      wireframe.position.x = monolith.position.x;
      wireframe.position.y = monolith.position.y;
      renderer.render(scene, camera);
    }
    animate();

    const onResize = () => {
      const nw = el.clientWidth || w;
      const nh = el.clientHeight || h;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("resize", onResize);
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);
  return (
    <div
      ref={mountRef}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
    />
  );
}

// ─── HERO — WebGL + Three.js + contenuto ─────────────────────────────────────
function Hero({ onStart }) {
  const [v, setV] = useState(false);
  const [threeReady, setThreeReady] = useState(!!window.THREE);
  useEffect(() => { setTimeout(() => setV(true), 100); }, []);

  // Carica Three.js dinamicamente se non è ancora presente
  useEffect(() => {
    if (window.THREE) { setThreeReady(true); return; }
    const script = document.createElement("script");
    script.src = "https://ajax.googleapis.com/ajax/libs/threejs/r125/three.min.js";
    script.onload = () => setThreeReady(true);
    document.head.appendChild(script);
  }, []);

  // Parallax contenuto al mouse
  const contentRef = useRef(null);
  useEffect(() => {
    const onMouse = (e) => {
      if (!contentRef.current) return;
      const x = (e.clientX / window.innerWidth - 0.5) * 14;
      const y = (e.clientY / window.innerHeight - 0.5) * 14;
      contentRef.current.style.transform = `translate(${x * 0.4}px, ${y * 0.4}px)`;
    };
    window.addEventListener("mousemove", onMouse);
    return () => window.removeEventListener("mousemove", onMouse);
  }, []);

  return (
    <section className="hero hero-cinematic">
      {/* Shader WebGL */}
      <ShaderBg />

      {/* Griglia matematica */}
      <div className="hero-math-grid" />

      {/* Monolite 3D */}
      {threeReady && <MonolithCanvas />}

      {/* Nav top */}
      <header className="hero-nav">
        <div className="hero-nav-left">
          <span className="hero-nav-icon">⊞</span>
          <span className="hero-nav-brand">IEL ARCHITECT</span>
        </div>
        <div className="hero-nav-right">
          <span className="hero-nav-item active">PORTAL</span>
          <span className="hero-nav-item">DNA INDEX</span>
          <span className="hero-nav-item">COLLECTIONS</span>
        </div>
      </header>

      {/* Contenuto centrale */}
      <main className="hero-main" ref={contentRef}>
        <div className={`hero-content ${v ? "vis" : ""}`}>
          <p className="hero-location">NOICATTARO, PUGLIA · RC XRARCH</p>
          <div className="hero-title-wrap">
            <h1 className="hero-h1-cine">Villa 127/C</h1>
            <h1 className="hero-h1-shadow" aria-hidden="true">Villa 127/C</h1>
          </div>
          <p className="hero-copy-cine">
            Benvenuti, <strong>{CLIENT_NAME}</strong>. Non state guardando immagini.<br />
            State conversando con il progetto.
          </p>
          <button className="hero-cta" onClick={onStart}>
            <span>INIZIA L'ESPERIENZA</span>
            <span className="hero-cta-arrow">→</span>
          </button>
        </div>
      </main>

      {/* Footer hint */}
      <footer className="hero-footer">
        <div className="hero-footer-line" />
        <span className="hero-footer-arrow">⌄⌄</span>
        <div className="hero-footer-line" />
      </footer>

      {/* Bottom nav */}
      <nav className="hero-bottom-nav">
        <button className="hero-bnav-btn active">◉</button>
        <button className="hero-bnav-btn">⌖</button>
        <button className="hero-bnav-btn">◌</button>
      </nav>
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
                    onMark={(area, pos) => onOpenIntelligence(area, pos)}
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

// ─── MOBILE BEFORE/AFTER SLIDER ──────────────────────────────────────────────
function MobileCompareCard({ decision, onChoice, choices, dna, onReact, onOpenIntelligence }) {
  const [ref, inView] = useInView(0.15);
  const chosen = choices[decision.id];
  const [sliderX, setSliderX] = useState(50);
  const wrapRef = useRef(null);
  const imgARef = useRef(null);
  const dragging = useRef(false);

  const getPct = (clientX) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return 50;
    return Math.max(2, Math.min(98, ((clientX - rect.left) / rect.width) * 100));
  };
  const onPointerDown = (e) => {
    dragging.current = true;
    wrapRef.current?.setPointerCapture?.(e.pointerId);
    setSliderX(getPct(e.clientX));
  };
  const onPointerMove = (e) => { if (dragging.current) setSliderX(getPct(e.clientX)); };
  const onPointerUp = () => { dragging.current = false; };

  const dominantVersion = sliderX < 50 ? "B" : "A";

  return (
    <section ref={ref} className={`mcompare-section ${inView ? "in-view" : ""}`}>
      <div className="mcompare-header">
        <div className="session-tag">VISIONE · {decision.session}</div>
        <h2 className="decision-h2">{decision.title}</h2>
        <p className="decision-q">{decision.question}</p>
        <p className="draw-hint">✎ Trascina il cursore · Disegna per annotare</p>
      </div>

      <div
        ref={wrapRef}
        className="mcompare-slider-wrap"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <Img imgRef={imgARef} src={decision.imageA} alt={decision.optionA.label} className="mcompare-slider-img" />
        <Img
          src={decision.imageB}
          alt={decision.optionB.label}
          className="mcompare-slider-img mcompare-slider-img-b"
          style={{ clipPath: `inset(0 0 0 ${sliderX}%)` }}
        />
        <DrawLayer decisionId={decision.id} imageRef={imgARef} onMark={(area, pos) => onOpenIntelligence(area, pos)} />
        <div className="mcompare-slider-line" style={{ left: `${sliderX}%` }} />
        <div className="mcompare-slider-handle" style={{ left: `${sliderX}%` }}>⇔</div>
        <div className="mcompare-slider-labels">
          <span className="mcompare-slider-label">{decision.optionA.label}</span>
          <span className="mcompare-slider-label">{decision.optionB.label}</span>
        </div>
      </div>

      <div style={{ padding: "18px 24px 0" }}>
        <p className="mcompare-tag" style={{ marginBottom: 6 }}>
          {dominantVersion === "A" ? decision.optionA.tag : decision.optionB.tag}
        </p>
        <p className="mcompare-desc">
          {dominantVersion === "A" ? decision.optionA.description : decision.optionB.description}
        </p>
      </div>

      <div style={{ display: "flex", gap: 10, margin: "16px 24px 0" }}>
        {["A","B"].map((k) => {
          const o = k === "A" ? decision.optionA : decision.optionB;
          return (
            <button key={k} className={`mcompare-choose ${chosen === k ? "chosen" : ""}`}
              style={{ flex: 1, margin: 0 }} onClick={() => onChoice(decision.id, k)}>
              {chosen === k ? `✓ ${o.label}` : `Scegli ${o.label}`}
            </button>
          );
        })}
      </div>

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
  const [piState, setPiState] = useState(null); // {area, x, y} se non null
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
                  onReact={handleReact} onOpenIntelligence={(area, pos) => setPiState(pos ? { area, ...pos } : { area, x: window.innerWidth/2, y: window.innerHeight/2 })} />
              ) : (
                <CompareCard key={d.id} decision={d} onChoice={handleChoice} choices={choices} dna={dna}
                  onReact={handleReact} onOpenIntelligence={(area, pos) => setPiState(pos ? { area, ...pos } : { area, x: window.innerWidth/2, y: window.innerHeight/2 })} />
              )
            )}

            {PLACEHOLDERS.map((p) => <PlaceholderCard key={p.id} item={p} />)}
          </div>

          <DNAEngine choices={choices} dna={dna} sent={sent} onSend={() => setSent(true)} />
        </>
      )}

      {piState && (
        <ProjectIntelligenceCard
          area={piState.area} anchorX={piState.x} anchorY={piState.y}
          onClose={() => setPiState(null)}
          onValidated={handleValidated}
        />
      )}
    </div>
  );
}

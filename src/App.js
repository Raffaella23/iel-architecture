import React, { useState, useEffect, useRef, useCallback } from "react";
import "./App.css";

/* ============================================================
   IEL — Interactive Experience Layer — Villa 127/C
   App.js v0.9 — fix mirati, nessuna riscrittura

   v0.9.2 — Fix visibilità e privacy (di questa modifica):
   - Il contenuto sotto la Hero (decisioni, vista d'insieme, placeholder,
     invio feedback) è ora visibile SOLO dopo login. Prima del login si vede
     solo la Hero pubblica + invito ad accedere.
   - Project Intelligence: la griglia tecnica (materiali/rischi/benefici) e
     l'Inspiration Object (prompt Lychee) sono visibili SOLO al ruolo
     "architect". Il cliente vede solo il design_intent in linguaggio semplice.

   (log storico invariato sotto)
   ============================================================ */

const ARCHITECT_EMAIL = "cianiraffaella@gmail.com";
const DNA_STORAGE_KEY = "iel_villa127c_dna_v08";
const ANNOTATIONS_STORAGE_KEY = "iel_villa127c_annotations_v01";
const AUTH_STORAGE_KEY = "iel_villa127c_auth_v01";
const AUTH_USERS_STORAGE_KEY = "iel_villa127c_auth_users_v01";
const ADMIN_EMAIL = "cianiraffaella@gmail.com";
const ADMIN_PASSWORD = "2505";
const BASE_RENDER_PROMPT =
  "Villa 127/C, Noicattaro. Architectural design evolution grounded in local stone, calibrated light, domestic privacy, warm contemporary materiality, coherent indoor-outdoor continuity.";

const QUICK_CHOICES = [
  "Più privacy",
  "Più luce naturale",
  "Disposizione arredi",
  "Più verde",
  "Costo",
  "Altro…",
];

const DECISIONS = [
  {
    id: "piano_terra",
    title: "Piano Terra",
    eyebrow: "Sessione Visione — 01",
    hint: "Disegna sopra il piano per lasciare un segno (Edita), oppure scegli la versione.",
    optionA: {
      label: "Versione I",
      image: "/piano_terra1.png",
      desc: "Cucina e living rivestiti in marmo Calacatta, superfici lucide e continue.",
      materiale: "Marmo Calacatta",
    },
    optionB: {
      label: "Versione II",
      image: "/piano_terra2.png",
      desc: "Palette materica calda, texture naturali e finiture opache.",
      materiale: "Materica calda",
    },
    hotspots: {
      cucina: { xMin: 0, xMax: 0.35, yMin: 0, yMax: 0.5 },
      living: { xMin: 0.35, xMax: 0.7, yMin: 0, yMax: 0.5 },
      pranzo: { xMin: 0.35, xMax: 0.7, yMin: 0.5, yMax: 1 },
      "zona notte ospiti": { xMin: 0.7, xMax: 1, yMin: 0, yMax: 1 },
    },
  },
  {
    id: "piano_primo",
    title: "Piano Primo",
    eyebrow: "Sessione Visione — 02",
    hint: "Disegna sopra il piano per lasciare un segno (Edita), oppure scegli la versione.",
    optionA: {
      label: "Versione I",
      image: "/piano_primo_v1.png",
      desc: "Zona notte padronale con bagno en-suite separato.",
    },
    optionB: {
      label: "Versione II",
      image: "/piano_primo_v2.png",
      desc: "Zona notte aperta verso un piccolo living privato.",
    },
    hotspots: {
      "camera padronale": { xMin: 0, xMax: 0.5, yMin: 0, yMax: 0.6 },
      bagno: { xMin: 0.5, xMax: 0.75, yMin: 0, yMax: 0.6 },
      "living primo piano": { xMin: 0, xMax: 1, yMin: 0.6, yMax: 1 },
    },
  },
];

const PLACEHOLDERS = [
  { id: "sezione_long", label: "Sezione longitudinale", icon: "▤", image: "/Placeholdersez1.png", fallbackImage: "/edificio1.png" },
  { id: "sezione_trasv", label: "Sezione trasversale", icon: "▥", image: "/Placeholdersez2.png", fallbackImage: "/edificio2.png" },
  { id: "prospetto_nord", label: "Prospetto Nord", icon: "◧", image: "/edificio2.png", fallbackImage: "/edificio1.png" },
  { id: "prospetto_sud", label: "Prospetto Sud", icon: "◨", image: "/PlaceholderProspettosud.png", fallbackImage: "/edificio1.png" },
  { id: "prospetto_est", label: "Prospetto Est", icon: "◩", image: "/Placeholderprospettoest.png", fallbackImage: "/edificio2.png" },
  { id: "prospetto_ovest", label: "Prospetto Ovest", icon: "◪", image: "/PlaceholderProspettoOvest.png", fallbackImage: "/edificio2.png" },
  { id: "interrato", label: "Piano interrato", icon: "▨", image: "/PlaceholderPianoInterrato.png", fallbackImage: "/piano_terra1.png" },
  { id: "giardino", label: "Giardino e pertinenze", icon: "❖", image: "/PlaceholderVistaprospettica.png", fallbackImage: "/edificio1.png" },
];

function emptyDNA() {
  return {
    progetto: "Villa 127/C — Noicattaro",
    cliente: "Gabriele e Ludovica",
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
    dna_updates: [],
    inspiration_objects: [],
    render_prompt_current: BASE_RENDER_PROMPT,
    render_prompt_history: [
      {
        version: 1,
        prompt: BASE_RENDER_PROMPT,
        reason: "Baseline architettonica iniziale del progetto.",
        area: "progetto generale",
        confidence: 0.6,
        ts: new Date().toISOString(),
      },
    ],
    system_feedback: [],
  };
}

function AnnotationMarks({ annotations, onOpen }) {
  return (
    <>
      {annotations.map((ann) => (
        <button
          key={ann.id}
          type="button"
          className="annotation-mark"
          style={{ left: `${ann.xRatio * 100}%`, top: `${ann.yRatio * 100}%` }}
          onClick={(e) => {
            e.stopPropagation();
            onOpen(ann);
          }}
          title={ann.area}
        >
          <span className="annotation-mark__dot" />
        </button>
      ))}
    </>
  );
}

function loadDNA() {
  try {
    const raw = localStorage.getItem(DNA_STORAGE_KEY);
    if (!raw) return emptyDNA();
    const parsed = JSON.parse(raw);
    return { ...emptyDNA(), ...parsed };
  } catch {
    return emptyDNA();
  }
}

function loadAuthUsers() {
  const seed = [{ email: ADMIN_EMAIL, password: ADMIN_PASSWORD, role: "architect" }];
  try {
    const raw = localStorage.getItem(AUTH_USERS_STORAGE_KEY);
    if (!raw) return seed;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return seed;
    return parsed.some((user) => user.email === ADMIN_EMAIL) ? parsed : [...parsed, seed[0]];
  } catch {
    return seed;
  }
}

function loadAuthSession() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function loadAnnotations() {
  try {
    const raw = localStorage.getItem(ANNOTATIONS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function createAnnotationRecord({ decisionId, optionKey, area, localAnchor, frameRect }) {
  return {
    id: `ann_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    decisionId,
    optionKey,
    area,
    xRatio: frameRect.width ? localAnchor.x / frameRect.width : 0.5,
    yRatio: frameRect.height ? localAnchor.y / frameRect.height : 0.5,
    createdAt: new Date().toISOString(),
    status: "active",
    quickChoice: null,
    customText: "",
    aiResult: null,
    suggestion: "",
  };
}

function buildArchitecturalInterpretation({ area, quickChoice, customText }) {
  const request = (customText || quickChoice || "miglioramento spaziale").trim();
  const cleanRequest = request.replace(/\?+$/, "").trim();
  const style = request.toLowerCase().includes("privacy")
    ? "contemporary private retreat"
    : request.toLowerCase().includes("luce")
    ? "light-driven mediterranean minimalism"
    : request.toLowerCase().includes("verde")
    ? "indoor-outdoor mediterranean living"
    : "warm contemporary architectural refinement";
  const materials = request.toLowerCase().includes("caldo")
    ? ["rovere naturale", "intonaco minerale caldo", "pietra locale spazzolata"]
    : ["travertino chiaro", "rovere naturale", "microcemento opaco"];
  const colors = request.toLowerCase().includes("verde")
    ? ["sabbia", "salvia", "bronzo ossidato"]
    : ["avorio caldo", "pietra chiara", "bronzo brunito"];
  const lighting = request.toLowerCase().includes("luce")
    ? "Ampliare l'apporto zenitale e laterale con controllo dell'abbagliamento, integrazione di luce indiretta serale e gerarchia luminosa per profondità spaziale."
    : "Consolidare una luce calda stratificata: tagli indiretti, accent lighting su materiali e sorgenti schermate per comfort visivo serale.";
  const atmosphere = request.toLowerCase().includes("privacy")
    ? "Atmosfera raccolta, protetta e più introspettiva."
    : "Atmosfera calma, architettonica e materica, con leggibilità chiara dei volumi.";
  const functional = request.toLowerCase().includes("arredi")
    ? "Riorganizzare i pieni e i vuoti per rendere gli arredi parte della sequenza architettonica, migliorando percorrenze e zone di sosta."
    : "Ottimizzare uso, transizioni e leggibilità dell'area segnata mantenendo coerenza con il progetto generale.";
  const risks = request.toLowerCase().includes("luce")
    ? ["Possibile eccesso di abbagliamento senza schermature", "necessità di coordinare nuove aperture con il linguaggio di facciata"]
    : ["Rischio di sovraccarico materico se non calibrato", "necessità di verificare costo e manutenzione nel dettaglio esecutivo"];
  const benefits = [
    "Migliore coerenza tra uso quotidiano e intenzione architettonica",
    "Incremento della qualità percettiva e della leggibilità dello spazio",
  ];
  const contextual = [
    "Verificare allineamento con la palette già presente nel Project DNA",
    `Coordinare l'intervento con l'area ${area} senza interrompere la continuità compositiva della villa`,
  ];
  // Formato fisso a "citazione + risposta": evita di incollare la domanda grezza
  // dentro un template che assume una frase-obiettivo (es. "più luce"), non una domanda.
  const proposal = {
    interpretation: `Osservazione del cliente sull'area ${area}: "${cleanRequest}".`,
    design_intent: `Per l'area ${area}, rispetto a "${cleanRequest}": ${functional} ${atmosphere}`,
    materials,
    lighting_strategy: lighting,
    atmosphere,
    functional_improvements: functional,
    risks,
    benefits,
    contextual_recommendations: contextual,
    confidence: request.toLowerCase().includes("altro") ? 0.67 : 0.82,
  };
  return {
    interpretation: proposal.interpretation,
    design_intent: proposal.design_intent,
    open_questions: ["Verificare con il cliente il livello di priorità rispetto alle altre aree annotate."],
    system_feedback: `Il cliente ha annotato l'area ${area} con la richiesta: "${cleanRequest}".`,
    proposal,
    inspiration_object: {
      style,
      materials,
      colors,
      lighting: lighting,
      keywords: [area, request, "villa contemporanea", "Puglia", "architettura domestica"],
      image_prompt: `Architectural concept render for Villa 127/C in Noicattaro, focus on ${area}, ${style}, materials: ${materials.join(", ")}, colors: ${colors.join(", ")}, lighting: ${lighting}, atmosphere: ${atmosphere}, high-detail architectural visualization, no furniture catalog style, coherent Mediterranean contemporary residence.`,
    },
  };
}

function appendUniqueValues(list, values) {
  return [...new Set([...(list || []), ...(values || []).filter(Boolean)])];
}

function buildDNAUpdate({ annotationId, area, aiResult, quickChoice }) {
  const proposal = aiResult.proposal || {};
  return {
    annotationId: annotationId || null,
    reason: aiResult.interpretation || `Annotazione confermata su ${area}`,
    affected_area: area,
    confidence: proposal.confidence || 0.72,
    timestamp: new Date().toISOString(),
    quick_choice: quickChoice || null,
    materials: proposal.materials || [],
    lighting: proposal.lighting_strategy || "",
    atmosphere: proposal.atmosphere || "",
  };
}

function extendRenderPrompt(currentPrompt, area, aiResult) {
  const proposal = aiResult.proposal || {};
  const additions = [
    `Area ${area}`,
    proposal.atmosphere,
    ...(proposal.materials || []),
    proposal.lighting_strategy,
  ].filter(Boolean);
  const delta = additions.join(" · ");
  return delta && !currentPrompt.includes(delta) ? `${currentPrompt} | ${delta}` : currentPrompt;
}

/* ---------------- AI LAYER — output JSON rigoroso ---------------- */

async function askProjectIntelligence({ area, quickChoice, customText }) {
  const userPayload = {
    area,
    quickChoice: quickChoice || null,
    customText: customText || null,
    project: "Villa 127/C, Noicattaro",
    clients: "Gabriele & Ludovica",
  };

  try {
    const response = await fetch("/api/ai-intelligence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userPayload),
    });
    const parsed = await response.json();
    if (!parsed || parsed.error) throw new Error("ai-intelligence non disponibile");
    const fallback = buildArchitecturalInterpretation({ area, quickChoice, customText });
    return {
      interpretation: parsed.interpretation || fallback.interpretation,
      design_intent: parsed.design_intent || fallback.design_intent,
      open_questions: Array.isArray(parsed.open_questions) ? parsed.open_questions : fallback.open_questions,
      system_feedback: parsed.system_feedback || fallback.system_feedback,
      proposal: parsed.proposal || fallback.proposal,
      inspiration_object: parsed.inspiration_object || fallback.inspiration_object,
    };
  } catch (err) {
    return buildArchitecturalInterpretation({ area, quickChoice, customText });
  }
}

/* ---------------- IMMAGINI DI RIFERIMENTO (Unsplash, via api/reference-images.js) ---------------- */

// Libreria vocabolario "quiet luxury / mediterranean" — rende le ricerche
// immagine coerenti con il linguaggio estetico reale del progetto invece di
// restare generiche. Elenco curato a mano, non AI: copre i casi frequenti.
const DESIGN_LIBRARY = {
  styles: [
    "luxury contemporary architecture",
    "Mediterranean modernism",
    "quiet luxury interior design",
    "timeless residential design",
  ],
  landscape: [
    "Mediterranean garden",
    "olive trees courtyard",
    "outdoor living pergola",
    "luxury swimming pool",
  ],
  lighting: [
    "architectural lighting design",
    "hidden indirect lighting",
    "natural daylight interior",
  ],
  decoration: [
    "custom luxury furniture",
    "designer furniture",
    "indoor greenery",
  ],
};

// Traduce i materiali/colori italiani già usati nel testo del motore a
// regole nel termine inglese equivalente, solo per la ricerca immagine —
// il testo italiano mostrato al cliente resta invariato.
const MATERIAL_IT_EN = {
  "travertino chiaro": "travertine",
  "rovere naturale": "oak wood",
  "microcemento opaco": "microcement",
  "intonaco minerale caldo": "lime plaster",
  "pietra locale spazzolata": "brushed limestone",
};
function materialEn(it) {
  return MATERIAL_IT_EN[it] || it;
}

const COLOR_IT_EN = {
  "sabbia": "sand beige",
  "salvia": "sage green",
  "bronzo ossidato": "oxidized bronze",
  "avorio caldo": "warm ivory",
  "pietra chiara": "light stone",
  "bronzo brunito": "burnished bronze",
};
function colorEn(it) {
  return COLOR_IT_EN[it] || it;
}

// Sceglie uno stile della libreria in modo deterministico in base all'area,
// così la stessa area riannotata più volte resta coerente nello stile cercato.
function pickStyleTerm(area) {
  const pool = DESIGN_LIBRARY.styles;
  let hash = 0;
  const a = area || "";
  for (let i = 0; i < a.length; i++) hash = (hash * 31 + a.charCodeAt(i)) % 997;
  return pool[hash % pool.length];
}

// Unsplash è un catalogo in inglese: tradurre l'area (es. "cucina") aumenta
// drasticamente la pertinenza e il tasso di successo della ricerca.
const AREA_EN_MAP = [
  ["zona notte ospiti", "guest bedroom"],
  ["camera padronale", "master bedroom"],
  ["living primo piano", "upper floor living room"],
  ["cucina", "kitchen"],
  ["pranzo", "dining room"],
  ["bagno", "bathroom"],
  ["living", "living room"],
  ["giardino", "garden"],
  ["area generica", "house interior"],
];

function translateArea(area) {
  const a = (area || "").toLowerCase();
  for (const [it, en] of AREA_EN_MAP) {
    if (a.includes(it)) return en;
  }
  return "villa interior architecture";
}

async function tryFetchImage(query, page = 1) {
  try {
    const res = await fetch("/api/reference-images", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, page }),
    });
    const data = await res.json();
    return data && data.imageUrl ? { url: data.imageUrl, credit: data.imageCredit, query } : null;
  } catch {
    return null;
  }
}

async function fetchReferenceImages(queries, fallbackQuery) {
  const uniqueQueries = [...new Set((queries || []).filter(Boolean))].slice(0, 4);
  const seenUrls = new Set();
  const results = [];
  // Sequenziale (non Promise.all): serve per sapere, tentativo dopo tentativo,
  // quali URL sono già stati usati ed evitare di mostrare la stessa foto due volte.
  for (let i = 0; i < uniqueQueries.length; i++) {
    const query = uniqueQueries[i];
    let result = await tryFetchImage(query);
    if (result && seenUrls.has(result.url)) result = null; // scarta un doppione esatto
    if (!result && fallbackQuery && fallbackQuery !== query) {
      // Pagina diversa ad ogni tentativo di riserva, altrimenti la stessa query
      // generica ripesca sempre la stessa prima foto per più slot contemporaneamente.
      result = await tryFetchImage(fallbackQuery, i + 1);
      if (result && seenUrls.has(result.url)) result = null;
    }
    if (result) {
      seenUrls.add(result.url);
      results.push(result);
    }
  }
  return results;
}

// Parole-chiave riconosciute nella richiesta del cliente (italiano -> termine
// inglese per Unsplash). Elenco finito: copre i casi comuni, non sostituisce
// una vera comprensione del linguaggio (per quello serve la AI reale).
const REQUEST_KEYWORD_MAP = [
  ["mobil", "custom luxury furniture"],
  ["arred", "custom luxury furniture"],
  ["divano", "sofa"],
  ["poltrona", "armchair"],
  ["tavolo", "dining table"],
  ["sedi", "chairs"],
  ["letto", "bed"],
  ["armadio", "wardrobe"],
  ["luce", "architectural lighting design"],
  ["illumina", "architectural lighting design"],
  ["lampad", "lamp"],
  ["pavimento", "flooring"],
  ["rivestiment", "natural stone cladding"],
  ["facciat", "mediterranean facade architecture"],
  ["finestra", "window"],
  ["porta", "door"],
  ["terrazza", "outdoor living terrace"],
  ["scala", "staircase"],
  ["colore", "color palette"],
  ["tappeto", "rug"],
  ["libreria", "bookshelf"],
  ["verde", "Mediterranean garden greenery"],
  ["giardino", "Mediterranean garden"],
  ["piscina", "luxury swimming pool"],
  ["outdoor", "outdoor living space"],
  ["wellness", "wellness spa interior"],
];

function extractRequestKeywordEn(request) {
  const r = (request || "").toLowerCase();
  for (const [it, en] of REQUEST_KEYWORD_MAP) {
    if (r.includes(it)) return en;
  }
  return null;
}

function buildImageQueries(area, inspirationObject, request) {
  const areaEn = translateArea(area);
  const requestEn = extractRequestKeywordEn(request);
  const styleTerm = pickStyleTerm(area);

  if (!inspirationObject) {
    return [requestEn ? `${requestEn} ${areaEn}` : `${styleTerm} ${areaEn}`];
  }

  const { materials = [], colors = [] } = inspirationObject;
  const mat0 = materials[0] ? materialEn(materials[0]) : null;
  const mat1 = materials[1] ? materialEn(materials[1]) : null;
  const col0 = colors[0] ? colorEn(colors[0]) : null;

  const queries = [
    requestEn ? `${requestEn} ${areaEn}` : `${styleTerm} ${areaEn}`,
    mat0 ? `${mat0} ${areaEn}` : `${styleTerm} interior`,
    requestEn && mat0 ? `${mat0} ${requestEn}` : (mat1 ? `${mat1} interior design` : `${styleTerm} interior design`),
    col0 ? `${col0} ${areaEn} luxury interior` : `${areaEn} architectural detail`,
  ];
  return [...new Set(queries.filter(Boolean))];
}

/* ---------------- HERO: shader bronzo + monolite Three.js ---------------- */

function HeroShaderCanvas() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext("webgl");
    if (!gl) return;

    const resize = () => {
      canvas.width = canvas.clientWidth * devicePixelRatio;
      canvas.height = canvas.clientHeight * devicePixelRatio;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    const vertSrc = `attribute vec2 a_pos; void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }`;
    const fragSrc = `
      precision mediump float;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;
      uniform float u_time;
      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        vec2 m = u_mouse;
        float d = distance(uv, m);
        float glow = smoothstep(0.7, 0.0, d) * 0.55;
        float flicker = 0.04 * sin(u_time * 0.6 + uv.x * 8.0);
        vec3 bronze = vec3(0.72, 0.53, 0.31);
        vec3 base = vec3(0.05, 0.047, 0.039);
        vec3 color = base + bronze * (glow + flicker * 0.3);
        gl_FragColor = vec4(color, 1.0);
      }`;

    function compile(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    }

    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vertSrc));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fragSrc));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );
    const posLoc = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "u_resolution");
    const uMouse = gl.getUniformLocation(prog, "u_mouse");
    const uTime = gl.getUniformLocation(prog, "u_time");

    let raf;
    const start = performance.now();
    const draw = () => {
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform2f(uMouse, mouseRef.current.x, 1.0 - mouseRef.current.y);
      gl.uniform1f(uTime, (performance.now() - start) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      raf = requestAnimationFrame(draw);
    };
    draw();

    const onMove = (e) => {
      mouseRef.current = { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight };
    };
    window.addEventListener("pointermove", onMove);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return <canvas ref={canvasRef} className="hero__shader-canvas" />;
}

function HeroMonolith() {
  const mountRef = useRef(null);

  useEffect(() => {
    let renderer, scene, camera, mesh, raf;
    let disposed = false;

    function ensureThree(cb) {
      if (window.THREE) return cb();
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
      script.onload = cb;
      document.body.appendChild(script);
    }

    ensureThree(() => {
      if (disposed) return;
      const THREE = window.THREE;
      const mount = mountRef.current;
      if (!mount) return;

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(45, mount.clientWidth / mount.clientHeight, 0.1, 100);
      camera.position.z = 6;

      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      mount.appendChild(renderer.domElement);

      const geo = new THREE.IcosahedronGeometry(1.6, 0);
      const wire = new THREE.WireframeGeometry(geo);
      mesh = new THREE.LineSegments(wire, new THREE.LineBasicMaterial({ color: 0xd9a866 }));
      scene.add(mesh);

      const onResize = () => {
        if (!mount) return;
        camera.aspect = mount.clientWidth / mount.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(mount.clientWidth, mount.clientHeight);
      };
      window.addEventListener("resize", onResize);

      const animate = () => {
        if (disposed) return;
        mesh.rotation.y += 0.0025;
        mesh.rotation.x += 0.0012;
        renderer.render(scene, camera);
        raf = requestAnimationFrame(animate);
      };
      animate();

      mountRef.current._cleanup = () => {
        window.removeEventListener("resize", onResize);
        cancelAnimationFrame(raf);
        renderer.dispose();
      };
    });

    return () => {
      disposed = true;
      if (mountRef.current && mountRef.current._cleanup) mountRef.current._cleanup();
    };
  }, []);

  return <div ref={mountRef} className="hero__monolith-canvas" />;
}

/* ---------------- TOP NAV + BOTTOM NAV ---------------- */

function TopNav({ active, onNavigate, authSession, onOpenLogin, onLogout }) {
  const items = [
    { id: "progetto", label: "Progetto" },
    { id: "edita", label: "Edita" },
    { id: "intelligence", label: "Intelligence" },
    { id: "dna", label: "DNA" },
  ];
  return (
    <nav className="top-nav">
      <span className="top-nav__brand">IEL ARCHITECT</span>
      <div className="top-nav__links">
        {items.map((it) => (
          <button
            key={it.id}
            className={"top-nav__link" + (active === it.id ? " is-active" : "")}
            onClick={() => onNavigate(it.id)}
          >
            {it.label}
          </button>
        ))}
      </div>
      <div className="top-nav__session-wrap">
        {authSession ? (
          <>
            <span className="top-nav__session">{authSession.email}</span>
            <button className="top-nav__session-btn" onClick={onLogout}>Esci</button>
          </>
        ) : (
          <button className="top-nav__session-btn" onClick={onOpenLogin}>Accedi</button>
        )}
      </div>
    </nav>
  );
}

function BottomNav({ onNavigate }) {
  return (
    <div className="bottom-nav">
      <button className="bottom-nav__btn" onClick={() => onNavigate("progetto")} aria-label="Home">
        🏠
      </button>
      <button className="bottom-nav__btn" onClick={() => onNavigate("edita")} aria-label="Edita">
        ✎
      </button>
      <button className="bottom-nav__btn" onClick={() => onNavigate("dna")} aria-label="DNA">
        🧬
      </button>
    </div>
  );
}

function LoginOverlay({ open, authError, form, mode, onModeChange, onChange, onEmailAccess, onAdminAccess, onRegister, onProviderClick, onClose }) {
  if (!open) return null;

  return (
    <div className="login-overlay" onClick={onClose}>
      <div className="login-panel" onClick={(e) => e.stopPropagation()}>
        <div className="login-panel__eyebrow">Ingresso protetto</div>
        <h2 className="login-panel__title">{mode === "login" ? "Accedi al progetto" : "Registrati al progetto"}</h2>
        <p className="login-panel__body">
          La Hero resta pubblica. Tutto il resto del progetto (decisioni, materiali, DNA) richiede accesso.
        </p>

        <div className="login-panel__switch">
          <button
            type="button"
            className={"login-panel__switch-btn" + (mode === "login" ? " is-active" : "")}
            onClick={() => onModeChange("login")}
          >
            Accedi
          </button>
          <button
            type="button"
            className={"login-panel__switch-btn" + (mode === "register" ? " is-active" : "")}
            onClick={() => onModeChange("register")}
          >
            Registrati
          </button>
        </div>

        <div className="login-panel__providers">
          {[
            ["google", "Google"],
            ["apple", "Apple"],
            ["microsoft", "Microsoft"],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              className="login-provider-btn"
              onClick={() => onProviderClick(label)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="login-panel__divider">oppure</div>

        <div className="login-panel__form">
          <input
            className="login-input"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => onChange("email", e.target.value)}
          />
          <input
            className="login-input"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => onChange("password", e.target.value)}
          />
          <button type="button" className="login-submit-btn" onClick={onEmailAccess}>
            {mode === "login" ? "Accedi con email" : "Accedi con email"}
          </button>
          {mode === "login" && (
            <button type="button" className="login-submit-btn login-submit-btn--secondary" onClick={onAdminAccess}>
              Entra come admin
            </button>
          )}
          {mode === "register" && (
            <button type="button" className="login-submit-btn login-submit-btn--secondary" onClick={onRegister}>
              Registrati
            </button>
          )}
        </div>

        <div className="login-panel__note">
          Stato attuale: accesso locale prototipo via email. Admin abilitato: {ADMIN_EMAIL}. Google / Apple / Microsoft verranno attivati con Firebase su Vercel.
        </div>

        {authError && <div className="login-panel__error">{authError}</div>}

        <button type="button" className="login-panel__close" onClick={onClose}>
          Chiudi
        </button>
      </div>
    </div>
  );
}

/* ---------------- LOCKED PREVIEW (nuovo — sostituisce il contenuto se non loggati) ---------------- */

function LockedPreview({ onOpenLogin }) {
  return (
    <section className="decision-section" style={{ textAlign: "center" }}>
      <div className="decision-section__eyebrow">Accesso riservato</div>
      <h2 className="decision-section__title">Il progetto continua dopo l'accesso</h2>
      <p className="decision-section__hint">
        Decisioni, materiali, planimetrie e Project DNA sono visibili solo dopo aver effettuato l'accesso
        con l'email e il codice ricevuti dall'architetto.
      </p>
      <button className="hero__cta" style={{ marginTop: 18 }} onClick={onOpenLogin}>
        Accedi al progetto
      </button>
    </section>
  );
}

/* ---------------- DRAW LAYER (azione "Edita") ---------------- */

function DrawLayer({ hotspots, isDrawing, enabled, onDrawingChange, onMark, containerRef }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const points = useRef([]);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
  }, [containerRef]);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [resizeCanvas]);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const findArea = (fx, fy) => {
    for (const [name, box] of Object.entries(hotspots || {})) {
      if (fx >= box.xMin && fx <= box.xMax && fy >= box.yMin && fy <= box.yMax) return name;
    }
    return "area generica";
  };

  const onPointerDown = (e) => {
    if (!enabled) return;
    e.preventDefault();
    drawing.current = true;
    points.current = [getPos(e)];
    onDrawingChange(true);
    canvasRef.current.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!drawing.current) return;
    const pos = getPos(e);
    points.current.push(pos);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#e2b876";
    ctx.shadowColor = "#e2b876";
    ctx.shadowBlur = 10;
    ctx.lineWidth = 3;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    points.current.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.stroke();
  };

  const onPointerUp = (e) => {
    if (!drawing.current) return;
    drawing.current = false;
    const canvas = canvasRef.current;
    const pts = points.current;
    if (pts.length > 0) {
      const avgX = pts.reduce((s, p) => s + p.x, 0) / pts.length;
      const avgY = pts.reduce((s, p) => s + p.y, 0) / pts.length;
      const fx = avgX / canvas.width;
      const fy = avgY / canvas.height;
      const area = findArea(fx, fy);
      onMark(area, { x: avgX, y: avgY });
    }
    setTimeout(() => {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      onDrawingChange(false);
    }, 900);
  };

  return (
    <canvas
      ref={canvasRef}
      className={"draw-canvas" + (isDrawing ? " is-flashing" : "") + (enabled ? " is-enabled" : "")}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    />
  );
}

/* ---------------- REACTION BAR ---------------- */

function ReactionBar({ decisionId, reaction, onReact }) {
  const emojis = ["😍", "🤔", "❌"];
  return (
    <div className="reaction-bar">
      {emojis.map((e) => (
        <button
          key={e}
          className={"reaction-btn" + (reaction === e ? " is-active" : "")}
          onClick={(evt) => onReact(decisionId, e, evt)}
        >
          {e}
        </button>
      ))}
    </div>
  );
}

/* ---------------- PROJECT INTELLIGENCE (popup ancorato) ---------------- */

function ProjectIntelligencePanel({ popup, role, onQuickChoice, onCustomChange, onConfirm, onEdit, onRemove, onClose, onZoomImage }) {
  const [showReport, setShowReport] = useState(false);
  if (!popup || !popup.open) return null;
  const { step, area, anchor, quickChoice, customText, aiResult, placeAbove } = popup;
  const isArchitect = role === "architect";

  const style = {
    left: Math.max(12, Math.min(anchor.x - 160, window.innerWidth - 340)),
    top: placeAbove ? anchor.y - 12 : anchor.y + 24,
    transform: placeAbove ? "translateY(-100%)" : "none",
  };

  return (
    <div className="pi-anchor" style={style}>
      <div className={"pi-arrow " + (placeAbove ? "pi-arrow--above" : "pi-arrow--below")} />
      <div className="pi-card">
        <div className="pi-card__eyebrow">Project Intelligence</div>

        {step === "intent" && (
          <>
            <div className="pi-card__prompt">
              Ho notato che hai segnato <b>{area}</b>. Cosa vorresti migliorare?
            </div>
            <div className="pi-choices">
              {QUICK_CHOICES.map((c) => (
                <button key={c} className="pi-choice-btn" onClick={() => onQuickChoice(c)}>
                  {c}
                </button>
              ))}
            </div>
            {quickChoice === "Altro…" && (
              <textarea
                className="pi-custom-input"
                placeholder="Scrivi cosa vorresti cambiare…"
                value={customText}
                onChange={(e) => onCustomChange(e.target.value)}
                autoFocus
              />
            )}
            {quickChoice === "Altro…" && customText.trim() && (
              <button className="pi-btn pi-btn--primary" style={{ marginTop: 10, width: "100%" }} onClick={onConfirm}>
                Invia
              </button>
            )}
          </>
        )}

        {step === "thinking" && (
          <div className="pi-thinking">
            <div className="pi-thinking__label">Project Intelligence sta elaborando…</div>
            <div className="pi-thinking__bar">
              <div className="pi-thinking__bar-fill" />
            </div>
          </div>
        )}

        {step === "confirm" && aiResult && (
          <>
            <div className="pi-confirm__intent">{aiResult.design_intent}</div>

            {/* Immagini di riferimento: visibili a cliente e architetto */}
            {aiResult.reference_images && aiResult.reference_images.length > 0 && (
              <div className="pi-reference-images" style={{ display: "flex", gap: 8, marginTop: 10, marginBottom: 10, flexWrap: "wrap" }}>
                {aiResult.reference_images.map((img, i) => (
                  <div key={i} style={{ flex: "1 1 45%", minWidth: 90 }}>
                    <img
                      src={img.url}
                      alt="Riferimento"
                      onClick={() => onZoomImage && onZoomImage(img.url)}
                      style={{ width: "100%", height: 100, objectFit: "cover", borderRadius: 4, display: "block", cursor: "zoom-in" }}
                    />
                    {img.credit && (
                      <div style={{ fontSize: 9, opacity: 0.6, marginTop: 2 }}>{img.credit}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Report tecnico: SOLO architetto, collassato di default — niente muro di testo */}
            {isArchitect && (
              <button
                type="button"
                className="pi-btn"
                style={{ width: "100%", marginBottom: 10 }}
                onClick={() => setShowReport((v) => !v)}
              >
                {showReport ? "▾ Nascondi report tecnico" : "▸ Report per l'architetto (prompt, materiali, rischi)"}
              </button>
            )}
            {isArchitect && showReport && (
              <>
                {aiResult.proposal && (
                  <div className="pi-proposal-grid">
                    <div><b>Materiali</b><span>{(aiResult.proposal.materials || []).join(", ") || "—"}</span></div>
                    <div><b>Luce</b><span>{aiResult.proposal.lighting_strategy || "—"}</span></div>
                    <div><b>Atmosfera</b><span>{aiResult.proposal.atmosphere || "—"}</span></div>
                    <div><b>Funzione</b><span>{aiResult.proposal.functional_improvements || "—"}</span></div>
                    <div><b>Benefici</b><span>{(aiResult.proposal.benefits || []).join(" · ") || "—"}</span></div>
                    <div><b>Rischi</b><span>{(aiResult.proposal.risks || []).join(" · ") || "—"}</span></div>
                  </div>
                )}
                {aiResult.inspiration_object && (
                  <div className="pi-inspiration-box">
                    <div className="pi-inspiration-box__title">Prompt Lychee (solo architetto)</div>
                    <div><b>Style</b> {aiResult.inspiration_object.style}</div>
                    <div><b>Keywords</b> {(aiResult.inspiration_object.keywords || []).join(", ")}</div>
                    <div><b>Prompt</b> {aiResult.inspiration_object.image_prompt}</div>
                  </div>
                )}
                {aiResult.open_questions && aiResult.open_questions.length > 0 && (
                  <div className="pi-confirm__questions">
                    {aiResult.open_questions.map((q, i) => (
                      <div key={i}>· {q}</div>
                    ))}
                  </div>
                )}
              </>
            )}

            {isArchitect && (
              <textarea
                className="pi-confirm__edit"
                value={aiResult.design_intent}
                onChange={(e) => onEdit(e.target.value)}
              />
            )}
            <div className="pi-confirm__actions">
              {popup.annotationId && (
                <button className="pi-btn pi-btn--danger" onClick={onRemove}>
                  Rimuovi segno
                </button>
              )}
              <button className="pi-btn" onClick={onClose}>
                ✏ Modifica
              </button>
              <button className="pi-btn pi-btn--primary" onClick={onConfirm}>
                ✓ Conferma
              </button>
            </div>
          </>
        )}

        {step === "saved" && (
          <div className="pi-saved">
            <span className="pi-saved__check">✓</span>
            Aggiunto al Project DNA
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- DESKTOP COMPARE CARD (con parallax reale su scroll) ---------------- */

function useScrollParallax(ref) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const raw = 1 - Math.min(1, Math.max(0, rect.top / vh));
      setProgress(raw);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [ref]);
  return progress;
}

function DesktopCompareCard({ decision, option, optionKey, chosen, isDrawing, editEnabled, onToggleEdit, onDraw, onOpenAnnotation, annotations, onChoose, dnaMateriali, onZoom }) {
  const cardRef = useRef(null);
  const frameRef = useRef(null);
  const progress = useScrollParallax(cardRef);
  const scale = 1.22 - 0.22 * progress;
  const translate = 54 * (1 - progress);
  const rotate = (1 - progress) * 1.2;

  const materialActive = dnaMateriali.includes(option.materiale);

  return (
    <div
      ref={cardRef}
      className={"compare-card" + (chosen ? " is-selected" : "")}
      style={{ transform: `scale(${scale}) translateY(${translate}px) rotateZ(${rotate}deg)` }}
    >
      <div className="draw-layer-wrap compare-card__frame" ref={frameRef}>
        <img src={option.image} alt={option.label} className="compare-card__image" />
        <AnnotationMarks
          annotations={annotations}
          onOpen={(annotation) => onOpenAnnotation(annotation, frameRef)}
        />
        <DrawLayer
          hotspots={decision.hotspots}
          isDrawing={isDrawing}
          enabled={editEnabled}
          onDrawingChange={onDraw.setDrawing}
          onMark={(area, anchor) => onDraw.onMark(decision.id, optionKey, area, anchor, frameRef)}
          containerRef={frameRef}
        />
        <button
          className={"edita-toggle-btn" + (editEnabled ? " is-active" : "")}
          onClick={(e) => {
            e.stopPropagation();
            onToggleEdit(decision.id);
          }}
          type="button"
        >
          {editEnabled ? "Edita attivo" : "Attiva Edita"}
        </button>
        <button
          className="zoom-btn"
          onClick={(e) => { e.stopPropagation(); onZoom(option.image, option.label); }}
          aria-label="Ingrandisci"
        >
          ⤢
        </button>
        <span className="edita-hint">{editEnabled ? "Edita attivo — disegna per lasciare un segno" : "Attiva Edita per iniziare a disegnare"}</span>
      </div>
      <div className="compare-card__body">
        <div className="compare-card__label">{option.label}</div>
        <div className="compare-card__desc">{option.desc}</div>
        {option.materiale && (
          <div className="material-row">
            <span className={"material-chip" + (materialActive ? " is-active" : "")}>
              {option.materiale}
            </span>
          </div>
        )}
        <button
          className={"compare-card__choose" + (chosen ? " is-chosen" : "")}
          onClick={() => onChoose(decision.id, optionKey, option)}
        >
          {chosen ? "✓ Scelto" : `Scegli ${option.label}`}
        </button>
      </div>
    </div>
  );
}

/* ---------------- MOBILE COMPARE SLIDER ---------------- */

function MobileCompareCard({ decision, chosen, isDrawing, editEnabled, onToggleEdit, onDraw, onOpenAnnotation, annotations, onChoose, onZoom }) {
  const [pos, setPos] = useState(50);
  const wrapRef = useRef(null);
  const dragging = useRef(false);

  const setFromClientX = (clientX) => {
    const rect = wrapRef.current.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, pct)));
  };

  const onHandleDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragging.current = true;
    e.target.setPointerCapture(e.pointerId);
  };
  const onHandleMove = (e) => {
    if (!dragging.current) return;
    e.preventDefault();
    e.stopPropagation();
    setFromClientX(e.clientX);
  };
   const onHandleUp = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    dragging.current = false;
  };

  const dominant = pos > 50 ? decision.optionA : decision.optionB;

  return (
    <div>
      <div
        className="draw-layer-wrap mobile-slider"
        ref={wrapRef}
        style={{ "--slider-pos": `${pos}%` }}
      >
        <img src={decision.optionB.image} alt={decision.optionB.label} className="mobile-slider__img" />
        <img
          src={decision.optionA.image}
          alt={decision.optionA.label}
          className="mobile-slider__img mobile-slider__img--top"
        />
        <AnnotationMarks
          annotations={annotations}
          onOpen={(annotation) => onOpenAnnotation(annotation, wrapRef)}
        />
        {chosen && (
          <DrawLayer
            hotspots={decision.hotspots}
            isDrawing={isDrawing}
            enabled={editEnabled}
            onDrawingChange={onDraw.setDrawing}
            onMark={(area, anchor) => onDraw.onMark(decision.id, chosen, area, anchor, wrapRef)}
            containerRef={wrapRef}
          />
        )}
        {chosen && (
          <button
            className={"edita-toggle-btn edita-toggle-btn--mobile" + (editEnabled ? " is-active" : "")}
            onClick={(e) => {
              e.stopPropagation();
              onToggleEdit(decision.id);
            }}
            type="button"
          >
            {editEnabled ? "Edita attivo" : "Attiva Edita"}
          </button>
        )}
        <button
          className="zoom-btn"
          onClick={(e) => { e.stopPropagation(); onZoom(dominant.image, dominant.label); }}
          aria-label="Ingrandisci"
        >
          ⤢
        </button>
        <div className="mobile-slider__divider" />
        <div
          className="mobile-slider__handle"
          onPointerDown={onHandleDown}
          onPointerMove={onHandleMove}
          onPointerUp={onHandleUp}
        >
          ⇔
        </div>
      </div>
      <div className="mobile-slider__desc">{dominant.desc}</div>
      <div className="mobile-choose-row">
        <button
          className={"compare-card__choose" + (chosen === "optionA" ? " is-chosen" : "")}
          onClick={() => onChoose(decision.id, "optionA", decision.optionA)}
        >
          Scegli Versione I
        </button>
        <button
          className={"compare-card__choose" + (chosen === "optionB" ? " is-chosen" : "")}
          onClick={() => onChoose(decision.id, "optionB", decision.optionB)}
        >
          Scegli Versione II
        </button>
      </div>
      <div className="edita-mobile-status">
        {!chosen
          ? "Scegli una versione per sbloccare Edita"
          : editEnabled
          ? "✎ Edita attivo — ora puoi disegnare col dito senza interferire con lo slider"
          : "Tocca “Attiva Edita” per iniziare a disegnare"}
      </div>
    </div>
  );
}

/* ---------------- ZOOM VIEWER — pinch / rotellina / doppio-tap / trascina ---------------- */

function ZoomViewer({ src, alt, onClose }) {
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const pointers = useRef(new Map());
  const pinchStart = useRef(null);
  const dragStart = useRef(null);

  const clampScale = (s) => Math.max(1, Math.min(4, s));

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      pinchStart.current = { dist, scale };
      dragStart.current = null;
    } else if (pointers.current.size === 1 && scale > 1) {
      dragStart.current = { x: e.clientX, y: e.clientY, posX: pos.x, posY: pos.y };
    }
  };

  const onPointerMove = (e) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2 && pinchStart.current) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const next = clampScale(pinchStart.current.scale * (dist / pinchStart.current.dist));
      setScale(next);
    } else if (pointers.current.size === 1 && dragStart.current) {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setPos({ x: dragStart.current.posX + dx, y: dragStart.current.posY + dy });
    }
  };

  const endPointer = (e) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchStart.current = null;
    if (pointers.current.size === 0) dragStart.current = null;
  };

  const onWheel = (e) => {
    e.preventDefault();
    setScale((s) => clampScale(s - e.deltaY * 0.0015));
  };

  const onDoubleClick = () => {
    setScale((s) => (s > 1 ? 1 : 2.5));
    setPos({ x: 0, y: 0 });
  };

  return (
    <div className="zoom-overlay" onClick={onClose}>
      <button className="zoom-overlay__close" onClick={onClose} aria-label="Chiudi">✕</button>
      <div className="zoom-overlay__hint">Pizzica o usa la rotellina per ingrandire · doppio tocco per reset</div>
      <img
        src={src}
        alt={alt}
        className="zoom-overlay__img"
        style={{ transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})` }}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onWheel={onWheel}
        onDoubleClick={onDoubleClick}
        draggable={false}
      />
    </div>
  );
}

/* ---------------- VISTA D'INSIEME & PALETTE MATERIALI ---------------- */

const BUILDING_OVERVIEW = [
  { id: "edificio1", image: "/edificio1.png", label: "Vista d'insieme e palette materiali" },
  { id: "edificio2", image: "/edificio2.png", label: "Sezione assonometrica dell'edificio" },
];

function BuildingOverviewSection({ onZoom }) {
  return (
    <section className="decision-section">
      <div className="decision-section__eyebrow">Riferimento</div>
      <h2 className="decision-section__title">Vista d'insieme &amp; Palette Materiali</h2>
      <p className="decision-section__hint">Tocca un'immagine per ingrandirla e leggere i dettagli materici.</p>
      <div className="overview-grid">
        {BUILDING_OVERVIEW.map((item) => (
          <button
            key={item.id}
            className="overview-thumb"
            onClick={() => onZoom(item.image, item.label)}
          >
            <img src={item.image} alt={item.label} className="overview-thumb__img" />
            <span className="overview-thumb__label">⤢ {item.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

/* ---------------- PLACEHOLDER CARD ---------------- */

function PlaceholderCard({ item, onZoom }) {
  const [imgSrc, setImgSrc] = useState(item.image);

  return (
    <button
      className="placeholder-card"
      type="button"
      onClick={() => imgSrc && onZoom(imgSrc, item.label)}
    >
      {imgSrc ? (
        <img
          src={imgSrc}
          alt={item.label}
          className="placeholder-card__img"
          onError={() => {
            if (item.fallbackImage && imgSrc !== item.fallbackImage) setImgSrc(item.fallbackImage);
            else setImgSrc("");
          }}
        />
      ) : (
        <div className="placeholder-card__icon">{item.icon}</div>
      )}
      <div className="placeholder-card__overlay">
        <div className="placeholder-card__label">{item.label}</div>
        <div className="placeholder-card__sub">⤢ Tocca per ingrandire</div>
      </div>
    </button>
  );
}

/* ---------------- SIDE PANEL: DNA VIEW ---------------- */

function DNAViewPanel({ dna, onClose }) {
  const categories = [
    ["stile", "Stile"],
    ["materiali", "Materiali"],
    ["luce", "Luce"],
    ["privacy", "Privacy"],
    ["outdoor", "Outdoor"],
    ["funzioni_richieste", "Funzioni richieste"],
    ["elementi_rifiutati", "Elementi rifiutati"],
  ];
  return (
    <div className="side-panel-overlay" onClick={onClose}>
      <div className="side-panel" onClick={(e) => e.stopPropagation()}>
        <div className="side-panel__header">
          <div className="side-panel__title">Project DNA</div>
          <button className="side-panel__close" onClick={onClose}>
            ×
          </button>
        </div>
        {categories.map(([key, label]) => (
          <div className="dna-category" key={key}>
            <div className="dna-category__label">{label}</div>
            <div className="dna-category__items">
              {dna[key] && dna[key].length > 0 ? (
                dna[key].map((v, i) => (
                  <span className="dna-tag" key={i}>
                    {v}
                  </span>
                ))
              ) : (
                <span className="dna-empty">Nessun dato ancora</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- SIDE PANEL: INTELLIGENCE SUMMARY (intenzioni validate) ---------------- */

function IntelligenceSummaryPanel({ dna, onClose }) {
  return (
    <div className="side-panel-overlay" onClick={onClose}>
      <div className="side-panel" onClick={(e) => e.stopPropagation()}>
        <div className="side-panel__header">
          <div className="side-panel__title">Project Intelligence</div>
          <button className="side-panel__close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="dna-category__label" style={{ marginBottom: 14 }}>
          Intenzioni validate dal cliente
        </div>
        {dna.intenzioni_validate.length === 0 && (
          <div className="dna-empty">Nessuna intenzione validata ancora. Disegna sopra un piano per iniziare.</div>
        )}
        {dna.intenzioni_validate.map((rec, i) => (
          <div className="intent-record" key={i}>
            <div className="intent-record__area">
              {rec.area} — {rec.intent_label}
            </div>
            <div>{rec.design_intent}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================
   APP
   ================================================================ */

export default function App() {
  const [authSession, setAuthSession] = useState(loadAuthSession);
  const [showLogin, setShowLogin] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authError, setAuthError] = useState("");
  const [authForm, setAuthForm] = useState({ email: "", password: "" });
  const [authUsers, setAuthUsers] = useState(loadAuthUsers);
  const [dna, setDna] = useState(loadDNA);
  const [annotations, setAnnotations] = useState(loadAnnotations);
  const [choices, setChoices] = useState({});
  const [reactions, setReactions] = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);
  const [isDrawing, setIsDrawing] = useState(false);
  const [activeEditDecision, setActiveEditDecision] = useState(null);
  const [navActive, setNavActive] = useState("progetto");
  const [showDNA, setShowDNA] = useState(false);
  const [showIntelligenceSummary, setShowIntelligenceSummary] = useState(false);
  const [lycheePrompt, setLycheePrompt] = useState(() => loadDNA().render_prompt_current || BASE_RENDER_PROMPT);
  const [scrollProgress, setScrollProgress] = useState(0);

  const [popup, setPopup] = useState({ open: false });
  const [zoom, setZoom] = useState(null);

  const decisionsRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(DNA_STORAGE_KEY, JSON.stringify(dna));
  }, [dna]);

  useEffect(() => {
    if (authSession) localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authSession));
    else localStorage.removeItem(AUTH_STORAGE_KEY);
  }, [authSession]);

  useEffect(() => {
    localStorage.setItem(AUTH_USERS_STORAGE_KEY, JSON.stringify(authUsers));
  }, [authUsers]);

  useEffect(() => {
    localStorage.setItem(ANNOTATIONS_STORAGE_KEY, JSON.stringify(annotations));
  }, [annotations]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 900);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const pct = h.scrollTop / (h.scrollHeight - h.clientHeight || 1);
      setScrollProgress(Math.min(1, Math.max(0, pct)));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNavigate = (id) => {
    if (!authSession && id !== "progetto") {
      setShowLogin(true);
      setAuthError("Accedi per modificare il progetto, usare Edita o aprire i pannelli riservati.");
      return;
    }
    setNavActive(id);
    if (id === "progetto") {
      decisionsRef.current && decisionsRef.current.scrollIntoView({ behavior: "smooth" });
    } else if (id === "edita") {
      decisionsRef.current && decisionsRef.current.scrollIntoView({ behavior: "smooth" });
    } else if (id === "intelligence") {
      setShowIntelligenceSummary(true);
    } else if (id === "dna") {
      setShowDNA(true);
    }
  };

  const requireAccess = (message) => {
    if (authSession) return true;
    setShowLogin(true);
    setAuthError(message);
    return false;
  };

  const handleAuthFieldChange = (key, value) => {
    setAuthForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleEmailAccess = () => {
    if (!authForm.email.trim() || !authForm.password.trim()) {
      setAuthError("Inserisci email e password per accedere al prototipo protetto.");
      return;
    }
    const email = authForm.email.trim().toLowerCase();
    const password = authForm.password.trim();
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      setAuthSession({
        provider: "email-admin",
        role: "architect",
        email,
        loginAt: new Date().toISOString(),
      });
      setAuthError("");
      setShowLogin(false);
      decisionsRef.current && decisionsRef.current.scrollIntoView({ behavior: "smooth" });
      return;
    }
    const match = authUsers.find((user) => user.email.toLowerCase() === email && user.password === password);
    if (!match) {
      setAuthError("Credenziali non valide. Per l'accesso admin usa l'email configurata e la password assegnata.");
      return;
    }
    setAuthSession({
      provider: match.role === "architect" ? "email-admin" : "email-preview",
      role: match.role || "client",
      email,
      loginAt: new Date().toISOString(),
    });
    setAuthError("");
    setShowLogin(false);
    decisionsRef.current && decisionsRef.current.scrollIntoView({ behavior: "smooth" });
  };

  const handleAdminAccess = () => {
    setAuthForm({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
    setAuthSession({
      provider: "email-admin",
      role: "architect",
      email: ADMIN_EMAIL,
      loginAt: new Date().toISOString(),
    });
    setAuthError("");
    setShowLogin(false);
    decisionsRef.current && decisionsRef.current.scrollIntoView({ behavior: "smooth" });
  };

  const handleRegister = () => {
    if (!authForm.email.trim() || !authForm.password.trim()) {
      setAuthError("Inserisci email e password per registrare un accesso locale prototipo.");
      return;
    }
    const email = authForm.email.trim().toLowerCase();
    if (authUsers.some((user) => user.email.toLowerCase() === email)) {
      setAuthError("Questa email è già registrata. Usa Accedi.");
      return;
    }
    setAuthUsers((prev) => [...prev, { email, password: authForm.password.trim(), role: "client" }]);
    setAuthError("Registrazione locale completata. Ora puoi accedere.");
    setAuthMode("login");
  };

  const handleProviderClick = (provider) => {
    setAuthError(`${provider} sarà attivato con Firebase su Vercel. Per ora puoi entrare nel prototipo usando email + password.`);
  };

  const handleLogout = () => {
    setAuthSession(null);
    setActiveEditDecision(null);
    setIsDrawing(false);
  };

  const handleToggleEdit = (decisionId) => {
    setActiveEditDecision((prev) => (prev === decisionId ? null : decisionId));
    setIsDrawing(false);
  };

  const handleChoose = (decisionId, optionKey, option) => {
    if (!requireAccess("Accedi per confermare una versione e salvare la scelta nel Project DNA.")) return;
    setChoices((prev) => ({ ...prev, [decisionId]: optionKey }));
    setDna((prev) => {
      const next = { ...prev, decisioni_raw: { ...prev.decisioni_raw, [decisionId]: optionKey } };
      if (option.materiale && !next.materiali.includes(option.materiale)) {
        next.materiali = [...next.materiali, option.materiale];
      }
      return next;
    });
  };

  const handleReact = (decisionId, emoji, evt) => {
    if (!requireAccess("Accedi per registrare reazioni e aprire Project Intelligence.")) return;
    setReactions((prev) => ({ ...prev, [decisionId]: emoji }));
    setDna((prev) => ({ ...prev, reazioni: { ...prev.reazioni, [decisionId]: emoji } }));

    if (emoji === "🤔" || emoji === "❌") {
      const rect = evt.currentTarget.getBoundingClientRect();
      const viewportX = rect.left + rect.width / 2;
      const viewportY = rect.top;
      openPopupForArea(decisionId, "la scelta appena espressa", {
        x: viewportX + window.scrollX,
        y: viewportY + window.scrollY,
      }, viewportY);
    }
  };

  const openPopupForArea = (decisionId, area, anchorPagePx, viewportYOverride, annotation) => {
    const viewportY = viewportYOverride != null ? viewportYOverride : anchorPagePx.y - window.scrollY;
    const placeAbove = viewportY > window.innerHeight - 260;
    setPopup({
      open: true,
      decisionId,
      annotationId: annotation ? annotation.id : null,
      area,
      anchor: anchorPagePx,
      placeAbove,
      step: annotation && annotation.aiResult ? "confirm" : "intent",
      quickChoice: annotation ? annotation.quickChoice : null,
      customText: annotation ? annotation.customText || "" : "",
      aiResult: annotation ? annotation.aiResult : null,
    });
  };

  const handleMark = (decisionId, optionKey, area, localAnchor, wrapRef) => {
    if (!requireAccess("Accedi per creare annotazioni persistenti e attivare il contesto AI.")) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const viewportY = rect.top + localAnchor.y;
    const anchor = {
      x: rect.left + localAnchor.x + window.scrollX,
      y: viewportY + window.scrollY,
    };
    const annotation = createAnnotationRecord({
      decisionId,
      optionKey,
      area,
      localAnchor,
      frameRect: { width: rect.width, height: rect.height },
    });
    setAnnotations((prev) => [...prev, annotation]);
    openPopupForArea(decisionId, area, anchor, viewportY, annotation);
  };

  const handleOpenAnnotation = (annotation, wrapRef) => {
    if (!requireAccess("Accedi per riaprire le annotazioni e il relativo contesto AI.")) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const localX = rect.width * annotation.xRatio;
    const localY = rect.height * annotation.yRatio;
    const viewportY = rect.top + localY;
    const anchor = {
      x: rect.left + localX + window.scrollX,
      y: viewportY + window.scrollY,
    };
    openPopupForArea(annotation.decisionId, annotation.area, anchor, viewportY, annotation);
  };

  const runIntelligence = async (quickChoice, customText) => {
    setPopup((p) => ({ ...p, step: "thinking", quickChoice, customText }));
    const [aiResult] = await Promise.all([
      askProjectIntelligence({ area: popup.area, quickChoice, customText }),
      new Promise((res) => setTimeout(res, 1400)),
    ]);
    const referenceImages = await fetchReferenceImages(
      buildImageQueries(popup.area, aiResult.inspiration_object, customText || quickChoice),
      `${translateArea(popup.area)} interior architecture`
    );
    setPopup((p) => ({ ...p, step: "confirm", aiResult: { ...aiResult, reference_images: referenceImages } }));
  };

  const handleQuickChoice = (choice) => {
    if (choice === "Altro…") {
      setPopup((p) => ({ ...p, quickChoice: choice }));
      return;
    }
    runIntelligence(choice, "");
  };

  const handleCustomChange = (val) => {
    setPopup((p) => ({ ...p, customText: val }));
  };

  const handleConfirmCustom = () => {
    runIntelligence("Altro…", popup.customText);
  };

  const handleEditIntent = (val) => {
    setPopup((p) => ({ ...p, aiResult: { ...p.aiResult, design_intent: val } }));
  };

  const handleConfirmSaved = () => {
    const dnaUpdate = buildDNAUpdate({ annotationId: popup.annotationId, area: popup.area, aiResult: popup.aiResult, quickChoice: popup.quickChoice });
    const record = {
      annotationId: popup.annotationId || null,
      area: popup.area,
      intent_label: popup.quickChoice,
      design_intent: popup.aiResult.design_intent,
      proposal: popup.aiResult.proposal || null,
      inspiration_object: popup.aiResult.inspiration_object || null,
      reason: dnaUpdate.reason,
      confidence: dnaUpdate.confidence,
      ts: new Date().toISOString(),
    };
    setDna((prev) => ({
      ...prev,
      materiali: appendUniqueValues(prev.materiali, dnaUpdate.materials),
      luce: appendUniqueValues(prev.luce, dnaUpdate.lighting ? [dnaUpdate.lighting] : []),
      stile: appendUniqueValues(prev.stile, popup.aiResult.inspiration_object ? [popup.aiResult.inspiration_object.style] : []),
      funzioni_richieste: appendUniqueValues(prev.funzioni_richieste, popup.aiResult.proposal ? [popup.aiResult.proposal.functional_improvements] : []),
      dna_updates: [...prev.dna_updates, dnaUpdate],
      inspiration_objects: popup.annotationId
        ? [
            ...prev.inspiration_objects.filter((item) => item.annotationId !== popup.annotationId),
            {
              annotationId: popup.annotationId,
              area: popup.area,
              ...popup.aiResult.inspiration_object,
              timestamp: dnaUpdate.timestamp,
            },
          ]
        : [
            ...prev.inspiration_objects,
            {
              annotationId: popup.annotationId,
              area: popup.area,
              ...popup.aiResult.inspiration_object,
              timestamp: dnaUpdate.timestamp,
            },
          ],
      intenzioni_validate: popup.annotationId
        ? [
            ...prev.intenzioni_validate.filter((item) => item.annotationId !== popup.annotationId),
            record,
          ]
        : [...prev.intenzioni_validate, record],
      render_prompt_current: extendRenderPrompt(prev.render_prompt_current || BASE_RENDER_PROMPT, popup.area, popup.aiResult),
      render_prompt_history: [
        ...prev.render_prompt_history,
        {
          version: (prev.render_prompt_history[prev.render_prompt_history.length - 1]?.version || 1) + 1,
          prompt: extendRenderPrompt(prev.render_prompt_current || BASE_RENDER_PROMPT, popup.area, popup.aiResult),
          reason: dnaUpdate.reason,
          area: popup.area,
          confidence: dnaUpdate.confidence,
          ts: dnaUpdate.timestamp,
        },
      ],
      system_feedback: popup.aiResult.system_feedback
        ? [
            ...prev.system_feedback.filter((item) => item.annotationId !== popup.annotationId),
            {
              annotationId: popup.annotationId || null,
              area: popup.area,
              note: popup.aiResult.system_feedback,
              ts: new Date().toISOString(),
            },
          ]
        : prev.system_feedback,
    }));
    setLycheePrompt((prev) => extendRenderPrompt(prev || BASE_RENDER_PROMPT, popup.area, popup.aiResult));
    if (popup.annotationId) {
      setAnnotations((prev) =>
        prev.map((ann) =>
          ann.id === popup.annotationId
            ? {
                ...ann,
                quickChoice: popup.quickChoice,
                customText: popup.customText,
                aiResult: popup.aiResult,
                suggestion: popup.aiResult.proposal?.design_intent || popup.aiResult.interpretation || popup.quickChoice || "Suggerimento AI",
                status: "saved",
              }
            : ann
        )
      );
    }
    setPopup((p) => ({ ...p, step: "saved" }));
    setTimeout(() => setPopup({ open: false }), 2200);
  };

  const handleClosePopup = () => setPopup({ open: false });

  const handleRemoveAnnotation = () => {
    if (!popup.annotationId) return;
    setAnnotations((prev) => prev.filter((ann) => ann.id !== popup.annotationId));
    setDna((prev) => ({
      ...prev,
      intenzioni_validate: prev.intenzioni_validate.filter((item) => item.annotationId !== popup.annotationId),
      dna_updates: prev.dna_updates.filter((item) => item.annotationId !== popup.annotationId),
      inspiration_objects: prev.inspiration_objects.filter((item) => item.annotationId !== popup.annotationId),
      system_feedback: prev.system_feedback.filter((item) => item.annotationId !== popup.annotationId),
    }));
    setPopup({ open: false });
  };

  const handleSendEmail = () => {
    if (!requireAccess("Accedi per esportare e inviare il Project DNA all'architetto.")) return;

    const isArchitect = authSession?.role === "architect";

    const clientSafeLines = [
      `Progetto: ${dna.progetto}`,
      `Cliente: ${dna.cliente}`,
      "",
      "— LE VOSTRE SCELTE —",
      ...Object.entries(dna.decisioni_raw).map(([k, v]) => `${k}: ${v}`),
      "",
      "— LE VOSTRE REAZIONI —",
      ...Object.entries(dna.reazioni).map(([k, v]) => `${k}: ${v}`),
      "",
      "— OSSERVAZIONI CONDIVISE —",
      ...dna.intenzioni_validate.map((r) => `[${r.area}] ${r.design_intent}`),
    ].join("\n");

    const architectLines = [
      clientSafeLines,
      "",
      "— MATERIALI RILEVATI —",
      dna.materiali.join(", ") || "—",
      "",
      "— PROMPT LYCHEE (editato dall'architetto) —",
      lycheePrompt,
      "",
      "===== NOTE INTERNE — solo per architetto, non condivise col cliente =====",
      ...dna.system_feedback.map((f) => `[${f.area}] ${f.note}`),
    ].join("\n");

    const subject = encodeURIComponent(
      `IEL — ${isArchitect ? "Project DNA tecnico" : "Feedback cliente"} — ${dna.progetto}`
    );
    const body = encodeURIComponent(isArchitect ? architectLines : clientSafeLines);
    window.location.href = `mailto:${ARCHITECT_EMAIL}?subject=${subject}&body=${body}`;
  };

  const totalDecisions = DECISIONS.length;
  const madeDecisions = Object.keys(choices).length;
  const decisionProgress = totalDecisions ? madeDecisions / totalDecisions : 0;

  return (
    <div className="iel-app">
      <TopNav
        active={navActive}
        onNavigate={handleNavigate}
        authSession={authSession}
        onOpenLogin={() => {
          setAuthMode("login");
          setShowLogin(true);
          setAuthError("");
        }}
        onLogout={handleLogout}
      />
      <div className="progress-bar">
        <div
          className="progress-bar__fill"
          style={{ width: `${Math.max(decisionProgress, scrollProgress) * 100}%` }}
        />
      </div>

      <section className="hero">
        <HeroShaderCanvas />
        <HeroMonolith />
        <div className="hero__grid" />
        <div className="hero__content">
          <div className="hero__eyebrow">IEL · Design Iteration Engine</div>
          <h1 className="hero__title" data-text="Villa 127/C">
            Villa 127/C
          </h1>
          <p className="hero__subtitle">
            Ogni scelta che fai qui diventa parte del Project DNA — e guida il prossimo render.
          </p>
          <button
            className="hero__cta"
            onClick={() => {
              if (authSession) handleNavigate("progetto");
              else {
                setAuthMode("login");
                setShowLogin(true);
                setAuthError("");
              }
            }}
          >
            {authSession ? "Apri il progetto" : "Accedi al progetto"}
          </button>
        </div>
      </section>

      <div className="live-notice">● un edificio che si costruisce insieme a voi, decisione dopo decisione</div>

      {!authSession ? (
        <LockedPreview
          onOpenLogin={() => {
            setAuthMode("login");
            setShowLogin(true);
            setAuthError("");
          }}
        />
      ) : (
        <>
          <div ref={decisionsRef}>
            {DECISIONS.map((decision) => (
              <section className="decision-section" key={decision.id}>
                <div className="decision-section__eyebrow">{decision.eyebrow}</div>
                <h2 className="decision-section__title">{decision.title}</h2>
                <p className="decision-section__hint">{decision.hint}</p>

                {!isMobile && (
                  <div className="compare-desktop">
                    <DesktopCompareCard
                      decision={decision}
                      option={decision.optionA}
                      optionKey="optionA"
                      chosen={choices[decision.id] === "optionA"}
                      isDrawing={isDrawing}
                      editEnabled={activeEditDecision === decision.id}
                      onToggleEdit={handleToggleEdit}
                      onDraw={{ setDrawing: setIsDrawing, onMark: handleMark }}
                      onOpenAnnotation={handleOpenAnnotation}
                      annotations={annotations.filter((ann) => ann.decisionId === decision.id && ann.optionKey === "optionA")}
                      onChoose={handleChoose}
                      dnaMateriali={dna.materiali}
                      onZoom={(src, alt) => setZoom({ src, alt })}
                    />
                    <DesktopCompareCard
                      decision={decision}
                      option={decision.optionB}
                      optionKey="optionB"
                      chosen={choices[decision.id] === "optionB"}
                      isDrawing={isDrawing}
                      editEnabled={activeEditDecision === decision.id}
                      onToggleEdit={handleToggleEdit}
                      onDraw={{ setDrawing: setIsDrawing, onMark: handleMark }}
                      onOpenAnnotation={handleOpenAnnotation}
                      annotations={annotations.filter((ann) => ann.decisionId === decision.id && ann.optionKey === "optionB")}
                      onChoose={handleChoose}
                      dnaMateriali={dna.materiali}
                      onZoom={(src, alt) => setZoom({ src, alt })}
                    />
                  </div>
                )}

                {isMobile && (
                  <div className="compare-mobile">
                    <MobileCompareCard
                      decision={decision}
                      chosen={choices[decision.id]}
                      isDrawing={isDrawing}
                      editEnabled={activeEditDecision === decision.id}
                      onToggleEdit={handleToggleEdit}
                      onDraw={{ setDrawing: setIsDrawing, onMark: handleMark }}
                      onOpenAnnotation={handleOpenAnnotation}
                      annotations={annotations.filter((ann) => ann.decisionId === decision.id && ann.optionKey === choices[decision.id])}
                      onChoose={handleChoose}
                      onZoom={(src, alt) => setZoom({ src, alt })}
                    />
                  </div>
                )}

                <ReactionBar decisionId={decision.id} reaction={reactions[decision.id]} onReact={handleReact} />
              </section>
            ))}
          </div>

          <BuildingOverviewSection onZoom={(src, alt) => setZoom({ src, alt })} />

          <section className="decision-section">
            <div className="decision-section__eyebrow">Struttura</div>
            <h2 className="decision-section__title">Sezioni e Prospetti</h2>
            <p className="decision-section__hint">Le tavole disponibili sono già consultabili. Tocca un'immagine per leggerla meglio.</p>
          </section>
          <div className="placeholder-grid">
            {PLACEHOLDERS.map((p) => (
              <PlaceholderCard item={p} key={p.id} onZoom={(src, alt) => setZoom({ src, alt })} />
            ))}
          </div>

          <section className="send-section">
            <h2 className="send-section__title">
              {authSession?.role === "architect"
                ? "Invia il Project DNA all'architetto"
                : "Condividi le tue impressioni con l'architetto"}
            </h2>

            {authSession?.role === "architect" ? (
              <>
                <p>Il DNA raccoglie decisioni, reazioni e intenzioni validate. Puoi modificare il prompt per Lychee prima dell'invio.</p>
                <div className="send-section__lychee-label">Prompt Lychee (editabile)</div>
                <textarea
                  className="send-section__textarea"
                  value={lycheePrompt}
                  onChange={(e) => setLycheePrompt(e.target.value)}
                />
                <div className="send-section__internal-note">
                  L'email include anche le note interne (system feedback) — visibili solo a te, mai al cliente.
                </div>
              </>
            ) : (
              <p>
                Le vostre scelte, reazioni e osservazioni verranno raccolte in un unico messaggio per l'architetto —
                niente gergo tecnico, solo ciò che avete scelto e detto.
              </p>
            )}

            <button className="send-section__cta" onClick={handleSendEmail}>
              {authSession?.role === "architect" ? "Invia email tecnica all'architetto" : "Invia il tuo feedback all'architetto"}
            </button>
          </section>
        </>
      )}

      {isMobile && authSession && <BottomNav onNavigate={handleNavigate} />}

      <ProjectIntelligencePanel
        popup={popup}
        role={authSession?.role}
        onQuickChoice={handleQuickChoice}
        onCustomChange={handleCustomChange}
        onConfirm={popup.quickChoice === "Altro…" && popup.step === "intent" ? handleConfirmCustom : handleConfirmSaved}
        onEdit={handleEditIntent}
        onRemove={handleRemoveAnnotation}
        onClose={handleClosePopup}
        onZoomImage={(src) => setZoom({ src, alt: "Riferimento" })}
      />

      {showDNA && <DNAViewPanel dna={dna} onClose={() => setShowDNA(false)} />}
      {showIntelligenceSummary && (
        <IntelligenceSummaryPanel dna={dna} onClose={() => setShowIntelligenceSummary(false)} />
      )}
      {zoom && <ZoomViewer src={zoom.src} alt={zoom.alt} onClose={() => setZoom(null)} />}
      <LoginOverlay
        open={showLogin}
        authError={authError}
        form={authForm}
        mode={authMode}
        onModeChange={(mode) => {
          setAuthMode(mode);
          setAuthError("");
        }}
        onChange={handleAuthFieldChange}
        onEmailAccess={handleEmailAccess}
        onAdminAccess={handleAdminAccess}
        onRegister={handleRegister}
        onProviderClick={handleProviderClick}
        onClose={() => {
          setShowLogin(false);
          setAuthError("");
        }}
      />
    </div>
  );
}

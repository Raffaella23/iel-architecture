// api/ai-intelligence.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  const { area, quickChoice, customText, project, clients } = req.body;

  if (!area) {
    return res.status(400).json({ error: 'Manca il campo "area"' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY non configurata su Vercel' });
  }

  const richiesta = (customText || quickChoice || 'miglioramento spaziale generico').trim();

  const prompt = `Sei un architetto senior che assiste una collega nella lettura delle osservazioni dei clienti durante una sessione di progettazione condivisa online.

PROGETTO: ${project || 'Villa 127/C, Noicattaro'}
CLIENTI: ${clients || 'Gabriele e Ludovica'}
AREA ANNOTATA DAL CLIENTE: ${area}
RICHIESTA/OSSERVAZIONE DEL CLIENTE: "${richiesta}"

LINGUAGGIO ESTETICO GIÀ ESISTENTE NEL PROGETTO (mantieni coerenza quando ha senso, discostatene solo se la richiesta del cliente lo giustifica chiaramente):
- Materiali tipici: travertino chiaro, rovere naturale, microcemento opaco, intonaco minerale caldo, pietra locale spazzolata
- Colori tipici: sabbia, salvia, bronzo ossidato, avorio caldo, pietra chiara, bronzo brunito
- Registro: lusso silenzioso, mediterraneo contemporaneo, continuità indoor-outdoor

COMPITO: interpreta l'osservazione del cliente in modo specifico e pertinente all'area indicata — non generico — e restituisci SOLO un oggetto JSON con ESATTAMENTE questa struttura (nessun testo fuori dal JSON, nessun blocco di codice markdown):

{
  "interpretation": "una frase in italiano che riassume cosa il cliente sta chiedendo per quest'area, nel formato: Osservazione del cliente sull'area [area]: \\"[richiesta pulita]\\".",
  "design_intent": "1-2 frasi in italiano, linguaggio semplice e rassicurante per il cliente (NON tecnico), che spiegano come questa osservazione verrà tradotta in scelta progettuale",
  "open_questions": ["una o due domande in italiano che l'architetto dovrebbe porre al cliente per affinare la scelta"],
  "system_feedback": "una frase tecnica in italiano ad uso interno, riassume l'annotazione per il log del progetto",
  "proposal": {
    "interpretation": "stesso testo del campo interpretation sopra",
    "design_intent": "stesso testo del campo design_intent sopra",
    "materials": ["2-3 materiali in italiano, coerenti col progetto salvo motivo contrario"],
    "lighting_strategy": "1-2 frasi in italiano su come gestire la luce in quest'area rispetto alla richiesta",
    "atmosphere": "1 frase in italiano che descrive l'atmosfera risultante",
    "functional_improvements": "1-2 frasi in italiano su come cambia funzionalmente lo spazio",
    "risks": ["1-2 rischi tecnici o di cantiere in italiano, concreti e specifici per questa richiesta"],
    "benefits": ["1-2 benefici concreti in italiano"],
    "contextual_recommendations": ["1-2 raccomandazioni in italiano per mantenere coerenza col resto del progetto"],
    "confidence": 0.75
  },
  "inspiration_object": {
    "style": "2-4 parole in inglese, es. warm contemporary architectural refinement",
    "materials": ["stessi materiali del campo proposal.materials ma tradotti in inglese"],
    "colors": ["2-3 colori in inglese coerenti con l'atmosfera"],
    "lighting": "stessa lighting_strategy ma in inglese, sintetica",
    "keywords": ["${area}", "villa contemporanea", "Puglia", "architettura domestica"],
    "image_prompt": "un prompt in inglese per generazione immagine architettonica, formato: Architectural concept render for Villa 127/C in Noicattaro, focus on [area], [style], materials: [...], colors: [...], lighting: [...], atmosphere: [...], high-detail architectural visualization, no furniture catalog style, coherent Mediterranean contemporary residence."
  }
}

Il campo "confidence" deve essere un numero tra 0.5 e 0.95: più alto se la richiesta del cliente è chiara e specifica, più basso se è vaga (es. "Altro…" senza dettagli).`;

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.7,
          },
        }),
      }
    );

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      console.error('Errore Gemini (ai-intelligence):', data);
      return res.status(502).json({ error: 'Errore nella generazione AI' });
    }

    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      return res.status(502).json({ error: 'Risposta AI vuota' });
    }

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch (parseErr) {
      console.error('JSON non valido da Gemini:', rawText);
      return res.status(502).json({ error: 'Formato risposta AI non valido' });
    }

    return res.status(200).json(parsed);
  } catch (err) {
    console.error('Errore ai-intelligence:', err);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
}

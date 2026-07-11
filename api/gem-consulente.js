module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ risposta: 'Metodo non consentito' });
  }

  try {
    const { domanda, elemento } = req.body;

    if (!domanda) {
      return res.status(400).json({ risposta: 'Manca il campo "domanda"' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ risposta: 'GEMINI_API_KEY non configurata su Vercel' });
    }

    const prompt = `Sei un consulente edile esperto in ristrutturazioni in Italia.
Rispondi in italiano, in modo breve e diretto (max 120 parole).
Fornisci un range di costo realistico in euro quando possibile, spiegando brevemente cosa lo fa variare (materiali, manodopera, zona).
Elemento della casa: ${elemento || 'non specificato'}
Domanda del cliente: ${domanda}`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      console.error('Errore Gemini:', data);
      return res.status(502).json({ risposta: 'Errore nella generazione della risposta AI' });
    }

    const risposta = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Nessuna risposta generata.';

    return res.status(200).json({ risposta });
  } catch (err) {
    console.error('Errore gem-consulente:', err);
    return res.status(500).json({ risposta: 'Errore interno del server' });
  }
};

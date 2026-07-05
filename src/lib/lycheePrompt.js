// Costruisce un prompt tecnico pronto per Lychee Studio a partire dal
// contesto reale della conversazione con il cliente.

export function buildLycheePrompt(scene, annotationText, proposals) {
  const materialContext = scene.subtitle || ''
  const proposalLines = proposals
    .map((p, i) => `${i + 1}. [${p.category}] ${p.text}`)
    .join('\n')

  return [
    `Progetto: Villa 127/C, Noicattaro (Puglia) — scena "${scene.title}".`,
    `Contesto materico/scenico: ${materialContext}.`,
    `Osservazione originale del cliente: "${annotationText}".`,
    `Interventi da visualizzare:`,
    proposalLines,
    `Stile richiesto: coerente con i render esistenti del progetto, luce naturale mediterranea, materiali reali (travertino, rovere, microcemento), nessun elemento fantasy o fuori contesto.`,
    `Output atteso: variazione fotorealistica della scena che integri gli interventi sopra, mantenendo inquadratura e proporzioni compatibili con l'originale.`,
  ].join('\n')
}

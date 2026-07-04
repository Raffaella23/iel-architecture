// src/lib/annotationRules.js
// Motore di suggerimenti a regole — zero costo, gira nel browser.

const RULES = [
  {
    keywords: ['buio', 'poca luce', 'scuro', 'ombra'],
    category: 'illuminazione',
    text: 'Valutare un\'apertura zenitale o una vetrata a tutta altezza per portare luce naturale diretta, oltre a un sistema di illuminazione indiretta a soffitto per le ore serali.',
    imageSearchQuery: 'skylight natural light minimalist interior',
  },
  {
    keywords: ['freddo', 'gelido', 'temperatura'],
    category: 'materiali',
    text: 'Il rovere e il travertino già previsti in palette aiutano a mitigare la percezione di freddo rispetto a superfici lisce; si può rinforzare con tappeti o pavimento radiante nella zona indicata.',
    imageSearchQuery: 'warm oak flooring cozy interior',
  },
  {
    keywords: ['stretto', 'piccolo', 'angusto', 'poco spazio'],
    category: 'dettaglio',
    text: 'Aprire un varco visivo verso l\'ambiente adiacente (es. parete vetrata o soglia a tutta altezza) amplia la percezione dello spazio senza intervenire sulla superficie reale.',
    imageSearchQuery: 'glass partition open floor plan small space',
  },
  {
    keywords: ['rumore', 'rumoroso', 'acustica', 'sento tutto'],
    category: 'dettaglio',
    text: 'Introdurre pannelli acustici o una libreria a tutta parete tra gli ambienti riduce la trasmissione del suono mantenendo la funzione dello spazio.',
    imageSearchQuery: 'acoustic wood panel wall interior design',
  },
  {
    keywords: ['privacy', 'si vede da fuori', 'esposto'],
    category: 'materiali',
    text: 'Un vetro serigrafato o una schermatura in doghe di legno sulla vetrata indicata protegge la privacy mantenendo il passaggio di luce naturale.',
    imageSearchQuery: 'wood slat screen privacy facade',
  },
  {
    keywords: ['freddo colore', 'grigio', 'triste', 'spento'],
    category: 'colore',
    text: 'Un accento cromatico caldo (terracotta o ocra) su una sola parete o elemento d\'arredo bilancia la palette senza stravolgere l\'insieme già progettato.',
    imageSearchQuery: 'terracotta accent wall warm interior',
  },
  {
    keywords: ['arredo', 'vuoto', 'spoglio', 'mobili'],
    category: 'arredo',
    text: 'Un elemento scultoreo singolo (es. poltrona in rovere e cuoio) in un angolo dello spazio evita l\'effetto "vuoto" senza appesantire.',
    imageSearchQuery: 'sculptural leather armchair minimalist room',
  },
  {
    keywords: ['atmosfera', 'freddo emotivo', 'poco accogliente'],
    category: 'atmosfera',
    text: 'Illuminazione calda a temperatura 2700K nelle zone di sosta (invece della luce neutra da lavoro) cambia sensibilmente la percezione di calore dell\'ambiente la sera.',
    imageSearchQuery: 'warm ambient lighting evening living room',
  },
]

function fallbackSuggestion(scene) {
  return [{
    category: 'dettaglio',
    text: `Per approfondire l'osservazione su "${scene.title}", segnaliamo il punto all'architetto per una valutazione mirata sul posto — i materiali già previsti (${scene.subtitle}) offrono margine di intervento locale senza modifiche strutturali.`,
    imageSearchQuery: `${scene.title} architecture detail`,
  }]
}

export function getRuleBasedSuggestions(annotationText, scene) {
  const text = annotationText.toLowerCase()
  const matched = RULES.filter(rule =>
    rule.keywords.some(kw => text.includes(kw))
  )

  const proposals = matched.length > 0 ? matched.slice(0, 3) : fallbackSuggestion(scene)

  return {
    reasoning: matched.length > 0
      ? `L'osservazione sulla scena "${scene.title}" richiama aspetti già presenti nel progetto (${scene.subtitle}); le proposte seguenti intervengono su quel contesto specifico.`
      : `Osservazione registrata su "${scene.title}" — proposta generale in attesa di valutazione diretta dell'architetto.`,
    proposals,
  }
}

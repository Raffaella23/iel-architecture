# IEL for Architecture — MVP 0.1

Layer interattivo 3D per studi di architettura. Aperto via QR code, zero app richieste.

---

## Setup locale (prima volta)

Requisiti: **Node.js 18+** e **Git** installati su Windows.

```bash
# 1. Clona il repository
git clone https://github.com/TUO-USERNAME/iel-architecture.git
cd iel-architecture

# 2. Installa dipendenze
npm install

# 3. Avvia in locale
npm start
# → apre http://localhost:3000
```

---

## Deploy su Vercel (una volta sola)

1. Vai su [vercel.com](https://vercel.com) → crea account gratuito con GitHub
2. Click **"Add New Project"** → importa `iel-architecture`
3. Lascia tutto di default → click **Deploy**
4. Vercel ti dà una URL pubblica tipo `iel-architecture.vercel.app`

Da quel momento: ogni `git push` aggiorna automaticamente il sito.

---

## Sostituire il modello placeholder con il tuo GLB

1. Esporta il modello da IC.ai in formato **GLB**
2. Rinomina il file `model.glb`
3. Mettilo nella cartella `/public/`
4. Apri `src/components/ModelViewer.js`
5. Segui le istruzioni nei commenti (decommentare le righe GLB)

---

## Personalizzare i materiali

In `src/App.js`, modifica l'array `MATERIALS`:

```js
const MATERIALS = [
  { id: 'travertino', label: 'Travertino', color: '#D4C5A9' },
  { id: 'cemento',    label: 'Cemento',    color: '#9B9B9B' },
  { id: 'rovere',     label: 'Rovere',     color: '#8B6914' },
];
```

Cambia i colori con i valori hex che vuoi. Se usi render pre-generati da IC.ai
invece dei colori, parla con Claude per integrare lo swap di immagini.

---

## Struttura progetto

```
iel-architecture/
├── public/
│   ├── index.html
│   └── model.glb          ← metti qui il tuo modello
├── src/
│   ├── App.js             ← logica principale
│   ├── App.css            ← design system
│   ├── index.js
│   └── components/
│       ├── ModelViewer.js ← viewer 3D (placeholder + GLB)
│       └── MaterialSelector.js
├── package.json
└── vercel.json
```

---

*IEL Core — RC XRArch · Foxbyte Social*

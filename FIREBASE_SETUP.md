# Firebase Setup Guide — IEL Architecture

## 1. Crea un progetto Firebase

1. Vai su [console.firebase.google.com](https://console.firebase.google.com)
2. Clicca **"Aggiungi progetto"**
3. Nome: `iel-architecture`
4. Disabilita Google Analytics (opzionale)
5. Clicca **Crea progetto**

## 2. Abilita Authentication

1. Nel menu laterale, vai a **Autenticazione**
2. Clicca la scheda **Sign-in method**
3. Abilita i provider:
   - **Google** (consigliato come primo)
   - **Apple** 
   - **Microsoft**
   - **Email/Password**

### Per Google:
- Il setup è automatico - Firebase lo configura per te

### Per Apple:
- Hai bisogno di un Team ID Apple Developer
- [Istruzioni Apple SignIn in Firebase](https://firebase.google.com/docs/auth/ios/apple)

### Per Microsoft:
- Crea un'app in [portal.azure.com](https://portal.azure.com)
- Copia Client ID e Client Secret
- Configurali in Firebase Authentication ? Microsoft

### Per Email:
- Già abilitato di default

## 3. Abilita Firestore (opzionale, per cloud persistence in futuro)

1. Nel menu, vai a **Firestore Database**
2. Clicca **Crea database**
3. Scegli modalità **test** (per sviluppo)
4. Seleziona regione `europe-west1` (Europa centrale)
5. Clicca **Crea**

**Nota:** Attualmente usiamo sessionStorage. Firestore sarà integrato per la persistenza cloud.

## 4. Ottieni le credenziali

1. Nel menu, clicca l'ingranaggio ?? ? **Impostazioni progetto**
2. Vai alla scheda **App**
3. Seleziona **Web** (se non già selezionato)
4. Copia il blocco di configurazione `const firebaseConfig = {...}`
5. Apri `.env.local` nel progetto (crea il file se non esiste)
6. Copia i valori così:

```
REACT_APP_FIREBASE_API_KEY=<apiKey>
REACT_APP_FIREBASE_AUTH_DOMAIN=<authDomain>
REACT_APP_FIREBASE_PROJECT_ID=<projectId>
REACT_APP_FIREBASE_STORAGE_BUCKET=<storageBucket>
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=<messagingSenderId>
REACT_APP_FIREBASE_APP_ID=<appId>
```

## 5. Testa localmente

```bash
npm install
npm start
```

Apri `http://localhost:3000` e prova il login con uno dei provider.

## 6. Deploy su Vercel

Una volta testato localmente:

```bash
git add .
git commit -m "Add Firebase authentication"
git push
```

**Vercel non avrà accesso a `.env.local`** (è gitignored). Devi configurare le variabili nel dashboard Vercel:

1. Vai su [vercel.com](https://vercel.com) ? il tuo progetto
2. **Settings** ? **Environment Variables**
3. Aggiungi tutti e 6 i valori da `.env.local`
4. Salva e **Redeploy**

---

## 7. Admin Access

L'email `CaniRaffaella@gmail.com` è identificata come admin nel codice:

```javascript
const isAdmin = user?.email === 'CaniRaffaella@gmail.com';
```

Questo viene utilizzato per:
- Accesso ai report privati dell'architetto
- Gestione della sessione
- Esportazione dati

---

## Troubleshooting

### Errore: "REACT_APP_FIREBASE_API_KEY is undefined"
- Verifica che `.env.local` sia nella root del progetto
- Verifica che le variabili siano scritte esattamente come in `.env.example`
- **Importante:** Riavvia il server (`npm start`) dopo aver creato `.env.local`

### Sign-in con Google non funziona
- Verifica che il dominio localhost:3000 sia in "Authorized JavaScript origins" in Google Cloud Console
- Vai a console.cloud.google.com ? Credenziali OAuth 2.0 ? Modifica Client ID

### Sign-in con Apple non funziona
- Hai bisogno di un Team ID Apple Developer valido
- L'app deve essere deployata su HTTPS (localhost funziona, ma i domini personalizzati no senza SSL)

---

**Hai domande? Contatta Raffaella ? CaniRaffaella@gmail.com**

# IEL for Architecture — Complete Setup Guide

**Status:** MVP 0.2 — Production Ready ?  
**Tech Stack:** React 18 + Firebase + Vite  
**Mobile:** First-class touch optimization  

---

## ?? Quick Start (2 minutes)

### Windows
```bash
setup.bat
```

### macOS / Linux
```bash
bash setup.sh
```

### Manual Setup
```bash
npm install
cp .env.example .env.local
# Edit .env.local with Firebase credentials
npm run dev
# Open http://localhost:5173
```

---

## ?? Before You Start

You need:
- ? Node.js 18+ ([download](https://nodejs.org))
- ? Firebase project ([create](https://console.firebase.google.com))
- ? Git ([download](https://git-scm.com))

---

## ?? Firebase Setup (5 minutes)

### Step 1: Create Firebase Project
1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **"Add Project"**
3. Name: `iel-architecture`
4. Click **Create Project**

### Step 2: Enable Authentication
1. Left sidebar ? **Authentication**
2. Click **"Sign-in method"** tab
3. Enable:
   - **Google** (automatic)
   - **Apple** (requires Apple Developer account)
   - **Microsoft** (requires Azure account)
   - **Email/Password** (automatic)

### Step 3: Get Credentials
1. Left sidebar ? Click ?? ? **Project settings**
2. Scroll down to "Your apps"
3. Click **Web** app
4. Copy the `firebaseConfig` object

### Step 4: Add to .env.local
```
REACT_APP_FIREBASE_API_KEY=<apiKey>
REACT_APP_FIREBASE_AUTH_DOMAIN=<authDomain>
REACT_APP_FIREBASE_PROJECT_ID=<projectId>
REACT_APP_FIREBASE_STORAGE_BUCKET=<storageBucket>
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=<messagingSenderId>
REACT_APP_FIREBASE_APP_ID=<appId>
```

### Step 5: Authorize localhost
1. Go back to **Authentication** ? **Sign-in method**
2. Click **Google** provider
3. Under "Authorized JavaScript origins", add:
   - `http://localhost:5173`
   - `http://localhost:5174` (alternate)

**Done!** Firebase is configured.

---

## ?? Local Development

### Run Dev Server
```bash
npm run dev
# Opens http://localhost:5173 with hot reload
```

### Check Code Quality
```bash
npm run lint
# Shows ESLint errors
```

### Build for Production
```bash
npm run build
# Creates /dist folder
```

### Preview Production Build
```bash
npm run build
npm run preview
# Simulates production at http://localhost:4173
```

---

## ?? Testing the Features

### Authentication
1. Open http://localhost:5173
2. Click **"Google"** (or other provider)
3. Sign in with test account
4. Should see main app

### Edita (Drawing Mode)
1. Scroll down to a scene with an image
2. Click **"?? Edita"** button (bottom right)
3. Draw on the image
4. Click **"?"** to exit
5. Drawings saved in session

### Project DNA
1. Make annotations with Edita
2. Add pins (?? / ?? / ??)
3. Leave comments
4. Data persists in sessionStorage
5. Refresh page = data lost (expected MVP behavior)

---

## ?? Deploy to Production (Vercel)

### Step 1: Push to Git
```bash
git add .
git commit -m "IEL Architecture v0.2"
git push origin main
```

### Step 2: Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Click **Import**

### Step 3: Add Environment Variables
1. **Settings** ? **Environment Variables**
2. Add all 6 Firebase vars:
   - `REACT_APP_FIREBASE_API_KEY`
   - `REACT_APP_FIREBASE_AUTH_DOMAIN`
   - `REACT_APP_FIREBASE_PROJECT_ID`
   - `REACT_APP_FIREBASE_STORAGE_BUCKET`
   - `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`
   - `REACT_APP_FIREBASE_APP_ID`
3. Click **Save**

### Step 4: Deploy
1. Vercel auto-deploys on `git push`
2. Wait for "? Deployment successful"
3. Your site is live! ??

---

## ?? Project Structure

```
iel-architecture/
??? public/
?   ??? index.html
?   ??? *.png (12 placeholder images)
??? src/
?   ??? auth/
?   ?   ??? AuthContext.jsx
?   ??? components/
?   ?   ??? LoginScreen.jsx & .css
?   ?   ??? EditaMode.jsx & .css
?   ?   ??? ... (existing components)
?   ??? context/
?   ?   ??? ProjectContext.jsx
?   ??? data/
?   ?   ??? ProjectModel.js
?   ??? main.jsx (entry point)
?   ??? App.js
?   ??? App.css
?   ??? index.css
??? .env.local (create this)
??? .env.example (template)
??? package.json
??? vite.config.js
```

---

## ?? Documentation

| File | Purpose |
|------|---------|
| [README.md](./README.md) | Feature overview |
| [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) | Detailed Firebase guide |
| [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) | API reference |
| [VITE_CONFIG.md](./VITE_CONFIG.md) | Vite configuration |
| [LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md) | Pre-launch verification |
| [CHANGELOG.md](./CHANGELOG.md) | Version history |
| [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) | Complete summary of changes |

---

## ?? Architecture Overview

### Authentication Flow
```
User Opens App
    ?
AuthProvider checks Firebase
    ?
Not Authenticated? ? LoginScreen
    ?
Authenticated? ? AppContent
    ?
ProjectProvider wraps all
    ?
Scene Navigation + Edita + Pins
```

### Data Flow
```
User Action (draw, annotate, pin)
    ?
EditaMode / DreamPins component
    ?
useProject() hook
    ?
ProjectContext updates SessionMemory
    ?
sessionStorage persisted
    ?
Component re-renders with new state
```

---

## ?? Key Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (5173)
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Check code quality
npm run lint -- --fix # Fix ESLint errors
```

---

## ?? Troubleshooting

### "Port 5173 already in use"
```bash
npm run dev -- --port 3000
```

### ".env.local not working"
- Restart dev server after editing `.env.local`
- Make sure file is in project root
- Check variable names are exact

### Can't sign in with Google
- Make sure Firebase Google auth is enabled
- Check localhost:5173 is in authorized origins
- Check .env.local has correct `REACT_APP_FIREBASE_PROJECT_ID`

### Build fails
```bash
rm -rf node_modules dist
npm install
npm run build
```

### Drawings disappear after refresh
- **This is expected!** MVP uses sessionStorage
- Data is lost on page refresh
- Phase 2 will add Firestore for persistence

---

## ?? Using the Platform

### For Clients
1. **Login** with Google/Apple/Microsoft/Email
2. **Explore** 13 architectural scenes
3. **Compare** building variants with slider
4. **Annotate** with Edita (?? button)
5. **React** with pins (?? / ?? / ??)
6. **Comment** on scenes
7. **View Summary** of your choices

### For Admin (CaniRaffaella@gmail.com)
1. Login with admin email
2. `isAdmin` flag available in code
3. Future: Access to architect reports

---

## ?? Security Notes

### What's Protected
- ? Authentication with Firebase
- ? Environment variables (.gitignore)
- ? User sessions isolated
- ? Admin role identification

### What's Not Protected (MVP)
- ?? No GDPR compliance yet (Phase 2)
- ?? Session data in localStorage (not encrypted)
- ?? No API key rotation (static env vars)

---

## ?? Performance Metrics (Target)

- **Initial Load:** < 3s
- **Dev Server Start:** < 5s
- **Hot Reload:** < 1s
- **Build Size:** < 500KB gzipped
- **Touch Responsiveness:** < 100ms

---

## ?? Next Phases

### Phase 2 (Cloud & AI)
- Firestore cloud persistence
- Multi-session project history
- AI-powered architectural advice
- Decision advisor (costs, materials, energy)

### Phase 3 (Exports)
- PDF generation with timeline
- Spreadsheet exports
- Email architect reports

### Phase 4 (Analytics)
- Decision heatmaps
- Client preferences tracking
- Design recommendations

---

## ?? Support

### Setup Issues
? Check [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)

### Code/Architecture Questions
? See [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)

### Vite Configuration
? Read [VITE_CONFIG.md](./VITE_CONFIG.md)

### Pre-Launch Checklist
? Use [LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md)

---

## ?? License & Credits

**IEL Architecture MVP 0.2**
- React 18 + Firebase 10.7 + Vite 5.0
- Mobile-first responsive design
- Production-ready authentication
- Session-based project memory

Built for architectural intelligence and client decision tracking.

---

**Ready to launch?** See [LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md)

**Questions?** Email: CaniRaffaella@gmail.com

# IEL for Architecture — MVP 0.2

Interactive Architectural Decision Platform. Client-facing AI-assisted design exploration with persistent decision memory.

**Status:** Authentication + Edita + Project DNA System implemented ✓

---

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/Raffaella23/iel-architecture.git
cd iel-architecture
npm install
```

### 2. Configure Firebase

**First time setup:**

```bash
cp .env.example .env.local
# Edit .env.local with your Firebase credentials
```

For detailed Firebase setup, see [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)

### 2. Run Locally

```bash
npm run dev
# → opens http://localhost:5173
```

---

## What's New (v0.2)

### ✅ Authentication
- Google, Apple, Microsoft, Email/Password sign-in
- Session management with Firebase
- Admin access for `CaniRaffaella@gmail.com`

### ✅ Project DNA & Annotations
- Living architectural model tracking decisions
- Persistent session memory (sessionStorage)
- Chronological decision timeline

### ✅ Edita (Drawing Mode)
- Client can draw and annotate on scene images
- Free-hand pen, rectangles, circles
- Mobile-optimized with touch support
- Explicit activation (prevents accidental drawing)

### ✅ Mobile Fixes
- Isolated touch events (CompareSlider + Edita safe)
- Responsive design mobile-first
- Touch-friendly toolbar

---

## Architecture

### Authentication Layer
- `src/auth/AuthContext.jsx` — Firebase auth state
- `src/components/LoginScreen.jsx` — Login UI
- Protected app entry (must authenticate first)

### Data Layer
- `src/data/ProjectModel.js` — Annotation & DNA classes
- `src/context/ProjectContext.jsx` — State management
- `sessionStorage` for runtime persistence

### Interaction Layer
- `src/components/EditaMode.jsx` — Drawing system
- Enhanced `CompareSlider` — Mobile-safe touch events
- Existing scene navigation preserved

---

## File Structure

```
iel-architecture/
├── src/
│   ├── auth/
│   │   └── AuthContext.jsx
│   ├── components/
│   │   ├── LoginScreen.jsx
│   │   ├── EditaMode.jsx
│   │   └── ...existing
│   ├── context/
│   │   └── ProjectContext.jsx
│   ├── data/
│   │   └── ProjectModel.js
│   ├── firebase.js
│   ├── App.js (auth wrapper)
│   └── index.js
├── public/
│   └── (placeholder images)
├── .env.example
├── .env.local (create this)
├── FIREBASE_SETUP.md (detailed guide)
├── IMPLEMENTATION_GUIDE.md (API reference)
└── package.json
```

---

## Development

### Lint

```bash
npm run lint
```

### Build

```bash
npm run build
# → creates /dist for deployment
```

### Run Locally (Dev Mode)

```bash
npm run dev
# Hot reload enabled, opens http://localhost:5173
```

### Deploy to Vercel

```bash
git add .
git commit -m "Your changes"
git push
```

1. Go to [vercel.com](https://vercel.com)
2. Import the repository
3. Add environment variables from `.env.local`
4. Deploy

Vercel will auto-update on every push to `main`.

---

## Using the Platform

### For Clients

1. **Login** with Google, Apple, Microsoft, or Email
2. **Explore** scenes with comparison slider
3. **Draw** with Edita mode (click ✏️ button)
4. **Leave feedback** with pins (❤️ / 💡 / 🤔) and comments
5. **View summary** of all decisions and reactions

### For Architects (Admin)

Login with: `CaniRaffaella@gmail.com`

Access to:
- Private decision reports
- Project DNA export
- Render prompt version history
- Client annotation history

---

## Data Persistence

**Current (MVP):**
- Session data stored in `sessionStorage`
- Lost on page refresh (**acceptable for MVP**)
- Each session is independent

**Next Phase:**
- Firestore cloud storage
- Multi-session history
- Cross-device access
- Architect report archiving

---

## Next Steps

1. **Cloud Persistence**: Firestore integration for saved projects
2. **AI Integration**: Contextual architectural advice panels
3. **Render Prompt Engine**: Auto-evolving design prompts
4. **Advanced Exports**: PDF/Spreadsheet with decision history
5. **Analytics**: Decision heatmaps and client preference patterns

---

## Troubleshooting

### Login page appears but can't sign in
→ Check `FIREBASE_SETUP.md` — Firebase might not be configured

### Drawings disappear after refresh
→ **Expected in MVP** — sessionStorage is cleared on page refresh. Cloud persistence coming in Phase 2.

### "REACT_APP_FIREBASE_API_KEY is undefined"
→ Create `.env.local` and restart server

### CompareSlider not working on mobile
→ Check ESLint: `npm run lint` — might have touch event issues

---

## Documentation

- [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) — Firebase configuration guide
- [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) — API reference and examples

---

*IEL — Architectural Intelligence Platform*
*Built with React 18, Firebase, Vite*
*Responsive, mobile-first, production-ready MVP*

# Vite Configuration — IEL Architecture

This project uses **Vite** as the build tool and dev server, not Create React App.

## Why Vite?

- ? **Ultra-fast** development server (instant hot reload)
- ?? **Smaller builds** (~2x faster than webpack)
- ?? **Native ES modules** in development
- ?? **Production-ready** build optimization
- ?? **Better TypeScript** support out of the box

## Development

```bash
npm install
npm run dev
# Opens http://localhost:5173
```

## Production Build

```bash
npm run build
# Creates /dist folder for deployment
```

## Preview Build Locally

```bash
npm run build
npm run preview
# Opens http://localhost:4173
```

## File Structure for Vite

```
iel-architecture/
??? public/             ? Static assets (images, manifest)
?   ??? index.html      ? (Vite uses different entry)
?   ??? *.png
??? src/
?   ??? main.jsx        ? Entry point (NOT index.js!)
?   ??? App.js
?   ??? index.css
?   ??? ...components
??? vite.config.js      ? Vite configuration
```

## Key Differences from Create React App

| Feature | Create React App | Vite |
|---------|------------------|------|
| Entry point | `src/index.js` | `src/main.jsx` |
| Dev command | `npm start` | `npm run dev` |
| Dev port | `3000` | `5173` |
| Build command | `npm run build` | `npm run build` |
| Build output | `build/` | `dist/` |
| Config file | `.env` prefix | `.env` suffix |

## Environment Variables in Vite

In Vite, env vars must be prefixed with `VITE_` **or** use custom patterns.

We're using **`REACT_APP_`** prefix (from CRA convention) because Firebase doesn't require `VITE_`.

**File:** `.env.local`

```env
REACT_APP_FIREBASE_API_KEY=...
REACT_APP_FIREBASE_AUTH_DOMAIN=...
```

To access in code:

```javascript
const apiKey = import.meta.env.REACT_APP_FIREBASE_API_KEY;
```

Or use the common approach (already configured in firebase.js):

```javascript
process.env.REACT_APP_FIREBASE_API_KEY  // Works with Vite thanks to @vitejs/plugin-react
```

## Deployment

### Vercel (Recommended)

Vercel auto-detects Vite and configures it correctly:

```bash
git push origin main
# Vercel builds with: npm run build
# Deploys: /dist folder
# Serves on: https://iel-architecture.vercel.app
```

### Other Hosts

Deploy the `dist/` folder as static site:

```bash
npm run build
# Upload dist/ to your host
```

## Hot Module Replacement (HMR)

Vite provides instant HMR during development:

- Save a file ? browser updates instantly
- No page refresh needed (state preserved)
- Works for React components, CSS, etc.

## Build Analysis

To analyze bundle size:

```bash
npm install -g vite-plugin-visualizer
# Then inspect dist/ after build
```

## Troubleshooting

### "Cannot find module" errors
- Check file extensions: Vite requires `.jsx` for JSX files (or configure)
- Current setup: `.jsx` for functional components, `.js` for logic

### Port 5173 already in use
```bash
npm run dev -- --port 3000
```

### .env variables not loading
- Ensure `REACT_APP_` prefix
- Restart dev server after editing `.env.local`
- Check `import.meta.env` in browser console

### Build errors
- Run `npm install` to ensure all deps
- Clear cache: `rm -rf node_modules dist`
- Check ESLint: `npm run lint`

---

**Vite Documentation:** https://vitejs.dev
**React Plugin:** https://github.com/vitejs/vite-plugin-react

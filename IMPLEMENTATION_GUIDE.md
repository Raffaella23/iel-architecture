# IEL Architecture System — Implementation Guide

## Nuove Funzionalità Implementate

### 1. ?? **Authentication System**

- **Firebase Integration**: Google, Apple, Microsoft, Email/Password
- **Secure Login Screen**: Mobile-optimized UI con smooth transitions
- **Session Management**: Automatic user tracking and logout

**Files:**
- `src/firebase.js` - Firebase configuration
- `src/auth/AuthContext.jsx` - Auth state management
- `src/components/LoginScreen.jsx` - Login UI
- `src/components/LoginScreen.css` - Responsive styles

**Usage in Components:**
```javascript
import { useAuth } from './auth/AuthContext';

export default function MyComponent() {
  const { user, isAdmin, logout } = useAuth();

  return (
    <div>
      {user.email}
      {isAdmin && <button>Admin Panel</button>}
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

**Admin Features:**
- Identified by email: `1cianiraffaella@gmail.com`
- Access to private architect reports
- Project data management

---

### 2. ?? **Project DNA & Annotations System**

Living model of architectural decisions with persistent memory.

**Data Model:**
```javascript
// Annotation: Single marked point/region
class Annotation {
  id, sceneId, geometry, viewportPosition, room, emoji, 
  timestamp, linkedConversation, linkedComments, status
}

// ProjectDNA: Evolving architectural model
class ProjectDNA {
  designIntent, materials, lighting, privacy, atmosphere,
  recurringPreferences, unresolvedQuestions, confidenceLevel,
  renderPromptVersion, renderPromptText
}

// SessionMemory: Runtime state manager
class SessionMemory {
  annotations (Map), dna, decisionTimeline
}
```

**Files:**
- `src/data/ProjectModel.js` - Data classes
- `src/context/ProjectContext.jsx` - State management

**Usage in Components:**
```javascript
import { useProject } from './context/ProjectContext';

export default function MyScene() {
  const { addAnnotation, updateDNA, getAnnotationsByScene } = useProject();

  const handleNewAnnotation = () => {
    addAnnotation(sceneId, {
      geometry: { type: 'point', data: { x: 100, y: 200 } },
      viewportPosition: { x: 0.5, y: 0.3 },
      room: 'Soggiorno',
      emoji: '??',
    });
  };

  const updateDNAIntent = () => {
    updateDNA({
      designIntent: 'Spazio aperto con luce naturale',
    }, 'User requested open space');
  };
}
```

**Data Persistence:**
- **Session Memory**: `sessionStorage` (current session only)
- **Cloud (Future)**: Will integrate Firestore for multi-session persistence

---

### 3. ?? **Edita Mode — Drawing & Annotation System**

Client can draw directly on scene images after explicit activation.

**Features:**
- **Pen Mode**: Free-hand drawing with customizable stroke width
- **Shapes**: Rectangle and circle drawing tools
- **Colors**: 4 architectural color palette (bronze, sage, terracotta, gold)
- **Touch-Optimized**: Mobile-safe, prevents Edita conflicts with slider
- **Persistent Drawings**: Saved to project session memory

**Files:**
- `src/components/EditaMode.jsx` - Drawing interface
- `src/components/EditaMode.css` - Mobile-responsive styles

**Integration in Scene:**
```javascript
import EditaMode from './components/EditaMode';

export default function Scene() {
  const imageRef = useRef(null);

  return (
    <>
      <img ref={imageRef} src={sceneImage} />
      <EditaMode sceneId={sceneId} imageElement={imageRef.current} />
    </>
  );
}
```

**User Workflow:**
1. Click "?? Edita" button to activate drawing mode
2. Select tool (pen, rectangle, circle)
3. Choose color and stroke width
4. Draw on image
5. Drawings are automatically saved with annotations
6. Click "?" to exit drawing mode (drawings remain saved)

---

### 4. ?? **Mobile Optimizations**

**Touch Event Isolation:**
- CompareSlider: Scoped touch events prevent Edita conflicts
- Passive listeners on non-blocking events
- PreventDefault only where necessary

**Responsive Design:**
- Mobile-first CSS architecture
- Touch-optimized button sizes (44px+ target area)
- Flexible toolbars for small screens
- Bottom sheet positioning for mobile

---

## Setup Instructions

### 1. Environment Configuration

Create `.env.local` in project root:

```bash
cp .env.example .env.local
# Edit .env.local with your Firebase credentials
```

### 2. Firebase Setup

Follow `FIREBASE_SETUP.md` for:
- Creating Firebase project
- Enabling authentication methods
- Obtaining credentials
- Local and deployment configuration

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Locally

```bash
npm run dev
# Opens http://localhost:5173
# Hot reload enabled
```

For more details on Vite configuration, see [VITE_CONFIG.md](./VITE_CONFIG.md)

### 5. Build & Test

```bash
npm run lint    # Check ESLint
npm run build   # Production build
```

---

## Project Structure

```
iel-architecture/
??? public/              # Static assets + placeholder images
?   ??? *.png           # Architectural renders
?   ??? index.html
??? src/
?   ??? auth/
?   ?   ??? AuthContext.jsx        # Firebase auth management
?   ??? components/
?   ?   ??? LoginScreen.jsx        # Login UI
?   ?   ??? LoginScreen.css
?   ?   ??? EditaMode.jsx          # Drawing mode
?   ?   ??? EditaMode.css
?   ?   ??? ...existing components
?   ??? context/
?   ?   ??? ProjectContext.jsx     # Project data state
?   ??? data/
?   ?   ??? ProjectModel.js        # Data classes
?   ??? firebase.js                # Firebase config
?   ??? App.js                     # Main app + auth wrapper
?   ??? App.css
?   ??? index.js
?   ??? index.css
??? .env.example                  # Environment template
??? .env.local                    # Local env vars (gitignored)
??? .gitignore
??? FIREBASE_SETUP.md             # Firebase configuration guide
??? package.json
??? vite.config.js
```

---

## Key Decisions & Trade-offs

### Why Firebase?
- ? Supports Google, Apple, Microsoft, Email natively
- ? Free tier covers MVP usage
- ? Scales to production easily
- ? No backend infrastructure needed initially
- ? GDPR-compliant data storage options

### Why sessionStorage for now?
- ? Fast, no server round-trips
- ? Suitable for single-session MVP
- ? Easy migration to Firestore later
- ?? Data lost on page refresh (acceptable for MVP)
- **Future:** Add Firestore sync on logout/save events

### Why explicit Edita activation?
- ? Prevents accidental drawing
- ? Clear user intent
- ? Mobile-friendly (no hover states)
- ? Distinguishes from passive viewing

### Why touch event isolation?
- ? Prevents CompareSlider from triggering Edita
- ? Prevents Edita from blocking slider
- ? Better touch UX on mobile
- ? Future-proofs for more complex interactions

---

## Future Enhancements (Phase 2+)

1. **Cloud Persistence**
   - Firestore integration for multi-session data
   - User project history
   - Architect report access

2. **AI Integration**
   - Contextual architectural advice
   - Decision advisor (costs, complexity, materials)
   - Inspiration generation with visual references

3. **Render Prompt Engine**
   - Automatic prompt versioning
   - Prompt inspector UI
   - Export/copy functionality

4. **Advanced Exports**
   - PDF generation with decision timeline
   - Spreadsheet exports (materials, costs, notes)
   - Email integration

5. **Analytics & Insights**
   - Decision heatmaps
   - Client preference patterns
   - Confidence metrics tracking

---

## Troubleshooting

### Login doesn't work
- Check Firebase credentials in `.env.local`
- Verify project is enabled for each auth method
- Check browser console for error messages
- Ensure localhost is in authorized JavaScript origins (for Google)

### Drawings not persisting
- Check browser supports sessionStorage
- Verify EditaMode is inside ProjectProvider
- Check browser console for errors

### Mobile touch events acting weird
- Verify touch event handlers have proper preventDefault
- Test on actual device (not just browser emulation)
- Check CSS for `touch-action` properties

### Build fails
- Run `npm install` to ensure all deps
- Check ESLint errors: `npm run lint`
- Clear node_modules: `rm -rf node_modules && npm install`

---

## Support & Questions

- **Firebase Issues**: See FIREBASE_SETUP.md
- **Architecture Questions**: Check comments in `src/data/ProjectModel.js`
- **Component Integration**: Look at examples in component files

**Contact:** CaniRaffaella@gmail.com

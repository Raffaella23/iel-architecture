# Changelog — IEL Architecture

## [0.2.0] - 2026-07-03

### ?? Added — Authentication System
- Firebase integration (Google, Apple, Microsoft, Email/Password)
- Secure LoginScreen component with OAuth and email flows
- AuthContext for state management
- Admin access identification (CaniRaffaella@gmail.com)
- Session tracking and logout functionality

### ?? Added — Project DNA & Annotations
- ProjectModel.js with Annotation, ProjectDNA, SessionMemory classes
- ProjectContext for state management
- Persistent session memory using sessionStorage
- Chronological decision timeline logging
- Annotation linking to scenes, conversations, and comments

### ?? Added — Edita Mode (Drawing & Annotation)
- EditaMode component with free-hand, rectangle, circle drawing
- Color picker (bronze, sage, terracotta, gold)
- Adjustable stroke width (1-8px)
- Mobile-optimized touch event handling
- Explicit activation to prevent accidental drawing
- Drawings persist to session memory

### ?? Improved — Mobile & Touch Events
- CompareSlider: Scoped touch events prevent interference with other modes
- Isolated event listeners (passive where safe, preventDefault only when needed)
- Mobile-first responsive design for all new components
- Touch-friendly toolbar with adequate target sizes (44px+)
- Better touch UX on smaller screens

### ?? Added — Dependencies
- firebase ^10.7.0 - Authentication and future persistence
- eslint & eslint-config-react-app - Code quality

### ?? Added — Documentation
- FIREBASE_SETUP.md - Step-by-step Firebase configuration
- IMPLEMENTATION_GUIDE.md - API reference and usage examples
- .env.example - Environment variables template
- Updated README.md with new features and setup

### ?? Added — Build & Deployment
- ESLint configuration in package.json
- npm lint script for code quality checks
- .gitignore with environment variables protection
- Firebase configuration via environment variables

### ?? Added — Styling
- LoginScreen.css - Mobile-optimized auth UI
- EditaMode.css - Mobile-responsive drawing toolbar
- Consistent with existing design system (bronze, paper, ink palette)

---

## [0.1.0] - Previous Release

### Initial Features
- Interactive scene navigation with 13 architectural scenes
- CompareSlider for dual-image variants
- Dream Pins system (?? / ?? / ??)
- Decision Replay explanations
- Comment system for feedback
- QR code sharing
- Welcome screen & summary view
- Mood filters for selected scenes
- Placeholder architectural images

---

## Breaking Changes

None in v0.2 — All existing features preserved and enhanced.

---

## Migration Notes

### For Developers
- All components now require AuthProvider and ProjectProvider wrappers
- Import the new IELApp export from src/App.js instead of App directly
- Firebase credentials must be set in .env.local before running

### For Deployment
- Add 6 Firebase environment variables to Vercel dashboard
- .env.local is gitignored and won't be deployed automatically

---

## Known Limitations (MVP)

- Session data lost on page refresh (sessionStorage only)
- No multi-session history or cloud backup
- Admin features minimal (basic email identification)
- Annotations not yet backed by cloud storage
- No AI integration yet (Phase 2)

---

## Future Roadmap

### Phase 2 (Cloud & AI)
- [ ] Firestore integration for persistent multi-session storage
- [ ] AI-powered contextual advice panels
- [ ] Decision advisor (costs, materials, energy efficiency)
- [ ] Architectural inspiration generator

### Phase 3 (Exports & Reports)
- [ ] PDF generation with decision timeline
- [ ] Spreadsheet exports (materials, brands, costs)
- [ ] Architect-only private reports
- [ ] Email integration for report distribution

### Phase 4 (Analytics & Intelligence)
- [ ] Decision heatmaps
- [ ] Client preference pattern recognition
- [ ] Confidence metrics tracking
- [ ] Design solution recommendations

---

## Security & Compliance

### Implemented
- ? Firebase Authentication (industry standard)
- ? Environment variable protection (.gitignore)
- ? Client data isolated per user session
- ? GDPR-compliant data handling ready (Firestore)

### To Be Implemented
- [ ] GDPR data export/deletion endpoints
- [ ] Data retention policies
- [ ] End-to-end encryption for sensitive annotations
- [ ] Admin audit logs

---

## Testing

### Manual Testing Completed
- ? Firebase login flows (Google, Apple, Microsoft, Email)
- ? Session memory persistence
- ? Edita drawing on desktop and mobile
- ? CompareSlider touch isolation
- ? Responsive UI on mobile (320px-1920px)

### To Be Automated
- [ ] Jest unit tests for ProjectModel
- [ ] React Testing Library for components
- [ ] E2E tests for auth flows
- [ ] Mobile device testing suite

---

*Deployed with: React 18, Firebase 10.7, Vite*

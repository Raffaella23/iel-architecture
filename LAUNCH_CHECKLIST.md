# Pre-Launch Checklist — IEL Architecture MVP 0.2

## ? Development Setup

- [ ] Clone repository
- [ ] Run `npm install`
- [ ] Create `.env.local` with Firebase credentials
- [ ] Run `npm start` and test locally
- [ ] Login works with all auth methods
- [ ] Scene navigation works
- [ ] CompareSlider works on mobile
- [ ] Edita drawing mode activates and works
- [ ] Pins and comments still work (preserved features)

---

## ? Firebase Configuration

- [ ] Firebase project created at console.firebase.google.com
- [ ] Authentication methods enabled:
  - [ ] Google
  - [ ] Apple
  - [ ] Microsoft
  - [ ] Email/Password
- [ ] Web app registered in Firebase
- [ ] Credentials copied to `.env.local`
- [ ] Localhost:3000 added to authorized JavaScript origins (for Google)
- [ ] Test each login method locally

---

## ? Code Quality

- [ ] Run `npm run lint` — no errors
- [ ] Run `npm run build` — successful
- [ ] Check for console errors in browser DevTools
- [ ] Test on mobile device (not just browser emulation)
  - [ ] Touch events work smoothly
  - [ ] UI responsive at 320px width
  - [ ] No layout shifts

---

## ? Git & Version Control

- [ ] All changes committed
- [ ] No sensitive data in commits (.env.local is gitignored)
- [ ] Updated CHANGELOG.md
- [ ] Updated README.md
- [ ] Version bumped in package.json (if needed)
- [ ] Ready for `git push origin main`

---

## ? Deployment to Vercel

### Pre-Deployment
- [ ] Logged into vercel.com
- [ ] Repository imported
- [ ] Build settings correct (should be auto-detected)

### Environment Variables in Vercel
Go to **Settings ? Environment Variables** and add:

- [ ] `REACT_APP_FIREBASE_API_KEY`
- [ ] `REACT_APP_FIREBASE_AUTH_DOMAIN`
- [ ] `REACT_APP_FIREBASE_PROJECT_ID`
- [ ] `REACT_APP_FIREBASE_STORAGE_BUCKET`
- [ ] `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `REACT_APP_FIREBASE_APP_ID`

### Deployment
- [ ] Run `git push origin main`
- [ ] Vercel auto-deploys
- [ ] Wait for "Deployment successful" status
- [ ] Visit deployment URL and test login
- [ ] All auth methods work on production
- [ ] Mobile-responsive design intact

---

## ? Post-Launch Testing

### Authentication
- [ ] Google login works
- [ ] Apple login works
- [ ] Microsoft login works
- [ ] Email/Password signup works
- [ ] Email/Password login works
- [ ] Logout works
- [ ] Session persists on page navigation
- [ ] Session lost on browser close (sessionStorage behavior)

### Features
- [ ] All 13 scenes load correctly
- [ ] CompareSlider works on desktop and mobile
- [ ] Edita mode activates with ?? button
- [ ] Can draw with pen, rectangle, circle
- [ ] Drawings persist in session
- [ ] Drawings lost on page refresh (expected MVP behavior)
- [ ] Pins and comments save correctly
- [ ] Summary view shows all pins and comments
- [ ] QR code sharing works

### Performance
- [ ] Page load time < 3s
- [ ] No layout shifts (CLS)
- [ ] Touch interactions responsive
- [ ] No console errors

---

## ? Admin Testing

- [ ] Login with `CaniRaffaella@gmail.com`
- [ ] `isAdmin` flag correctly identifies admin user
- [ ] Future admin features will have this flag available

---

## ? Mobile Device Testing (Real Hardware)

Test on actual devices:

- [ ] iPhone (iOS 14+)
- [ ] Android phone (Android 10+)
- [ ] Tablet (landscape orientation)

Check:
- [ ] Login flows work
- [ ] No zoom jumps
- [ ] Touch events smooth
- [ ] Toolbar not cut off
- [ ] Drawings work with finger

---

## ? Browser Compatibility

- [ ] Chrome/Chromium (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## ? Documentation

- [ ] FIREBASE_SETUP.md is complete and accurate
- [ ] IMPLEMENTATION_GUIDE.md covers all components
- [ ] README.md reflects new features
- [ ] CHANGELOG.md documents changes
- [ ] Code comments explain complex logic
- [ ] .env.example shows all required variables

---

## ? Security Review

- [ ] No hardcoded credentials in code
- [ ] .env.local in .gitignore
- [ ] .env.local never committed
- [ ] Firebase security rules reviewed (default test mode is fine for MVP)
- [ ] Admin access only for specific email
- [ ] No sensitive data in console logs

---

## ?? Launch Steps

1. **Pre-launch**
   - [ ] Complete all checkboxes above
   - [ ] Get sign-off from team

2. **Day of Launch**
   - [ ] Make final test deployment
   - [ ] Share production URL with stakeholders
   - [ ] Send launch announcement

3. **Post-launch Monitoring**
   - [ ] Monitor error rates for first 24h
   - [ ] Check user feedback
   - [ ] Monitor Firebase usage (costs)
   - [ ] Be ready to rollback if needed

---

## ?? Support Contacts

- **Firebase Issues**: Console.firebase.google.com
- **Deployment Issues**: Vercel dashboard and logs
- **Code Questions**: See IMPLEMENTATION_GUIDE.md
- **Admin**: CaniRaffaella@gmail.com

---

## Notes for Next Phases

### Phase 2 (Cloud Persistence)
- [ ] Add Firestore database configuration
- [ ] Create migration for sessionStorage ? Firestore
- [ ] Add multi-session project history

### Phase 3 (AI Integration)
- [ ] Research AI service (OpenAI API, etc.)
- [ ] Plan contextual panel UI
- [ ] Create prompt engineering system

### Phase 4 (Exports)
- [ ] Evaluate PDF generation libraries
- [ ] Design export templates
- [ ] Integrate email service

---

**Last Updated:** 2026-07-03
**Prepared for:** Production MVP Launch
**Status:** Ready for Launch ?

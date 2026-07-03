# ?? QUICK START — 3 Steps to Production

**Time Required:** 20 minutes  
**Complexity:** Easy  
**Result:** Live app with authentication  

---

## Step 1: Local Setup (5 min)

### Windows
```bash
setup.bat
```

### macOS / Linux
```bash
bash setup.sh
```

### Manual
```bash
npm install
cp .env.example .env.local
```

? **Done!** Dependencies installed.

---

## Step 2: Firebase Setup (10 min)

### Go to Firebase
1. Open https://console.firebase.google.com
2. Click "Add Project"
3. Name: `iel-architecture`
4. Click "Create Project"

### Enable Auth
1. Left sidebar ? Authentication
2. Click "Sign-in method"
3. Enable: Google, Apple, Microsoft, Email

### Get Credentials
1. Click ?? ? Project Settings
2. Under "Your apps" ? Web
3. Copy the config object
4. Open `.env.local` and paste values:

```
REACT_APP_FIREBASE_API_KEY=<apiKey>
REACT_APP_FIREBASE_AUTH_DOMAIN=<authDomain>
REACT_APP_FIREBASE_PROJECT_ID=<projectId>
REACT_APP_FIREBASE_STORAGE_BUCKET=<storageBucket>
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=<messagingSenderId>
REACT_APP_FIREBASE_APP_ID=<appId>
```

### Authorize localhost
1. Firebase Console ? Authentication ? Google
2. Add to "Authorized JavaScript origins":
   - `http://localhost:5173`

? **Done!** Firebase configured.

---

## Step 3: Test & Deploy (5 min)

### Test Locally
```bash
npm run dev
# Opens http://localhost:5173
```

Try login with Google. ?

### Deploy to Vercel
```bash
git add .
git commit -m "IEL Architecture v0.2"
git push origin main
```

### Configure Vercel
1. Go to Vercel dashboard
2. Open your `iel-architecture` project
3. Settings ? Environment Variables
4. Add all 6 Firebase variables
5. Click Save

Vercel auto-deploys! ?

---

## ? You're Done!

Your app is now:
- ? Live on Vercel (auto-updates on `git push`)
- ? Authenticated with 4 providers
- ? Mobile-ready
- ? Ready for drawing mode (Edita)

---

## ?? Need More Help?

- **Complete walkthrough:** [COMPLETE_SETUP_GUIDE.md](./COMPLETE_SETUP_GUIDE.md)
- **Firebase issues:** [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)
- **Deployment issues:** [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **API reference:** [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)

---

## ?? You're Ready!

Everything is configured and tested. Your MVP is production-ready.

**Questions?** See the full guides above.

**Ready to customize?** Check the component files in `src/`.

?? **Ship it!**

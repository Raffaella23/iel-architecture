# Deployment Guide — IEL Architecture

**Target:** Vercel (recommended) or any static hosting  
**Duration:** 10 minutes  
**Requirements:** GitHub account + Firebase credentials  

---

## Prerequisites

Before deploying, ensure:

? All code committed to Git
? Local testing complete (`npm run build` succeeds)
? Firebase project created and configured
? `.env.local` has all 6 Firebase variables
? `vercel.json` configured for Vite

---

## Step 1: Prepare for Deployment

### Local Testing
```bash
npm run build
npm run preview
# Should work perfectly at http://localhost:4173
```

### Commit All Changes
```bash
git add .
git commit -m "IEL Architecture v0.2 - Ready for deployment"
git push origin main
```

---

## Step 2: Deploy to Vercel (Recommended)

### If First Time with Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub (or create account)
3. Click **"Add New Project"**
4. Find and select `iel-architecture` repository
5. Click **Import**

Vercel will auto-detect:
- ? Framework: Vite
- ? Build command: `npm run build`
- ? Output directory: `dist`

### Add Environment Variables

**CRITICAL STEP:**

1. In Vercel dashboard, open **Settings** ? **Environment Variables**
2. Add all 6 Firebase variables:

| Key | Value |
|-----|-------|
| `REACT_APP_FIREBASE_API_KEY` | From Firebase console |
| `REACT_APP_FIREBASE_AUTH_DOMAIN` | your-project.firebaseapp.com |
| `REACT_APP_FIREBASE_PROJECT_ID` | your-project-id |
| `REACT_APP_FIREBASE_STORAGE_BUCKET` | your-project.appspot.com |
| `REACT_APP_FIREBASE_MESSAGING_SENDER_ID` | sender-id-number |
| `REACT_APP_FIREBASE_APP_ID` | app-id-string |

3. Click **Save**

### Deploy

1. Click **Deploy** button
2. Wait 2-3 minutes for build to complete
3. See ? **"Deployment successful"** message
4. Click visit URL or use auto-generated domain

---

## Step 3: Post-Deployment Testing

### Production Smoke Test

On your deployed URL:

- [ ] Page loads without errors
- [ ] Can login with each provider:
  - [ ] Google
  - [ ] Apple
  - [ ] Microsoft
  - [ ] Email/Password
- [ ] All 13 scenes visible
- [ ] CompareSlider works
- [ ] Edita drawing mode works
- [ ] Pins and comments save
- [ ] QR code generation works
- [ ] Mobile responsive on 320px width
- [ ] No console errors (F12)

### Check Vercel Analytics

1. Go to Vercel dashboard
2. **Analytics** tab shows:
   - Page load time
   - Core Web Vitals
   - Error rates

---

## Step 4: Configure Custom Domain (Optional)

### Add Domain to Vercel

1. In project settings, go to **Domains**
2. Add your domain (e.g., `iel-architecture.com`)
3. Follow DNS configuration instructions
4. Wait 24-48 hours for propagation

### Test Custom Domain

```bash
https://your-domain.com
# Should load your deployed app
```

---

## Step 5: Continuous Deployment Setup

Vercel auto-deploys on every push to `main`:

```bash
# Make a change
git add .
git commit -m "Update feature"
git push origin main

# Vercel automatically:
# 1. Pulls latest code
# 2. Runs npm install
# 3. Runs npm run build
# 4. Deploys /dist to CDN
# 5. Shows deployment URL

# Typically takes 1-3 minutes
```

---

## Alternative: Deploy to Other Platforms

### Netlify

1. Go to [netlify.com](https://netlify.com)
2. Connect GitHub repository
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add environment variables
6. Deploy

### GitHub Pages

Not recommended (requires extra configuration for SPA routing).

### AWS S3 + CloudFront

1. Build locally: `npm run build`
2. Upload `/dist` contents to S3 bucket
3. Configure CloudFront distribution
4. Set environment variables in build process

### DigitalOcean App Platform

1. Create new app
2. Connect GitHub repo
3. Set build command: `npm run build`
4. Set HTTP routes to serve `/dist`
5. Add environment variables
6. Deploy

---

## Monitoring & Maintenance

### Monitor Performance

**Weekly Check:**
```bash
# Visit https://your-deployed-url.com
# Check browser console (F12) for errors
# Test all auth methods
# Test drawing mode on mobile
```

### Monitor Firebase Usage

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. **Project settings** ? **Usage & billing**
3. Monitor:
   - Authentication (free tier: 10k/month)
   - Firestore reads/writes (when implemented)

### Update Dependencies

Monthly security updates:
```bash
npm update
npm audit fix
git push  # Auto-deploys on Vercel
```

---

## Troubleshooting Deployment

### Build Fails on Vercel

**Check Vercel logs:**
1. Go to deployment in Vercel
2. Click **Deployments** tab
3. Click failed deployment
4. Scroll to see error message

**Common issues:**
- Missing environment variables
- Node version mismatch
- Dependency conflict

**Fix:**
```bash
npm install  # Local
npm run build
git push  # Redeploy
```

### App Shows "Loading..." then crashes

**Problem:** Firebase credentials not set correctly

**Solution:**
1. Verify all 6 env vars in Vercel
2. Ensure variable names exact match
3. Redeploy: Go to Vercel ? Deployments ? redeploy latest

### Login doesn't work in production

**Likely Causes:**
- Firebase domain not authorized
- CORS issue
- Environment variables missing

**Fix:**
1. Go to Firebase Console ? Authentication
2. Check authorized JavaScript origins includes your domain
3. For Google: Add your Vercel URL to authorized origins
4. Check browser console for specific error

### Drawings disappear on refresh

**This is expected!** MVP uses sessionStorage.

**When fixed (Phase 2):**
- Add Firestore integration
- Drawings will persist across sessions

---

## Security Checklist Before Launch

- [ ] `.env.local` is in `.gitignore`
- [ ] No Firebase keys in code
- [ ] No hardcoded secrets in commits
- [ ] HTTPS enforced (Vercel does this automatically)
- [ ] Firebase security rules reviewed
- [ ] Admin email configured correctly
- [ ] Rate limiting considered (Firebase)
- [ ] GDPR notice/terms ready (for future)

---

## Performance Optimization

### Production Build Metrics

Expected after `npm run build`:

- Total size: ~250-400 KB (gzipped)
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1

### Monitor with Vercel Analytics

Vercel provides real-world performance data for your app.

---

## Rollback (If Needed)

### Revert to Previous Deployment

**Option 1: Via Vercel Dashboard**
1. Go to **Deployments** tab
2. Click a previous successful deployment
3. Click **...** ? **Promote to Production**

**Option 2: Via Git**
```bash
git revert HEAD~1  # Revert last commit
git push origin main  # Redeploy
```

---

## Success Criteria

? Deployment complete when:
- [ ] App loads at `https://your-domain.com`
- [ ] Login works with all methods
- [ ] All scenes visible and interactive
- [ ] Drawing mode works
- [ ] Mobile responsive
- [ ] No console errors
- [ ] Firebase connected
- [ ] Performance > 90 (Lighthouse)

---

## Post-Launch Monitoring

### First 24 Hours
- Check error logs every hour
- Monitor Firebase usage
- Test from different devices
- Get initial user feedback

### First Week
- Monitor performance metrics
- Track user signup flow
- Ensure no memory leaks
- Check mobile UX

### Ongoing
- Weekly log review
- Monthly security updates
- Quarterly performance optimization
- Bi-annual dependency audit

---

## Next Steps (Phase 2)

After successful MVP launch:
- [ ] Add Firestore for cloud persistence
- [ ] Implement AI integration
- [ ] Add export features
- [ ] Create architect dashboard
- [ ] Setup monitoring alerts

---

## Support

**Deployment stuck?**
- Check Vercel logs
- Verify environment variables
- Read error messages carefully

**Questions?**
- See [COMPLETE_SETUP_GUIDE.md](./COMPLETE_SETUP_GUIDE.md)
- Review [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)
- Contact: CaniRaffaella@gmail.com

---

**Ready to launch?** ??  
**Status:** Production-ready  
**Timeline:** 10 minutes to deployed  
**Success Rate:** 99% (with proper setup)

# 🚀 DEPLOYMENT GUIDE - ZoomClone

Complete guide to deploy your ZoomClone application to production.

## ☁️ Option 1: Vercel (Recommended - 5 minutes)

Vercel is the creators of Next.js and provides seamless deployment.

### Prerequisites
- GitHub account
- Vercel account (free at https://vercel.com)

### Step 1: Push Code to GitHub

```bash
# Create GitHub repository first at github.com/new

# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit: ZoomClone"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/zoom-clone.git
git push -u origin main
```

### Step 2: Deploy to Vercel

1. **Visit**: https://vercel.com/new
2. **Connect GitHub**: Click "Connect your Git Provider"
3. **Select Repository**: Choose "zoom-clone"
4. **Configuration**:
   - Framework Preset: `Next.js` (auto-selected)
   - Root Directory: `.` (leave default)
   - Build Command: `npm run build` (auto-filled)

5. **Environment Variables**: Add these:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
   CLERK_SECRET_KEY=sk_test_xxx
   NEXT_PUBLIC_JITSI_DOMAIN=meet.jit.si
   MONGODB_URI=mongodb+srv://user:pass@...
   ```

6. **Deploy**: Click "Deploy"
7. **Wait**: 2-3 minutes for deployment
8. **Access**: You'll get a URL like `https://zoom-clone.vercel.app`

### Subsequent Deployments

Just push to main branch:
```bash
git push origin main
# Vercel automatically redeploys!
```

---

## ☁️ Option 2: Heroku

Alternative cloud platform with free tier (limited).

### Prerequisites
- Heroku account (https://heroku.com)
- Heroku CLI installed

### Setup

```bash
# Login to Heroku
heroku login

# Create app
heroku create zoom-clone-app

# Add MongoDB Atlas as addon (MongoDB Atlas is better than Heroku Postgres)
# Skip this - use MongoDB Atlas directly

# Set environment variables
heroku config:set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
heroku config:set CLERK_SECRET_KEY=sk_test_xxx
heroku config:set NEXT_PUBLIC_JITSI_DOMAIN=meet.jit.si
heroku config:set MONGODB_URI=mongodb+srv://user:pass@...

# Deploy
git push heroku main

# View app
heroku open

# View logs
heroku logs --tail
```

---

## ☁️ Option 3: Railway

Modern alternative to Heroku.

### Setup

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Link MongoDB Atlas
railway variable MONGODB_URI mongodb+srv://...

# Set other variables
railway variable NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY pk_test_xxx
railway variable CLERK_SECRET_KEY sk_test_xxx
railway variable NEXT_PUBLIC_JITSI_DOMAIN meet.jit.si

# Deploy
railway up

# Get production URL
railway domain
```

---

## 🌍 Custom Domain Setup

All platforms support custom domains.

### Step 1: Purchase Domain

- **Registrars**: Namecheap, GoDaddy, Route53, Google Domains
- **Example**: `zoom-clone.com`

### Step 2: Point DNS to Deployment Platform

#### For Vercel:
1. Go to Project Settings → Domains
2. Add your domain
3. Copy the DNS records shown
4. Paste records into your domain registrar's DNS settings
5. Wait for propagation (5 minutes - 48 hours)

#### For Heroku:
1. `heroku domains:add zoom-clone.com`
2. Get CNAME from output
3. Add CNAME record to DNS provider
4. Wait for propagation

### Step 3: Verify SSL Certificate

Most platforms auto-provision HTTPS certificates.

```bash
# Verify in browser
https://zoom-clone.com

# Should show HTTPS connection (green lock)
```

---

## 📊 Production Environment Variables

Create `.env.production` (don't commit this):

```env
# Use production Clerk keys (not test keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx
CLERK_SECRET_KEY=sk_live_xxx

# Use production Jitsi domain
NEXT_PUBLIC_JITSI_DOMAIN=meet.yourdomain.com

# Use MongoDB Atlas connection
MONGODB_URI=mongodb+srv://prod_user:strong_password@cluster0.mongodb.net/zoom-clone?retryWrites=true&w=majority
```

---

## 🔒 Production Security Checklist

- [ ] Clerk: Switch to production keys
- [ ] MongoDB Atlas: Enable IP whitelist
- [ ] Jitsi: Use self-hosted domain
- [ ] Enable HTTPS on custom domain
- [ ] Set strong passwords for databases
- [ ] Enable 2FA on Clerk dashboard
- [ ] Configure database backups
- [ ] Set up monitoring alerts
- [ ] Review environment variables are not logged

### MongoDB Atlas Security

1. **IP Whitelist**:
   - go to "Network Access"
   - Add deployment platform's IPs
   - Remove "Allow from Anywhere" (if added)

2. **Database User**:
   - Strong password (20+ characters)
   - Limited permissions (not Admin)
   - Different user for read-only if needed

3. **Connection String**:
   - Use SRV connection string
   - Enable authentication

### Clerk Production Setup

1. **Sign In Methods**:
   - Remove test/development methods
   - Only production methods

2. **OAuth Providers**:
   - Update redirect URLs to production domain
   - Test sign-in flow in production

3. **Email Templates**:
   - Customize with your branding
   - Test email delivery

---

## 📈 Performance Optimization

### Vercel Analytics
1. Go to Project → Analytics
2. Monitor:
   - Page performance
   - User interactions
   - Web vitals

### Database Optimization
1. Create indexes on common queries:
   ```javascript
   // In MongoDB Atlas

   // Index for meetings by hostId
   db.meetings.createIndex({ hostId: 1 })

   // Index for meetings by meetingId
   db.meetings.createIndex({ meetingId: 1 })

   // Index for users by email
   db.users.createIndex({ email: 1 })
   ```

2. Enable Query Analytics
   - MongoDB Atlas → Performance
   - Review slow queries

### CDN Optimization
- Vercel automatically uses CDN
- Tailwind CSS minified automatically
- Enable caching on Jitsi resources

---

## 🔄 Continuous Deployment Setup

### GitHub Actions (Free CI/CD)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to Vercel
        run: |
          npm install -g vercel
          vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
```

---

## 📊 Monitoring & Logging

### Error Tracking

**Sentry Integration** (Free tier available):

1. Create account at https://sentry.io
2. Create Next.js project
3. Install SDK:
   ```bash
   npm install @sentry/nextjs
   ```

4. Configure in `next.config.js`

### Uptime Monitoring

**UptimeRobot** (Free):
1. Visit https://uptimerobot.com
2. Add monitoring for your URL
3. Get alerts if site goes down

### Analytics

**Vercel Analytics**: Built-in
**Google Analytics**: Add to `app/layout.tsx`
```tsx
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_ID"></script>
```

---

## 🐛 Troubleshooting Deployment

### Issue: "Deployment Failed"
**Solution**: Check build logs
```bash
# For Vercel: View in dashboard
# For Heroku:
heroku logs --tail --app app-name
```

### Issue: Environment Variables Not Set
**Solution**: Verify in platform dashboard
```bash
# Heroku
heroku config --app app-name

# Railway
railway variable
```

### Issue: Database Connection Timeout
**Solution**: Check IP whitelist
- MongoDB Atlas → Network Access
- Ensure deployment IP is whitelisted

### Issue: Jitsi SSL Certificate Error
**Solution**: Use HTTPS domain with valid cert
```bash
# Test SSL
curl -I https://your-jitsi-domain.com/external_api.js
```

---

## 💰 Cost Estimation

### Monthly Costs (Rough Estimates)

| Service | Free Tier | Paid Tier |
|---------|-----------|-----------|
| Vercel | $0 | $20+/mo |
| MongoDB Atlas | Free 512MB | $57+/mo |
| Clerk | 10k MAU | $25+/mo |
| Jitsi (meet.jit.si) | $0 | $5+/mo |
| **Total** | **$0** | **$107+/mo** |

### Optimization Tips

- **Free tier**: Perfect for testing
- **Reduce MongoDB**: Archive old meetings
- **Self-host Jitsi**: Save $5/mo (requires server)
- **Clerk optimization**: Monitor MAU (monthly active users)

---

## 🎉 Post-Deployment Checklist

- [ ] Site loads on production URL
- [ ] Sign up/login works
- [ ] Can create meetings
- [ ] Jitsi loads correctly
- [ ] Videos work with good quality
- [ ] Database persists data
- [ ] Emails send correctly
- [ ] Error handling works
- [ ] Performance is acceptable
- [ ] SSL certificate is valid

---

## 📞 Support

- **Vercel Issues**: https://vercel.com/help
- **MongoDB Issues**: https://docs.mongodb.com/
- **Clerk Issues**: https://clerk.com/docs
- **Next.js Issues**: https://nextjs.org/docs

---

**Deployment Complete! 🚀**

Your ZoomClone is now live and accessible to users worldwide.

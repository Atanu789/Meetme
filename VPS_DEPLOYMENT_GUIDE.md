# VPS Deployment Guide - Jitsi Integration

## Overview

Your Jitsi integration automatically handles both HTTP and HTTPS, and will try both protocols if one fails. This makes deployment flexible.

## Local Development Setup

### Option 1: HTTP with meet subdomain (Easier)
```bash
# .env.local
NEXT_PUBLIC_JITSI_DOMAIN=http://meet.melanam.com
```

- Uses HTTP which is faster for local testing
- Works with your current dev setup
- Change later for production

### Option 2: Auto-detect Protocol (Recommended for testing both)
```bash
# .env.local
NEXT_PUBLIC_JITSI_DOMAIN=meet.melanam.com
```

- Automatically uses HTTP if your Next.js app is on HTTP
- Automatically uses HTTPS if your Next.js app is on HTTPS
- No changes needed when deploying to HTTPS

## Production Deployment on VPS

### Prerequisites
1. âœ… SSL/TLS certificate installed on melanam.com
2. âœ… Jitsi running on HTTPS
3. âœ… DNS records pointing correctly

### VPS Configuration (Recommended)

```bash
# .env.local (on your VPS)
NEXT_PUBLIC_JITSI_DOMAIN=https://melanam.com
```

**This configuration:**
- Uses HTTPS (secure)
- Uses main domain (melanam.com) instead of subdomain
- Automatic protocol detection works as fallback

### Alternative: Using Subdomain

```bash
# .env.local (on your VPS)
NEXT_PUBLIC_JITSI_DOMAIN=https://meet.melanam.com
```

Either works - use whichever domain your Jitsi is running on.

## How Automatic Fallback Works

The component tries to load the Jitsi API with the protocol you specified:

```
1. Try: https://melanam.com/external_api.js
   â”œâ”€ âœ… Success? â†’ Use HTTPS
   â””â”€ âŒ Failed? â†’ Try step 2
   
2. Try: http://melanam.com/external_api.js
   â”œâ”€ âœ… Success? â†’ Use HTTP (fallback)
   â””â”€ âŒ Failed? â†’ Show error
```

This means:
- If HTTPS certificate is not ready, it falls back to HTTP
- If your app is on HTTPS but Jitsi temporarily on HTTP, it still works
- No downtime due to protocol mismatch

## Deployment Checklist

### Before Deploying
- [ ] SSL certificate obtained for melanam.com or meet.melanam.com
- [ ] Jitsi running on HTTPS
- [ ] DNS records point to VPS IP (38.45.94.222)
- [ ] Ports 80, 443, 10000/UDP open on VPS

### On VPS (when deploying)

1. **Update environment variable:**
```bash
# On your VPS, modify .env.local
NEXT_PUBLIC_JITSI_DOMAIN=https://melanam.com

# Or if using meet subdomain:
NEXT_PUBLIC_JITSI_DOMAIN=https://meet.melanam.com
```

2. **Restart Next.js app:**
```bash
npm run build
npm run start
```

3. **Test:**
   - Open https://melanam.com/dashboard
   - Create/join a meeting
   - Should connect to HTTPS Jitsi automatically

## Configuration Scenarios

### Scenario 1: Development (Local)
```bash
NEXT_PUBLIC_JITSI_DOMAIN=http://meet.melanam.com
# Your app: http://localhost:3000 (HTTP)
# Jitsi: Available on HTTP for testing
```

### Scenario 2: Staging (HTTPS, Not Yet Deployed)
```bash
NEXT_PUBLIC_JITSI_DOMAIN=https://meet.melanam.com
# Your Next.js app: https://melanam.com (HTTPS)
# Jitsi domain runs on main domain with HTTPS
```

### Scenario 3: Production (HTTPS Main Domain)
```bash
NEXT_PUBLIC_JITSI_DOMAIN=https://melanam.com
# Your app: https://melanam.com (HTTPS)
# Jitsi: Running on same domain with HTTPS
```

### Scenario 4: Auto-detect (Most Flexible)
```bash
NEXT_PUBLIC_JITSI_DOMAIN=melanam.com
# Auto-detects protocol based on where app is loaded from
# http://localhost:3000 â†’ tries http://melanam.com
# https://melanam.com â†’ tries https://melanam.com
# Fallback to opposite if first fails
```

## Troubleshooting

### "Cannot load from https://melanam.com"
**Cause:** SSL certificate not ready or Jitsi not on HTTPS

**Solution:**
1. Verify certificate: `openssl s_client -connect melanam.com:443`
2. Check Jitsi status: `docker ps | grep jitsi`
3. Check logs: `docker logs jitsi-web`
4. Temporarily use HTTP in .env.local:
   ```bash
   NEXT_PUBLIC_JITSI_DOMAIN=http://melanam.com
   ```

### "Cannot reach melanam.com on http or https"
**Cause:** Domain not accessible or firewall blocked

**Solution:**
1. Test domain reachability:
   ```bash
   curl -I https://melanam.com/external_api.js
   ```
2. Check firewall rules (ports 80, 443 open)
3. Verify DNS: `nslookup melanam.com`

### Works on localhost but not on VPS
**Cause:** Environment variables not reloaded

**Solution:**
```bash
# On VPS
npm run build  # This reads .env.local
npm run start
```

## Migration Path: HTTP â†’ HTTPS

### Step 1: Development (No changes needed)
```bash
# Keep using HTTP for local testing
NEXT_PUBLIC_JITSI_DOMAIN=http://meet.melanam.com
```

### Step 2: Prepare SSL Certificate
- Get certificate for melanam.com
- Configure in Jitsi Docker (update certificates)
- Restart Jitsi

### Step 3: Update Configuration
```bash
# Change to HTTPS in .env.local
NEXT_PUBLIC_JITSI_DOMAIN=https://melanam.com

# Build and redeploy
npm run build
npm run start
```

### Step 4: Verify
- Test on https://melanam.com
- Check browser console for any errors
- Try joining a meeting

## Environment Variables Reference

| Variable | Example | Purpose |
|----------|---------|---------|
| NEXT_PUBLIC_JITSI_DOMAIN | https://melanam.com | Your Jitsi domain with protocol |
| MONGODB_URI | mongodb+srv://... | Database connection |
| NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY | pk_test_... | Clerk auth key |
| CLERK_SECRET_KEY | sk_test_... | Clerk secret |

## Docker Compose for VPS

If running via Docker on VPS:

```bash
# Build for production
docker build -t melanam-app .

# Run with environment
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_JITSI_DOMAIN=https://melanam.com \
  -e MONGODB_URI=your_mongodb_uri \
  -e NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key \
  -e CLERK_SECRET_KEY=your_secret \
  melanam-app
```

## Quick Test Commands

```bash
# Test if Jitsi is accessible on HTTPS
curl -I https://melanam.com/external_api.js

# Test if Jitsi is accessible on HTTP
curl -I http://melanam.com/external_api.js

# Check what your app is trying to load (browser console)
# Look for: [Jitsi] Loading from https://melanam.com/external_api.js
```

## Support

If something doesn't work:

1. **Check environment variable:**
   ```bash
   echo $NEXT_PUBLIC_JITSI_DOMAIN
   ```

2. **Check browser console:**
   - Open DevTools (F12)
   - Go to Console tab
   - Look for [Jitsi] logs

3. **Check server logs:**
   - `npm run dev` shows logs locally
   - `docker logs` for Docker containers

4. **Test domain directly:**
   - Visit `https://melanam.com/external_api.js` in browser
   - Should show JavaScript code, not error

---

**You're ready to deploy to production with HTTPS!** ðŸš€


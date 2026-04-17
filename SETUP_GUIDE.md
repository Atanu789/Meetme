# ðŸ“‹ SETUP GUIDE - ZoomClone

This guide walks you through setting up the ZoomClone application from scratch.

## ðŸŽ¯ Quick Start (5 minutes)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment
Create `.env.local`:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_JITSI_DOMAIN=meet.jit.si
MONGODB_URI=mongodb://localhost:27017/zoom-clone
```

### Step 3: Start Development
```bash
npm run dev
```

### Step 4: Open Browser
Navigate to `http://localhost:3000`

---

## ðŸ”§ Detailed Setup

### Prerequisites Checklist
- [ ] Node.js 18+ installed
- [ ] npm or yarn package manager
- [ ] MongoDB (local or Atlas account)
- [ ] Clerk account (free tier available)
- [ ] Text editor (VS Code recommended)

---

## ðŸ“¦ Step 1: MongoDB Setup

### ðŸ”² Option A: Local MongoDB (Recommended for Development)

#### macOS (Homebrew)
```bash
# Install MongoDB
brew list | grep mongodb
# If not installed:
brew install mongodb-community

# Start MongoDB service
brew services start mongodb-community

# Verify connection
mongosh
# Should show: "Current Mong version: X.X.X"
# Type: exit
```

#### Windows (Direct Download)
1. Download from: https://www.mongodb.com/try/download/community
2. Run the installer
3. Keep defaults and install
4. MongoDB starts as a service automatically
5. Verify in PowerShell:
   ```powershell
   mongosh
   ```

#### Linux (Ubuntu/Debian)
```bash
# Add MongoDB repository key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Add repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Install and start
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod

# Verify
mongosh
```

**Expected `.env.local` value:**
```env
MONGODB_URI=mongodb://localhost:27017/zoom-clone
```

### ðŸ”° Option B: MongoDB Atlas (Cloud Database)

#### Setup Steps:
1. **Create Account**: Visit https://www.mongodb.com/cloud/atlas
2. **Sign Up**: Use email/password or Google OAuth
3. **Create Organization**: Name: "ZoomClone" or similar
4. **Build First Cluster**:
   - Click "Build a Database"
   - Choose "Shared" (free tier)
   - Select region (choose closest to you)
   - Click "Create Cluster"
   - Wait 2-5 minutes for deployment

5. **Create Database User**:
   - Go to "Security" â†’ "Database Access"
   - Click "Add New Database User"
   - Username: `zoomadmin`
   - Password: Generate strong password (save it!)
   - Built-in Role: "Atlas Admin"
   - Click "Add User"

6. **Allow Network Access**:
   - Go to "Network Access"
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for development)
   - For production use specific IPs

7. **Get Connection String**:
   - Go to "Clusters" â†’ "Connect"
   - Choose "Connect your application"
   - Select "Node.js" driver version 5.x
   - Copy connection string

8. **Update Connection String**:
   Replace in `.env.local`:
   ```env
   MONGODB_URI=mongodb+srv://zoomadmin:PASSWORD@cluster0.mongodb.net/zoom-clone?retryWrites=true&w=majority
   ```
   (Replace PASSWORD with your actual password and cluster name)

**Test Connection:**
```bash
# Terminal
mongosh "mongodb+srv://zoomadmin:PASSWORD@cluster0.mongodb.net/test"
# Should connect successfully
```

---

## ðŸ” Step 2: Clerk Authentication Setup

### Create Clerk Account
1. **Visit**: https://clerk.com
2. **Click**: "Sign Up"
3. **Choose**: "Email" or "Google" signup
4. **Create Organization**: "ZoomClone" (optional)

### Get Clerk API Keys

#### Steps:
1. **Dashboard**: After login, go to https://dashboard.clerk.com
2. **Select Application**: Choose your app
3. **API Keys Tab**: Go to "Configure" â†’ "API Keys"
4. **Copy Keys**:
   - **Publishable Key**: Starts with `pk_test_` or `pk_live_`
   - **Secret Key**: Starts with `sk_test_` or `sk_live_`

### Configure in `.env.local`

```env
# Public key (safe to expose in browser)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_abc123xy...

# Secret key (NEVER expose in frontend)
CLERK_SECRET_KEY=sk_test_def456yz...
```

### Enable Authentication Methods

In Clerk Dashboard:
1. **Go to**: "Customize" â†’ "Sign up"
2. **Enable**:
   - [x] Email address
   - [x] Password
3. **Go to**: "Social Connections"
4. **Enable**:
   - [ ] Google (optional, for OAuth)

**To add Google OAuth:**
1. In Clerk Dashboard â†’ "Social Connections"
2. Click "Google"
3. Follow setup instructions to add your OAuth credentials
4. Enable the connection

---

## ðŸŒ Step 3: Jitsi Domain Configuration

### ðŸ”² Option A: Public Jitsi (Development/Testing)

Fastest setup - use `meet.jit.si`:

```env
NEXT_PUBLIC_JITSI_DOMAIN=meet.jit.si
```

**Pros:**
- Instant setup
- No server configuration
- Good for testing

**Cons:**
- Shared domain (not for production)
- Limited customization
- Rate limiting possible

### ðŸ”² Option B: Self-Hosted Jitsi (Production)

For production deployments:

#### Using Docker (Recommended):
1. **Install Docker**: https://docker.com
2. **Pull Jitsi Image**:
   ```bash
   docker pull jitsi/jitsi-meet
   ```
3. **Run Container**:
   ```bash
   docker run -d \
     -p 80:80 \
     -p 443:443 \
     -e XMPP_DOMAIN=meet.myapp.com \
     -e JICOFO_AUTH_USER=focus \
     -e XMPP_AUTH_DOMAIN=auth.meet.myapp.com \
     jitsi/jitsi-meet
   ```

4. **Update DNS**: Point `meet.myapp.com` to server IP
5. **Update `.env.local`**:
   ```env
   NEXT_PUBLIC_JITSI_DOMAIN=meet.myapp.com
   ```

### Optional: Private Rooms with JWT

If you want authenticated private rooms, add:

```env
JITSI_JWT_SECRET=your_shared_jitsi_secret
JITSI_JWT_ISSUER=melanam
```

The app will generate a room token for signed-in users when a meeting is marked private.

#### For Complete Setup: Follow
- Official Docs: https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-start
- YouTube Guide: Search "Jitsi Meet Self-Hosted Setup"

---

## ðŸ’» Step 4: Project Setup

### Clone Repository (if applicable)
```bash
git clone <repository-url>
cd zoom-clone
```

### Install Dependencies
```bash
npm install
```

### Create Configuration Files

**`.env.local`** (Already created earlier)
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_JITSI_DOMAIN=meet.jit.si
MONGODB_URI=mongodb://localhost:27017/zoom-clone
```

### Verify Installation
```bash
# Check Node version
node --version  # Should be 18+

# Check npm version
npm --version

# Test MongoDB connection
mongosh "mongodb://localhost:27017"

# Should output connection details
```

---

## ðŸš€ Step 5: Run the Application

### Development Mode
```bash
npm run dev
```

**Output should show:**
```
  â–² Next.js 14.0.0
  - Local:        http://localhost:3000
  - Environments: .env.local

âœ“ Ready in 2.3s
```

### Build for Production
```bash
npm run build
npm start
```

---

## ðŸ§ª Step 6: Test the Application

### Test Checklist:

#### A. Landing Page
- [ ] Navigate to `http://localhost:3000`
- [ ] See hero section with CTA buttons
- [ ] "Get Started Free" and "Sign In" buttons visible

#### B. Sign Up
- [ ] Click "Get Started Free"
- [ ] Fill email and password
- [ ] Click "Sign Up"
- [ ] Should redirect to `/dashboard`
- [ ] User should be logged in

#### C. Dashboard
- [ ] User email visible in navbar
- [ ] "Create New Meeting" button visible
- [ ] "Join Meeting" button visible

#### D. Create Meeting
- [ ] Click "Create New Meeting"
- [ ] Enter title: "Test Meeting"
- [ ] Click "Create & Join"
- [ ] Should redirect to room page

#### E. Jitsi Integration
- [ ] Jitsi iframe loads
- [ ] "Allow" camera/microphone permissions
- [ ] See your video stream
- [ ] Toolbar buttons visible (camera, mic, share screen)

#### F. Log Out
- [ ] Click user avatar in navbar
- [ ] Click "Logout"
- [ ] Should redirect to landing page
- [ ] No user info in navbar

#### G. Join Meeting
- [ ] Create a meeting as User A
- [ ] Copy meeting ID from URL
- [ ] Sign out
- [ ] Sign in as User B
- [ ] Click "Join Meeting"
- [ ] Paste meeting ID
- [ ] Should join the same room

---

## ðŸ“Š Database Verification

### Check MongoDB Collections

#### Connect to MongoDB:
```bash
mongosh
```

#### Check Database:
```javascript
// Show all databases
show databases

// Use zoom-clone database
use zoom-clone

// Show all collections
show collections

// Check users collection
db.users.find()

// Check meetings collection
db.meetings.find()

// Count documents
db.users.countDocuments()
db.meetings.countDocuments()
```

---

## ðŸ” Debugging Tips

### Enable Verbose Logging

Add to `.env.local`:
```env
DEBUG=*
```

### Check Browser Console
1. Open DevTools: `F12`
2. Go to "Console" tab
3. Look for errors
4. Check network tab for API calls

### Check Server Logs
Terminal where `npm run dev` runs will show:
- API route calls
- Database operations
- Errors and warnings

### Common Issues & Solutions

#### "Cannot connect to MongoDB"
```bash
# Check if MongoDB is running
brew services list  # macOS
sudo systemctl status mongod  # Linux
Get-Service MongoDB  # Windows
```

#### "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not set"
```bash
# Verify .env.local file exists
ls -la .env.local

# Check content
cat .env.local

# Rebuild
npm run dev  # Restart dev server
```

#### "Jitsi script fails to load"
```javascript
// Check in browser console
fetch('https://meet.jit.si/external_api.js')
  .then(r => console.log(r.status))
  .catch(e => console.error(e))
```

#### "Meeting not found after creation"
- Check MongoDB is running
- Check MONGODB_URI in `.env.local`
- Verify API response in browser Network tab

---

## ðŸ“ Environment Variables Reference

| Variable | Required | Value Example | Type |
|----------|----------|--|--|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | `pk_test_abc123...` | Public |
| `CLERK_SECRET_KEY` | Yes | `sk_test_def456...` | Secret |
| `NEXT_PUBLIC_JITSI_DOMAIN` | Yes | `meet.jit.si` | Public |
| `MONGODB_URI` | Yes | `mongodb://localhost:27017/...` | Secret |

---

## âœ… Final Verification Checklist

Before considering setup complete:

- [ ] MongoDB running and accessible
- [ ] Clerk keys configured
- [ ] Jitsi domain accessible
- [ ] `.env.local` file created
- [ ] `npm install` completed
- [ ] `npm run dev` runs without errors
- [ ] Landing page loads at `http://localhost:3000`
- [ ] Sign up works
- [ ] Dashboard loads
- [ ] Can create meeting
- [ ] Jitsi loads in room
- [ ] Can hear/see video

---

## ðŸŽ‰ Setup Complete!

Your ZoomClone application is now ready to use!

**Next Steps:**
1. Create meetings and test functionality
2. Customize branding and styling
3. Deploy to production (Vercel, Heroku, etc.)
4. Add additional features

---

## ðŸ“ž Support Resources

- **Clerk Docs**: https://clerk.com/docs
- **MongoDB Docs**: https://docs.mongodb.com/
- **Next.js Docs**: https://nextjs.org/docs
- **Jitsi Docs**: https://jitsi.github.io/handbook/
- **Tailwind Docs**: https://tailwindcss.com/docs
- **Zustand Docs**: https://github.com/pmndrs/zustand

---

**Happy coding! ðŸš€**


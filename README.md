# ZoomClone - SaaS-Grade Video Conferencing Platform

A complete, production-ready video conferencing application built with Next.js 14, TypeScript, Tailwind CSS, Clerk Authentication, MongoDB, and Jitsi Meet.

## 🚀 Features

- ✅ User authentication with Clerk (Email/Password + Google OAuth)
- ✅ Create and manage video meetings
- ✅ Join meetings via ID
- ✅ HD video conferencing with Jitsi
- ✅ Screen sharing
- ✅ Real-time chat
- ✅ Meeting recordings
- ✅ Responsive design with modern glass UI
- ✅ MongoDB database integration
- ✅ Fully TypeScript typed
- ✅ Zero external UI libraries (pure Tailwind CSS)

## 🧱 Tech Stack

### Frontend
- **Next.js 14** (App Router)
- **TypeScript** (strict mode)
- **Tailwind CSS** (styling)
- **Zustand** (state management)
- **Clerk** (authentication)

### Backend
- **Next.js API Routes**
- **MongoDB** (database)
- **Mongoose** (ODM)
- **Jitsi Meet** (video conferencing)

## 📁 Project Structure

```
zoom-clone/
├── app/
│   ├── api/
│   │   ├── create-meeting/route.ts
│   │   ├── get-meeting/route.ts
│   │   └── get-meetings/route.ts
│   ├── room/
│   │   └── [id]/page.tsx
│   ├── dashboard/page.tsx
│   ├── sign-in/page.tsx
│   ├── sign-up/page.tsx
│   ├── page.tsx
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── Navbar.tsx
│   ├── MeetingCard.tsx
│   ├── JoinModal.tsx
│   ├── Loader.tsx
│   └── AuthProvider.tsx
├── hooks/
│   └── useScript.ts
├── lib/
│   ├── clerk.ts
│   ├── auth.ts
│   └── db.ts
├── models/
│   ├── User.ts
│   └── Meeting.ts
├── store/
│   └── useUserStore.ts
├── middleware.ts
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── next.config.js
├── package.json
├── .env.local
└── .gitignore
```

## ⚙️ Installation & Setup

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Clerk account (https://clerk.com)
- Jitsi domain (or use meet.jit.si for testing)

### Step 1: Clone & Install Dependencies

```bash
# Navigate to project directory
cd zoom-clone

# Install dependencies
npm install
```

### Step 2: Setup Environment Variables

Create `.env.local` file in the root directory:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx

# Jitsi Configuration
NEXT_PUBLIC_JITSI_DOMAIN=meet.myapp.com

# MongoDB
MONGODB_URI=mongodb://localhost:27017/zoom-clone
```

#### Get Clerk API Keys:
1. Go to https://dashboard.clerk.com
2. Create a new application
3. Navigate to **API Keys** section
4. Copy **Publishable Key** and **Secret Key**
5. Paste them in `.env.local`

#### MongoDB Setup:
**Option A: Local MongoDB**
```bash
# Install MongoDB (macOS with Homebrew)
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community

# MongoDB will run on mongodb://localhost:27017
```

**Option B: MongoDB Atlas (Cloud)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a new cluster
4. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/zoom-clone`
5. Update `.env.local` with the connection string

#### Jitsi Domain:
**Option A: Public Jitsi (for testing)**
- Use `meet.jit.si` in `.env.local`
- Note: This is public and not suitable for production

**Option B: Self-hosted Jitsi (production)**
- Deploy Jitsi on your own server
- Follow: https://github.com/jitsi/jitsi-meet/blob/master/doc/manual-install.md
- Update `NEXT_PUBLIC_JITSI_DOMAIN` with your domain

### Step 3: Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 🔐 Authentication Flow

### Signup
1. Navigate to `http://localhost:3000/sign-up`
2. Enter email and password (or use Google OAuth)
3. Clerk creates the account
4. Redirected to `/dashboard`

### Login
1. Navigate to `http://localhost:3000/sign-in`
2. Enter credentials
3. Redirected to `/dashboard`

### Protected Routes
- `/dashboard` - requires authentication
- `/room/[id]` - requires authentication
- `/` - public landing page

## 🎥 How to Use

### Create a Meeting
1. Sign in or sign up
2. Go to Dashboard (`/dashboard`)
3. Click "Create New Meeting"
4. Enter meeting title and description
5. Click "Create & Join"
6. Jitsi will open with your meeting room

### Join a Meeting
1. Sign in
2. Go to Dashboard
3. Click "Join Meeting"
4. Enter Meeting ID
5. Click "Join"

### In a Meeting
- 🎤 Toggle microphone
- 📹 Toggle camera
- 🖥️ Share screen
- 💬 Send messages
- 📝 Annotations
- 🔴 Record (if enabled)

## 📊 Database Models

### User Model
```typescript
{
  _id: ObjectId
  name: string
  email: string (unique)
  firebaseId: string (unique)
  createdAt: Date
  updatedAt: Date
}
```

### Meeting Model
```typescript
{
  _id: ObjectId
  meetingId: string (unique)
  hostId: string
  hostEmail: string
  title: string
  description: string
  createdAt: Date
  updatedAt: Date
}
```

## 🔌 API Routes

### POST `/api/create-meeting`
Create a new meeting.

**Request:**
```json
{
  "title": "Team Standup",
  "description": "Daily sync",
  "hostEmail": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "meetingId": "abc123xyz",
  "meeting": { /* meeting object */ }
}
```

### GET `/api/get-meeting?id={meetingId}`
Get meeting details.

**Response:**
```json
{
  "success": true,
  "meeting": { /* meeting object */ }
}
```

### GET `/api/get-meetings`
Get all meetings for current user (paginated).

**Response:**
```json
{
  "success": true,
  "meetings": [ /* array of meetings */ ]
}
```

## 🧪 Testing the Complete Flow

### Scenario 1: Create and Join a Meeting
```bash
# 1. Start the app
npm run dev

# 2. Open http://localhost:3000

# 3. Sign up with test email
# - Go to /sign-up
# - Enter: test@example.com / password123
# - Click Sign Up

# 4. Create meeting on dashboard
# - Click "Create New Meeting"
# - Enter title: "Test Meeting"
# - Click "Create & Join"
# - Jitsi opens in fullscreen

# 5. Grant permissions
# - Allow camera and microphone access
# - See your video stream

# 6. Test features
# - Toggle camera/microphone
# - Share screen
# - Send chat messages
```

### Scenario 2: Join Existing Meeting
```bash
# 1. Create meeting (as user 1)
# 2. Copy the Meeting ID from URL bar
# 3. Sign in as different user
# 4. Click "Join Meeting" 
# 5. Paste Meeting ID
# 6. Click "Join"
# 7. Both users can see each other
```

## 🚨 Troubleshooting

### Issue: "Meeting not found"
**Solution:** Ensure MongoDB is running and MONGODB_URI is correct
```bash
# Check MongoDB status
mongosh # or mongo for older versions
# Should connect without errors
```

### Issue: Jitsi not loading
**Solution:** Check if Jitsi domain is accessible
```bash
# Test Jitsi domain
curl -I https://meet.jit.si/external_api.js
# Should return 200 status
```

### Issue: Clerk authentication fails
**Solution:** Verify Clerk keys in `.env.local`
```bash
# Ensure both keys are present and correct
echo $NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
echo $CLERK_SECRET_KEY
```

### Issue: "Cannot find module '@clerk/nextjs'"
**Solution:** Reinstall dependencies
```bash
rm -rf node_modules package-lock.json
npm install
```

## 🏗️ Building for Production

### 1. Build the application
```bash
npm run build
```

### 2. Start production server
```bash
npm start
```

### 3. Deploy to Vercel (Recommended)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Follow prompts to connect GitHub and deploy
```

### 4. Environment Variables on Production
Set these in your hosting platform (Vercel, Heroku, etc.):
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_JITSI_DOMAIN`
- `MONGODB_URI`

## 📈 Performance Optimizations

- ✅ Dynamic imports for Jitsi script
- ✅ Image optimization with Next.js
- ✅ CSS-in-JS with Tailwind CSS
- ✅ Mongoose connection pooling
- ✅ Client-side state with Zustand
- ✅ API route caching

## 🔐 Security Features

- ✅ Clerk-managed authentication
- ✅ Middleware route protection
- ✅ Environment variable encryption
- ✅ CORS configured
- ✅ MongoDB injection prevention

## 📝 License

MIT License - feel free to use this project for personal or commercial use.

## 🤝 Contributing

Contributions are welcome! Feel free to submit issues and pull requests.

## 📞 Support

For issues and questions:
1. Check troubleshooting section above
2. Review Clerk docs: https://clerk.com/docs
3. Review Jitsi docs: https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-start
4. Check MongoDB docs: https://docs.mongodb.com/

---

**Happy connecting! 🎉**

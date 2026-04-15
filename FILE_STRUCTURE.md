# 📂 FILE STRUCTURE & QUICK REFERENCE

## 🎯 Quick File Map

| File | Purpose | Type |
|------|---------|------|
| `package.json` | Dependencies & scripts | Config |
| `tsconfig.json` | TypeScript configuration | Config |
| `tailwind.config.ts` | Tailwind CSS config | Config |
| `postcss.config.js` | PostCSS configuration | Config |
| `next.config.js` | Next.js configuration | Config |
| `middleware.ts` | Route protection with Clerk | Middleware |
| `.env.local` | Environment variables | Secret |
| `.env.example` | Environment variable template | Reference |
| `.gitignore` | Git ignore rules | Config |

---

## 📁 Directory Structure

```
zoom-clone/
│
├── 📄 Configuration Files
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── postcss.config.js
│   ├── next.config.js
│   ├── middleware.ts
│   ├── .env.local (NEVER COMMIT)
│   ├── .env.example
│   └── .gitignore
│
├── 📁 /app (App Router)
│   ├── 📱 layout.tsx ........................ Root layout with ClerkProvider
│   ├── 📱 page.tsx ......................... Landing page (hero section)
│   ├── 📱 globals.css ....................... Global styles & animations
│   │
│   ├── 📁 /api ............................ API Routes
│   │   ├── /create-meeting
│   │   │   └── route.ts ........... Create new meeting
│   │   ├── /get-meeting
│   │   │   └── route.ts ........... Get meeting by ID
│   │   └── /get-meetings
│   │       └── route.ts ........... Get all user meetings
│   │
│   ├── 📁 /sign-in ....................... Clerk sign-in page
│   │   ├── page.tsx ............... Custom sign-in form
│   │   └── [[...catch-all]]/page.tsx ... Clerk UI
│   │
│   ├── 📁 /sign-up ....................... Clerk sign-up page
│   │   ├── page.tsx ............... Custom sign-up form
│   │   └── [[...catch-all]]/page.tsx ... Clerk UI
│   │
│   ├── 📁 /dashboard ...................... User dashboard
│   │   └── page.tsx ............... Create/join meetings
│   │
│   └── 📁 /room .......................... Video room
│       └── [id]/page.tsx .......... Jitsi video call
│
├── 📁 /components .......................... React components
│   ├── Navbar.tsx ...................... Navigation bar
│   ├── MeetingCard.tsx ................. Meeting card UI
│   ├── JoinModal.tsx ................... Join meeting modal
│   ├── Loader.tsx ...................... Loading spinner
│   └── AuthProvider.tsx ................ Clerk auth provider
│
├── 📁 /lib ............................ Utility libraries
│   ├── clerk.ts ...................... Clerk config
│   ├── auth.ts ....................... Auth helpers
│   └── db.ts ......................... MongoDB connection
│
├── 📁 /models ........................ Mongoose schemas
│   ├── User.ts ....................... User schema
│   └── Meeting.ts .................... Meeting schema
│
├── 📁 /store ......................... Zustand stores
│   └── useUserStore.ts ............... User state
│
├── 📁 /hooks ......................... Custom React hooks
│   └── useScript.ts .................. Dynamic script loader
│
├── 📁 /types ......................... TypeScript types
│   └── index.ts ...................... Global type definitions
│
├── 📄 Documentation
│   ├── README.md ..................... Main documentation
│   ├── SETUP_GUIDE.md ................ Detailed setup instructions
│   ├── DEPLOYMENT_GUIDE.md ........... Production deployment
│   └── FILE_STRUCTURE.md ............ This file
│
└── 📁 /.next ........................ Build output (auto-generated)
```

---

## 🔑 Key Files Explained

### Configuration Layer
- **package.json** - Lists all dependencies (Clerk, MongoDB, Zustand, etc.)
- **tsconfig.json** - TypeScript strict mode, path aliases
- **tailwind.config.ts** - Custom colors, fonts, gradients
- **next.config.js** - Next.js specific settings
- **middleware.ts** - Clerk authentication middleware

### Frontend Layer
- **app/layout.tsx** - Root layout, wraps with ClerkProvider
- **app/page.tsx** - Landing page with hero section
- **components/** - Reusable UI components
- **app/globals.css** - Global styles, animations, Tailwind

### Auth Layer
- **lib/auth.ts** - Clerk auth helpers
- **components/AuthProvider.tsx** - Auth state provider
- **middleware.ts** - Route protection

### Backend Layer
- **app/api/** - API routes for meetings
- **lib/db.ts** - MongoDB connection (singleton pattern)
- **models/** - Mongoose schemas (User, Meeting)

### State Management
- **store/useUserStore.ts** - Zustand store for user data
- **hooks/useScript.ts** - Custom hook for Jitsi script

### Video/Conferencing
- **app/room/[id]/page.tsx** - Jitsi integration
- **hooks/useScript.ts** - Script loading logic

### Database Layer
- **models/User.ts** - User MongoDB schema
- **models/Meeting.ts** - Meeting MongoDB schema

---

## 📊 Data Flow

```
User Signup
    ↓
Clerk Authentication
    ↓
AuthProvider (useUser hook)
    ↓
useUserStore (Zustand)
    ↓
Navbar displays user

Create Meeting
    ↓
API Route: POST /api/create-meeting
    ↓
Clerk middleware verifies user
    ↓
Generate meetingId (nanoid)
    ↓
Save to MongoDB with hostId
    ↓
Redirect to /room/[id]
    ↓
Jitsi loads in room page
```

---

## 🔀 Component Hierarchy

```
RootLayout (with ClerkProvider)
├── AuthProvider
│   ├── Navbar
│   │   ├── User dropdown
│   │   └── Auth links
│   │
│   └── Main Content
│       ├── page.tsx (landing)
│       ├── sign-in (page + [[...catch-all]])
│       ├── sign-up (page + [[...catch-all]])
│       ├── dashboard/page.tsx
│       │   ├── MeetingCard (multiple)
│       │   └── JoinModal
│       └── room/[id]/page.tsx
│           └── Jitsi iframe
```

---

## 🔄 State Management Flow

```
Clerk Auth State
    ↓
useUser() hook
    ↓
AuthProvider reads user
    ↓
useUserStore.setState()
    ↓
Zustand updates global state
    ↓
Components useUserStore()
    ↓
Get user info anywhere
```

---

## 📡 API Route Flow

```
Client Request
    ↓
Next.js API Route Handler
    ↓
Clerk Middleware (auth check)
    ↓
Get userId from Clerk
    ↓
Connect to MongoDB
    ↓
Query/Create data
    ↓
Return JSON response
    ↓
Client receives & updates UI
```

---

## 🎯 Important Patterns Used

### 1. MongoDB Connection (Singleton)
```typescript
// lib/db.ts
let cached = { conn: null, promise: null }
// Reuses connection across requests
```

### 2. Dynamic Script Loading
```typescript
// hooks/useScript.ts
// Prevents SSR errors with Jitsi
// Only loads in browser
```

### 3. Clerk Authentication
```typescript
// middleware.ts
// Protects routes
// middleware.ts & AuthProvider.tsx work together
```

### 4. Zustand Store
```typescript
// store/useUserStore.ts
// Global state without props drilling
```

### 5. Type Safety
```typescript
// types/index.ts
// All models have TypeScript interfaces
// Prevents runtime errors
```

---

## ⚡ Performance Optimizations

| Optimization | Location | Benefit |
|--------------|----------|---------|
| Dynamic imports | `useScript.ts` | Reduces bundle size |
| Image optimization | `next.config.js` | Faster loading |
| CSS minification | Tailwind | Smaller CSS file |
| Database indexing | Models | Faster queries |
| Connection pooling | `db.ts` | Efficient db use |
| Client-side state | `useUserStore` | Reduces server load |

---

## 🔐 Security Features

| Feature | Location | Purpose |
|---------|----------|---------|
| Clerk Auth | `middleware.ts` | Verify users |
| Route Protection | `middleware.ts` | Prevent access |
| Secret keys | `.env.local` | Never exposed |
| MongoDB Auth | `.env.local` | Database security |
| HTTPS | Production | Encrypted traffic |

---

## 📦 File Size Estimates

| File/Folder | Size | Notes |
|-------------|------|-------|
| node_modules | ~500MB | After npm install |
| .next/build | ~20MB | Production build |
| app/ | ~100KB | Pages & components |
| lib/ | ~20KB | Utilities |
| models/ | ~10KB | Database schemas |

---

## ✅ Deployment File Checklist

Before deploying, ensure these are present:

```bash
✓ package.json          # Dependencies listed
✓ tsconfig.json         # TypeScript configured
✓ tailwind.config.ts    # Tailwind setup
✓ middleware.ts         # Clerk middleware
✓ app/layout.tsx        # Root layout with ClerkProvider
✓ All .tsx files        # No missing components
✓ All .ts files         # No missing utilities
✓ .env.example          # Template for vars
✓ README.md             # Documentation
```

---

## 🚀 File Generation Command

To regenerate all files in correct structure:

```bash
# Create directories
mkdir -p app/{api/{create-meeting,get-meeting,get-meetings},sign-in/[[...catch-all]],sign-up/[[...catch-all]],dashboard,room/[id]}
mkdir -p components lib models store hooks types

# Files already created in this session
# See package.json for dependencies
```

---

## 🔍 File Verification

To verify file integrity:

```bash
# Count files
find . -type f -name "*.tsx" -o -name "*.ts" -o -name "*.json" | wc -l

# Check for missing imports
npm run lint

# Build test
npm run build

# Type check
tsc --noEmit
```

---

## 📞 File References

Quick reference for file paths in code:

```typescript
// Import from lib
import { getClerkUser } from '@/lib/auth';
import dbConnect from '@/lib/db';

// Import from models
import User from '@/models/User';
import Meeting from '@/models/Meeting';

// Import from components
import { Navbar } from '@/components/Navbar';

// Import from store
import { useUserStore } from '@/store/useUserStore';

// Import from hooks
import { useScript } from '@/hooks/useScript';

// Import from types
import type { Meeting, User } from '@/types';
```

---

**File reference complete! 📚**

Every file has a purpose and contributes to the complete application.

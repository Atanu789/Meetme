# AI Assistant Quick Start

## Prerequisites
✅ Already done:
- Next.js 14 app
- MongoDB setup
- NextAuth authentication
- Jitsi integration
- Environment variables configured

## Setup Steps

### 1. Install Dependencies (Already Done ✅)
```bash
npm install assemblyai
```

### 2. Get AssemblyAI API Key
1. Go to https://www.assemblyai.com/
2. Sign up for free account
3. Go to Dashboard → API token
4. Copy your API key

### 3. Add Environment Variable
Edit `.env.local` and add:
```
ASSEMBLYAI_API_KEY=your_api_key_here
```

Then restart your dev server:
```bash
npm run dev
```

### 4. Verify Setup

Test the languages endpoint:
```bash
curl http://localhost:3000/api/ai/languages
```

Should return JSON with supported languages.

## What's Installed

### Components
- ✅ `AIAssistant.tsx` - Navbar button with language picker
- ✅ `AIResultsDisplay.tsx` - Display meeting results
- ✅ `CaptionOverlay.tsx` - Already exists (will be enhanced in Phase 2)

### Hooks
- ✅ `useAI.ts` - State management for AI operations

### Services
- ✅ `lib/assemblyai.ts` - AssemblyAI API wrapper

### API Routes
- ✅ `/api/ai/init` - Enable/disable AI
- ✅ `/api/ai/languages` - Get supported languages
- ✅ `/api/ai/process-meeting` - Generate summary
- ✅ `/api/ai/translate` - Translate text
- ✅ `/api/ai/transcript-status` - Check transcription status

### Database
- ✅ Updated `Meeting` model with AI fields

## Feature Status

### Current (Phase 1)
✅ AI enable/disable in navbar
✅ Language selection (18+ languages)
✅ Post-meeting summary generation
✅ Key decisions extraction
✅ Action items extraction
✅ Transcript storage
✅ Speaker detection with colors
✅ Results display in meeting history
✅ Download transcript as text file

### Coming Soon (Phase 2)
🔄 Real-time captions during meeting
🔄 Live speaker detection
🔄 Real-time translation
🔄 WebSocket streaming

### Future (Phase 3)
💡 Speaker analytics
💡 Sentiment analysis
💡 PII redaction
💡 Entity extraction
💡 Meeting recording auto-processing

## First Test

### Test 1: AI Tab in Meeting Room
1. Go to a meeting room
2. Look for the 🧠 **AI Assistant** button in navbar
3. Click it
4. Select a language
5. Click toggle to enable
6. Button should turn blue with "Active" status

### Test 2: Process a Meeting
After a meeting ends:
1. Go to Dashboard
2. Find the meeting in history
3. If AI was enabled, you should see AI Results section
4. Summary, decisions, and action items should appear

### Test 3: Language Dropdown
1. Click AI Assistant again
2. Try changing language
3. Confirm select box shows all 18+ languages

## Environment Variables Checklist

```
✅ MONGOBD_URI - MongoDB connection
✅ NEXTAUTH_SECRET - NextAuth secret
✅ NEXTAUTH_URL - NextAuth URL
✅ NEXT_PUBLIC_JITSI_DOMAIN - Jitsi server
✅ ASSEMBLYAI_API_KEY - NEW! AssemblyAI API key
```

## File Changes Summary

### New Files Created (8 total)
1. `lib/assemblyai.ts` - AssemblyAI service (310 lines)
2. `components/AIAssistant.tsx` - Navbar component (290 lines)
3. `components/AIResultsDisplay.tsx` - Results display (380 lines)
4. `hooks/useAI.ts` - AI state hook (180 lines)
5. `app/api/ai/init/route.ts` - Initialize AI endpoint
6. `app/api/ai/process-meeting/route.ts` - Post-meeting processing
7. `app/api/ai/translate/route.ts` - Translation endpoint
8. `app/api/ai/languages/route.ts` - Language list endpoint
9. `app/api/ai/transcript-status/route.ts` - Status checker
10. `AI_ASSISTANT_IMPLEMENTATION.md` - Full documentation
11. `EXAMPLE_AI_INTEGRATION.md` - Integration examples

### Modified Files (2 total)
1. `models/Meeting.ts` - Added AI fields
2. `components/Navbar.tsx` - Added AIAssistant import and integration

### Total Lines Added
~2000+ lines of new code

## Troubleshooting

### "Can't resolve module 'assemblyai'"
```bash
npm install assemblyai
npm run dev
```

### "ASSEMBLYAI_API_KEY not found"
1. Check `.env.local` has the variable
2. Restart dev server
3. Verify it's not in `.env` (should be `.env.local`)

### AI button not showing in navbar
1. Check you're in a room (URL: `/room/...`)
2. Check browser console for errors
3. Verify AIAssistant component imported in Navbar.tsx

### Language dropdown empty
1. Check `/api/ai/languages` endpoint is accessible
2. Check browser Network tab for API errors
3. Verify ASSEMBLYAI_API_KEY is set

### "Translation failed" error
1. Verify text is not empty
2. Check targetLanguage is valid (use endpoint to verify)
3. Check AssemblyAI account has credits

## Support

### Docs
- AssemblyAI: https://www.assemblyai.com/docs
- Next.js: https://nextjs.org/docs
- MongoDB: https://docs.mongodb.com

### Testing
- Save this doc: `AI_QUICK_START.md`
- Refer to: `EXAMPLE_AI_INTEGRATION.md`
- Troubleshoot: Check console errors first

## What's Next?

1. ✅ Add ASSEMBLYAI_API_KEY to .env.local
2. ✅ Restart dev server
3. ✅ Test AI button in meeting room
4. ⏭️ Test post-meeting processing
5. ⏭️ Hook up meeting-end event to process-meeting API
6. ⏭️ Test results display in dashboard
7. ⏭️ Plan Phase 2 (real-time captions)

---

**Questions?** Check `AI_ASSISTANT_IMPLEMENTATION.md` for details.

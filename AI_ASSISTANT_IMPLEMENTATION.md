# AI Assistant Implementation Guide

## Overview
This implementation adds an AI Assistant powered by AssemblyAI to your Jitsi meeting platform. The AI provides:
- Real-time speech-to-text transcription with speaker detection
- Live multilingual captions
- Automatic post-meeting summaries
- Key decision extraction
- Action item identification
- Transcript storage and retrieval
- Secure backend relay (API key never exposed to browser)

## Environment Setup

Add to your `.env.local` file:

```
# AssemblyAI Configuration
ASSEMBLYAI_API_KEY=your_assemblyai_api_key_here
```

Get your AssemblyAI API key from: https://www.assemblyai.com/dashboard

## Database Updates

The `Meeting` model has been extended with new fields:
- `aiEnabled: boolean` - Whether AI is active for this meeting
- `aiLanguage: string` - Selected language for transcription
- `transcript: ITranscript[]` - Full transcript with timestamps and speakers
- `summary: string` - AI-generated meeting summary
- `keyDecisions: string[]` - Key decisions from the meeting
- `actionItems: IActionItem[]` - Action items with optional owners
- `translatedCaptions: ITranslatedCaption[]` - Captions in different languages
- `speakerLabels: ISpeaker[]` - Speaker identification with colors

No migration needed - MongoDB will auto-create fields on first write.

## API Endpoints

### Initialize AI for a Meeting
**POST** `/api/ai/init`
```json
{
  "meetingId": "room-uuid",
  "language": "en"
}
```

### Disable AI for a Meeting
**DELETE** `/api/ai/init?meetingId=room-uuid`

### Get Supported Languages
**GET** `/api/ai/languages`
Returns list of all AssemblyAI supported languages

### Process Meeting (Generate Summary)
**POST** `/api/ai/process-meeting`
```json
{
  "meetingId": "room-uuid",
  "recordingUrl": "https://...",  // Optional: audio file URL
  "transcriptId": "aai-uuid"       // Optional: existing transcript ID
}
```

### Translate Text
**POST** `/api/ai/translate`
```json
{
  "text": "Hello world",
  "targetLanguage": "es"
}
```

### Check Transcription Status
**GET** `/api/ai/transcript-status?transcriptId=aai-uuid`

## Frontend Components

### AIAssistant Component
Located in `components/AIAssistant.tsx`
- Toggle AI on/off during meeting
- Select transcription language
- Display live captions
- Show AI status indicator

**Usage in Navbar:**
```tsx
import AIAssistant from './components/AIAssistant';

<AIAssistant meetingId={meetingId} onAIToggle={(enabled) => {}} />
```

### AIResultsDisplay Component
Located in `components/AIResultsDisplay.tsx`
- Display meeting summary
- Show key decisions
- List action items
- Display full transcript with speaker labels
- Download transcript as text file

**Usage in Meeting History:**
```tsx
import AIResultsDisplay from './components/AIResultsDisplay';

<AIResultsDisplay
  meetingId={meeting.meetingId}
  summary={meeting.summary}
  keyDecisions={meeting.keyDecisions}
  actionItems={meeting.actionItems}
  transcript={meeting.transcript}
  speakerLabels={meeting.speakerLabels}
/>
```

## Service Layer

### AssemblyAI Service (`lib/assemblyai.ts`)
Handles all AssemblyAI API interactions:

```typescript
import { getAssemblyAIService, SUPPORTED_LANGUAGES } from '@/lib/assemblyai';

const assemblyai = getAssemblyAIService();

// Submit audio for transcription
const result = await assemblyai.submitTranscription(audioUrl, {
  language: 'en',
  speakerLabels: true,
});

// Get transcription status
const transcript = await assemblyai.getTranscription(transcriptId);

// Translate text
const translated = await assemblyai.translateText(text, 'es');

// Generate summary
const { summary, keyDecisions, actionItems } = 
  await assemblyai.generateSummary(transcriptId);

// Get speaker labels
const speakers = await assemblyai.getSpeakerLabels(transcriptId);

// Get detailed transcript with timestamps
const details = await assemblyai.getDetailedTranscript(transcriptId);
```

## Supported Languages

AssemblyAI supports 18+ languages:
- English, Spanish, French, German, Italian, Portuguese, Dutch, Polish
- Russian, Japanese, Chinese (Mandarin), Vietnamese, Thai, Korean
- Turkish, Hindi, Arabic, and more

See `SUPPORTED_LANGUAGES` constant in `lib/assemblyai.ts`

## Implementation Steps

### Step 1: Add AssemblyAI API Key
```bash
# Add to .env.local
ASSEMBLYAI_API_KEY=your_key_here
```

### Step 2: Enable AI in Meeting
When user clicks AI Assistant button in navbar:
1. Language is selected (default: English)
2. AI is enabled via POST `/api/ai/init`
3. `aiEnabled` flag is set in database
4. Status indicator shows "Active"

### Step 3: Real-time Capture (Optional - Phase 2)
For live captions during meeting:
1. Browser captures audio from Jitsi
2. Audio chunks sent to backend relay
3. Backend streams to AssemblyAI RealtimeTranscriber
4. Captions pushed back to frontend via WebSocket
5. Displayed in live caption overlay

### Step 4: Post-meeting Processing
When meeting ends:
1. Recording/audio file is available (Jitsi recording or uploaded)
2. Call POST `/api/ai/process-meeting` with recordingUrl
3. AssemblyAI transcribes audio
4. LeMUR API generates summary, decisions, action items
5. Results saved to Meeting model
6. Dashboard displays AI results

### Step 5: Display Results
Show AIResultsDisplay component in:
- Meeting history view
- Meeting details page
- Dashboard past meetings section

## Architecture

```
Browser (client) ← → Next.js Backend ← → AssemblyAI API
                     (secure relay)        (API key protected)
```

**Security:**
- AssemblyAI API key exists ONLY on backend
- Never sent to browser
- Browser makes requests → Backend → AssemblyAI
- Responses returned safely to browser

## Currently Implemented

✅ Database schema with AI fields
✅ AssemblyAI service layer
✅ Backend API endpoints for AI operations
✅ AIAssistant navbar component
✅ AIResultsDisplay component for meeting results
✅ Language selector
✅ Status indicators

## Phase 2: Real-time Features (Optional)

Future enhancements:
- Live caption streaming via WebSocket
- Real-time translation of captions
- Live speaker identification
- Multi-language simultaneous display
- Meeting recording integration with Jitsi

## Phase 3: Advanced Features (Optional)

- Speaker analytics (talk time, participation)
- Sentiment analysis
- Custom vocabulary/word boost
- Redaction of sensitive information (PII)
- Entity extraction
- Auto-generated meeting minutes

## Troubleshooting

### API Key Not Found
- Ensure `ASSEMBLYAI_API_KEY` is in `.env.local`
- Restart Next.js dev server after adding env var

### Transcription Fails
- Check AssemblyAI account has sufficient credits
- Verify audio file is accessible (for file uploads)
- Check supported audio formats

### Missing Captions
- Ensure `aiEnabled: true` in database
- Check browser console for WebSocket errors
- Verify backend is running and accessible

### Speaker Labels Not Showing
- Verify transcription completed successfully (`status: 'completed'`)
- Check audio quality (AssemblyAI needs clear audio)
- Try with mono or stereo audio validation

## Dependencies

- `assemblyai` - AssemblyAI SDK for transcription and analysis
- `motion` - Framer Motion for UI animations
- `@tabler/icons-react` - Icon library

Already installed: ✅

## Cost Considerations

AssemblyAI pricing:
- Speech-to-text: ~$0.50-1.00 per hour
- LeMUR (AI summary): ~$0.01 per 1000 input tokens
- Real-time captions: separate pricing

Monitor usage in AssemblyAI dashboard.

## Next Steps

1. Add ASSEMBLYAI_API_KEY to `.env.local`
2. Test AI initialization endpoint
3. Test language selection
4. Implement audio capture and streaming (Phase 2)
5. Add live caption WebSocket relay (Phase 2)
6. Integrate post-meeting processing trigger
7. Display AI results in meeting history

## Questions or Issues?

Refer to:
- AssemblyAI Documentation: https://www.assemblyai.com/docs
- API Reference: https://www.assemblyai.com/docs/api-reference

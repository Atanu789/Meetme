# Phase 2: Real-time Captions Implementation Guide

## Overview
Phase 2 adds live speech-to-text captions during meetings using AssemblyAI's RealtimeTranscriber.

## Current State (Phase 1 - Complete ✅)
- AI enable/disable toggle
- Language selection
- Post-meeting summary generation
- Results display in history

## Phase 2 Goals
🔄 Live captions during meeting in real-time
🔄 Speaker detection labels ("Speaker 1", "Speaker 2", etc.)
🔄 Translation of captions to other languages
🔄 Partial → Final caption transitions (like Google Meet)

## Architecture

```
Browser                    Backend                   AssemblyAI
─────────────────────────────────────────────────────────────
│                          │                         │
├─ Capture audio ─────────→├─ Audio relay ──────────→├─ Process
│ (Jitsi audio)            │ (buffer chunks)         │
│                          │                         │
├─────────────────────────←┤─ Stream captions ──────←┤ Output
│ Display captions         │ (via WebSocket)         │
│ Update UI                │                         │
│                          │                         │
```

## Implementation Steps

### Step 1: Audio Capture from Jitsi

**File:** Need to create `hooks/useJitsiAudio.ts`

```typescript
// Capture audio stream from Jitsi meeting
export function useJitsiAudio(apiRef: any) {
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (!apiRef?.current) return;

    // Get audio from Jitsi track
    const onTrackAdded = (track: MediaStreamTrack) => {
      if (track.kind === 'audio') {
        const stream = new MediaStream([track]);
        setAudioStream(stream);
      }
    };

    apiRef.current.addEventListener('participantJoined', onTrackAdded);

    return () => {
      apiRef.current?.removeEventListener('participantJoined', onTrackAdded);
    };
  }, [apiRef]);

  return audioStream;
}
```

### Step 2: Audio Stream Relay Backend

**File:** Need to create `app/api/ai/stream-audio/route.ts`

For WebSocket upgrades (streaming audio chunks):

```typescript
import { WebSocketServer } from 'ws';
import { AssemblyAI } from 'assemblyai';

// This would handle WebSocket connections for streaming
export async function GET(request: Request) {
  // Upgrade to WebSocket
  // Send audio chunks to AssemblyAI RealtimeTranscriber
  // Stream captions back to client
}
```

### Step 3: Update Backend Meeting AI Service

**File:** `backend/meeting-ai-service/src/server/index.js`

Extend existing server to handle real-time captions:

```javascript
// Add real-time transcriber support
const { RealtimeTranscriber } = require('assemblyai');

// On WebSocket connection from frontend:
wss.on('connection', async (ws) => {
  const rt = new RealtimeTranscriber({
    token: process.env.ASSEMBLYAI_API_KEY,
    encoding: 'pcm_s16le',
    sampleRate: 16000,
  });

  // Forward audio chunks from browser to AssemblyAI
  ws.on('message', (chunk) => {
    rt.sendAudio(chunk);
  });

  // Stream captions back to browser
  rt.on('transcript', (data: any) => {
    ws.send(JSON.stringify({
      type: 'caption',
      text: data.text,
      speaker: data.speaker,
      partial: !data.message_type.includes('FinalTranscript'),
    }));
  });
});
```

### Step 4: Frontend WebSocket Handler

**File:** Need to create `lib/caption-ws.ts`

```typescript
export class CaptionWebSocket {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;

  async connect(meetingId: string) {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    this.ws = new WebSocket(`${wsProtocol}//localhost:4010/caption/${meetingId}`);

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'caption') {
        // Handle caption
        this.onCaption?.(data);
      }
    };
  }

  sendAudioChunk(chunk: ArrayBuffer) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(chunk);
    }
  }

  onCaption?: (data: any) => void;
}
```

### Step 5: Update AIAssistant Component

**File:** Modify `components/AIAssistant.tsx`

Add audio stream tracking:

```typescript
export function AIAssistant({ meetingId, onAIToggle }: AIAssistantProps) {
  const [captionWs, setCaptionWs] = useState<CaptionWebSocket | null>(null);

  useEffect(() => {
    if (!aiEnabled) return;

    // Connect to caption WebSocket
    const ws = new CaptionWebSocket();
    ws.onCaption = (data) => {
      setCaptions((prev) => [...prev, data]);
    };

    ws.connect(meetingId);
    setCaptionWs(ws);

    return () => ws.close?.();
  }, [aiEnabled, meetingId]);

  // ... rest of component
}
```

### Step 6: Update CaptionOverlay for Real-time captions

**File:** Already exists `components/CaptionOverlay.tsx`

Modify to accept real-time caption updates:

```typescript
export function CaptionOverlay({ meetingId, className }: CaptionOverlayProps) {
  const [captions, setCaptions] = useState<Caption[]>([]);

  useEffect(() => {
    // Subscribe to real-time captions from WebSocket
    const subscription = onRealtimeCaption((caption) => {
      setCaptions((prev) => [...prev, caption]);
    });

    return () => subscription?.unsubscribe();
  }, []);

  // ... rest of component with real-time updates
}
```

## Files to Create for Phase 2

1. **`lib/caption-ws.ts`** - WebSocket caption handler (150 lines)
2. **`hooks/useJitsiAudio.ts`** - Audio stream capture hook (80 lines)
3. **`app/api/ai/stream-audio/route.ts`** - WebSocket upgrade endpoint (120 lines)
4. **`backend/meeting-ai-service/src/caption-handler.js`** - Real-time caption streaming (200 lines)

## Files to Modify

1. **`components/AIAssistant.tsx`** - Add caption stream connection (50 lines added)
2. **`components/CaptionOverlay.tsx`** - Subscribe to real-time captions (40 lines added)
3. **`backend/meeting-ai-service/src/server/index.js`** - Add WebSocket handler (80 lines added)

## Audio Constraints

**Format Requirements:**
- Encoding: PCM (16-bit signed)
- Sample Rate: 16kHz
- Channels: Mono
- Bitrate: ~256 kbps

**Browser Constraints:**
```typescript
const audioConstraints = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    sampleRate: 16000,
  },
};
```

## WebSocket Protocol

**Client → Server (Audio):**
```
Binary frame with PCM audio chunk (256 bytes typical)
```

**Server → Client (Captions):**
```json
{
  "type": "caption",
  "text": "The project is complete",
  "speaker": "Speaker 1",
  "timestamp": 125000,
  "partial": false,
  "confidence": 0.95
}
```

## Performance Considerations

- **Latency Target:** < 500ms from speech to caption
- **Chunk Size:** 256 bytes (16ms of audio at 16kHz)
- **Buffer:** 5-10 chunks (80-160ms latency)
- **WebSocket Ping:** 30s keep-alive to prevent disconnection

## Testing Phase 2

1. **Mock Data Testing:**
   - Test WebSocket connection
   - Test caption display updates
   - Test partial → final transitions

2. **Real Audio Testing:**
   - Use browser microphone
   - Verify audio quality
   - Check speaker detection

3. **Multi-participant:**
   - Test with multiple speakers
   - Verify speaker labels switch correctly
   - Check caption accuracy with background noise

## Implementation Order

1. Create caption WebSocket handler
2. Update backend meeting-ai-service
3. Create audio capture hook
4. Add WebSocket to AI Assistant
5. Update Caption Overlay
6. Test with mock data
7. Test with real audio
8. Performance tuning

## Estimated Effort

- Estimated: 4-8 hours
- Components: 5 files to create, 3 to modify
- Testing: 2-3 hours

## Known Challenges

1. **Audio Format:** Must ensure browser captures 16kHz mono PCM
2. **Latency:** Network delays can cause speech → caption delays
3. **Speaker Detection:** Requires clear audio; background noise reduces accuracy
4. **Mobile:** Audio capture may have limitations on mobile browsers
5. **Browser Support:** WebSocket and audio APIs not supported on older browsers

## Integration Hooks

Current Phase 1 integration points that will be used:

- ✅ `AIAssistant.tsx` - Already has socket connection example
- ✅ `CaptionOverlay.tsx` - Already handles caption display
- ✅ `useAI.ts` - Can extend with real-time state
- ✅ Backend server - Already has WebSocket setup
- ✅ API `/api/ai/init` - Already enables AI tracking

## Future Optimizations

- Cache frequent phrases
- Use speaker profiles for better detection
- Implement client-side audio preprocessing
- Add caption confidence indicators
- Batch requests for translation

## References

- AssemblyAI Real-time API: https://www.assemblyai.com/docs/speech-to-text/real-time
- Web Audio API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- WebSocket API: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket

---

**Status:** Ready for Phase 2 implementation
**Last Updated:** Now
**Next Step:** Start with caption-ws.ts

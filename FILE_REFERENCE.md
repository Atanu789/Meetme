# File Reference Guide

## All Created Files

### API Endpoints (6 files)
```
app/api/recording/start/route.ts          🆕
app/api/recording/stop/route.ts           🆕
app/api/recording/status/route.ts         🆕
app/api/livestream/start/route.ts         🆕
app/api/livestream/stop/route.ts          🆕
app/api/livestream/status/route.ts        🆕
```

### React Hooks (2 files)
```
hooks/useRecording.ts                     🆕
hooks/useLivestream.ts                    🆕
```

### Components (2 files)
```
components/YouTubeStreamModal.tsx         🆕
components/Navbar.tsx                     ✏️ UPDATED
```

### Configuration (1 file)
```
.env.example                              ✏️ UPDATED
```

### Documentation (4 files)
```
JIBRI_LIVESTREAM_SETUP.md                 🆕 (Comprehensive guide)
JIBRI_QUICK_START.md                      🆕 (Quick reference)
IMPLEMENTATION_SUMMARY.md                 🆕 (This summary)
FILE_REFERENCE.md                         🆕 (This file)
```

---

## Quick Navigation

### Getting Started
1. Read: [JIBRI_QUICK_START.md](JIBRI_QUICK_START.md) - 5 minute setup
2. Read: [JIBRI_LIVESTREAM_SETUP.md](JIBRI_LIVESTREAM_SETUP.md) - Detailed guide
3. Deploy: Follow checklist in [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)

### For Frontend Developers
1. **Hooks**: Use `useRecording()` and `useLivestream()` in your components
2. **Component**: Reference [components/YouTubeStreamModal.tsx](components/YouTubeStreamModal.tsx)
3. **Updated Navbar**: See [components/Navbar.tsx](components/Navbar.tsx#L1-L50) for example usage

### For Backend Developers  
1. **API Design**: Check each route file in `app/api/recording/*` and `app/api/livestream/*`
2. **Error Handling**: Each endpoint validates inputs and returns proper HTTP status codes
3. **Authentication**: All endpoints check session via `auth()` function

### For DevOps/Deployment
1. **Environment Setup**: See [.env.example](.env.example) for required variables
2. **Docker**: Reference env vars in deployment configs
3. **Jibri Setup**: See "Prerequisites" section in [JIBRI_LIVESTREAM_SETUP.md](JIBRI_LIVESTREAM_SETUP.md)

### For Troubleshooting
1. **Common Issues**: [JIBRI_LIVESTREAM_SETUP.md#Troubleshooting](JIBRI_LIVESTREAM_SETUP.md)
2. **API Issues**: Check API route files for validation logic
3. **UI Issues**: Check [components/Navbar.tsx](components/Navbar.tsx) for state management

---

## File Descriptions

### API Endpoints

#### `app/api/recording/start/route.ts`
- **Method**: POST
- **Auth**: Required (NextAuth session)
- **Input**: `{ roomName: string }`
- **Output**: `{ success: boolean, recordingId: string, status: string }`
- **Error Codes**: 400, 401, 500
- **Description**: Initializes Jibri recording for a room

#### `app/api/recording/stop/route.ts`
- **Method**: POST
- **Auth**: Required
- **Input**: `{ roomName: string }`
- **Output**: `{ success: boolean, status: string, recordingPath?: string }`
- **Error Codes**: 400, 401, 500
- **Description**: Stops Jibri recording and returns file path

#### `app/api/recording/status/route.ts`
- **Method**: GET
- **Auth**: Required
- **Query**: `roomName` (required)
- **Output**: `{ success: boolean, status: string, healthy: boolean }`
- **Error Codes**: 400, 401, 500
- **Description**: Gets current recording/Jibri health status

#### `app/api/livestream/start/route.ts`
- **Method**: POST
- **Auth**: Required
- **Input**: `{ roomName: string, youtubeStreamUrl: string }`
- **Output**: `{ success: boolean, streamId: string, status: string }`
- **Error Codes**: 400, 401, 500
- **Description**: Starts YouTube livestream via Jibri

#### `app/api/livestream/stop/route.ts`
- **Method**: POST
- **Auth**: Required
- **Input**: `{ roomName: string }`
- **Output**: `{ success: boolean, status: string }`
- **Error Codes**: 400, 401, 500
- **Description**: Stops YouTube livestream

#### `app/api/livestream/status/route.ts`
- **Method**: GET
- **Auth**: Required
- **Query**: `roomName` (required)
- **Output**: `{ success: boolean, status: string, streaming: boolean }`
- **Error Codes**: 400, 401, 500
- **Description**: Gets current livestream/Jibri status

### React Hooks

#### `hooks/useRecording.ts`
```typescript
// Usage
const { 
  isRecording,           // boolean - recording in progress
  recordingId,           // string | null - current recording ID
  error,                 // string | null - error message if any
  loading,               // boolean - request in progress
  startRecording,        // (roomName: string) => Promise<void>
  stopRecording,         // (roomName: string) => Promise<void>
  clearError             // () => void
} = useRecording(roomName);
```

#### `hooks/useLivestream.ts`
```typescript
// Usage
const {
  isStreaming,           // boolean - livestream in progress
  streamId,              // string | null - current stream ID
  error,                 // string | null - error message
  loading,               // boolean - request in progress
  startLivestream,       // (room: string, url: string) => Promise<void>
  stopLivestream,        // (roomName: string) => Promise<void>
  clearError             // () => void
} = useLivestream(roomName);
```

### Components

#### `components/YouTubeStreamModal.tsx`
- **Props**: `isOpen`, `onClose`, `onSubmit`, `loading`
- **Features**: Form with validation, error display, loading state
- **Usage**: Mounted in Navbar when YouTube button clicked

#### `components/Navbar.tsx` (UPDATED)
- **New Imports**: `YouTubeStreamModal`, `useRecording`, `useLivestream`
- **New State**: Recording, livestream, and modal state management
- **New Buttons**: 
  - ⏺ Record / ⏹ Recording (red color)
  - 📺 YouTube / 🔴 Live (rose color)
- **New Features**: Error toasts, loading states, modal management

### Configuration

#### `.env.example` (UPDATED)
New variables added:
```
JIBRI_SERVICE_URL=http://localhost:2222
JIBRI_API_SECRET=your_jibri_api_secret
JIBRI_RECORDINGS_PATH=/tmp/jibri-recordings
```

---

## Testing Checklist

### Before Deployment
- [ ] All 9 files created successfully
- [ ] npm build succeeds without errors
- [ ] TypeScript compilation passes
- [ ] All imports resolve correctly

### Functional Testing (Local Dev)
- [ ] Recording button appears in room
- [ ] Livestream button appears in room
- [ ] Recording starts without error
- [ ] Recording stops without error
- [ ] YouTube modal opens and closes
- [ ] YouTube URL input validates
- [ ] Livestream starts without error
- [ ] Livestream stops without error
- [ ] Error messages display on failures

### Integration Testing
- [ ] Jibri service is reachable
- [ ] Authentication works for all endpoints
- [ ] Recording files are created
- [ ] Livestream connects to YouTube
- [ ] Error handling works (bad URLs, bad roomName)

### Production Setup
- [ ] Environment variables configured
- [ ] Jibri service running and healthy
- [ ] Self-hosted Jitsi domain configured
- [ ] HTTPS enabled for all endpoints
- [ ] Monitoring/alerting configured
- [ ] Recording storage verified
- [ ] Backup strategy configured

---

## API Request Examples

### cURL Examples

#### Start Recording
```bash
curl -X POST http://localhost:3000/api/recording/start \
  -H "Content-Type: application/json" \
  -d '{"roomName":"meeting-123"}'
```

#### Start Livestream
```bash
curl -X POST http://localhost:3000/api/livestream/start \
  -H "Content-Type: application/json" \
  -d '{
    "roomName":"meeting-123",
    "youtubeStreamUrl":"rtmps://a.rtmp.youtube.com/live2/xxx"
  }'
```

#### Get Status
```bash
curl http://localhost:3000/api/recording/status?roomName=meeting-123
curl http://localhost:3000/api/livestream/status?roomName=meeting-123
```

### JavaScript Examples

#### Using Fetch
```javascript
// Start recording
await fetch('/api/recording/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ roomName: 'meeting-123' })
});

// Start livestream
await fetch('/api/livestream/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    roomName: 'meeting-123',
    youtubeStreamUrl: 'rtmps://a.rtmp.youtube.com/live2/xxx'
  })
});
```

#### Using Hooks
```typescript
import { useRecording } from '@/hooks/useRecording';
import { useLivestream } from '@/hooks/useLivestream';

export function MyComponent({ roomName }) {
  const { isRecording, startRecording, stopRecording } = useRecording(roomName);
  const { isStreaming, startLivestream, stopLivestream } = useLivestream(roomName);

  return (
    <>
      <button onClick={() => startRecording(roomName)}>
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </button>
      <button onClick={() => startLivestream(roomName, 'rtmps://...')}>
        Go Live
      </button>
    </>
  );
}
```

---

## Environment Variables Reference

### Required Variables
| Variable | Example | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_JITSI_DOMAIN` | `meet.example.com` | Self-hosted Jitsi domain |
| `JIBRI_SERVICE_URL` | `http://jibri:2222` | Jibri API endpoint |
| `JIBRI_API_SECRET` | `random-secret-123` | Jibri API authentication |

### Optional Variables
| Variable | Default | Purpose |
|----------|---------|---------|
| `JIBRI_RECORDINGS_PATH` | `/tmp/jibri-recordings` | Recording storage path |

---

## Common Code Patterns

### Pattern 1: Simple Recording Control
```typescript
import { useRecording } from '@/hooks/useRecording';

export function RecordButton({ roomName }) {
  const { isRecording, startRecording, stopRecording } = useRecording(roomName);

  const handleClick = () => {
    if (isRecording) {
      stopRecording(roomName);
    } else {
      startRecording(roomName);
    }
  };

  return (
    <button onClick={handleClick}>
      {isRecording ? 'Stop' : 'Start'} Recording
    </button>
  );
}
```

### Pattern 2: Livestream with URL Input
```typescript
import { useLivestream } from '@/hooks/useLivestream';

export function LivestreamControl({ roomName }) {
  const { isStreaming, startLivestream, stopLivestream } = useLivestream(roomName);
  const [url, setUrl] = useState('');

  const handleStart = async () => {
    await startLivestream(roomName, url);
  };

  return (
    <>
      <input 
        value={url} 
        onChange={e => setUrl(e.target.value)}
        placeholder="YouTube stream URL"
      />
      {isStreaming ? (
        <button onClick={() => stopLivestream(roomName)}>Stop Stream</button>
      ) : (
        <button onClick={handleStart}>Go Live</button>
      )}
    </>
  );
}
```

### Pattern 3: With Error Handling
```typescript
import { useRecording } from '@/hooks/useRecording';

export function RobustRecordButton({ roomName }) {
  const { isRecording, startRecording, stopRecording, error, clearError } = useRecording(roomName);

  return (
    <>
      <button onClick={() => startRecording(roomName)}>
        {isRecording ? 'Stop' : 'Start'}
      </button>
      {error && (
        <div className="error">
          {error}
          <button onClick={clearError}>Dismiss</button>
        </div>
      )}
    </>
  );
}
```

---

## Version Information
- **Implementation Date**: May 27, 2026
- **Next.js Version**: ^14.0.0
- **React Version**: ^18.2.0
- **TypeScript**: ^5.3.3

---

## Links & Resources

### Documentation
- [Setup Guide](JIBRI_LIVESTREAM_SETUP.md)
- [Quick Start](JIBRI_QUICK_START.md)  
- [Implementation Summary](IMPLEMENTATION_SUMMARY.md)
- [This File](FILE_REFERENCE.md)

### External Resources
- [Jibri GitHub](https://github.com/jitsi/jibri)
- [Jitsi Documentation](https://jitsi.org/user-documentation/)
- [YouTube Livestream Help](https://support.google.com/youtube/answer/2474026)
- [Next.js App Router](https://nextjs.org/docs/app)

---

**Last Updated**: May 27, 2026
**Status**: ✅ Complete & Ready

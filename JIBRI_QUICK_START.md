# Jibri Recording & YouTube Livestream - Quick Start

## 30-Second Setup

### 1. Add to `.env.local`
```bash
JIBRI_SERVICE_URL=http://your-jibri-server:2222
JIBRI_API_SECRET=your_secure_secret_here
NEXT_PUBLIC_JITSI_DOMAIN=meet.your-domain.com
```

### 2. Deploy Jibri
```bash
# If using Docker, add to docker-compose.yml
jibri:
  image: jitsi/jibri:latest
  environment:
    XMPP_SERVER: prosody
    XMPP_DOMAIN: xmpp.your-domain.com
    JIBRI_NICKNAME: jibri
    JIBRI_PASSWORD: jibripassword
  ports:
    - "2222:2222"
```

### 3. Use in UI
- **Recording**: Click ⏺ Record button → ⏹ Recording (red) → Click to stop
- **Livestream**: Click 📺 YouTube → Paste stream URL → Go Live → 🔴 Live (red) → Click to stop

## Restart and Test

```bash
npm run dev
# Open a meeting room
# Test recording button
# Test livestream with test YouTube stream
```

## Common Issues

| Issue | Solution |
|-------|----------|
| "Jibri service not configured" | Add `JIBRI_API_SECRET` to `.env.local` |
| "Cannot connect to Jibri" | Verify `JIBRI_SERVICE_URL` is reachable |
| "Recording not starting" | Check Jibri logs: `docker logs jibri` |
| "YouTube stream won't start" | Verify stream URL format: `rtmps://a.rtmp.youtube.com/live2/...` |
| Button disabled/loading | Wait - request is processing |

## File Locations

- **Hooks**: 
  - `hooks/useRecording.ts` - Recording state management
  - `hooks/useLivestream.ts` - Livestream state management
- **Components**:
  - `components/Navbar.tsx` - UI buttons (updated)
  - `components/YouTubeStreamModal.tsx` - URL input form
- **API Routes**:
  - `app/api/recording/start` - Start recording
  - `app/api/recording/stop` - Stop recording
  - `app/api/livestream/start` - Start livestream
  - `app/api/livestream/stop` - Stop livestream
- **Config**:
  - `.env.example` - Environment variables (updated)

## Next: Production Deployment

1. Set up reverse proxy for Jibri (optional but recommended)
2. Configure HTTPS for Jitsi
3. Set up proper storage for recordings
4. Enable monitoring/alerting for Jibri health
5. Create backup strategy for recorded videos

Full setup guide: [JIBRI_LIVESTREAM_SETUP.md](JIBRI_LIVESTREAM_SETUP.md)

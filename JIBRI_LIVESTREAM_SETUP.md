# Jitsi Recording (Jibri) & YouTube Livestream Setup Guide

## Overview

This guide explains how to set up and use the new Jibri recording and YouTube livestream features in Melanam.

### Features Implemented

1. **Jitsi Video Recording (Jibri)** - Record meetings and save them as video files
2. **YouTube Livestream** - Stream your Jitsi meeting directly to YouTube Live

## Architecture

### Components Created

#### Frontend Components
- **[components/YouTubeStreamModal.tsx](components/YouTubeStreamModal.tsx)** - Modal for entering YouTube stream URL
- **[hooks/useRecording.ts](hooks/useRecording.ts)** - React hook for managing recording state
- **[hooks/useLivestream.ts](hooks/useLivestream.ts)** - React hook for managing livestream state
- **[components/Navbar.tsx](components/Navbar.tsx)** - Updated with recording/livestream buttons

#### Backend API Endpoints
- **POST /api/recording/start** - Start Jibri recording
- **POST /api/recording/stop** - Stop Jibri recording
- **GET /api/recording/status** - Get recording status
- **POST /api/livestream/start** - Start YouTube livestream
- **POST /api/livestream/stop** - Stop YouTube livestream
- **GET /api/livestream/status** - Get livestream status

## Prerequisites

### 1. Self-Hosted Jitsi Installation
You need a self-hosted Jitsi instance (not meet.jit.si). Set this in:
```
NEXT_PUBLIC_JITSI_DOMAIN=meet.your-domain.com
```

### 2. Jibri Service
Jibri must be installed and running on your Jitsi infrastructure.

**Installation on Docker:**
```bash
# Jibri Docker Compose example
jibri:
  image: jitsi/jibri:latest
  environment:
    XMPP_SERVER: prosody
    XMPP_DOMAIN: xmpp.your-domain.com
    XMPP_AUTH_DOMAIN: auth.xmpp.your-domain.com
    XMPP_BOSH_URL_BASE: http://prosody:5280
    JIBRI_NICKNAME: jibri
    JIBRI_PASSWORD: jibripassword
  ports:
    - "2222:2222"
  depends_on:
    - prosody
```

### 3. YouTube Account (for Livestream)
You need a YouTube account with livestream permissions enabled.

## Environment Configuration

### Required Variables

Add these to your `.env.local` or `.env` file:

```bash
# Jibri Service Configuration
JIBRI_SERVICE_URL=http://localhost:2222
JIBRI_API_SECRET=your_secure_jibri_api_secret

# Jibri Recording Storage (on server)
JIBRI_RECORDINGS_PATH=/tmp/jibri-recordings

# Jitsi Configuration (must be self-hosted)
NEXT_PUBLIC_JITSI_DOMAIN=meet.your-domain.com
```

### Environment Variable Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JIBRI_SERVICE_URL` | Yes | `http://localhost:2222` | URL where Jibri API is running |
| `JIBRI_API_SECRET` | Yes | - | API secret for Jibri authentication |
| `JIBRI_RECORDINGS_PATH` | No | `/tmp/jibri-recordings` | Where recordings are stored on server |
| `NEXT_PUBLIC_JITSI_DOMAIN` | Yes | `meet.jit.si` | Your self-hosted Jitsi domain |

## Usage Guide

### Recording a Meeting

1. **Start Recording**
   - Click the **⏺ Record** button in the navbar
   - Recording indicator will show as **⏹ Recording** when active
   - A red pulse animation indicates recording is in progress

2. **Stop Recording**
   - Click the **⏹ Recording** button to stop
   - Recording will be saved to `JIBRI_RECORDINGS_PATH` on your Jibri server

### Streaming to YouTube Live

1. **Get Your YouTube Stream URL**
   - Go to [YouTube Studio](https://studio.youtube.com)
   - Click **Create** → **Go Live**
   - Choose **Stream** 
   - Copy the **Stream URL** (looks like: `rtmps://a.rtmp.youtube.com/live2/xxx`)

2. **Start Livestream**
   - Click the **📺 YouTube** button in the navbar
   - Paste your YouTube stream URL in the modal
   - Click **Go Live**
   - Status will change to **🔴 Live** when streaming

3. **Stop Livestream**
   - Click the **🔴 Live** button to end the stream
   - Status returns to **📺 YouTube**

## API Reference

### Start Recording
```bash
POST /api/recording/start
Content-Type: application/json

{
  "roomName": "meeting-room-123"
}

Response:
{
  "success": true,
  "recordingId": "meeting-room-123-1683620400000",
  "status": "recording",
  "message": "Recording started successfully"
}
```

### Stop Recording
```bash
POST /api/recording/stop
Content-Type: application/json

{
  "roomName": "meeting-room-123"
}

Response:
{
  "success": true,
  "status": "stopped",
  "message": "Recording stopped successfully",
  "recordingPath": "/tmp/jibri-recordings/recording-123.webm"
}
```

### Get Recording Status
```bash
GET /api/recording/status?roomName=meeting-room-123

Response:
{
  "success": true,
  "status": "idle",
  "healthy": true,
  "jibriStatus": {
    "status": "HEALTHY"
  }
}
```

### Start YouTube Livestream
```bash
POST /api/livestream/start
Content-Type: application/json

{
  "roomName": "meeting-room-123",
  "youtubeStreamUrl": "rtmps://a.rtmp.youtube.com/live2/xxx",
  "displayName": "Melanam Livestream"
}

Response:
{
  "success": true,
  "streamId": "meeting-room-123-1683620400000",
  "status": "streaming",
  "message": "YouTube livestream started successfully"
}
```

### Stop YouTube Livestream
```bash
POST /api/livestream/stop
Content-Type: application/json

{
  "roomName": "meeting-room-123"
}

Response:
{
  "success": true,
  "status": "stopped",
  "message": "YouTube livestream stopped successfully"
}
```

### Get Livestream Status
```bash
GET /api/livestream/status?roomName=meeting-room-123

Response:
{
  "success": true,
  "status": "streaming",
  "streaming": true,
  "jibriStatus": {
    "status": "HEALTHY"
  }
}
```

## Features

### Recording
- **Automatic**: No additional setup after deploying Jibri
- **Multiple Formats**: Records in WebM format (compatible with most browsers)
- **Storage**: Recordings saved to `/tmp/jibri-recordings` on Jibri server
- **Quality**: Records full HD video with audio
- **State Management**: React hooks handle all state and loading states

### YouTube Livestream
- **Easy Setup**: Just paste your YouTube stream URL
- **Real-time**: Stream starts immediately
- **Quality**: Maintains meeting video quality
- **Error Handling**: Built-in error messages if stream fails
- **Security**: Stream URL is only sent to your backend (not exposed to browser)

## UI Components

### Recording Button
- **Idle State**: ⏺ Record (light gray background)
- **Recording State**: ⏹ Recording (red background with animation)
- **Hover Effects**: Smooth transitions and color changes
- **Loading State**: Button disabled while starting/stopping

### Livestream Button
- **Idle State**: 📺 YouTube (rose background)
- **Streaming State**: 🔴 Live (rose background with pulsing indicator)
- **Modal**: User-friendly form to enter YouTube stream URL

### Status Messages
- Success notifications confirm action started
- Error messages display with dismiss button
- Loading indicators on buttons while processing

## Troubleshooting

### Recording Not Starting
1. **Check Jibri Service**
   ```bash
   # Verify Jibri is running
   curl -H "Authorization: Bearer YOUR_SECRET" http://localhost:2222/jibri/api/v1.0/health
   ```

2. **Verify Configuration**
   - Confirm `JIBRI_SERVICE_URL` is correct
   - Check `JIBRI_API_SECRET` matches Jibri config
   - Ensure Jitsi domain matches `NEXT_PUBLIC_JITSI_DOMAIN`

3. **Check Logs**
   ```bash
   # Docker logs
   docker logs jibri
   ```

### Livestream URL Not Working
1. **Verify YouTube Stream URL Format**
   - Should start with `rtmps://`
   - Should contain `youtube.com`
   - URL should be copied directly from YouTube Studio

2. **Check YouTube Account**
   - Verify livestream permissions are enabled
   - Ensure channel is not restricted
   - Check YouTube Studio for any notifications

3. **Network Issues**
   - Ensure your server can reach YouTube's RTMP servers
   - Check firewall allows outbound RTMPS traffic (port 1935)

### Permission Errors
- Ensure authenticated user has permission to record
- Check NextAuth session is valid
- Verify JWT tokens if using JWT auth

## Integration with Database

### Recording Metadata (Optional)
You can store recording metadata in MongoDB:

```typescript
// models/Meeting.ts - add these fields
recordingEnabled: boolean;
recordingId: string;
recordingPath: string;
lastRecordingAt: Date;
livestreamEnabled: boolean;
livestreamId: string;
lastLivestreamAt: Date;
```

### Activity Logging (Optional)
Log recording/livestream events:

```typescript
// models/MeetingActivity.ts - add these types
'recording-started' | 'recording-stopped' | 'livestream-started' | 'livestream-stopped'
```

## Performance Considerations

1. **Recording Impact**
   - Recording consumes CPU/memory on Jibri server
   - Plan for at least 2-4 GB RAM per concurrent recording
   - Use SSD storage for faster recording output

2. **Livestream Impact**
   - Livestream uses network bandwidth
   - Recommend minimum 10 Mbps upload speed
   - May need to adjust video quality if bandwidth is limited

3. **Scaling**
   - Deploy multiple Jibri instances for concurrent recordings
   - Use load balancing for multiple Jibri services
   - Monitor server resources during peak usage

## Security Considerations

1. **API Secret**
   - Store `JIBRI_API_SECRET` in secure environment
   - Rotate secrets regularly
   - Use strong random values (32+ characters)

2. **YouTube URLs**
   - Stream URLs should never be shared publicly
   - Implement rate limiting on API endpoints
   - Consider encrypting stream URLs in transit

3. **File Access**
   - Secure recording output directory permissions
   - Implement access controls for downloaded recordings
   - Consider encrypting stored recordings

4. **Authentication**
   - Ensure user is authenticated before allowing recording/livestream
   - Implement per-room permissions if needed
   - Log all recording/livestream activities

## Next Steps

1. **Deploy Jibri** in your self-hosted Jitsi infrastructure
2. **Configure Environment Variables** in your production `.env`
3. **Test Recording** in a test meeting
4. **Test Livestream** with a test YouTube stream
5. **Configure Monitoring** for Jibri health
6. **Set Up Storage** for recorded videos
7. **Document Procedures** for your users

## Additional Resources

- [Jitsi Documentation](https://jitsi.org/user-documentation/)
- [Jibri GitHub](https://github.com/jitsi/jibri)
- [YouTube Livestream Documentation](https://support.google.com/youtube/answer/2474026)
- [Self-Hosted Jitsi Deployment](https://jitsi.github.io/handbook/docs/deployment/)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Jibri logs
3. Verify all environment variables
4. Check network connectivity
5. Ensure Jitsi domain is correctly configured

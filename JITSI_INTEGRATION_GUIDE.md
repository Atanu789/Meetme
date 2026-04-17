# Jitsi Integration Guide for Next.js

This guide covers integrating your self-hosted Jitsi Meet server with the Meetme Next.js application.

## Quick Start

### 1. Environment Setup

Add your Jitsi server domain to `.env.local`:

```bash
# Use your custom self-hosted Jitsi domain
NEXT_PUBLIC_JITSI_DOMAIN=meet.melanam.com

# Optional: For HTTP/HTTPS considerations
# For development with HTTP: meet.melanam.com
# For production with HTTPS: https://meet.melanam.com
```

### 2. Using the JitsiMeeting Component

```tsx
import { JitsiMeeting } from '@/components/JitsiMeeting';

export function MyMeetingRoom() {
  return (
    <JitsiMeeting
      roomName="my-meeting-123"
      displayName="John Doe"
      userEmail="john@example.com"
      onReadyToClose={() => console.log('Meeting ended')}
    />
  );
}
```

## Component Props

### Required Props

- **`roomName`** (string): Unique identifier for the meeting room

### Optional Props

- **`displayName`** (string): Display name for the user. Default: "Guest"
- **`userEmail`** (string): Email address of the user. Optional.
- **`domain`** (string): Custom Jitsi domain. Defaults to `NEXT_PUBLIC_JITSI_DOMAIN` env var
- **`onReady`** (function): Callback when meeting is ready
- **`onReadyToClose`** (function): Callback when user leaves meeting
- **`startWithAudioMuted`** (boolean): Mute audio on start. Default: false
- **`startWithVideoMuted`** (boolean): Mute video on start. Default: false
- **`prejoinPageEnabled`** (boolean): Show prejoin screen. Default: false
- **`toolbarButtons`** (string[]): Custom toolbar buttons to show
- **`showLogo`** (boolean): Show Jitsi logo. Default: false
- **`height`** (string): Container height. Default: "100%"
- **`className`** (string): CSS class for container

## Configuration Examples

### Basic Meeting Room in a Page

```tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { JitsiMeeting } from '@/components/JitsiMeeting';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;

  return (
    <div className="w-full h-screen">
      <JitsiMeeting
        roomName={roomId}
        displayName="User Name"
        userEmail="user@example.com"
        height="100%"
        onReadyToClose={() => router.push('/dashboard')}
      />
    </div>
  );
}
```

### Embedded Meeting in a Modal/Dialog

```tsx
import { JitsiMeeting } from '@/components/JitsiMeeting';

export function MeetingModal({ isOpen, roomId, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-40">
      <div className="absolute inset-4 bg-white rounded-lg overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50"
        >
          Close
        </button>
        <JitsiMeeting
          roomName={roomId}
          displayName="Your Name"
          height="100%"
          onReadyToClose={onClose}
        />
      </div>
    </div>
  );
}
```

### Custom Toolbar Configuration

```tsx
<JitsiMeeting
  roomName="meeting-room"
  displayName="Host"
  toolbarButtons={[
    'microphone',
    'camera',
    'desktop',      // Screen sharing
    'fullscreen',
    'hangup',
    'chat',
    'raisehand',
    'videoquality',
    'tileview',
  ]}
  prejoinPageEnabled={false}
  startWithAudioMuted={true}
/>
```

## Toolbar Button Options

Available buttons (pick what you need):
- `microphone` - Toggle microphone
- `camera` - Toggle camera
- `desktop` - Share screen/desktop
- `fullscreen` - Fullscreen mode
- `hangup` - End meeting
- `chat` - Chat messages
- `recording` - Record meeting
- `livestream` - Stream to YouTube/etc
- `etherpad` - Collaborative notepad
- `sharedvideo` - Share video URL
- `settings` - Audio/video settings
- `raisehand` - Raise hand feature
- `videoquality` - Video quality settings
- `tileview` - Multi-view grid layout
- `stats` - Connection statistics
- `shortcuts` - Keyboard shortcuts
- `closedcaptions` - Captions
- `flipself` - Flip camera

## Environment Variables

### `.env.local` Setup

```bash
# Your self-hosted Jitsi domain (required)
# Can be with or without https:// prefix
NEXT_PUBLIC_JITSI_DOMAIN=meet.melanam.com
# or
NEXT_PUBLIC_JITSI_DOMAIN=https://meet.melanam.com

# Other app configuration
MONGODB_URI=your_mongodb_uri
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key
CLERK_SECRET_KEY=your_secret
```

## Self-Hosted Jitsi Configuration

Your server is configured correctly if:

1. ✅ Domain resolves: `meet.melanam.com` → `38.45.94.222`
2. ✅ External API accessible: `https://meet.melanam.com/external_api.js`
3. ✅ All ports exposed:
   - Port 80 (HTTP)
   - Port 443 (HTTPS)
   - Port 10000/UDP (media traffic)
4. ✅ Reverse proxy configured (handled by Jitsi Docker web container)

## HTTP vs HTTPS Considerations

### Development (HTTP)

```bash
NEXT_PUBLIC_JITSI_DOMAIN=meet.melanam.com
```

Works fine for development, but modern browsers may show warnings.

### Production (HTTPS - Recommended)

```bash
NEXT_PUBLIC_JITSI_DOMAIN=https://meet.melanam.com
```

Once you upgrade your SSL certificate:
1. Update your DNS/proxy to use HTTPS
2. Update `NEXT_PUBLIC_JITSI_DOMAIN` to include `https://`
3. Ensure port 443 is open and configured

## Advanced Configuration

### Custom Conference Config Overrides

The component uses reasonable defaults, but you can customize via environment variables:

```tsx
// In component, add custom configs:
<JitsiMeeting
  roomName={roomId}
  displayName={user.name}
  // These are automatically handled:
  // - startWithAudioMuted: false
  // - startWithVideoMuted: false
  // - prejoinPageEnabled: false
/>
```

For more config options, see [Jitsi Advanced Configuration](https://jitsi.github.io/handbook/docs/config/).

### Event Handling

The component emits these events internally:
- `videoConferenceJoined` - User successfully joined
- `readyToClose` - Meeting ended (triggers `onReadyToClose` callback)
- `participantJoined` - Another user joined
- `participantLeft` - User left
- `conferenceError` - Error occurred

## Troubleshooting

### "Failed to load video service" Error

**Solution**: Verify your domain:
1. Check `meet.melanam.com` is accessible
2. Curl test: `curl https://meet.melanam.com/external_api.js`
3. Verify DNS: `nslookup meet.melanam.com`
4. Check firewall: Ensure port 443 is open

### Video Not Starting

**Solution**: Check browser console for errors:
1. Browser DevTools → Console tab
2. Look for CORS or security errors
3. Verify Jitsi services running: `docker ps` on your server
4. Check Jitsi logs: `docker logs jitsi-web`

### Only Audio/Video Works

**Solution**: UDP port 10000 may be blocked:
1. Test UDP: `timeout 5 nc -u -zv 38.45.94.222 10000`
2. Check firewall rules on VPS
3. Ensure Docker port mapping: `-p 10000:10000/udp`

### Participants Can't See Each Other

**Solution**: JVB (Jitsi Videobridge) configuration:
1. Check `PUBLIC_URL` in Docker `.env`
2. Verify JVB is running: `docker logs jitsi-jvb`
3. Check NAT/port forwarding on VPS

## Production Checklist

- [ ] HTTPS enabled with valid SSL certificate
- [ ] `NEXT_PUBLIC_JITSI_DOMAIN` updated to use `https://`
- [ ] All Jitsi services running (web, prosody, jicofo, jvb)
- [ ] Firewall rules: ports 80, 443, 10000/UDP open
- [ ] Regular backups of Jitsi config and Docker volumes
- [ ] Monitor Jitsi logs: `docker logs -f jitsi-web`
- [ ] Test with multiple participants regularly

## Next Steps

1. **Customize Branding**: Update toolbar, logo, and colors
2. **Add Meeting Controls**: Create dashboard for creating/managing meetings
3. **Recording**: Enable meeting recording (configured in Docker `.env`)
4. **Analytics**: Add meeting analytics and usage tracking
5. **Security**: Implement meeting passwords and access controls

## Resources

- [Jitsi Meet Documentation](https://jitsi.github.io/handbook/docs/)
- [Docker Jitsi Meet GitHub](https://github.com/jitsi/docker-jitsi-meet)
- [Jitsi External API Docs](https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-iframe/)
- [Advanced Configuration](https://jitsi.github.io/handbook/docs/config/)

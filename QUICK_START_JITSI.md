# Quick Start - Jitsi Integration

Get your self-hosted Jitsi server integrated in 5 minutes!

## ✅ Step 1: Verify Your Setup

Your `.env.local` already has:
```bash
NEXT_PUBLIC_JITSI_DOMAIN=meet.melanam.com
```

**That's it!** Your custom domain is configured.

## ✅ Step 2: Use the Component

Your room page already uses the new `JitsiMeeting` component! It's been refactored to:
- Work with your custom domain
- Handle errors gracefully
- Clean up properly on unmount

## ✅ Step 3: Test It

```bash
# 1. Start your dev server
npm run dev

# 2. Go to a meeting room
# Example: http://localhost:3000/room/test-meeting-123

# 3. You should see:
# - JitsiMeeting component loading
# - Jitsi interface embedding
# - Your video conference running
```

## 🎨 Optional: Customize (5 more min)

### Change Toolbar Buttons

In `app/room/[id]/page.tsx`, modify the `JitsiMeeting` component:

```tsx
<JitsiMeeting
  roomName={meetingId}
  displayName={userDisplayName}
  userEmail={userEmail}
  height="100%"
  toolbarButtons={[
    'microphone',
    'camera',
    'desktop',    // Screen sharing
    'hangup',
  ]}
  onReadyToClose={() => router.push('/dashboard')}
/>
```

### Start with Muted Audio/Video

```tsx
<JitsiMeeting
  roomName={meetingId}
  displayName={userDisplayName}
  userEmail={userEmail}
  height="100%"
  startWithAudioMuted={true}  // Add this
  startWithVideoMuted={false}
  onReadyToClose={() => router.push('/dashboard')}
/>
```

### Use Configuration Presets

```tsx
import { CONFIG_PRESETS, TOOLBAR_PRESETS } from '@/lib/jitsi';

<JitsiMeeting
  roomName={meetingId}
  displayName={userDisplayName}
  userEmail={userEmail}
  height="100%"
  {...CONFIG_PRESETS.classroom}  // Preset config
  toolbarButtons={TOOLBAR_PRESETS.host}  // Preset toolbar
  onReadyToClose={() => router.push('/dashboard')}
/>
```

## 📚 Available Components

### `JitsiMeeting` - Main Component
```tsx
import { JitsiMeeting } from '@/components/JitsiMeeting';

<JitsiMeeting
  roomName="my-room"
  displayName="John Doe"
  height="100%"
/>
```

### `JitsiMeetingContainer` - With Error/Loading
```tsx
import { JitsiMeetingContainer } from '@/components/JitsiMeetingContainer';

<JitsiMeetingContainer
  roomName={roomId}
  displayName={userName}
  isLoading={loading}
  error={error}
  onRetry={() => reload()}
/>
```

## 🛠️ Available Utilities

### Hook: `useJitsiMeeting`
```tsx
import { useJitsiMeeting } from '@/hooks/useJitsiMeeting';

const { generateRoomName, formatDisplayName } = useJitsiMeeting();

const roomId = generateRoomName();  // "meetme-h4x8gvr-a1b2c3"
const name = formatDisplayName("John Doe");  // "John Doe"
```

### Config Utils: `lib/jitsi.ts`
```tsx
import {
  getJitsiApiUrl,
  getCleanDomain,
  validateJitsiDomain,
  TOOLBAR_PRESETS,
  CONFIG_PRESETS,
} from '@/lib/jitsi';

const apiUrl = getJitsiApiUrl('meet.melanam.com');
const isValid = await validateJitsiDomain('meet.melanam.com');
```

## 🎯 Toolbar Buttons Quick Reference

Pick what you need:

```tsx
// Minimal (just join/leave)
['microphone', 'camera', 'hangup']

// Standard
['microphone', 'camera', 'desktop', 'fullscreen', 'hangup', 'chat']

// Host/Instructor
['microphone', 'camera', 'desktop', 'hangup', 'chat', 'recording', 'settings', 'stats']

// Everything
['microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen', 'hangup', 
 'chat', 'recording', 'livestream', 'settings', 'raisehand', 'videoquality', 
 'tileview', 'stats', 'shortcuts']
```

## 🚀 What's Ready to Use

✅ **Core component** - `JitsiMeeting.tsx`  
✅ **Your room page** - Already updated to use it  
✅ **Custom domain** - Configured to `meet.melanam.com`  
✅ **Utilities** - Ready in `hooks/` and `lib/`  
✅ **Documentation** - Full guides included  

## 🔍 Verify It Works

1. Check if your domain is accessible:
```bash
curl -I https://meet.melanam.com/external_api.js
# Should return 200 or 301/302
```

2. Check browser console when joining a meeting:
```
No errors = ✅ Good to go
```

3. Test with a friend:
- Create a meeting
- Share the link
- Both should see each other

## 📖 Need More Info?

See these files:

- **Quick overview:** [JITSI_SETUP_SUMMARY.md](./JITSI_SETUP_SUMMARY.md)
- **Full guide:** [JITSI_INTEGRATION_GUIDE.md](./JITSI_INTEGRATION_GUIDE.md)
- **Component reference:** [components/README.md](./components/README.md)

## ⚠️ Common Issues

### Jitsi not loading
```
Solution: Verify NEXT_PUBLIC_JITSI_DOMAIN in .env.local
```

### No video/audio
```
Solution: Check browser camera/mic permissions
         Check UDP port 10000 on your server
```

### Can't see other participants
```
Solution: Test from different networks
         Check Jitsi logs: docker logs jitsi-jvb
```

## 🎉 That's It!

Your Jitsi integration is ready. Start using it:

1. **Create meetings** via your dashboard
2. **Share links** with participants
3. **Join** and start video conferencing!

---

**Next: HTTPS Setup** (When Ready)

When you get an SSL certificate:
1. Update DNS/proxy to use HTTPS
2. Change `NEXT_PUBLIC_JITSI_DOMAIN=https://meet.melanam.com`
3. Restart your Next.js app

**Questions?** Check the [JITSI_INTEGRATION_GUIDE.md](./JITSI_INTEGRATION_GUIDE.md) troubleshooting section!

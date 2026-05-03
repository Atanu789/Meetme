# Live Captions Development Quick Start

Get live captions working in your project **right now** — no meetings, no ffmpeg, no complex setup.

## ⚡ 1-minute setup

**Terminal 1: Caption backend**
```bash
cd "c:\Users\Atanu Basak\ZOOM 2.0"
npm run meeting-ai
```

**Terminal 2: Dev bot (cycles through test audio)**
```bash
cd "c:\Users\Atanu Basak\ZOOM 2.0\backend\meeting-ai-service"
npm run bot:dev
```

**Terminal 3: Next.js frontend**
```bash
cd "c:\Users\Atanu Basak\ZOOM 2.0"
npm run dev
```

Then open http://localhost:3000/room/dev-room-123 in your browser and watch **live captions appear every 15 seconds**.

## What's happening

1. **Dev Bot** cycles through 3 test audio samples.
2. **AssemblyAI** transcribes each sample.
3. **Captions posted** to your caption backend.
4. **WebSocket overlay** receives and displays them in real-time.

## Customization

```bash
# Change room ID
npm run bot:dev -- my-custom-room

# Slow down caption cycles (seconds)
$env:DEV_BOT_INTERVAL_SECONDS = "30"
npm run bot:dev
```

## Environment

Ensure `.env.local` has:
```
ASSEMBLYAI_API_KEY=your_key_here
NEXT_PUBLIC_MEETING_AI_WS_URL=ws://localhost:4010
```

## Output

You should see:
```
[dev-bot] starting development bot
[dev-bot] meeting room: dev-room-123
[dev-bot] cycling through 3 test audio samples

  → Open your browser to http://localhost:3000/room/dev-room-123 to see live captions
  → Press Ctrl+C to stop

[dev-bot] cycle 1: transcribing Sports Injuries
[dev-bot] caption posted: "Runner's knee characterized by pain..."
[dev-bot] caption posted: "It is caused by overuse, muscle imbalance..."
```

Captions will appear in your meeting room overlay in real-time.

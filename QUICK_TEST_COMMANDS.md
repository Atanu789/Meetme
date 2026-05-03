# Phase 1 Audio Test — Copy-Paste Commands

## Command 1: Start Backend Server

**Terminal 1 (PowerShell):**
```powershell
cd "c:\Users\Atanu Basak\ZOOM 2.0\backend\meeting-ai-service"
npm start
```

Wait for output:
```
✅ HTTP server listening on port 4010
```

---

## Command 2: Run Audio Capture Bot

**Terminal 2 (PowerShell) — After Step 1 is ready:**
```powershell
cd "c:\Users\Atanu Basak\ZOOM 2.0\backend\meeting-ai-service"
node src/bot/zoomBotAssemblyRunner.js "audio-test-001" "https://meet.melanam.com/audio-test-001" "Melanam Bot"
```

---

## Command 3: Open Meeting in Browser

**Open this URL in your browser BEFORE running the bot:**
```
https://meet.melanam.com/audio-test-001
```

**Keep the browser tab open while the bot records.**

---

## Expected Result

Bot will print:
```
╔════════════════════════════════════════════════════════════════╗
║                    AUDIO FILE SAVED                           ║
╚════════════════════════════════════════════════════════════════╝

📁 Absolute Path:
   C:\Users\Atanu Basak\ZOOM 2.0\backend\meeting-ai-service\data\audio\audio-test-001\test.wav

📊 File Size:  XXX KB
⏱️  Duration:   XX seconds
```

**Then:** Windows Explorer opens automatically showing the folder with `test.wav`

---

## What to Do Next

1. **Double-click test.wav** to play it
2. **Listen for:**
   - ✅ Meeting voices?
   - ✅ Your speech?
   - ❌ Or silence?

3. **Report the result** to ChatGPT:
   - I can hear: [meeting audio / silence / noise]
   - RMS was: [value from logs]
   - File size: [KB]

---

## File Location (Manual Fallback)

If Explorer doesn't open, file is here:
```
c:\Users\Atanu Basak\ZOOM 2.0\backend\meeting-ai-service\data\audio\audio-test-001\test.wav
```

Copy → paste in Windows Explorer address bar → Enter

---

## Timing

| Step | Time |
|------|------|
| Backend startup | ~3 seconds |
| Bot join meeting | ~5 seconds |
| Audio recording | 10 seconds |
| Validation | ~1 second |
| **Total** | **~19 seconds** |


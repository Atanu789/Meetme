# Phase 1 Audio Validation — Testing Runbook

## Quick Start (3 Steps)

### Step 1: Start the Backend Server
```powershell
cd "c:\Users\Atanu Basak\ZOOM 2.0\backend\meeting-ai-service"
npm start
```

**Expected output:**
```
[server] ✅ HTTP server listening on port 4010
[server] ✅ WebSocket server listening on port 4010
```

⏳ Wait for this message before continuing.

---

### Step 2: Start a Jitsi Meeting (Open in Browser)

Open in your web browser:
```
https://meet.melanam.com/audio-test-001
```

Or use your existing meeting URL.

**What to do in the meeting:**
- Speak some words (e.g., "Testing one two three, can you hear me?")
- Keep it open for at least 15 seconds
- The bot will join automatically

**Note:** You need AUDIO in the meeting. If it's quiet:
- Play some background audio
- Or join from another browser tab speaking

---

### Step 3: Run the Bot (Open New Terminal)

```powershell
cd "c:\Users\Atanu Basak\ZOOM 2.0\backend\meeting-ai-service"
node src/bot/zoomBotAssemblyRunner.js "audio-test-001" "https://meet.melanam.com/audio-test-001" "Melanam Bot"
```

**What the bot will do:**
1. Launch Playwright browser silently
2. Join the Jitsi meeting
3. Record 10 seconds of audio
4. Validate the audio
5. Print the exact file path
6. **Auto-open the folder in Windows Explorer**

---

## Expected Output (Success Case)

```
[bot] PHASE 1: AUDIO CAPTURE VALIDATION
[bot] meetingId=audio-test-001
[bot] PHASE 1: AUDIO CAPTURE VALIDATION (NO TRANSCRIPTION)
[bot] mode: record to disk, validate, then exit
[bot] ✅ joined meeting successfully
[bot] ✅ recording started, will save to: C:\...\data\audio\audio-test-001\test.wav
[bot] ✅ recording completed
[bot] validating audio file...

[audio-validation] RESULTS
==========================
📁 file size:              315.42 KB
⏱️  estimated duration:     10.05 seconds
📊 RMS (root mean square): 0.045230
🔇 silence detected:       ✅ NO (PASSED)
✅ overall valid:          ✅ PASSED
==========================

[bot] ✅ AUDIO VALIDATION PASSED

╔════════════════════════════════════════════════════════════════╗
║                    AUDIO FILE SAVED                           ║
╚════════════════════════════════════════════════════════════════╝

📁 Absolute Path:
   C:\Users\Atanu Basak\ZOOM 2.0\backend\meeting-ai-service\data\audio\audio-test-001\test.wav

📊 File Size:
   315.42 KB (323000 bytes)

⏱️  Duration:
   10.05 seconds

🔊 Audio Energy (RMS):
   0.045230 (speech-like)

════════════════════════════════════════════════════════════════
🎧 NEXT: Open test.wav with any media player to listen
════════════════════════════════════════════════════════════════

[bot] 📂 Opening folder in Explorer...
[bot] 🎯 Ready for manual audio inspection
```

**Then:** Windows Explorer will open showing the folder with `test.wav`

---

## Manual Audio Inspection

### Step 4: Listen to test.wav

After the bot finishes:

1. **Explorer will auto-open** showing the folder
2. **Double-click test.wav** to open in default media player
3. **Listen and answer:**

```
✅ Can you hear meeting voices/speakers?
✅ Can you hear Jitsi audio?
❌ Is it completely silent?
❌ Is it only noise/no speech?
```

---

## Troubleshooting

### ❌ Bot doesn't start
```
Error: MEETING_AI_PORT not found
```
**Fix:** Make sure backend server is running (Step 1)

---

### ❌ File shows 0 bytes or very small
```
📊 File Size: 0.00 KB
```
**Reason:** ffmpeg failed
- Check ffmpeg is installed: `ffmpeg -version`
- Check audio device exists: `ffmpeg -list_devices true -f dshow -i dummy`

---

### ❌ Audio is SILENT (validation fails)
```
🔇 silence detected: ❌ YES (FAILED)
📊 RMS: 0.000001
```

**Reasons:**
1. **No speakers in meeting** — Add audio/voice
2. **Windows loopback disabled** — Configure stereo mix
3. **ffmpeg wrong device** — Set `BOT_AUDIO_DEVICE` env var
4. **Meeting has no audio output** — Check Jitsi audio is working

**To fix on Windows:**
```powershell
# Option A: Enable Stereo Mix
# Settings → Volume advanced options → App volume and device preferences → 
# Find ffmpeg → Choose output → Stereo Mix

# Option B: Set audio device manually
$env:BOT_AUDIO_DEVICE = "Speakers (Your Device Name)"
node src/bot/zoomBotAssemblyRunner.js ...

# Option C: List available devices
ffmpeg -hide_banner -list_devices true -f dshow -i dummy 2>&1 | findstr "(audio)"
```

---

### ❌ Recording too short
```
🔇 Recording too short (3.2s < 9s)
```

**Reason:** ffmpeg timed out or failed
- ffmpeg executable missing
- Device name wrong
- Permissions issue

---

### ❌ Explorer doesn't open
```
⚠️ Could not auto-open folder
```

**File is still saved!** Open it manually:
- Copy the path from bot logs
- Open Windows Explorer
- Paste path in address bar
- Press Enter

---

## File Location Reference

All recordings are saved to:
```
c:\Users\Atanu Basak\ZOOM 2.0\backend\meeting-ai-service\data\audio\{meetingId}\test.wav
```

For our test:
```
c:\Users\Atanu Basak\ZOOM 2.0\backend\meeting-ai-service\data\audio\audio-test-001\test.wav
```

---

## Command Reference

### Run with custom meeting ID
```powershell
node src/bot/zoomBotAssemblyRunner.js "my-meeting-123" "https://meet.melanam.com/my-meeting-123" "Melanam Bot"
```

### Run with verbose output (debug)
```powershell
$env:DEBUG = "1"
node src/bot/zoomBotAssemblyRunner.js "audio-test-001" "https://meet.melanam.com/audio-test-001" "Melanam Bot"
```

### Override audio device (Windows)
```powershell
$env:BOT_AUDIO_DEVICE = "Stereo Mix"
node src/bot/zoomBotAssemblyRunner.js "audio-test-001" "https://meet.melanam.com/audio-test-001" "Melanam Bot"
```

### Run with custom ffmpeg path
```powershell
$env:BOT_FFMPEG_PATH = "C:\path\to\ffmpeg.exe"
node src/bot/zoomBotAssemblyRunner.js "audio-test-001" "https://meet.melanam.com/audio-test-001" "Melanam Bot"
```

---

## Success Criteria

✅ **Phase 1 Complete** if:
- File saves to disk
- File size > 300 KB
- Duration ≥ 9 seconds
- RMS > 0.001 (not silent)
- You can hear speech in test.wav

❌ **Phase 1 Failed** if:
- File doesn't save (permissions/device issue)
- File is silent (no audio capture setup)
- File is too short (ffmpeg timeout)

---

## Next Actions

### If ✅ PASS:
Proceed to Phase 2 → Enable realtime AssemblyAI streaming

### If ❌ FAIL:
- Fix audio device setup
- Verify ffmpeg installation
- Check OS loopback configuration
- Try different audio device

---

## One-Liner Quick Test (Minimal Output)

```powershell
cd backend\meeting-ai-service; node src/bot/zoomBotAssemblyRunner.js "audio-test-001" "https://meet.melanam.com/audio-test-001" "Bot"
```


# Meeting AI Bot + AssemblyAI Pipeline

This module reuses the Zoom bot approach from your provided `Meeting_bot-main` codebase and extends it with a realtime live caption pipeline:

1. Zoom bot joins a meeting via web client.
2. FFmpeg streams raw PCM audio to AssemblyAI realtime WebSocket.
3. AssemblyAI partial/final transcripts are published immediately.
4. Captions are posted to the caption endpoint:
   - `POST /api/rooms/:meetingId/captions`

## Files

- `src/bot/zoomBotAssemblyRunner.js`: main bot runner (join + capture + transcribe + publish)
- `src/bot/testAssemblyPipeline.js`: validates AssemblyAI + caption publish without joining a meeting

## Requirements

- Node.js 18+
- Full FFmpeg build with capture device support (`dshow/wasapi` on Windows, `pulse` on Linux, `avfoundation` on macOS)
- AssemblyAI API key in env (`ASSEMBLYAI_API_KEY`)
- Caption backend running (`npm run meeting-ai` from project root)

## Install

```bash
cd backend/meeting-ai-service
npm install
```

## Test AssemblyAI + Caption Endpoint

```bash
cd backend/meeting-ai-service
npm run bot:test:assembly -- caption-test-moihjc81
```

## Run Bot Pipeline

```bash
cd backend/meeting-ai-service
npm run bot:zoom -- caption-test-moihjc81 "https://us05web.zoom.us/j/123456789?pwd=xxxxx" "Melanam Note Bot"
```

## Notes

- On Linux, set `BOT_PULSE_SOURCE` for precise sink capture.
- On Windows, the bot joins without audio by default and captures system audio via WASAPI loopback unless overridden.
- Set `BOT_JOIN_WITHOUT_AUDIO=0` only if you explicitly want the bot to join with audio enabled.
- Set `BOT_AUDIO_DEVICE` or `BOT_WASAPI_DEVICE` to override the capture source when needed.
- If ffmpeg is not on PATH, set `BOT_FFMPEG_PATH` (or rely on Playwright's bundled ffmpeg, auto-detected on Windows).
- This runner stays alive while the meeting is active and streams captions continuously.

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, execFileSync } = require('child_process');
const { chromium } = require('playwright');
const dotenv = require('dotenv');
const WebSocketModule = require('ws');

dotenv.config({ path: path.resolve(process.cwd(), '../../.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const CAPTION_BACKEND_URL = (process.env.CAPTION_BACKEND_URL || `http://localhost:${process.env.MEETING_AI_PORT || 4010}`).replace(/\/$/, '');
const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY || process.env.AAI_API_KEY || '';
const ASSEMBLYAI_WS_URL = process.env.ASSEMBLYAI_WS_BASE_URL || 'wss://streaming.assemblyai.com/v3/ws';
const ASSEMBLYAI_SPEECH_MODEL = process.env.ASSEMBLYAI_SPEECH_MODEL || 'u3-rt-pro';
const ASSEMBLYAI_TRANSCRIBE_LANGUAGE = process.env.ASSEMBLYAI_TRANSCRIBE_LANGUAGE || process.env.AAI_TRANSCRIBE_LANGUAGE || '';
const BOT_NAME = process.env.BOT_DISPLAY_NAME || 'Melanam Note Bot';
const AAI_AUDIO_SEND_MODE = (process.env.AAI_AUDIO_SEND_MODE || 'json').toLowerCase(); // json | binary

function buildAssemblyAiWsUrl() {
  const url = new URL(ASSEMBLYAI_WS_URL);
  url.searchParams.set('token', ASSEMBLYAI_API_KEY);
  url.searchParams.set('sample_rate', String(Number(process.env.ASSEMBLYAI_SAMPLE_RATE || 16000)));
  return url.toString();
}

function listDshowAudioDevices(ffmpegBin) {
  try {
    execFileSync(ffmpegBin, ['-hide_banner', '-list_devices', 'true', '-f', 'dshow', '-i', 'dummy'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return [];
  } catch (error) {
    const output = `${error.stdout || ''}\n${error.stderr || ''}`;
    const lines = output.split('\n');
    const audioDevices = [];

    for (const line of lines) {
      if (line.includes('(audio)')) {
        const match = line.match(/"(.+?)"\s+\(audio\)/);
        if (match) {
          audioDevices.push(match[1]);
        }
      }
    }

    if (audioDevices.length > 0) {
      return audioDevices;
    }

    console.log('[audio-stream] Could not enumerate dshow devices:', error.message);
    return [];
  }
}

function resolveFfmpegAudioDevice(platform) {
  if (platform === 'linux') {
    return process.env.BOT_PULSE_SOURCE || 'default';
  }

  if (platform === 'win32') {
    if (process.env.BOT_AUDIO_DEVICE) {
      return process.env.BOT_AUDIO_DEVICE;
    }

    const ffmpegBin = resolveFfmpegBinary();
    const devices = listDshowAudioDevices(ffmpegBin);
    
    if (devices.length > 0) {
      console.log('[audio-stream] Found dshow audio devices:', devices);
      return devices[0];
    }

    console.log('[audio-stream] Using default record device');
    return 'Microphone (FIIO JD10)';
  }

  if (platform === 'darwin') {
    return ':0';
  }

  return 'default';
}

function resolveFfmpegFormat(platform) {
  if (platform === 'linux') {
    return 'pulse';
  }
  if (platform === 'win32') {
    return 'dshow';
  }
  if (platform === 'darwin') {
    return 'avfoundation';
  }
  return 'pulse';  // fallback
}

function resolveFfmpegBinary() {
  if (process.env.BOT_FFMPEG_PATH) {
    return process.env.BOT_FFMPEG_PATH;
  }

  if (os.platform() === 'win32') {
    const localAppData = process.env.LOCALAPPDATA;
    if (localAppData) {
      const wingetPackages = path.join(localAppData, 'Microsoft', 'WinGet', 'Packages');
      if (fs.existsSync(wingetPackages)) {
        const stack = [wingetPackages];

        while (stack.length > 0) {
          const currentDir = stack.pop();
          const entries = fs.readdirSync(currentDir, { withFileTypes: true });

          for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name);
            if (entry.isDirectory()) {
              stack.push(fullPath);
              continue;
            }

            if (entry.isFile() && entry.name.toLowerCase() === 'ffmpeg.exe') {
              return fullPath;
            }
          }
        }
      }
    }
  }

  if (os.platform() === 'win32') {
    const localAppData = process.env.LOCALAPPDATA;
    if (localAppData) {
      const base = path.join(localAppData, 'ms-playwright');
      if (fs.existsSync(base)) {
        const entries = fs
          .readdirSync(base)
          .filter((name) => name.startsWith('ffmpeg-'))
          .sort()
          .reverse();

        for (const entry of entries) {
          const candidate = path.join(base, entry, 'ffmpeg-win64.exe');
          if (fs.existsSync(candidate)) {
            return candidate;
          }
        }
      }
    }
  }

  return 'ffmpeg';
}

function parseArgs() {
  const meetingId = process.argv[2];
  const meetingUrl = process.argv[3];
  const botNameArg = process.argv[4];

  if (!meetingId || !meetingUrl) {
    console.error('Usage: node src/bot/zoomBotAssemblyRunner.js <meetingId> <zoomMeetingUrl> [botName]');
    process.exit(1);
  }

  if (!ASSEMBLYAI_API_KEY) {
    console.error('ASSEMBLYAI_API_KEY (or AAI_API_KEY) is required.');
    process.exit(1);
  }

  return {
    meetingId,
    meetingUrl,
    botName: botNameArg || BOT_NAME,
    headless: process.env.HEADLESS === '1' || process.env.CI === 'true',
  };
}

function extractZoomMeetingId(url) {
  const match = url.match(/zoom\.us\/(?:j|wc\/join)\/(\d+)/i);
  return match ? match[1] : 'unknown';
}

function extractZoomPassword(url) {
  const match = url.match(/[?&]pwd=([^&]+)/);
  return match ? match[1] : '';
}

function extractZoomDomain(url) {
  const match = url.match(/https?:\/\/([^/]+)\//);
  return match ? match[1] : 'zoom.us';
}

function constructWebClientUrl(url) {
  const meetingId = extractZoomMeetingId(url);
  const password = extractZoomPassword(url);
  const domain = extractZoomDomain(url);
  let webUrl = `https://${domain}/wc/join/${meetingId}`;
  if (password) {
    webUrl += `?pwd=${password}`;
  }
  return webUrl;
}

function resolveJoinUrl(url) {
  if (/zoom\.us/i.test(url)) {
    return constructWebClientUrl(url);
  }

  return url;
}

function sanitizeForPath(value) {
  return String(value || 'meeting').replace(/[^a-z0-9_-]/gi, '_');
}

async function closeZoomAppDialog(page) {
  const selectors = [
    'button:has-text("Close this popover")',
    'button[aria-label="Close this popover"]',
    'button[title="Close this popover"]',
    'button:has-text("Close")',
  ];

  for (const selector of selectors) {
    try {
      const button = page.locator(selector).first();
      if (await button.isVisible({ timeout: 1500 })) {
        await button.click();
        await page.waitForTimeout(800);
        return;
      }
    } catch {
      // ignore and continue
    }
  }
}

async function clickJoinFromBrowser(page) {
  try {
    const button = page.locator('button:has-text("Join from browser")');
    if (await button.isVisible({ timeout: 4000 })) {
      await button.click();
      await page.waitForTimeout(2000);
    }
  } catch {
    // not present for many meeting types
  }
}

async function clickJoinWithoutAudio(page) {
  try {
    const button = page.locator('button:has-text("Join without audio")');
    if (await button.isVisible({ timeout: 4000 })) {
      await button.click({ force: true });
      await page.waitForTimeout(2000);
    }
  } catch {
    // not present in some flows
  }
}

async function fillName(page, botName) {
  const selectors = [
    'input[placeholder*="name"]',
    'input[placeholder*="Name"]',
    'input[placeholder*="Enter your name"]',
    'input[placeholder*="Your name"]',
    'input[aria-label*="name"]',
    'input[aria-label*="Name"]',
    'input[name="displayName"]',
    'input[name*="displayName"]',
    'input[type="text"]',
    'input[name*="name"]',
    'input[data-testid*="name"]',
    'input[data-testid*="display-name"]',
    '#input-for-name',
  ];

  for (const selector of selectors) {
    try {
      const input = page.locator(selector).first();
      if (await input.isVisible({ timeout: 1500 })) {
        await input.fill(botName);
        return;
      }
    } catch {
      // ignore and continue
    }
  }
}

async function clickJoin(page) {
  const selectors = [
    'button:has-text("Join meeting")',
    'button:has-text("Join now")',
    'button:has-text("Join")',
    'button[aria-label*="Join meeting"]',
    'button[aria-label*="Join now"]',
    'button[aria-label*="Join"]',
    'button:has-text("Ask to Join")',
    'button:has-text("Ask to join")',
  ];

  for (const selector of selectors) {
    try {
      const button = page.locator(selector).first();
      if (await button.isVisible({ timeout: 2000 })) {
        await button.click({ force: true });
        return;
      }
    } catch {
      // ignore and continue
    }
  }
}

async function waitUntilInsideMeeting(page) {
  for (let i = 0; i < 30; i += 1) {
    const status = await page.evaluate(() => {
      const text = document.body ? document.body.innerText : '';
      const hasJoinControls = text.includes('Join meeting') || text.includes('Join without audio') || text.includes('Enter your name');
      const hasMeetingControls =
        text.includes('Leave the meeting') ||
        text.includes('Invite people') ||
        text.includes('Open chat') ||
        text.includes('Open participants panel');
      return { hasMeetingControls, hasJoinControls };
    });

    if (status.hasMeetingControls && !status.hasJoinControls) {
      return true;
    }

    await page.waitForTimeout(2000);
  }

  return false;
}

async function joinZoomMeeting(page, meetingUrl, botName) {
  const webClientUrl = resolveJoinUrl(meetingUrl);
  const joinWithoutAudio = process.env.BOT_JOIN_WITHOUT_AUDIO === '1';
  console.log(`[bot] opening ${webClientUrl}`);

  await page.goto(webClientUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);

  await closeZoomAppDialog(page);

  const currentUrl = page.url();
  if (currentUrl.includes('zoom.us/login') || currentUrl.includes('/signin')) {
    throw new Error('ZOOM_LOGIN_REQUIRED');
  }

  await fillName(page, botName);
  console.log('[bot] filled bot display name');
  if (joinWithoutAudio) {
    await clickJoinWithoutAudio(page);
    console.log('[bot] selected join without audio if available');
  } else {
    console.log('[bot] joining with audio path enabled (BOT_JOIN_WITHOUT_AUDIO!=1)');
  }
  await page.waitForTimeout(1000);
  await clickJoin(page);
  console.log('[bot] clicked join button');

  // Jitsi often needs a short beat after the join click before audio can be captured.
  await page.waitForTimeout(7000);

  return true;
}

function ensureFfmpegCaptureSupport(ffmpegBin, platform) {
  let formats = '';
  try {
    formats = execFileSync(ffmpegBin, ['-hide_banner', '-formats'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (error) {
    throw new Error(`Unable to query ffmpeg formats from ${ffmpegBin}: ${error.message}`);
  }

  if (platform === 'win32') {
    const hasDshow = /\bdshow\b/i.test(formats);
    const hasWasapi = /\bwasapi\b/i.test(formats);
    if (!hasDshow && !hasWasapi) {
      throw new Error(
        'Your ffmpeg build does not support Windows audio capture devices (dshow/wasapi). Install full ffmpeg and set BOT_FFMPEG_PATH.'
      );
    }
  }

  if (platform === 'linux' && !/\bpulse\b/i.test(formats)) {
    throw new Error('Your ffmpeg build does not support PulseAudio capture. Install full ffmpeg with pulse input support.');
  }

  if (platform === 'darwin' && !/\bavfoundation\b/i.test(formats)) {
    throw new Error('Your ffmpeg build does not support AVFoundation capture. Install full ffmpeg with avfoundation input support.');
  }
}

function getBrowserCaptureResampleRate() {
  return Number(process.env.ASSEMBLYAI_SAMPLE_RATE || 16000);
}

function bufferToBase64(buffer) {
  return Buffer.from(buffer).toString('base64');
}

function sendAudioChunkToAssemblyAI(aaiWebSocket, chunk) {
  if (!chunk || aaiWebSocket.readyState !== WebSocketModule.OPEN) {
    return;
  }

  if (AAI_AUDIO_SEND_MODE === 'binary') {
    aaiWebSocket.send(chunk);
    return;
  }

  aaiWebSocket.send(JSON.stringify({
    type: 'audio',
    audio_data: bufferToBase64(chunk),
  }));
}

async function startBrowserAudioStream(page, aaiWebSocket) {
  const targetSampleRate = getBrowserCaptureResampleRate();
  let chunkCount = 0;
  let rmsAccumulator = 0;

  await page.exposeFunction('__botOnBrowserAudioChunk__', (payload) => {
    if (!payload || !payload.pcmBase64) {
      return;
    }

    if (aaiWebSocket.readyState !== WebSocketModule.OPEN) {
      return;
    }

    try {
      chunkCount += 1;
      rmsAccumulator += Number(payload.rms || 0);
      if (chunkCount % 200 === 0) {
        const avgRms = rmsAccumulator / 200;
        const rmsStatus = avgRms > 0.005 ? 'voice-like' : 'near-silence';
        console.log(`[audio-stream] browser chunks sent: ${chunkCount} avg_rms=${avgRms.toFixed(5)} (${rmsStatus})`);
        rmsAccumulator = 0;
      }
      const chunk = Buffer.from(payload.pcmBase64, 'base64');
      sendAudioChunkToAssemblyAI(aaiWebSocket, chunk);
    } catch (error) {
      console.error('[audio-stream] Failed to send browser audio to AssemblyAI:', error.message);
    }
  });

  const started = await page.evaluate(async (targetRate) => {
    if (window.__botBrowserAudioCaptureStarted) {
      return true;
    }

    const toBase64 = (bytes) => {
      let binary = '';
      const chunkSize = 0x8000;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
      }
      return btoa(binary);
    };

    const resample = (input, inputRate, outputRate) => {
      if (inputRate === outputRate) {
        return input;
      }

      const ratio = inputRate / outputRate;
      const outputLength = Math.max(1, Math.floor(input.length / ratio));
      const output = new Float32Array(outputLength);

      for (let i = 0; i < outputLength; i += 1) {
        const position = i * ratio;
        const left = Math.floor(position);
        const right = Math.min(left + 1, input.length - 1);
        const fraction = position - left;
        output[i] = input[left] + (input[right] - input[left]) * fraction;
      }

      return output;
    };

    const floatToPcm16 = (input) => {
      const bytes = new Uint8Array(input.length * 2);
      const view = new DataView(bytes.buffer);

      for (let i = 0; i < input.length; i += 1) {
        const sample = Math.max(-1, Math.min(1, input[i]));
        view.setInt16(i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      }

      return bytes;
    };

    const calculateRms = (input) => {
      if (!input.length) return 0;
      let sum = 0;
      for (let i = 0; i < input.length; i += 1) {
        sum += input[i] * input[i];
      }
      return Math.sqrt(sum / input.length);
    };

    const seen = new WeakSet();

    const attachToElement = (element) => {
      if (!element || seen.has(element)) {
        return false;
      }

      const capture = element.captureStream || element.mozCaptureStream;
      if (typeof capture !== 'function') {
        return false;
      }

      const stream = capture.call(element);
      if (!stream || stream.getAudioTracks().length === 0) {
        return false;
      }

      const context = new AudioContext();
      const source = context.createMediaStreamSource(stream);
      const processor = context.createScriptProcessor(4096, 1, 1);
      const sink = context.createGain();

      sink.gain.value = 0;
      source.connect(processor);
      processor.connect(sink);
      sink.connect(context.destination);

      processor.onaudioprocess = (event) => {
        const input = event.inputBuffer.getChannelData(0);
        const rms = calculateRms(input);
        const downsampled = resample(input, context.sampleRate, targetRate);
        const pcmBytes = floatToPcm16(downsampled);

        if (typeof window.__botOnBrowserAudioChunk__ === 'function') {
          window.__botOnBrowserAudioChunk__({
            pcmBase64: toBase64(pcmBytes),
            sampleRate: targetRate,
            rms,
          });
        }
      };

      element.__botBrowserAudioCapture = { context, source, processor, sink, stream };
      seen.add(element);
      return true;
    };

    const scanForAudio = () => {
      const candidates = Array.from(document.querySelectorAll('audio,video'));
      for (const element of candidates) {
        if (attachToElement(element)) {
          return true;
        }
      }

      return false;
    };

    const observer = new MutationObserver(() => {
      if (!window.__botBrowserAudioCaptureAttached) {
        window.__botBrowserAudioCaptureAttached = scanForAudio();
      }
    });

    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    }

    const intervalId = setInterval(() => {
      if (!window.__botBrowserAudioCaptureAttached) {
        window.__botBrowserAudioCaptureAttached = scanForAudio();
      }
    }, 2000);

    window.__botBrowserAudioCaptureStarted = true;
    window.__botBrowserAudioCaptureObserver = observer;
    window.__botBrowserAudioCaptureIntervalId = intervalId;
    window.__botBrowserAudioCaptureAttached = scanForAudio();
    return true;
  }, targetSampleRate);

  if (!started) {
    throw new Error('BROWSER_AUDIO_CAPTURE_FAILED');
  }

  console.log(`[audio-stream] browser audio capture armed at ${targetSampleRate} Hz`);

  return {
    async stop() {
      try {
        await page.evaluate(() => {
          if (window.__botBrowserAudioCaptureObserver) {
            window.__botBrowserAudioCaptureObserver.disconnect();
            window.__botBrowserAudioCaptureObserver = null;
          }

          if (window.__botBrowserAudioCaptureIntervalId) {
            clearInterval(window.__botBrowserAudioCaptureIntervalId);
            window.__botBrowserAudioCaptureIntervalId = null;
          }

          const tracked = Array.from(document.querySelectorAll('audio,video'));
          for (const element of tracked) {
            const captureState = element.__botBrowserAudioCapture;
            if (!captureState) {
              continue;
            }

            try {
              captureState.processor.disconnect();
              captureState.source.disconnect();
              captureState.sink.disconnect();
              captureState.context.close();
            } catch {
              // ignore
            }

            element.__botBrowserAudioCapture = null;
          }

          window.__botBrowserAudioCaptureStarted = false;
          window.__botBrowserAudioCaptureAttached = false;
        });
      } catch {
        // ignore
      }
    },
  };
}

function startRealtimeAudioStream(aaiWebSocket) {
  const platform = os.platform();
  const format = resolveFfmpegFormat(platform);
  let device = resolveFfmpegAudioDevice(platform);

  // Format device string based on input format
  if (format === 'dshow') {
    // dshow requires: audio="DeviceName" format
    device = `audio="${device}"`;
  } else if (format === 'avfoundation') {
    // avfoundation may need special formatting for device selection
    // ':0' is default, or pass device UID if needed
  }

  let args;

  // FFmpeg outputs raw PCM (s16le) at 16kHz mono
  if (format === 'pulse' || format === 'dshow' || format === 'avfoundation') {
    args = [
      '-hide_banner',
      '-loglevel', 'error',
      '-f', format,
      '-i', device,
      '-ac', '1',
      '-ar', '16000',
      '-f', 's16le',
      '-',  // stdout
    ];
  } else {
    args = [
      '-hide_banner',
      '-loglevel', 'error',
      '-f', 'pulse',
      '-i', 'default',
      '-ac', '1',
      '-ar', '16000',
      '-f', 's16le',
      '-',  // stdout
    ];
  }

  const ffmpegBin = resolveFfmpegBinary();
  ensureFfmpegCaptureSupport(ffmpegBin, platform);
  console.log(`[audio-stream] starting ffmpeg (${platform}) format=${format} device=${device}`);
  console.log(`[audio-stream] using ${ffmpegBin}`);
  
  const ffmpeg = spawn(ffmpegBin, args, { stdio: ['pipe', 'pipe', 'pipe'] });

  ffmpeg.stderr.on('data', (chunk) => {
    const line = chunk.toString().trim();
    if (line) {
      console.error(`[ffmpeg] ${line}`);
    }
  });

  ffmpeg.on('exit', (code) => {
    console.log(`[audio-stream] ffmpeg exited with code ${code}`);
  });

  // Stream stdout PCM to AssemblyAI WebSocket
  if (ffmpeg.stdout) {
    ffmpeg.stdout.on('data', (chunk) => {
      if (aaiWebSocket.readyState === WebSocketModule.OPEN) {
        try {
          sendAudioChunkToAssemblyAI(aaiWebSocket, chunk);
        } catch (err) {
          console.error('[audio-stream] Failed to send audio to AssemblyAI:', err.message);
        }
      }
    });
  }

  return ffmpeg;
}

async function postCaption(meetingId, text, speaker = 'Meeting Bot', final = true) {
  const payload = {
    text,
    speaker,
    final: final,
    timestamp: Date.now(),
  };

  const response = await fetch(`${CAPTION_BACKEND_URL}/api/rooms/${encodeURIComponent(meetingId)}/captions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Caption publish failed: ${response.status} ${body}`);
  }
}

function createRealtimeTranscriptHandler(meetingId) {
  let speakerMap = {};
  
  return {
    handleTranscript(transcript) {
      const messageType = transcript.message_type || transcript.type || '';
      const text = transcript.text || transcript.transcript || transcript.message || '';
      const userId = transcript.user_id || transcript.speaker || transcript.speaker_id || 'Unknown Speaker';
      
      if (!text) return;
      
      const speaker = speakerMap[userId] || userId || 'Unknown Speaker';
      const isFinal = /final/i.test(String(messageType));
      
      // Update speaker tracking
      if (!speakerMap[userId]) {
        speakerMap[userId] = speaker;
      }
      
      console.log(`[aai] ${isFinal ? 'FINAL' : 'PARTIAL'}: ${speaker}: ${text.slice(0, 80)}`);
      
      // Publish caption
      postCaption(meetingId, String(text), speaker, isFinal).catch(err => {
        console.error('[aai] Failed to publish caption:', err.message);
      });
    }
  };
}


(async () => {
  const config = parseArgs();

  console.log('[bot] starting meeting + realtime transcription pipeline');
  console.log(`[bot] meetingId=${config.meetingId}`);
  console.log(`[bot] captionBackend=${CAPTION_BACKEND_URL}`);

  let browser;
  let recorder;
  let browserCapture;
  let page;
  let monitorInterval;
  let shuttingDown = false;
  let aaiWebSocket;
  let transcriptHandler;

  const shutdown = async (reason) => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;

    console.log(`[bot] shutdown: ${reason}`);

    if (monitorInterval) {
      clearInterval(monitorInterval);
      monitorInterval = null;
    }

    if (aaiWebSocket) {
      try {
        aaiWebSocket.close();
      } catch {
        // ignore
      }
      aaiWebSocket = null;
    }

    if (recorder && !recorder.killed) {
      try {
        recorder.stdin.write('q\n');
      } catch {
        // ignore
      }
      await new Promise((resolve) => setTimeout(resolve, 1500));
      if (!recorder.killed) {
        recorder.kill('SIGKILL');
      }
    }

    if (browserCapture) {
      try {
        await browserCapture.stop();
      } catch {
        // ignore
      }
      browserCapture = null;
    }

    if (browser) {
      try {
        await browser.close();
      } catch {
        // ignore
      }
    }

    process.exit(0);
  };

  process.on('SIGINT', () => {
    shutdown('SIGINT');
  });
  process.on('SIGTERM', () => {
    shutdown('SIGTERM');
  });

  try {
    // Connect to AssemblyAI realtime WebSocket
    const assemblyAiUrl = buildAssemblyAiWsUrl();
    console.log(`[bot] connecting to AssemblyAI at ${assemblyAiUrl.replace(/token=[^&]+/, 'token=***')}`);
    aaiWebSocket = new WebSocketModule(assemblyAiUrl);
    transcriptHandler = createRealtimeTranscriptHandler(config.meetingId);

    aaiWebSocket.addEventListener('open', () => {
      console.log('[aai] ✅ Connected to AssemblyAI realtime WebSocket');
    });

    aaiWebSocket.addEventListener('message', (event) => {
      try {
        const message = JSON.parse(event.data);
        const messageType = message.message_type || message.type || '';
        
        if (/session.?begins?/i.test(String(messageType)) || /^begin$/i.test(String(messageType))) {
          console.log('[aai] Session started');
          console.log(`[aai] session begin payload keys: ${Object.keys(message).join(', ')}`);
          return;
        }

        if (/session.?terminated?/i.test(String(messageType))) {
          console.log('[aai] Session terminated');
          return;
        }

        if (/transcript/i.test(String(messageType)) || message.text || message.transcript) {
          transcriptHandler.handleTranscript(message);
          return;
        }

        if (message.error) {
          console.error('[aai] Error:', message.error);
          return;
        }

        if (messageType) {
          console.log(`[aai] message type: ${messageType}`);
        }
      } catch (err) {
        console.error('[aai] Failed to parse message:', err.message);
      }
    });

    aaiWebSocket.addEventListener('error', (err) => {
      console.error('[aai] WebSocket error:', err);
    });

    aaiWebSocket.addEventListener('close', () => {
      console.log('[aai] WebSocket closed');
      if (!shuttingDown) {
        console.log('[aai] AssemblyAI WebSocket unexpectedly closed, shutting down');
        shutdown('aai-websocket-closed');
      }
    });

    // Wait for AAI connection
    await new Promise((resolve) => {
      const checkConnection = setInterval(() => {
        if (aaiWebSocket.readyState === WebSocketModule.OPEN) {
          clearInterval(checkConnection);
          resolve();
        }
      }, 100);
      setTimeout(() => {
        clearInterval(checkConnection);
        resolve();
      }, 5000);
    });

    browser = await chromium.launch({
      headless: config.headless,
      args: [
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
        '--autoplay-policy=no-user-gesture-required',
      ],
    });

    const context = await browser.newContext({ permissions: ['microphone', 'camera'] });
    page = await context.newPage();

    const joined = await joinZoomMeeting(page, config.meetingUrl, config.botName);
    if (joined) {
      console.log('[bot] joined meeting successfully');
    } else {
      console.warn('[bot] join state not confirmed, continuing to monitor audio');
    }

    // Prefer browser-captured meeting audio on Windows because loopback devices are often unavailable.
    if (os.platform() === 'win32') {
      try {
        console.log('[bot] starting browser audio capture to AssemblyAI');
        browserCapture = await startBrowserAudioStream(page, aaiWebSocket);
      } catch (error) {
        console.warn(`[bot] browser audio capture failed, falling back to ffmpeg: ${error.message}`);
        console.log('[bot] starting audio streaming to AssemblyAI');
        recorder = startRealtimeAudioStream(aaiWebSocket);
      }
    } else {
      console.log('[bot] starting audio streaming to AssemblyAI');
      recorder = startRealtimeAudioStream(aaiWebSocket);
    }

    monitorInterval = setInterval(async () => {
      try {
        if (page.isClosed()) {
          console.log('[bot] page closed, stopping bot');
          await shutdown('page-closed');
        }
      } catch {
        await shutdown('page-unavailable');
      }
    }, 15000);

    await new Promise(() => {});
  } catch (error) {
    console.error('[bot] fatal error:', error.message);
    await shutdown('fatal-error');
  }
})();

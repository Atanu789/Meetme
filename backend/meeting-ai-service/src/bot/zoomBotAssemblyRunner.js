'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, execFileSync } = require('child_process');
const { chromium } = require('playwright');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '../../.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const CHUNK_SECONDS = Number(process.env.BOT_CHUNK_SECONDS || 4);
const CHUNK_SCAN_MS = Number(process.env.BOT_CHUNK_SCAN_MS || 2000);
const CAPTION_BACKEND_URL = (process.env.CAPTION_BACKEND_URL || `http://localhost:${process.env.MEETING_AI_PORT || 4010}`).replace(/\/$/, '');
const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY || process.env.AAI_API_KEY || '';
const ASSEMBLYAI_TRANSCRIBE_LANGUAGE = process.env.ASSEMBLYAI_TRANSCRIBE_LANGUAGE || process.env.AAI_TRANSCRIBE_LANGUAGE || '';
const BOT_NAME = process.env.BOT_DISPLAY_NAME || 'Melanam Note Bot';
const DATA_DIR = path.join(process.cwd(), 'data', 'audio');

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
  await clickJoinWithoutAudio(page);
  console.log('[bot] selected join without audio if available');
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

function startSegmentRecorder(recordingDir) {
  fs.mkdirSync(recordingDir, { recursive: true });
  const outputPattern = path.join(recordingDir, 'chunk_%03d.mp3');

  let args;
  const platform = os.platform();

  if (platform === 'linux') {
    const pulseSource = process.env.BOT_PULSE_SOURCE || 'default';
    args = [
      '-hide_banner',
      '-loglevel',
      'error',
      '-f',
      'pulse',
      '-i',
      pulseSource,
      '-ac',
      '1',
      '-ar',
      '16000',
      '-c:a',
      'libmp3lame',
      '-b:a',
      '64k',
      '-f',
      'segment',
      '-segment_time',
      String(CHUNK_SECONDS),
      '-reset_timestamps',
      '1',
      outputPattern,
    ];
  } else if (platform === 'win32') {
    args = [
      '-hide_banner',
      '-loglevel',
      'error',
      '-f',
      'wasapi',
      '-i',
      'default',
      '-ac',
      '1',
      '-ar',
      '16000',
      '-c:a',
      'libmp3lame',
      '-b:a',
      '64k',
      '-f',
      'segment',
      '-segment_time',
      String(CHUNK_SECONDS),
      '-reset_timestamps',
      '1',
      outputPattern,
    ];
  } else {
    args = [
      '-hide_banner',
      '-loglevel',
      'error',
      '-f',
      'avfoundation',
      '-i',
      ':0',
      '-ac',
      '1',
      '-ar',
      '16000',
      '-c:a',
      'libmp3lame',
      '-b:a',
      '64k',
      '-f',
      'segment',
      '-segment_time',
      String(CHUNK_SECONDS),
      '-reset_timestamps',
      '1',
      outputPattern,
    ];
  }

  const ffmpegBin = resolveFfmpegBinary();
  ensureFfmpegCaptureSupport(ffmpegBin, platform);
  console.log(`[bot] starting ffmpeg (${platform}) using ${ffmpegBin}`);
  const ffmpeg = spawn(ffmpegBin, args, { stdio: ['pipe', 'ignore', 'pipe'] });

  ffmpeg.stderr.on('data', (chunk) => {
    const line = chunk.toString().trim();
    if (line) {
      console.error(`[ffmpeg] ${line}`);
    }
  });

  ffmpeg.on('exit', (code) => {
    console.log(`[bot] ffmpeg exited with code ${code}`);
  });

  return ffmpeg;
}

async function uploadToAssemblyAI(filePath) {
  const stream = fs.createReadStream(filePath);

  const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
    method: 'POST',
    headers: {
      authorization: ASSEMBLYAI_API_KEY,
      'content-type': 'application/octet-stream',
    },
    body: stream,
  });

  if (!uploadResponse.ok) {
    const text = await uploadResponse.text();
    throw new Error(`AssemblyAI upload failed: ${uploadResponse.status} ${text}`);
  }

  const uploadJson = await uploadResponse.json();
  return uploadJson.upload_url;
}

async function uploadBufferToAssemblyAI(buffer) {
  const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
    method: 'POST',
    headers: {
      authorization: ASSEMBLYAI_API_KEY,
      'content-type': 'application/octet-stream',
    },
    body: buffer,
  });

  if (!uploadResponse.ok) {
    const text = await uploadResponse.text();
    throw new Error(`AssemblyAI upload failed: ${uploadResponse.status} ${text}`);
  }

  const uploadJson = await uploadResponse.json();
  return uploadJson.upload_url;
}

async function transcribeAudioBuffer(buffer) {
  const audioUrl = await uploadBufferToAssemblyAI(buffer);

  const createResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
    method: 'POST',
    headers: {
      authorization: ASSEMBLYAI_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      audio_url: audioUrl,
      speech_models: ['universal-3-pro', 'universal-2'],
      // If a specific language is configured, disable auto language detection
      // and force the language code (e.g. 'en' or 'en_us'). Otherwise keep
      // language_detection enabled to autodetect language.
      ...(ASSEMBLYAI_TRANSCRIBE_LANGUAGE
        ? { language_detection: false, language_code: ASSEMBLYAI_TRANSCRIBE_LANGUAGE }
        : { language_detection: true }),
      speaker_labels: true,
      punctuate: true,
      format_text: true,
    }),
  });

  if (!createResponse.ok) {
    const text = await createResponse.text();
    throw new Error(`AssemblyAI transcript create failed: ${createResponse.status} ${text}`);
  }

  const created = await createResponse.json();
  const transcriptId = created.id;

  const startedAt = Date.now();
  while (Date.now() - startedAt < 180000) {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const pollResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
      headers: { authorization: ASSEMBLYAI_API_KEY },
    });

    if (!pollResponse.ok) {
      const text = await pollResponse.text();
      throw new Error(`AssemblyAI poll failed: ${pollResponse.status} ${text}`);
    }

    const status = await pollResponse.json();
    if (status.status === 'completed') {
      return status;
    }

    if (status.status === 'error') {
      throw new Error(`AssemblyAI transcription failed: ${status.error || 'unknown error'}`);
    }
  }

  throw new Error('AssemblyAI transcription timed out');
}

async function transcribeChunk(filePath) {
  const buffer = fs.readFileSync(filePath);
  return transcribeAudioBuffer(buffer);
}

function normalizeSpeakerLabel(speaker) {
  if (speaker === null || speaker === undefined || speaker === '') {
    return 'Meeting Bot';
  }

  return `Speaker ${String(speaker)}`;
}

function extractCaptionSegments(transcript) {
  const utterances = Array.isArray(transcript?.utterances) ? transcript.utterances : [];

  if (utterances.length > 0) {
    return utterances
      .map((utterance) => ({
        text: String(utterance?.text || '').trim(),
        speaker: normalizeSpeakerLabel(utterance?.speaker),
      }))
      .filter((segment) => segment.text.length > 0);
  }

  const text = String(transcript?.text || '').trim();
  if (!text) {
    return [];
  }

  return [{ text, speaker: 'Meeting Bot' }];
}

async function publishTranscript(meetingId, transcript) {
  const segments = extractCaptionSegments(transcript);

  // Publish each segment as a separate caption update for real-time streaming
  for (const segment of segments) {
    // Mark as final=true since AssemblyAI gave us the completed transcript
    await postCaption(meetingId, segment.text, segment.speaker, true);
    console.log(`[bot] caption published (${segment.speaker}): ${segment.text.slice(0, 80)}`);
  }
}

async function startBrowserAudioCapture(page, meetingId) {
  const queue = [];
  let running = false;

  const processChunk = async (base64Audio) => {
    if (!base64Audio) {
      return;
    }

    queue.push(base64Audio);

    if (running) {
      return;
    }

    running = true;

    try {
      while (queue.length > 0) {
        const chunk = queue.shift();
        if (!chunk) {
          continue;
        }

        const buffer = Buffer.from(chunk, 'base64');
        if (buffer.length < 1000) {
          continue;
        }

        console.log(`[bot] transcribing browser audio chunk (${buffer.length} bytes)`);
        const transcript = await transcribeAudioBuffer(buffer);
        await publishTranscript(meetingId, transcript);
      }
    } finally {
      running = false;
    }
  };

  await page.exposeFunction('__botAudioChunk__', processChunk);

  const started = await page.evaluate(async () => {
    if (window.__botRecorderStarted) {
      return true;
    }

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    for (let attempt = 0; attempt < 20; attempt += 1) {
      const elements = Array.from(document.querySelectorAll('audio, video'));
      const stream = new MediaStream();

      for (const element of elements) {
        if (typeof element.captureStream !== 'function') {
          continue;
        }

        try {
          const captured = element.captureStream();
          for (const track of captured.getAudioTracks()) {
            stream.addTrack(track);
          }
        } catch {
          // Ignore elements that cannot be captured.
        }
      }

      if (stream.getAudioTracks().length > 0) {
        const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
        recorder.addEventListener('dataavailable', (event) => {
          if (!event.data || event.data.size === 0) {
            return;
          }

          const reader = new FileReader();
          reader.onloadend = () => {
            const result = String(reader.result || '');
            const base64 = result.includes(',') ? result.split(',')[1] : '';
            if (base64 && typeof window.__botAudioChunk__ === 'function') {
              window.__botAudioChunk__(base64);
            }
          };
          reader.readAsDataURL(event.data);
        });

        // 2-second chunks for more real-time captions (like Zoom/Meet)
        recorder.start(2000);
        window.__botRecorder = recorder;
        window.__botRecorderStarted = true;
        return true;
      }

      await sleep(2000);
    }

    return false;
  });

  if (!started) {
    throw new Error('BROWSER_AUDIO_CAPTURE_FAILED');
  }

  console.log('[bot] browser audio capture started');

  return {
    async stop() {
      try {
        await page.evaluate(() => {
          if (window.__botRecorder && window.__botRecorder.state !== 'inactive') {
            window.__botRecorder.stop();
          }
          window.__botRecorder = null;
          window.__botRecorderStarted = false;
        });
      } catch {
        // ignore
      }
    },
  };
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

function createChunkWatcher(recordingDir, meetingId) {
  const processed = new Set();
  let running = false;

  const run = async () => {
    if (running) {
      return;
    }

    running = true;

    try {
      if (!fs.existsSync(recordingDir)) {
        return;
      }

      const files = fs
        .readdirSync(recordingDir)
        .filter((name) => /^chunk_\d+\.mp3$/i.test(name))
        .map((name) => ({
          name,
          fullPath: path.join(recordingDir, name),
          mtimeMs: fs.statSync(path.join(recordingDir, name)).mtimeMs,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      for (const file of files) {
        if (processed.has(file.name)) {
          continue;
        }

        if (Date.now() - file.mtimeMs < 8000) {
          continue;
        }

        processed.add(file.name);
        console.log(`[pipeline] transcribing ${file.name}`);

        try {
          const transcript = await transcribeChunk(file.fullPath);
          const segments = extractCaptionSegments(transcript);
          if (segments.length > 0) {
            for (const segment of segments) {
              await postCaption(meetingId, segment.text, segment.speaker);
              console.log(`[pipeline] caption published from ${file.name} (${segment.speaker})`);
            }
          } else {
            console.log(`[pipeline] empty transcript for ${file.name}`);
          }
        } catch (error) {
          console.error(`[pipeline] failed for ${file.name}:`, error.message);
        }
      }
    } finally {
      running = false;
    }
  };

  const interval = setInterval(run, CHUNK_SCAN_MS);
  return {
    stop() {
      clearInterval(interval);
    },
  };
}


(async () => {
  const config = parseArgs();
  const recordingDir = path.join(DATA_DIR, sanitizeForPath(config.meetingId));

  console.log('[bot] starting meeting + assembly pipeline');
  console.log(`[bot] meetingId=${config.meetingId}`);
  console.log(`[bot] recordingDir=${recordingDir}`);
  console.log(`[bot] captionBackend=${CAPTION_BACKEND_URL}`);

  let browser;
  let recorder;
  let watcher;
  let page;
  let monitorInterval;
  let browserCapture;
  let shuttingDown = false;

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

    if (watcher) {
      watcher.stop();
      watcher = null;
    }

    if (browserCapture) {
      try {
        await browserCapture.stop();
      } catch {
        // ignore
      }
      browserCapture = null;
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
    browser = await chromium.launch({
      headless: config.headless,
      args: [
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
        '--autoplay-policy=no-user-gesture-required',
      ],
    });

    const context = await browser.newContext({ permissions: [] });
    page = await context.newPage();

    const joined = await joinZoomMeeting(page, config.meetingUrl, config.botName);
    if (joined) {
      console.log('[bot] joined meeting successfully');
    } else {
      console.warn('[bot] join state not confirmed, continuing to monitor audio');
    }

    try {
      browserCapture = await startBrowserAudioCapture(page, config.meetingId);
    } catch (error) {
      console.error('[bot] browser audio capture failed, falling back to ffmpeg:', error.message);
      recorder = startSegmentRecorder(recordingDir);
      watcher = createChunkWatcher(recordingDir, config.meetingId);
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

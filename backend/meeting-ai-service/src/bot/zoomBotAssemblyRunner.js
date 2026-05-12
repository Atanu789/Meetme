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
    const audioDevices = [];
    const seen = new Set();

    for (const match of output.matchAll(/"([^"]+)"\s+\(audio\)/g)) {
      const device = match[1];
      if (!seen.has(device)) {
        seen.add(device);
        audioDevices.push(device);
      }
    }

    for (const match of output.matchAll(/Alternative name "([^"]+)"/g)) {
      const device = match[1];
      if (!seen.has(device)) {
        seen.add(device);
        audioDevices.push(device);
      }
    }

    if (audioDevices.length > 0) {
      return audioDevices;
    }

    console.log('[audio-stream] Could not enumerate dshow devices:', error.message);
    return [];
  }
}

function normalizeDeviceName(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function getWindowsDshowCandidates(ffmpegBin, preferredDevice) {
  const discovered = listDshowAudioDevices(ffmpegBin);
  const preferred = String(preferredDevice || '').trim();
  const candidates = [];

  if (preferred) {
    candidates.push(preferred);
  }

  const preferredNorm = normalizeDeviceName(preferred);
  if (preferredNorm && discovered.length > 0) {
    const match = discovered.find((device) => {
      const normalized = normalizeDeviceName(device);
      return normalized.includes(preferredNorm) || preferredNorm.includes(normalized);
    });

    if (match && !candidates.includes(match)) {
      candidates.push(match);
    }
  }

  for (const device of discovered) {
    if (!candidates.includes(device)) {
      candidates.push(device);
    }
  }

  return candidates;
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
    // Try WASAPI first (more reliable), fall back to dshow
    return process.env.BOT_USE_DSHOW === '1' ? 'dshow' : 'wasapi';
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
  for (let i = 0; i < 60; i += 1) {
    const status = await page.evaluate(() => {
      const text = document.body ? document.body.innerText : '';
      const hasJoinControls = text.includes('Join meeting') || text.includes('Join without audio') || text.includes('Enter your name');
      const hasMeetingControls =
        text.includes('Leave the meeting') ||
        text.includes('Leave meeting') ||
        text.includes('Invite people') ||
        text.includes('Open chat') ||
        text.includes('Open participants panel') ||
        text.includes('Leave') ||
        text.includes('Mute') ||
        text.includes('Unmute');
      return { hasMeetingControls, hasJoinControls };
    });

    if (status.hasMeetingControls && !status.hasJoinControls) {
      console.log('[bot] ✅ confirmed inside meeting after', i * 2, 'seconds');
      return true;
    }

    await page.waitForTimeout(2000);
  }

  console.warn('[bot] ⚠️ could not confirm meeting state after 120 seconds, but continuing...');
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

  // Wait to confirm we're actually in the meeting
  const confirmed = await waitUntilInsideMeeting(page);
  if (!confirmed) {
    console.warn('[bot] ⚠️ Meeting join not confirmed, but continuing with audio capture...');
  }

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

function bufferToBase64(buffer) {
  return Buffer.from(buffer).toString('base64');
}

function calculateRmsFromBuffer(buffer) {
  // buffer should be s16le (2 bytes per sample, little-endian)
  if (buffer.length < 2) return 0;
  
  let sum = 0;
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const samples = buffer.length / 2;
  
  for (let i = 0; i < samples; i++) {
    const sample = view.getInt16(i * 2, true) / 32768; // normalize to -1..1
    sum += sample * sample;
  }
  
  return Math.sqrt(sum / samples);
}

function isAudioSilent(rms) {
  // RMS < 0.001 is near-silence; > 0.01 is likely speech
  return rms < 0.001;
}

async function validateAudioFile(filePath) {
  const stats = fs.statSync(filePath);
  const fileSize = stats.size;
  
  // Read entire file as buffer
  const buffer = fs.readFileSync(filePath);
  
  // PCM s16le: 16kHz, 1 channel, 16-bit = 32000 bytes per second
  // For 10 seconds: ~320KB (some WAV header overhead, ~44 bytes)
  const expectedMinSize = 16000 * 2 * 10 - 100; // conservative minimum
  const expectedMaxSize = 16000 * 2 * 10 + 500; // with WAV header + margin
  
  const rms = calculateRmsFromBuffer(buffer.slice(-Math.min(160000, buffer.length))); // last 5 seconds of audio data
  const isSilent = isAudioSilent(rms);
  
  // Estimate duration (rough, doesn't account for WAV header perfectly)
  // WAV header is typically 44 bytes for simple mono PCM
  const audioDataSize = Math.max(0, buffer.length - 100);
  const estimatedDurationSeconds = audioDataSize / (16000 * 2);
  
  return {
    fileSize,
    rms,
    isSilent,
    estimatedDurationSeconds,
    isValid: !isSilent && estimatedDurationSeconds >= 9, // at least 9 seconds of actual audio
  };
}

function recordAudioToFile(filePath, recordDurationSeconds = 10) {
  const platform = os.platform();
  const customDevice = process.env.BOT_AUDIO_DEVICE;

  if (platform === 'win32') {
    const ffmpegBin = resolveFfmpegBinary();
    const candidates = getWindowsDshowCandidates(ffmpegBin, customDevice || 'Stereo Mix');

    if (candidates.length === 0) {
      throw new Error('No Windows dshow audio devices found. Set BOT_AUDIO_DEVICE or enable a recording device.');
    }

    console.log('[audio-record] Windows dshow candidate list:', candidates);
    return recordAudioWithWindowsDshow(ffmpegBin, filePath, recordDurationSeconds, candidates);
  } else if (platform === 'linux') {
    // Linux: PulseAudio - capture loopback (monitor)
    const pulseDevice = customDevice || 'alsa_output.pci-0000_00_1f.3.analog-stereo.monitor';
    ffmpegCmd = [
      '-hide_banner',
      '-loglevel', 'warning',
      '-f', 'pulse',
      '-i', pulseDevice,
      '-ac', '1',
      '-ar', '16000',
      '-t', String(recordDurationSeconds),
      '-y',
      filePath,
    ];
    console.log(`[audio-record] Linux PulseAudio: using device "${pulseDevice}"`);
  } else if (platform === 'darwin') {
    // macOS: AVFoundation - :1 is typically Soundflower or loopback
    const avfDevice = customDevice || ':1';
    ffmpegCmd = [
      '-hide_banner',
      '-loglevel', 'warning',
      '-f', 'avfoundation',
      '-i', avfDevice,
      '-ac', '1',
      '-ar', '16000',
      '-t', String(recordDurationSeconds),
      '-y',
      filePath,
    ];
    console.log(`[audio-record] macOS AVFoundation: using device "${avfDevice}"`);
  }

  const ffmpegBin = resolveFfmpegBinary();
  
  console.log(`[audio-record] starting ffmpeg`);
  console.log(`[audio-record] recording to: ${filePath}`);
  console.log(`[audio-record] duration: ${recordDurationSeconds} seconds`);
  console.log(`[audio-record] ffmpeg binary: ${ffmpegBin}`);

  return new Promise((resolve, reject) => {
    const ffmpeg = spawn(ffmpegBin, ffmpegCmd, { 
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: false
    });

    let errorOutput = '';
    let outputData = '';
    
    ffmpeg.stderr.on('data', (chunk) => {
      const line = chunk.toString();
      errorOutput += line;
      // Log ffmpeg progress
      if (line.includes('frame=') || line.includes('Duration')) {
        console.log(`[ffmpeg] ${line.trim()}`);
      }
    });

    ffmpeg.stdout.on('data', (chunk) => {
      outputData += chunk.toString();
    });

    ffmpeg.on('exit', (code, signal) => {
      console.log(`[audio-record] ffmpeg exited: code=${code}, signal=${signal}`);
      
      // Check if file was created
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        console.log(`[audio-record] ✅ File created: ${sizeKB} KB`);
        resolve();
      } else {
        console.log(`[audio-record] ❌ No file created at ${filePath}`);
        
        // On Windows, if Stereo Mix failed, suggest checking settings
        if (os.platform() === 'win32' && errorOutput.includes('Stereo Mix')) {
          console.error(`[audio-record] ⚠️  Stereo Mix not found or disabled`);
          console.error(`[audio-record] To enable audio capture on Windows:`);
          console.error(`[audio-record]   1. Right-click volume icon → Sound settings`);
          console.error(`[audio-record]   2. Advanced → App volume and device preferences`);
          console.error(`[audio-record]   3. Find ffmpeg → Choose output → Stereo Mix`);
          console.error(`[audio-record] OR`);
          console.error(`[audio-record]   Set env var: BOT_AUDIO_DEVICE="Microphone"`);
        }
        
        if (code !== 0) {
          console.error(`[audio-record] ffmpeg error:\n${errorOutput.slice(0, 500)}`);
          reject(new Error(`ffmpeg failed with code ${code}`));
        } else {
          reject(new Error('ffmpeg exited but did not create output file'));
        }
      }
    });

    ffmpeg.on('error', (err) => {
      console.error(`[audio-record] ❌ ffmpeg error: ${err.message}`);
      reject(err);
    });

    // Force kill after timeout
    const killTimeout = setTimeout(() => {
      if (!ffmpeg.killed) {
        console.log(`[audio-record] timeout reached, terminating ffmpeg`);
        ffmpeg.kill('SIGTERM');
        setTimeout(() => {
          if (!ffmpeg.killed) {
            ffmpeg.kill('SIGKILL');
          }
        }, 2000);
      }
    }, (recordDurationSeconds + 5) * 1000);

    ffmpeg.on('exit', () => {
      clearTimeout(killTimeout);
    });
  });
}

function recordAudioWithWindowsDshow(ffmpegBin, filePath, recordDurationSeconds, candidates) {
  const tryCandidate = (deviceName) => new Promise((resolve, reject) => {
    const ffmpegCmd = [
      '-hide_banner',
      '-loglevel', 'warning',
      '-f', 'dshow',
      '-i', `audio="${deviceName}"`,
      '-ac', '1',
      '-ar', '16000',
      '-t', String(recordDurationSeconds),
      '-y',
      filePath,
    ];

    console.log(`[audio-record] trying Windows dshow device "${deviceName}"`);
    const ffmpeg = spawn(ffmpegBin, ffmpegCmd, { stdio: ['pipe', 'pipe', 'pipe'], shell: false });
    let errorOutput = '';

    ffmpeg.stderr.on('data', (chunk) => {
      errorOutput += chunk.toString();
    });

    ffmpeg.on('exit', (code, signal) => {
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        console.log(`[audio-record] ✅ File created with "${deviceName}": ${(stats.size / 1024).toFixed(2)} KB`);
        resolve({ deviceName, code, signal });
        return;
      }

      const cleanError = errorOutput.trim();
      console.log(`[audio-record] device "${deviceName}" failed: code=${code}, signal=${signal}`);
      if (cleanError) {
        console.log(`[audio-record] ffmpeg stderr for "${deviceName}":\n${cleanError.slice(0, 500)}`);
      }
      reject(new Error(cleanError || `ffmpeg failed for device ${deviceName} with code ${code}`));
    });

    ffmpeg.on('error', reject);
  });

  return candidates.reduce((chain, deviceName, index) => chain.then(async () => {
    if (index > 0 && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    try {
      await tryCandidate(deviceName);
      return;
    } catch {
      if (index === candidates.length - 1) {
        throw new Error(`All Windows dshow audio devices failed: ${candidates.join(', ')}`);
      }
    }
  }), Promise.resolve());
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

function sendAudioChunkToAssemblyAI(aaiWebSocket, chunk) {
  if (!chunk || aaiWebSocket.readyState !== WebSocketModule.OPEN) {
    return;
  }

  // AssemblyAI v3 realtime expects raw binary PCM data, NOT JSON frames
  // Send audio chunk as raw bytes directly
  aaiWebSocket.send(chunk);
}

(async () => {
  const config = parseArgs();

  console.log('[bot] PHASE 1: AUDIO CAPTURE VALIDATION');
  console.log(`[bot] meetingId=${config.meetingId}`);

  let browser;
  let recorder;
  let page;
  let monitorInterval;
  let heartbeatInterval;
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

    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
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
    console.log('[bot] PHASE 1: AUDIO CAPTURE VALIDATION (NO TRANSCRIPTION)');
    console.log('[bot] mode: record to disk, validate, then exit');

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
      console.log('[bot] ✅ joined meeting successfully');
    } else {
      console.warn('[bot] ⚠️ join state not confirmed, attempting audio capture anyway');
    }

    // Record audio to test file
    const recordDir = path.join(process.cwd(), 'data', 'audio', config.meetingId);
    if (!fs.existsSync(recordDir)) {
      fs.mkdirSync(recordDir, { recursive: true });
    }
    
    const testWavPath = path.join(recordDir, 'test.wav');
    console.log(`[bot] ✅ recording started, will save to: ${testWavPath}`);

    try {
      await recordAudioToFile(testWavPath, 10);
      console.log('[bot] ✅ recording completed');
    } catch (recordError) {
      console.error('[bot] ❌ recording failed:', recordError.message);
      await shutdown('audio-record-failed');
      return;
    }

    // Validate the recorded audio
    console.log('[bot] validating audio file...');
    let validation;
    try {
      validation = await validateAudioFile(testWavPath);
    } catch (valError) {
      console.error('[bot] ❌ validation error:', valError.message);
      await shutdown('audio-validation-error');
      return;
    }

    console.log(`
[audio-validation] RESULTS
==========================
📁 file size:              ${(validation.fileSize / 1024).toFixed(2)} KB
⏱️  estimated duration:     ${validation.estimatedDurationSeconds.toFixed(2)} seconds
📊 RMS (root mean square): ${validation.rms.toFixed(6)}
🔇 silence detected:       ${validation.isSilent ? '❌ YES (FAILED)' : '✅ NO (PASSED)'}
✅ overall valid:          ${validation.isValid ? '✅ PASSED' : '❌ FAILED'}
==========================
    `);

    if (!validation.isValid) {
      console.error('[bot] ❌ AUDIO VALIDATION FAILED');
      
      if (validation.isSilent) {
        console.error('[bot] ❌ REASON: Audio is silent (RMS < 0.001)');
        console.error('[bot] ❌ This likely means:');
        console.error('[bot]    - No audio source available on device');
        console.error('[bot]    - Meeting has no active speakers');
        console.error('[bot]    - OS-level loopback capture not configured');
        console.error('[bot]    - Audio output not routed to loopback device');
      }
      
      if (validation.estimatedDurationSeconds < 9) {
        console.error(`[bot] ❌ REASON: Recording too short (${validation.estimatedDurationSeconds.toFixed(2)}s < 9s)`);
        console.error('[bot]    - ffmpeg may have failed to start');
        console.error('[bot]    - Device not recognized');
      }

      await shutdown('audio-validation-failed');
      return;
    }

    console.log('[bot] ✅ AUDIO VALIDATION PASSED');
    
    // Print absolute path and file info clearly
    const absolutePath = path.resolve(testWavPath);
    const stats = fs.statSync(testWavPath);
    const fileSizeKB = (stats.size / 1024).toFixed(2);
    
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║                    AUDIO FILE SAVED                           ║
╚════════════════════════════════════════════════════════════════╝

📁 Absolute Path:
   ${absolutePath}

📊 File Size:
   ${fileSizeKB} KB (${stats.size} bytes)

⏱️  Duration:
   ${validation.estimatedDurationSeconds.toFixed(2)} seconds

🔊 Audio Energy (RMS):
   ${validation.rms.toFixed(6)} (speech-like)

════════════════════════════════════════════════════════════════
🎧 NEXT: Open test.wav with any media player to listen
════════════════════════════════════════════════════════════════
    `);

    // Auto-open folder based on platform
    try {
      const folderPath = path.dirname(absolutePath);
      if (os.platform() === 'win32') {
        const { exec } = require('child_process');
        exec(`explorer "${folderPath}"`);
        console.log(`[bot] 📂 Opening folder in Explorer...`);
      } else if (os.platform() === 'darwin') {
        const { exec } = require('child_process');
        exec(`open "${folderPath}"`);
        console.log(`[bot] 📂 Opening folder in Finder...`);
      } else if (os.platform() === 'linux') {
        const { exec } = require('child_process');
        exec(`xdg-open "${folderPath}"`);
        console.log(`[bot] 📂 Opening folder...`);
      }
    } catch (err) {
      console.warn(`[bot] ⚠️ Could not auto-open folder: ${err.message}`);
    }

    console.log('[bot] 🎯 Ready for manual audio inspection');
    
    await shutdown('audio-validation-complete');
  } catch (error) {
    console.error('[bot] fatal error:', error.message);
    console.error(error.stack);
    await shutdown('fatal-error');
  }
})();

'use strict';

const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '../../.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY || process.env.AAI_API_KEY || '';
const CAPTION_BACKEND_URL = (process.env.CAPTION_BACKEND_URL || `http://localhost:${process.env.MEETING_AI_PORT || 4010}`).replace(/\/$/, '');
const meetingId = process.argv[2] || 'dev-room-123';

const testAudios = [
  {
    url: 'https://storage.googleapis.com/aai-web-samples/5_common_sports_injuries.mp3',
    name: 'Sports Injuries',
  },
  {
    url: 'https://storage.googleapis.com/aai-web-samples/meeting_scenario.mp3',
    name: 'Meeting Sample',
  },
  {
    url: 'https://cdn.openai.com/API/docs/audio/alloy.mp3',
    name: 'General Audio',
  },
];

let audioIndex = 0;

async function transcribeRemoteAudio(audioUrl) {
  const createResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
    method: 'POST',
    headers: {
      authorization: ASSEMBLYAI_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      audio_url: audioUrl,
      speech_models: ['universal-3-pro', 'universal-2'],
      language_detection: true,
      speaker_labels: true,
      punctuate: true,
      format_text: true,
    }),
  });

  if (!createResponse.ok) {
    const text = await createResponse.text();
    throw new Error(`AssemblyAI create failed: ${createResponse.status} ${text}`);
  }

  const createJson = await createResponse.json();
  const transcriptId = createJson.id;

  const startedAt = Date.now();
  while (Date.now() - startedAt < 180000) {
    await new Promise((resolve) => setTimeout(resolve, 3000));

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

function extractCaptionSegments(transcript) {
  const utterances = Array.isArray(transcript?.utterances) ? transcript.utterances : [];

  if (utterances.length > 0) {
    return utterances
      .map((utterance) => ({
        text: String(utterance?.text || '').trim(),
        speaker: `Speaker ${String(utterance?.speaker || '1')}`,
      }))
      .filter((segment) => segment.text.length > 0);
  }

  const text = String(transcript?.text || '').trim();
  return text ? [{ text, speaker: 'Dev Bot' }] : [];
}

async function postCaption(text, speaker = 'Dev Bot') {
  const payload = {
    text,
    speaker,
    final: true,
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

async function runCycle() {
  const audioConfig = testAudios[audioIndex % testAudios.length];
  audioIndex += 1;

  console.log(`[dev-bot] cycle ${audioIndex}: transcribing ${audioConfig.name}`);

  try {
    const transcript = await transcribeRemoteAudio(audioConfig.url);
    const segments = extractCaptionSegments(transcript);

    if (segments.length === 0) {
      console.log(`[dev-bot] empty transcript from ${audioConfig.name}`);
      return;
    }

    const chunks = segments.slice(0, 5);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i].text.trim();
      if (!chunk) continue;

      const isFinal = i === chunks.length - 1;
      await postCaption(chunk, chunks[i].speaker || `${audioConfig.name} (${i + 1}/${chunks.length})`);
      console.log(`[dev-bot] caption posted: "${chunk.slice(0, 80)}..."`);

      if (i < chunks.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  } catch (error) {
    console.error(`[dev-bot] cycle failed:`, error.message);
  }
}

(async () => {
  if (!ASSEMBLYAI_API_KEY) {
    console.error('ASSEMBLYAI_API_KEY (or AAI_API_KEY) is required.');
    process.exit(1);
  }

  console.log(`[dev-bot] starting development bot`);
  console.log(`[dev-bot] meeting room: ${meetingId}`);
  console.log(`[dev-bot] caption backend: ${CAPTION_BACKEND_URL}`);
  console.log(`[dev-bot] cycling through ${testAudios.length} test audio samples`);
  console.log(`\n  → Open your browser to http://localhost:3000/room/${meetingId} to see live captions`);
  console.log(`  → Press Ctrl+C to stop\n`);

  const intervalSeconds = Number(process.env.DEV_BOT_INTERVAL_SECONDS || 15);

  await runCycle();

  setInterval(runCycle, intervalSeconds * 1000);
})().catch((error) => {
  console.error('[dev-bot] failed:', error.message);
  process.exit(1);
});

import { NextRequest, NextResponse } from 'next/server';

const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY || process.env.AAI_API_KEY || '';
const ASSEMBLYAI_TRANSCRIBE_LANGUAGE = process.env.ASSEMBLYAI_TRANSCRIBE_LANGUAGE || process.env.AAI_TRANSCRIBE_LANGUAGE || '';
const CAPTION_BACKEND_URL = (process.env.CAPTION_BACKEND_URL || `http://localhost:${process.env.MEETING_AI_PORT || 4010}`).replace(/\/$/, '');

type AssemblyAIUtterance = {
  text?: string;
  speaker?: string | number;
};

type AssemblyAITranscript = {
  status?: string;
  text?: string;
  utterances?: AssemblyAIUtterance[];
};

async function uploadToAssemblyAI(buffer: Buffer): Promise<string> {
  const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
    method: 'POST',
    headers: {
      authorization: ASSEMBLYAI_API_KEY,
      'content-type': 'application/octet-stream',
    },
    body: new Uint8Array(buffer),
  });

  if (!uploadResponse.ok) {
    const text = await uploadResponse.text();
    throw new Error(`AssemblyAI upload failed: ${uploadResponse.status} ${text}`);
  }

  const json = await uploadResponse.json();
  return json.upload_url;
}

async function transcribeAudio(audioUrl: string): Promise<AssemblyAITranscript> {
  const createResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
    method: 'POST',
    headers: {
      authorization: ASSEMBLYAI_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      audio_url: audioUrl,
      speech_models: ['universal-3-pro', 'universal-2'],
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
    throw new Error(`AssemblyAI create failed: ${createResponse.status} ${text}`);
  }

  const created = await createResponse.json();
  const transcriptId = created.id;

  const startedAt = Date.now();
  while (Date.now() - startedAt < 60000) {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const pollResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
      headers: { authorization: ASSEMBLYAI_API_KEY },
    });

    if (!pollResponse.ok) {
      const text = await pollResponse.text();
      throw new Error(`AssemblyAI poll failed: ${pollResponse.status} ${text}`);
    }

    const status = await pollResponse.json();
    if (status.status === 'completed') {
      return status as AssemblyAITranscript;
    }

    if (status.status === 'error') {
      throw new Error(`AssemblyAI transcription failed: ${status.error || 'unknown error'}`);
    }
  }

  throw new Error('AssemblyAI transcription timed out');
}

function extractCaptionSegments(transcript: AssemblyAITranscript) {
  const utterances = Array.isArray(transcript.utterances) ? transcript.utterances : [];

  if (utterances.length > 0) {
    return utterances
      .map((utterance) => ({
        text: String(utterance?.text || '').trim(),
        speaker: `Speaker ${String(utterance?.speaker || '1')}`,
      }))
      .filter((segment) => segment.text.length > 0);
  }

  const text = String(transcript.text || '').trim();
  return text ? [{ text, speaker: 'You' }] : [];
}

async function postCaption(meetingId: string, text: string, speaker = 'You'): Promise<void> {
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

export async function POST(request: NextRequest) {
  if (!ASSEMBLYAI_API_KEY) {
    return NextResponse.json({ error: 'AssemblyAI API key not configured' }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const meetingId = formData.get('meetingId') as string;

    if (!audioFile || !meetingId) {
      return NextResponse.json({ error: 'Missing audio or meetingId' }, { status: 400 });
    }

    const buffer = Buffer.from(await audioFile.arrayBuffer());

    if (buffer.length < 1000) {
      return NextResponse.json({ silence: true });
    }

    const audioUrl = await uploadToAssemblyAI(buffer);
    const transcript = await transcribeAudio(audioUrl);
    const segments = extractCaptionSegments(transcript);

    if (segments.length === 0) {
      return NextResponse.json({ silence: true });
    }

    for (const segment of segments) {
      await postCaption(meetingId, segment.text, segment.speaker);
    }

    return NextResponse.json({ text: String(transcript.text || '').trim(), segments });
  } catch (error) {
    console.error('[transcribe-audio] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Transcription failed' },
      { status: 500 }
    );
  }
}

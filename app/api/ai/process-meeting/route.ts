import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Meeting from '@/models/Meeting';
import Task from '@/models/Task';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getAssemblyAIService, type SpeakerNameMap } from '@/lib/assemblyai';

/**
 * Process meeting recording after it ends
 * Generate summary, key decisions, action items using AssemblyAI
 * POST /api/ai/process-meeting
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { meetingId, recordingUrl, transcriptId, speakerMap } = await request.json();

    if (!meetingId || (!recordingUrl && !transcriptId)) {
      return NextResponse.json(
        {
          error:
            'meetingId and either recordingUrl or transcriptId are required',
        },
        { status: 400 }
      );
    }

    await dbConnect();

    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      );
    }

    if (!meeting.aiEnabled) {
      return NextResponse.json(
        { error: 'AI is not enabled for this meeting' },
        { status: 400 }
      );
    }

    const assemblyai = getAssemblyAIService();
    let finalTranscriptId = transcriptId;
    const speakerNameMap = buildSpeakerNameMap(speakerMap, meeting);

    // If we have a recording URL and no transcript ID, submit for transcription
    if (recordingUrl && !transcriptId) {
      try {
        const submitResult = await assemblyai.submitTranscription(
          recordingUrl,
          {
            language: (meeting.aiLanguage as any) || 'en',
            speakerLabels: true,
          }
        );
        finalTranscriptId = submitResult.id;

        const completedTranscript = submitResult.status === 'completed'
          ? submitResult
          : await waitForCompletedTranscription(assemblyai, finalTranscriptId);

        if (!completedTranscript || completedTranscript.status !== 'completed') {
          return NextResponse.json(
            {
              success: true,
              message: 'Transcription submitted and is still processing',
              transcriptId: finalTranscriptId,
              status: completedTranscript?.status || submitResult.status,
            },
            { status: 202 }
          );
        }
      } catch (error: any) {
        console.error('Error submitting recording for transcription:', error);
        return NextResponse.json(
          { error: `Failed to submit recording: ${error.message}` },
          { status: 500 }
        );
      }
    }

    // Get transcription details (speaker labels, transcript)
    let speakerLabels = [];
    let detailedTranscript = [];

    try {
      const speakers = await assemblyai.getSpeakerLabels(finalTranscriptId, speakerNameMap);
      speakerLabels = speakers.map((s, idx) => ({
        speakerId: s.label,
        name: s.speaker,
        color: SPEAKER_COLORS[idx % SPEAKER_COLORS.length],
      }));

      detailedTranscript = await assemblyai.getDetailedTranscript(
        finalTranscriptId,
        speakerNameMap
      );
    } catch (error: any) {
      console.warn('Could not fetch speaker labels:', error.message);
    }

    // Generate summary, decisions, action items
    let summary = '';
    let keyNotes = [];
    let keyDecisions = [];
    let actionItems = [];

    try {
      const analysisResult = await assemblyai.generateMeetingNotes(
        finalTranscriptId,
        speakerNameMap
      );
      summary = analysisResult.summary;
      keyNotes = analysisResult.keyNotes;
      keyDecisions = analysisResult.keyDecisions;
      actionItems = analysisResult.actionItems.map((item: string) => ({
        item,
        owner: extractOwner(item),
      }));
    } catch (error: any) {
      console.warn('Could not generate summary:', error.message);
    }

    // Update meeting with AI results
    meeting.transcript = detailedTranscript.map((item: any) => ({
      text: item.text,
      timestamp: item.start,
      speakerId: item.speakerId,
      speaker: item.speaker,
    }));
    meeting.summary = summary;
    meeting.keyNotes = keyNotes;
    meeting.keyDecisions = keyDecisions;
    meeting.actionItems = actionItems;
    // Best-effort: persist action items as tasks so they appear in Task Workspace
    try {
      for (const ai of actionItems) {
        let title = '';
        let ownerName = '';
        if (typeof ai === 'string') title = ai;
        else if (ai && typeof ai === 'object') {
          title = ai.item || ai.text || ai.title || JSON.stringify(ai);
          ownerName = ai.owner || ai.assignee || ai.assignedTo || '';
        }
        if (!title) continue;
        // create task; ownerEmail left null (best-effort assignment)
        await Task.create({ meetingId: meetingId, title, ownerName });
      }
    } catch (taskErr) {
      console.error('Failed creating tasks from actionItems', taskErr);
    }
    meeting.speakerLabels = speakerLabels;

    await meeting.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Meeting processed successfully',
        data: {
          summary,
          keyNotes,
          keyDecisions,
          actionItems,
          speakerLabels,
          transcriptCount: detailedTranscript.length,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error processing meeting:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process meeting' },
      { status: 500 }
    );
  }
}

// Speaker colors for visual distinction
const SPEAKER_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#FFA502',
  '#95E1D3',
  '#F38181',
  '#AA96DA',
  '#FCBAD3',
];

// Extract owner from action item text (simple heuristic)
function extractOwner(item: string): string | undefined {
  const ownerMatch = item.match(/(?:owner|assign|to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
  return ownerMatch ? ownerMatch[1] : undefined;
}

function buildSpeakerNameMap(input: unknown, meeting: any): SpeakerNameMap {
  const speakerNameMap: SpeakerNameMap = {};

  const addMapping = (speakerId: unknown, displayName: unknown) => {
    const key = String(speakerId || '').trim();
    const name = String(displayName || '').trim();

    if (!key || !name) {
      return;
    }

    speakerNameMap[key] = name;

    const speakerPrefixMatch = key.match(/^speaker\s+(.+)$/i);
    if (speakerPrefixMatch?.[1]) {
      const rawId = speakerPrefixMatch[1].trim();
      speakerNameMap[rawId] = name;
      speakerNameMap[`Speaker ${rawId}`] = name;
      return;
    }

    speakerNameMap[`Speaker ${key}`] = name;
    speakerNameMap[`speaker:${key}`] = name;
    speakerNameMap[`speaker-${key}`] = name;
  };

  if (Array.isArray(meeting?.speakerLabels)) {
    meeting.speakerLabels.forEach((speaker: any) => {
      addMapping(
        speaker?.speakerId || speaker?.label || speaker?.id,
        speaker?.name || speaker?.speaker || speaker?.displayName
      );
    });
  }

  if (Array.isArray(input)) {
    input.forEach((speaker: any) => {
      addMapping(
        speaker?.speakerId || speaker?.label || speaker?.id,
        speaker?.name || speaker?.speaker || speaker?.displayName
      );
    });
  } else if (input && typeof input === 'object') {
    Object.entries(input as Record<string, unknown>).forEach(([speakerId, displayName]) => {
      addMapping(speakerId, displayName);
    });
  }

  return speakerNameMap;
}

async function waitForCompletedTranscription(assemblyai: any, transcriptId: string) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const transcript = await assemblyai.getTranscription(transcriptId);

    if (transcript.status === 'completed' || transcript.status === 'error') {
      return transcript;
    }
  }

  return null;
}

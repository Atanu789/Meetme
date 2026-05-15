import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Meeting from '@/models/Meeting';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getAssemblyAIService } from '@/lib/assemblyai';

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

    const { meetingId, recordingUrl, transcriptId } = await request.json();

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

        // Check status (may still be queued)
        if (submitResult.status !== 'completed') {
          return NextResponse.json(
            {
              success: true,
              message: 'Transcription submitted, processing in background',
              transcriptId: finalTranscriptId,
              status: submitResult.status,
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
      const speakers = await assemblyai.getSpeakerLabels(finalTranscriptId);
      speakerLabels = speakers.map((s, idx) => ({
        speakerId: s.label,
        name: s.speaker,
        color: SPEAKER_COLORS[idx % SPEAKER_COLORS.length],
      }));

      detailedTranscript = await assemblyai.getDetailedTranscript(
        finalTranscriptId
      );
    } catch (error: any) {
      console.warn('Could not fetch speaker labels:', error.message);
    }

    // Generate summary, decisions, action items
    let summary = '';
    let keyDecisions = [];
    let actionItems = [];

    try {
      const analysisResult = await assemblyai.generateSummary(
        finalTranscriptId
      );
      summary = analysisResult.summary;
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
      speakerId: item.speaker,
      speaker: item.speaker,
    }));
    meeting.summary = summary;
    meeting.keyDecisions = keyDecisions;
    meeting.actionItems = actionItems;
    meeting.speakerLabels = speakerLabels;

    await meeting.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Meeting processed successfully',
        data: {
          summary,
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

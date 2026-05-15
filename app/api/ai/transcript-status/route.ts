import { NextResponse } from 'next/server';
import { getAssemblyAIService } from '@/lib/assemblyai';

/**
 * Check transcription status
 * GET /api/ai/transcript-status?transcriptId=xxx
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const transcriptId = searchParams.get('transcriptId');

    if (!transcriptId) {
      return NextResponse.json(
        { error: 'transcriptId is required' },
        { status: 400 }
      );
    }

    const assemblyai = getAssemblyAIService();
    const transcript = await assemblyai.getTranscription(transcriptId);

    return NextResponse.json(
      {
        success: true,
        id: transcript.id,
        status: transcript.status,
        text: transcript.text || '',
        utterances: transcript.utterances?.length || 0,
        created_at: transcript.created_at,
        completed_at: transcript.completed_at,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error checking transcription status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check transcription status' },
      { status: 500 }
    );
  }
}

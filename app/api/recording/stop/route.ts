import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

interface JibriStopRequest {
  roomName: string;
}

/**
 * POST /api/recording/stop
 * Stop Jibri recording for a Jitsi room
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: JibriStopRequest = await req.json();
    const { roomName } = body;

    if (!roomName) {
      return NextResponse.json(
        { error: 'roomName is required' },
        { status: 400 }
      );
    }

    const jitsiDomain = process.env.NEXT_PUBLIC_JITSI_DOMAIN || 'meet.jit.si';
    const jibriUrl = process.env.JIBRI_SERVICE_URL || 'http://localhost:2222';
    const jibriSecret = process.env.JIBRI_API_SECRET;

    if (!jibriSecret) {
      console.warn('[Jibri] JIBRI_API_SECRET not configured');
      return NextResponse.json(
        { error: 'Jibri service not configured' },
        { status: 503 }
      );
    }

    // Prepare Jibri stop request
    const jibriPayload = {
      'jibri-room': {
        'room-jid': `${roomName}@${jitsiDomain}`,
      },
    };

    const response = await fetch(`${jibriUrl}/jibri/api/v1.0/stopService`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jibriSecret}`,
      },
      body: JSON.stringify(jibriPayload),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Jibri] Stop service failed:', error);
      return NextResponse.json(
        { error: 'Failed to stop recording', details: error },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[Jibri] Recording stopped successfully');

    return NextResponse.json({
      success: true,
      status: 'stopped',
      message: 'Recording stopped successfully',
      recordingPath: data['recording-path'] || undefined,
    });
  } catch (error) {
    console.error('[Jibri] Error stopping recording:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

interface JibriStartRequest {
  roomName: string;
  displayName?: string;
  rtmpUrl?: string;
  youtubeUrl?: string;
}

/**
 * POST /api/recording/start
 * Start Jibri recording for a Jitsi room
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: JibriStartRequest = await req.json();
    const { roomName, displayName = 'Recorder Bot', rtmpUrl, youtubeUrl } = body;

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

    // Prepare Jibri request
    const jibriPayload = {
      'jibri-room': {
        'room-jid': `${roomName}@${jitsiDomain}`,
        'display-name': displayName,
      },
      'recording': {
        'recording-type': 'file',
        'output-path': `/tmp/jibri-recordings/${roomName}-${Date.now()}.webm`,
      },
      ...(rtmpUrl || youtubeUrl ? {
        'streaming': {
          'rtmp-url': rtmpUrl || youtubeUrl,
        },
      } : {}),
    };

    const response = await fetch(`${jibriUrl}/jibri/api/v1.0/startService`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jibriSecret}`,
      },
      body: JSON.stringify({
        ...jibriPayload,
        'service-params': {
          'recording': {
            'enabled': true,
            'mode': 'file',
          },
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Jibri] Start service failed:', error);
      return NextResponse.json(
        { error: 'Failed to start recording', details: error },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[Jibri] Recording started successfully');

    return NextResponse.json({
      success: true,
      recordingId: `${roomName}-${Date.now()}`,
      status: 'recording',
      message: 'Recording started successfully',
    });
  } catch (error) {
    console.error('[Jibri] Error starting recording:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

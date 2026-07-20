import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { requireFeatureAccess } from '@/lib/membership';

interface YoutubeStreamStartRequest {
  roomName: string;
  youtubeStreamUrl: string;
  displayName?: string;
}

/**
 * POST /api/livestream/start
 * Start YouTube livestream from Jitsi room using Jibri
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userEmail = String(session.user?.email || '').toLowerCase();
    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if ((session.user as any)?.role !== 'admin') {
      const membershipCheck = await requireFeatureAccess(userEmail, 'livestream');
      if (!membershipCheck.ok) {
        return NextResponse.json(
          { error: membershipCheck.error, code: membershipCheck.code, membership: membershipCheck.membership || null },
          { status: membershipCheck.status }
        );
      }
    }

    const body: YoutubeStreamStartRequest = await req.json();
    const { roomName, youtubeStreamUrl, displayName = 'Melanam Livestream' } = body;

    if (!roomName || !youtubeStreamUrl) {
      return NextResponse.json(
        { error: 'roomName and youtubeStreamUrl are required' },
        { status: 400 }
      );
    }

    // Validate YouTube stream URL
    if (!youtubeStreamUrl.includes('youtube') && !youtubeStreamUrl.includes('rtmps')) {
      return NextResponse.json(
        { error: 'Invalid YouTube stream URL' },
        { status: 400 }
      );
    }

    const jitsiDomain = process.env.NEXT_PUBLIC_JITSI_DOMAIN || 'meet.jit.si';
    const jibriUrl = process.env.JIBRI_SERVICE_URL || 'http://localhost:2222';
    const jibriSecret = process.env.JIBRI_API_SECRET;

    if (!jibriSecret) {
      console.warn('[YouTube Stream] JIBRI_API_SECRET not configured');
      return NextResponse.json(
        { error: 'Streaming service not configured' },
        { status: 503 }
      );
    }

    // Prepare Jibri streaming request
    const jibriPayload = {
      'jibri-room': {
        'room-jid': `${roomName}@${jitsiDomain}`,
        'display-name': displayName,
      },
      'streaming': {
        'rtmp-url': youtubeStreamUrl,
      },
      'service-params': {
        'streaming': {
          'enabled': true,
          'mode': 'youtube',
        },
      },
    };

    const response = await fetch(`${jibriUrl}/jibri/api/v1.0/startService`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jibriSecret}`,
      },
      body: JSON.stringify(jibriPayload),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[YouTube Stream] Start service failed:', error);
      return NextResponse.json(
        { error: 'Failed to start YouTube stream', details: error },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[YouTube Stream] Livestream started successfully');

    return NextResponse.json({
      success: true,
      streamId: `${roomName}-${Date.now()}`,
      status: 'streaming',
      message: 'YouTube livestream started successfully',
    });
  } catch (error) {
    console.error('[YouTube Stream] Error starting livestream:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

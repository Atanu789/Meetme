import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/recording/status?roomName=xxx
 * Get Jibri recording status for a Jitsi room
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const roomName = req.nextUrl.searchParams.get('roomName');
    if (!roomName) {
      return NextResponse.json(
        { error: 'roomName query parameter is required' },
        { status: 400 }
      );
    }

    const jitsiDomain = process.env.NEXT_PUBLIC_JITSI_DOMAIN || 'meet.jit.si';
    const jibriUrl = process.env.JIBRI_SERVICE_URL || 'http://localhost:2222';
    const jibriSecret = process.env.JIBRI_API_SECRET;

    if (!jibriSecret) {
      return NextResponse.json(
        { error: 'Jibri service not configured' },
        { status: 503 }
      );
    }

    // Get health status from Jibri
    const response = await fetch(`${jibriUrl}/jibri/api/v1.0/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jibriSecret}`,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch recording status', status: 'unknown' },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      status: data?.status || 'idle',
      healthy: data?.status === 'HEALTHY',
      jibriStatus: data,
    });
  } catch (error) {
    console.error('[Jibri] Error fetching recording status:', error);
    return NextResponse.json(
      { error: 'Internal server error', status: 'error' },
      { status: 500 }
    );
  }
}

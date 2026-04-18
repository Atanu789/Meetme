import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../lib/db';
import Meeting from '../../../models/Meeting';
import { createJitsiJwt } from '../../../lib/jitsi-jwt';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth-options';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email || '';

    const searchParams = req.nextUrl.searchParams;
    const meetingId = searchParams.get('meetingId');
    const guestName = searchParams.get('name') || 'Guest';

    if (!meetingId) {
      return NextResponse.json({ error: 'Meeting ID is required' }, { status: 400 });
    }

    await dbConnect();

    const meeting = await Meeting.findOne({ meetingId });

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    if (!meeting.isPrivate) {
      return NextResponse.json({ token: null, isPrivate: false }, { status: 200 });
    }

    const secret = process.env.JITSI_JWT_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: 'Jitsi JWT secret is not configured' },
        { status: 500 }
      );
    }

    const domain = process.env.NEXT_PUBLIC_JITSI_DOMAIN || 'meet.jit.si';
    const issuer = process.env.JITSI_JWT_ISSUER || 'melanam';
    const resolvedName = userEmail || guestName;
    const resolvedId = userEmail || `guest:${resolvedName}`;

    const token = createJitsiJwt({
      roomName: meetingId,
      domain: domain.replace(/^https?:\/\//, ''),
      user: {
        id: resolvedId,
        name: resolvedName,
        email: userEmail || undefined,
      },
      secret,
      issuer,
      moderator: Boolean(userEmail) && (userEmail === meeting.hostEmail || userEmail === meeting.hostId),
    });

    return NextResponse.json(
      {
        success: true,
        isPrivate: true,
        token,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error creating Jitsi token:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create meeting token' },
      { status: 500 }
    );
  }
}

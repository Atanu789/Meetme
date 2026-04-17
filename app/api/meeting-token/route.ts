import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { clerkClient } from '@clerk/nextjs/server';
import dbConnect from '@/lib/db';
import Meeting from '@/models/Meeting';
import { createJitsiJwt } from '@/lib/jitsi-jwt';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const meetingId = searchParams.get('meetingId');

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
    const clerkUser = await clerkClient.users.getUser(userId);

    const token = createJitsiJwt({
      roomName: meetingId,
      domain: domain.replace(/^https?:\/\//, ''),
      user: {
        id: userId,
        name: clerkUser.firstName || clerkUser.emailAddresses[0]?.emailAddress || 'Guest',
        email: clerkUser.emailAddresses[0]?.emailAddress,
      },
      secret,
      issuer,
      moderator: userId === meeting.hostId,
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

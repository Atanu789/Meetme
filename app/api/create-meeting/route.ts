import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import dbConnect from '../../../lib/db';
import Meeting from '../../../models/Meeting';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth-options';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email;

    if (!userEmail) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const body = await req.json();
    const {
      title,
      description,
      isPrivate = false,
      chatEnabled = true,
      recordingEnabled = false,
    } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const meetingId = nanoid(12);

    const meeting = new Meeting({
      meetingId,
      hostId: userEmail,
      hostEmail: userEmail,
      title,
      description: description || '',
      isPrivate,
      chatEnabled,
      recordingEnabled,
    });

    await meeting.save();

    // Start the caption bot immediately so the room is monitored as soon as it exists.
    const jitsiDomain = (process.env.NEXT_PUBLIC_JITSI_DOMAIN || 'meet.melanam.com').replace(/^https?:\/\//, '').trim();
    const meetingUrl = `https://${jitsiDomain}/${meetingId}`;

    try {
      const meetingAiUrl = (process.env.MEETING_AI_CONTROL_URL || 'http://localhost:4010').replace(/\/$/, '');
      await fetch(`${meetingAiUrl}/api/start-bot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetingId,
          meetingUrl,
          botName: 'Melanam Live Captions Bot',
        }),
      });
    } catch (error) {
      console.error('Error scheduling caption bot:', error);
    }

    return NextResponse.json(
      {
        success: true,
        meetingId,
        meeting,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating meeting:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create meeting' },
      { status: 500 }
    );
  }
}

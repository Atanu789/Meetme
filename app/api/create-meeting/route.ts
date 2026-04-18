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

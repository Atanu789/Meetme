import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { auth } from '@clerk/nextjs';
import dbConnect from '@/lib/db';
import Meeting from '@/models/Meeting';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const body = await req.json();
    const { hostEmail, title, description } = body;

    if (!hostEmail || !title) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const meetingId = nanoid(12);

    const meeting = new Meeting({
      meetingId,
      hostId: userId,
      hostEmail,
      title,
      description: description || '',
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

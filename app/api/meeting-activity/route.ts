import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { clerkClient } from '@clerk/nextjs/server';
import dbConnect from '../../../lib/db';
import Meeting from '../../../models/Meeting';
import MeetingActivity from '../../../models/MeetingActivity';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const meetingId = req.nextUrl.searchParams.get('meetingId');

    await dbConnect();

    const query = meetingId ? { meetingId } : { userId };
    const activity = await MeetingActivity.find(query).sort({ createdAt: -1 }).limit(50);

    return NextResponse.json({ success: true, activity }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching meeting activity:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch meeting activity' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const body = await req.json();
    const { meetingId, type, details } = body;

    if (!meetingId || !type) {
      return NextResponse.json({ error: 'Meeting ID and type are required' }, { status: 400 });
    }

    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    const clerkUser = await clerkClient.users.getUser(userId);
    const userName = clerkUser.firstName || clerkUser.emailAddresses[0]?.emailAddress || 'Guest';
    const userEmail = clerkUser.emailAddresses[0]?.emailAddress || '';

    const activity = new MeetingActivity({
      meetingId,
      userId,
      userName,
      userEmail,
      type,
      details: details || '',
    });

    await activity.save();

    if (type === 'joined') {
      meeting.joinCount = (meeting.joinCount || 0) + 1;
      meeting.lastSessionAt = new Date();
      await meeting.save();
    }

    if (type === 'recording-started' || type === 'recording-stopped') {
      meeting.lastRecordingAt = new Date();
      await meeting.save();
    }

    return NextResponse.json({ success: true, activity }, { status: 201 });
  } catch (error: any) {
    console.error('Error saving meeting activity:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save meeting activity' },
      { status: 500 }
    );
  }
}
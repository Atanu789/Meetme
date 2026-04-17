import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { clerkClient } from '@clerk/nextjs/server';
import dbConnect from '@/lib/db';
import Meeting from '@/models/Meeting';
import MeetingMessage from '@/models/MeetingMessage';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const meetingId = req.nextUrl.searchParams.get('meetingId');
    if (!meetingId) {
      return NextResponse.json({ error: 'Meeting ID is required' }, { status: 400 });
    }

    await dbConnect();

    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    const messages = await MeetingMessage.find({ meetingId }).sort({ createdAt: 1 }).limit(200);

    return NextResponse.json({ success: true, messages }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching meeting messages:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch meeting messages' },
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
    const { meetingId, message } = body;

    if (!meetingId || !message?.trim()) {
      return NextResponse.json({ error: 'Meeting ID and message are required' }, { status: 400 });
    }

    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    const clerkUser = await clerkClient.users.getUser(userId);
    const senderName = clerkUser.firstName || clerkUser.emailAddresses[0]?.emailAddress || 'Guest';
    const senderEmail = clerkUser.emailAddresses[0]?.emailAddress || '';

    const chatMessage = new MeetingMessage({
      meetingId,
      senderId: userId,
      senderName,
      senderEmail,
      message: message.trim(),
    });

    await chatMessage.save();

    meeting.updatedAt = new Date();
    await meeting.save();

    return NextResponse.json({ success: true, message: chatMessage }, { status: 201 });
  } catch (error: any) {
    console.error('Error saving meeting message:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save message' },
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import dbConnect from '../../../lib/db';
import Meeting from '../../../models/Meeting';
import MeetingActivity from '../../../models/MeetingActivity';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const [meetings, activity] = await Promise.all([
      Meeting.find({ hostId: userId }).sort({ updatedAt: -1 }).limit(12),
      MeetingActivity.find({ userId }).sort({ createdAt: -1 }).limit(12),
    ]);

    return NextResponse.json(
      {
        success: true,
        meetings,
        activity,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching meeting history:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch meeting history' },
      { status: 500 }
    );
  }
}
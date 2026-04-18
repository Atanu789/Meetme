import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/db';
import Meeting from '../../../models/Meeting';
import MeetingActivity from '../../../models/MeetingActivity';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth-options';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email;

    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const [meetings, activity] = await Promise.all([
      Meeting.find({ hostEmail: userEmail }).sort({ updatedAt: -1 }).limit(12),
      MeetingActivity.find({ userEmail }).sort({ createdAt: -1 }).limit(12),
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
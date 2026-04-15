import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Meeting from '@/models/Meeting';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const searchParams = req.nextUrl.searchParams;
    const meetingId = searchParams.get('id');

    if (!meetingId) {
      return NextResponse.json(
        { error: 'Meeting ID is required' },
        { status: 400 }
      );
    }

    const meeting = await Meeting.findOne({ meetingId });

    if (!meeting) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        meeting,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching meeting:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch meeting' },
      { status: 500 }
    );
  }
}

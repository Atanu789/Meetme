import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import dbConnect from '../../../lib/db';
import Meeting from '../../../models/Meeting';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const meetings = await Meeting.find({ hostId: userId })
      .sort({ createdAt: -1 })
      .limit(12);

    return NextResponse.json(
      {
        success: true,
        meetings,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching meetings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch meetings' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/db';
import Meeting from '../../../models/Meeting';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth-options';

/**
 * Enable/configure AI assistant for a meeting
 * POST /api/ai/init
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { meetingId, language } = await request.json();

    if (!meetingId) {
      return NextResponse.json(
        { error: 'meetingId is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      );
    }

    // Verify user is host or admin
    if (meeting.hostEmail !== session.user.email) {
      return NextResponse.json(
        { error: 'Only meeting host can enable AI' },
        { status: 403 }
      );
    }

    // Update meeting with AI settings
    meeting.aiEnabled = true;
    meeting.aiLanguage = language || 'en';
    await meeting.save();

    return NextResponse.json(
      {
        success: true,
        message: 'AI assistant enabled',
        meeting: {
          meetingId,
          aiEnabled: meeting.aiEnabled,
          aiLanguage: meeting.aiLanguage,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error initializing AI:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initialize AI' },
      { status: 500 }
    );
  }
}

/**
 * Disable AI assistant for a meeting
 * DELETE /api/ai/init
 */
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const meetingId = searchParams.get('meetingId');

    if (!meetingId) {
      return NextResponse.json(
        { error: 'meetingId is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      );
    }

    if (meeting.hostEmail !== session.user.email) {
      return NextResponse.json(
        { error: 'Only meeting host can disable AI' },
        { status: 403 }
      );
    }

    meeting.aiEnabled = false;
    await meeting.save();

    return NextResponse.json(
      { success: true, message: 'AI assistant disabled' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error disabling AI:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to disable AI' },
      { status: 500 }
    );
  }
}

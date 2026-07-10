import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/db';
import { authOptions } from '@/lib/auth-options';
import { normalizeLmsRole } from '@/lib/lms-role';
import Meeting from '@/models/Meeting';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function DELETE(
  _: NextRequest,
  { params }: { params: { meetingId: string } }
) {
  try {
    const meetingId = String(params?.meetingId || '').trim();
    if (!meetingId) {
      return NextResponse.json({ error: 'meetingId is required' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    const userEmail = String(session?.user?.email || '').trim().toLowerCase();
    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const [meeting, dbUser] = await Promise.all([
      Meeting.findOne({ meetingId }),
      User.findOne({ email: userEmail }),
    ]);

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    const role = normalizeLmsRole(
      String((dbUser as any)?.role || (session.user as any)?.lmsRole || (session.user as any)?.role || '')
    );
    const isHost = String(meeting.hostEmail || '').toLowerCase() === userEmail;
    const canDelete = isHost || role === 'instructor' || role === 'admin';

    if (!canDelete) {
      return NextResponse.json(
        { error: 'Only meeting hosts and instructors can delete meeting summaries.' },
        { status: 403 }
      );
    }

    meeting.summary = '';
    meeting.keyNotes = [];
    meeting.keyDecisions = [];
    meeting.actionItems = [];
    await meeting.save();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[meeting-summary] delete failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete meeting summary' },
      { status: 500 }
    );
  }
}

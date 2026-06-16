export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth-options';
import dbConnect from '../../../../lib/db';
import User from '../../../../models/User';
import Meeting from '../../../../models/Meeting';

async function checkEnterpriseAuth() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { authorized: false, organizationId: null };
  }
  
  const user = session.user as any;
  const isAuthorized = user.role === 'enterprise_admin' || user.role === 'admin';
  
  return {
    authorized: isAuthorized,
    organizationId: user.organizationId,
  };
}

export async function GET() {
  try {
    const { authorized, organizationId } = await checkEnterpriseAuth();
    if (!authorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!organizationId) {
      return NextResponse.json({ error: 'No organization linked' }, { status: 400 });
    }

    await dbConnect();

    // Find all users belonging to the organization
    const orgMembers = await User.find({ organizationId });
    const memberEmails = orgMembers.map((m) => m.email);

    // Find meetings hosted by organization members
    const meetings = await Meeting.find({ hostEmail: { $in: memberEmails } });

    // Aggregate statistics
    const totalMembers = orgMembers.length;
    const totalMeetings = meetings.length;

    // Calculate active rooms (touched in the last 2 hours)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const activeMeetings = meetings.filter((meeting) => {
      const touchTime = meeting.lastSessionAt || meeting.updatedAt || meeting.createdAt;
      return new Date(touchTime) >= twoHoursAgo;
    }).length;

    // Calculate total participant joins (mock joinCount aggregator)
    const totalParticipantJoins = meetings.reduce((sum, meeting) => sum + (meeting.joinCount || 0), 0);

    // Mock weekly activity for chart: last 7 days of meeting creation counts
    const meetingsByDay = Array.from({ length: 7 }).map((_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - index);
      const dateStr = date.toLocaleDateString('en-US', { weekday: 'short' });
      
      const count = meetings.filter((meeting) => {
        const createDate = new Date(meeting.createdAt);
        return createDate.toDateString() === date.toDateString();
      }).length;

      return { day: dateStr, count };
    }).reverse();

    return NextResponse.json({
      success: true,
      stats: {
        totalMembers,
        totalMeetings,
        activeMeetings,
        totalParticipantJoins,
        meetingsByDay,
      },
    });
  } catch (error: any) {
    console.error('Enterprise stats GET error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

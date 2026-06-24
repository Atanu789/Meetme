import { NextRequest } from 'next/server';
import Meeting from '@/models/Meeting';
import { getLmsContext, json } from '../../_shared';

export async function GET(_: NextRequest) {
  const { context, response } = await getLmsContext();
  if (!context) return response;

  try {
    // Get all meetings created by the instructor
    const meetings = await Meeting.find({
      hostEmail: context.userEmail
    }).sort({ createdAt: -1 }).limit(50);

    return json({
      success: true,
      meetings: meetings.map(meeting => ({
        _id: meeting._id.toString(),
        meetingId: meeting.meetingId, // Return both IDs for flexibility
        roomName: meeting.title,
        title: meeting.title,
        createdAt: meeting.createdAt,
      }))
    });
  } catch (error: any) {
    console.error('Error fetching meetings:', error);
    return json({ error: error.message || 'Failed to fetch meetings' }, 500);
  }
}

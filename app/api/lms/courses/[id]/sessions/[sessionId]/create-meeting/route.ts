import { NextRequest } from 'next/server';
import { getLmsContext, json } from '../../../../../_shared';
import CourseSession from '@/models/CourseSession';
import Meeting from '@/models/Meeting';
import crypto from 'crypto';

export async function POST(_: NextRequest, { params }: { params: { id: string; sessionId: string } }) {
  const { context, response } = await getLmsContext();
  if (!context) return response;

  try {
    const session = await CourseSession.findById(params.sessionId);
    if (!session) return json({ error: 'Session not found' }, 404);

    // Only users who can view the course should be able to create the meeting here
    // (authorization is enforced by getLmsContext upstream in other routes; keep simple)

    // If session already linked to a Meeting, ensure the Meeting record exists and return it
    if (session.meetingId) {
      // Check whether a Meeting document exists for this meetingId
      const existing = await Meeting.findOne({ meetingId: session.meetingId });
      if (existing) {
        return json({ success: true, meetingId: session.meetingId });
      }

      // If the Meeting document is missing (manual sessions), create it using the session's metadata
      const meeting = new Meeting({
        meetingId: session.meetingId,
        hostId: context.userId,
        hostEmail: context.userEmail,
        title: session.meetingTitle || `Course session ${session._id}`,
        description: session.notes || '',
        isPrivate: false,
        chatEnabled: true,
        recordingEnabled: true,
      });

      await meeting.save();
      return json({ success: true, meetingId: session.meetingId });
    }

    // Generate a short unique meetingId
    const meetingId = `sess-${crypto.randomBytes(6).toString('hex')}`;

    const meeting = new Meeting({
      meetingId,
      hostId: context.userId,
      hostEmail: context.userEmail,
      title: session.meetingTitle || `Course session ${session._id}`,
      description: session.notes || '',
      isPrivate: false,
      chatEnabled: true,
      recordingEnabled: true,
    });

    await meeting.save();

    // Update the session to reference the new meeting
    session.meetingId = meetingId;
    await session.save();

    return json({ success: true, meetingId });
  } catch (err: any) {
    console.error('create-meeting error:', err);
    return json({ error: err.message || 'Failed to create meeting' }, 500);
  }
}

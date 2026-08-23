import { NextRequest } from 'next/server';
import { canManageCourse, getCourseOr404, getLmsContext, json } from '../../../../../_shared';
import CourseSession from '@/models/CourseSession';
import Meeting from '@/models/Meeting';
import crypto from 'crypto';
import { checkRoomCreationLimit } from '@/lib/membership';
import { getWorkspaceQuota } from '@/lib/workspace-usage';

export async function POST(_: NextRequest, { params }: { params: { id: string; sessionId: string } }) {
  const { context, response } = await getLmsContext();
  if (!context) return response;

  try {
    const session = await CourseSession.findById(params.sessionId);
    if (!session) return json({ error: 'Session not found' }, 404);

    const courseResult = await getCourseOr404(params.id);
    if (!courseResult.course) return courseResult.response;
    if (session.courseId !== params.id) return json({ error: 'Session not found' }, 404);
    if (!canManageCourse(courseResult.course, context)) return json({ error: 'Forbidden' }, 403);

    const workspaceQuota = await getWorkspaceQuota(context.userEmail, context.lmsRole === 'admin');
    if (!workspaceQuota) return json({ error: 'Active workspace plan required' }, 402);

    // If session already linked to a Meeting, ensure the Meeting record exists and return it
    if (session.meetingId) {
      // Check whether a Meeting document exists for this meetingId
      const existing = await Meeting.findOne({ meetingId: session.meetingId });
      if (existing) {
        return json({ success: true, meetingId: session.meetingId });
      }

      if (context.lmsRole !== 'admin' && workspaceQuota.scope === 'user') {
        const membershipCheck = await checkRoomCreationLimit(context.userEmail);
        if (!membershipCheck.ok) {
          return json(
            { error: membershipCheck.error, code: membershipCheck.code, membership: membershipCheck.membership || null },
            membershipCheck.status
          );
        }
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
        planSnapshot: workspaceQuota.plan,
        maxParticipants: workspaceQuota.planDefinition.maxParticipants,
        maxMeetingMinutes: workspaceQuota.planDefinition.maxMeetingMinutes,
      });

      await meeting.save();
      return json({ success: true, meetingId: session.meetingId });
    }

    // Generate a short unique meetingId
    const meetingId = `sess-${crypto.randomBytes(6).toString('hex')}`;

    if (context.lmsRole !== 'admin' && workspaceQuota.scope === 'user') {
      const membershipCheck = await checkRoomCreationLimit(context.userEmail);
      if (!membershipCheck.ok) {
        return json(
          { error: membershipCheck.error, code: membershipCheck.code, membership: membershipCheck.membership || null },
          membershipCheck.status
        );
      }
    }

    const meeting = new Meeting({
      meetingId,
      hostId: context.userId,
      hostEmail: context.userEmail,
      title: session.meetingTitle || `Course session ${session._id}`,
      description: session.notes || '',
      isPrivate: false,
      chatEnabled: true,
      recordingEnabled: true,
      planSnapshot: workspaceQuota.plan,
      maxParticipants: workspaceQuota.planDefinition.maxParticipants,
      maxMeetingMinutes: workspaceQuota.planDefinition.maxMeetingMinutes,
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

import { NextRequest } from 'next/server';
import { canManageCourse, canViewCourse, getCourseOr404, getLmsContext, json } from '../../../_shared';
import CourseSession from '@/models/CourseSession';
import Meeting from '@/models/Meeting';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const { context, response } = await getLmsContext();
  if (!context) return response;

  const courseResult = await getCourseOr404(params.id);
  if (!courseResult.course) return courseResult.response;

  if (!canViewCourse(courseResult.course, context)) {
    return json({ error: 'Forbidden' }, 403);
  }

  const sessions = await CourseSession.find({ courseId: params.id }).sort({ startsAt: 1 });
  return json({ success: true, sessions });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { context, response } = await getLmsContext();
  if (!context) return response;

  const courseResult = await getCourseOr404(params.id);
  if (!courseResult.course) return courseResult.response;

  if (!canManageCourse(courseResult.course, context)) {
    return json({ error: 'Forbidden' }, 403);
  }

  const body = await req.json();
  const providedMeetingId = String(body?.meetingId || '').trim();
  const startsAt = body?.startsAt ? new Date(body.startsAt) : null;

  if (!startsAt || Number.isNaN(startsAt.getTime())) {
    return json({ error: 'Valid session start time is required' }, 400);
  }

  // Try to find an existing Meeting if an ID was provided
  let meeting = null;
  if (providedMeetingId) {
    meeting = await Meeting.findOne({ meetingId: providedMeetingId });
  }

  // Determine meetingId to store and meetingTitle to display
  let meetingIdToUse = providedMeetingId || `manual_${params.id}_${Date.now().toString(36)}`;
  let meetingTitle = String(body?.meetingTitle || '').trim();

  if (!providedMeetingId && !meetingTitle) {
    return json({ error: 'Provide a meeting title or select an existing meeting' }, 400);
  }

  if (providedMeetingId && !meeting && !meetingTitle) {
    return json({ error: 'Provided meeting ID not found. Please enter a meeting title.' }, 400);
  }

  // If a meeting exists, prefer its canonical meetingId and title unless overridden
  if (meeting) {
    meetingIdToUse = meeting.meetingId;
    meetingTitle = meetingTitle || meeting.title || '';
  }

  const payload = {
    courseId: params.id,
    meetingId: meetingIdToUse,
    meetingTitle: meetingTitle,
    startsAt,
    endsAt: body?.endsAt ? new Date(body.endsAt) : null,
    status: body?.status || 'scheduled',
    notes: String(body?.notes || '').trim(),
    recordings: Array.isArray(body?.recordings)
      ? body.recordings
      : body?.recordingUrl
        ? [
            {
              title: String(body?.recordingTitle || body?.meetingTitle || meetingTitle || 'Course recording').trim(),
              url: String(body.recordingUrl).trim(),
              storagePath: String(body?.recordingStoragePath || '').trim(),
              createdAt: new Date(),
            },
          ]
        : [],
    createdById: context.userId,
    createdByEmail: context.userEmail,
  };

  if (body?.recordings === undefined && !body?.recordingUrl) {
    delete payload.recordings;
  }

  const session = await CourseSession.findOneAndUpdate(
    { courseId: params.id, meetingId: meetingIdToUse },
    payload,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return json({ success: true, session }, 201);
}

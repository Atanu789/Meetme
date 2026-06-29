import { NextRequest } from 'next/server';
import CourseSession from '@/models/CourseSession';
import { canManageCourse, getCourseOr404, getLmsContext, json } from '@/app/api/lms/_shared';

export async function POST(req: NextRequest, { params }: { params: { id: string; sessionId: string } }) {
  const { context, response } = await getLmsContext();
  if (!context) return response;

  const courseResult = await getCourseOr404(params.id);
  if (!courseResult.course) return courseResult.response;

  if (!canManageCourse(courseResult.course, context)) {
    return json({ error: 'Forbidden' }, 403);
  }

  const session = await CourseSession.findById(params.sessionId);
  if (!session || session.courseId.toString() !== params.id) {
    return json({ error: 'Course session not found' }, 404);
  }

  const body = await req.json();
  const title = String(body?.title || body?.meetingTitle || 'Course recording').trim();
  const url = String(body?.url || '').trim();
  const storagePath = String(body?.storagePath || '').trim();

  if (!title && !url && !storagePath) {
    return json({ error: 'Recording details are required' }, 400);
  }

  session.recordings = [
    ...(session.recordings || []),
    {
      title,
      url,
      storagePath,
      createdAt: new Date(),
    },
  ];

  await session.save();
  return json({ success: true, session });
}

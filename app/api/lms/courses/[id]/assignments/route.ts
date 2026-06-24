import { NextRequest } from 'next/server';
import { canManageCourse, canViewCourse, getCourseOr404, getLmsContext, json } from '../../../_shared';
import Assignment from '@/models/Assignment';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const { context, response } = await getLmsContext();
  if (!context) return response;

  const courseResult = await getCourseOr404(params.id);
  if (!courseResult.course) return courseResult.response;

  if (!canViewCourse(courseResult.course, context)) {
    return json({ error: 'Forbidden' }, 403);
  }

  const assignments = await Assignment.find({ courseId: params.id }).sort({ createdAt: -1 });
  return json({ success: true, assignments });
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
  const title = String(body?.title || '').trim();

  if (!title) {
    return json({ error: 'Assignment title is required' }, 400);
  }

  const assignment = new Assignment({
    courseId: params.id,
    title,
    description: String(body?.description || '').trim(),
    instructions: String(body?.instructions || '').trim(),
    dueAt: body?.dueAt ? new Date(body.dueAt) : null,
    pointsPossible: Number(body?.pointsPossible || 100),
    status: body?.status || 'draft',
    createdById: context.userId,
    createdByEmail: context.userEmail,
    createdByName: context.userName,
    attachmentPaths: Array.isArray(body?.attachmentPaths) ? body.attachmentPaths : [],
  });

  await assignment.save();
  return json({ success: true, assignment }, 201);
}

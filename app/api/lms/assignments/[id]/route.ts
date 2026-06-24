import { NextRequest } from 'next/server';
import Assignment from '@/models/Assignment';
import Submission from '@/models/Submission';
import Course from '@/models/Course';
import { canManageCourse, canViewCourse, getLmsContext, json } from '../../../_shared';

async function getAssignmentWithCourse(assignmentId: string) {
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) {
    return { assignment: null, response: json({ error: 'Assignment not found' }, 404) };
  }

  const course = await Course.findById(assignment.courseId);
  if (!course) {
    return { assignment: null, response: json({ error: 'Course not found' }, 404) };
  }

  return { assignment, course, response: null };
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const { context, response } = await getLmsContext();
  if (!context) return response;

  const result = await getAssignmentWithCourse(params.id);
  if (!result.assignment || !result.course) return result.response;

  if (!canViewCourse(result.course, context)) {
    return json({ error: 'Forbidden' }, 403);
  }

  return json({ success: true, assignment: result.assignment });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { context, response } = await getLmsContext();
  if (!context) return response;

  const result = await getAssignmentWithCourse(params.id);
  if (!result.assignment || !result.course) return result.response;

  if (!canManageCourse(result.course, context)) {
    return json({ error: 'Forbidden' }, 403);
  }

  const body = await req.json();
  const assignment = result.assignment;

  if (body?.title !== undefined) assignment.title = String(body.title).trim() || assignment.title;
  if (body?.description !== undefined) assignment.description = String(body.description || '');
  if (body?.instructions !== undefined) assignment.instructions = String(body.instructions || '');
  if (body?.dueAt !== undefined) assignment.dueAt = body.dueAt ? new Date(body.dueAt) : null;
  if (body?.pointsPossible !== undefined) assignment.pointsPossible = Number(body.pointsPossible || assignment.pointsPossible);
  if (body?.status !== undefined) assignment.status = body.status;
  if (body?.attachmentPaths !== undefined) assignment.attachmentPaths = Array.isArray(body.attachmentPaths) ? body.attachmentPaths : [];

  await assignment.save();
  return json({ success: true, assignment });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const { context, response } = await getLmsContext();
  if (!context) return response;

  const result = await getAssignmentWithCourse(params.id);
  if (!result.assignment || !result.course) return result.response;

  if (!canManageCourse(result.course, context)) {
    return json({ error: 'Forbidden' }, 403);
  }

  await Promise.all([
    Submission.deleteMany({ assignmentId: params.id }),
    Assignment.findByIdAndDelete(params.id),
  ]);

  return json({ success: true });
}

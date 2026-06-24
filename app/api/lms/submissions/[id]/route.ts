import { NextRequest } from 'next/server';
import Assignment from '@/models/Assignment';
import Course from '@/models/Course';
import Submission from '@/models/Submission';
import { canManageCourse, getLmsContext, json } from '../../../_shared';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { context, response } = await getLmsContext();
  if (!context) return response;

  const submission = await Submission.findById(params.id);
  if (!submission) {
    return json({ error: 'Submission not found' }, 404);
  }

  const assignment = await Assignment.findById(submission.assignmentId);
  if (!assignment) {
    return json({ error: 'Assignment not found' }, 404);
  }

  const course = await Course.findById(assignment.courseId);
  if (!course) {
    return json({ error: 'Course not found' }, 404);
  }

  if (!canManageCourse(course, context)) {
    return json({ error: 'Forbidden' }, 403);
  }

  const body = await req.json();
  if (body?.score !== undefined) {
    submission.grade.score = body.score === '' || body.score === null ? null : Number(body.score);
  }
  if (body?.feedback !== undefined) submission.grade.feedback = String(body.feedback || '');
  submission.grade.gradedById = context.userId;
  submission.grade.gradedByEmail = context.userEmail;
  submission.grade.gradedAt = new Date();
  submission.status = body?.status || 'returned';

  await submission.save();
  return json({ success: true, submission });
}

import { NextRequest } from 'next/server';
import Assignment from '@/models/Assignment';
import Course from '@/models/Course';
import Submission from '@/models/Submission';
import { canManageCourse, canViewCourse, getLmsContext, json } from '../../../../_shared';

async function getAssignmentCourse(assignmentId: string) {
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) {
    return { assignment: null, course: null, response: json({ error: 'Assignment not found' }, 404) };
  }

  const course = await Course.findById(assignment.courseId);
  if (!course) {
    return { assignment: null, course: null, response: json({ error: 'Course not found' }, 404) };
  }

  return { assignment, course, response: null };
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const { context, response } = await getLmsContext();
  if (!context) return response;

  const result = await getAssignmentCourse(params.id);
  if (!result.assignment || !result.course) return result.response;

  if (!canViewCourse(result.course, context)) {
    return json({ error: 'Forbidden' }, 403);
  }

  const submissions = canManageCourse(result.course, context)
    ? await Submission.find({ assignmentId: params.id }).sort({ updatedAt: -1 })
    : await Submission.find({ assignmentId: params.id, studentEmail: context.userEmail }).sort({ updatedAt: -1 });

  return json({ success: true, submissions });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { context, response } = await getLmsContext();
  if (!context) return response;

  const result = await getAssignmentCourse(params.id);
  if (!result.assignment || !result.course) return result.response;

  if (!canViewCourse(result.course, context)) {
    return json({ error: 'Forbidden' }, 403);
  }

  if (context.lmsRole === 'student' && result.assignment.status !== 'published') {
    return json({ error: 'Assignment is not open for submission' }, 403);
  }

  if (context.lmsRole === 'student' && !result.course.enrolledStudents.some((student: any) => student.email === context.userEmail)) {
    return json({ error: 'You are not enrolled in this course' }, 403);
  }

  const body = await req.json();
  const content = String(body?.content || '').trim();
  const attachmentPaths = Array.isArray(body?.attachmentPaths) ? body.attachmentPaths : [];

  const submission = await Submission.findOneAndUpdate(
    { assignmentId: params.id, studentEmail: context.userEmail },
    {
      assignmentId: params.id,
      courseId: result.course._id.toString(),
      studentId: context.userId,
      studentEmail: context.userEmail,
      studentName: context.userName,
      content,
      attachmentPaths,
      status: 'submitted',
      submittedAt: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return json({ success: true, submission }, 201);
}

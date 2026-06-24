import { NextRequest } from 'next/server';
import Course from '@/models/Course';
import CourseSession from '@/models/CourseSession';
import Assignment from '@/models/Assignment';
import Submission from '@/models/Submission';
import { canManageCourse, getCourseOr404, getLmsContext, json, canViewCourse } from '../../_shared';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const { context, response } = await getLmsContext();
  if (!context) return response;

  const courseResult = await getCourseOr404(params.id);
  if (!courseResult.course) return courseResult.response;

  if (!canViewCourse(courseResult.course, context)) {
    return json({ error: 'Forbidden' }, 403);
  }

  return json({ success: true, course: courseResult.course });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { context, response } = await getLmsContext();
  if (!context) return response;

  const courseResult = await getCourseOr404(params.id);
  if (!courseResult.course) return courseResult.response;

  if (!canManageCourse(courseResult.course, context)) {
    return json({ error: 'Forbidden' }, 403);
  }

  const body = await req.json();
  const course = courseResult.course;

  if (body?.title !== undefined) course.title = String(body.title).trim() || course.title;
  if (body?.description !== undefined) course.description = String(body.description || '');
  if (body?.code !== undefined) course.code = String(body.code).trim() || course.code;
  if (body?.status !== undefined) course.status = body.status;

  await course.save();
  return json({ success: true, course });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const { context, response } = await getLmsContext();
  if (!context) return response;

  const courseResult = await getCourseOr404(params.id);
  if (!courseResult.course) return courseResult.response;

  if (!canManageCourse(courseResult.course, context)) {
    return json({ error: 'Forbidden' }, 403);
  }

  const courseId = params.id;
  const assignments = await Assignment.find({ courseId }, '_id');
  const assignmentIds = assignments.map((assignment) => assignment._id.toString());

  await Promise.all([
    CourseSession.deleteMany({ courseId }),
    Submission.deleteMany({ courseId }),
    assignmentIds.length > 0 ? Submission.deleteMany({ assignmentId: { $in: assignmentIds } }) : Promise.resolve(),
    Assignment.deleteMany({ courseId }),
    Course.findByIdAndDelete(courseId),
  ]);

  return json({ success: true });
}

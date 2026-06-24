import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { requireLmsUserContext } from '@/lib/lms-auth';
import { LmsRole } from '@/lib/lms-role';
import Course from '@/models/Course';

export function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

export async function getLmsContext(requiredRoles?: LmsRole[]) {
  await dbConnect();
  const result = await requireLmsUserContext(requiredRoles);

  if (!result.context) {
    return { context: null, response: json({ error: result.error || 'Unauthorized' }, result.status) };
  }

  return { context: result.context, response: null };
}

export async function getCourseOr404(courseId: string) {
  const course = await Course.findById(courseId);

  if (!course) {
    return { course: null, response: json({ error: 'Course not found' }, 404) };
  }

  return { course, response: null };
}

export function canViewCourse(course: any, context: { userEmail: string; lmsRole: LmsRole }) {
  if (context.lmsRole === 'admin') {
    return true;
  }

  if (!course) {
    return false;
  }

  if ((course.instructorEmail || '').toLowerCase() === context.userEmail) {
    return true;
  }

  return (course.enrolledStudents || []).some((student: any) => (student.email || '').toLowerCase() === context.userEmail);
}

export function canManageCourse(course: any, context: { userEmail: string; lmsRole: LmsRole }) {
  if (context.lmsRole === 'admin') {
    return true;
  }

  return (course?.instructorEmail || '').toLowerCase() === context.userEmail;
}

export function isCourseMember(course: any, context: { userEmail: string; lmsRole: LmsRole }) {
  return canViewCourse(course, context);
}

export function serializeCourse(course: any) {
  return {
    ...course.toObject(),
    enrolledStudentCount: course.enrolledStudents?.length || 0,
  };
}

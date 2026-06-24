import { NextRequest } from 'next/server';
import { canManageCourse, getCourseOr404, getLmsContext, json } from '../../../_shared';

function normalizeStudents(body: any) {
  if (Array.isArray(body?.students)) {
    return body.students
      .map((student: any) => ({
        email: String(student?.email || '').trim().toLowerCase(),
        name: String(student?.name || '').trim(),
        userId: String(student?.userId || '').trim(),
      }))
      .filter((student: any) => student.email);
  }

  const email = String(body?.studentEmail || body?.email || '').trim().toLowerCase();
  if (!email) return [];

  return [
    {
      email,
      name: String(body?.studentName || body?.name || '').trim(),
      userId: String(body?.studentId || body?.userId || '').trim(),
    },
  ];
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
  const students = normalizeStudents(body);

  if (students.length === 0) {
    return json({ error: 'At least one student email is required' }, 400);
  }

  const existing = new Map((courseResult.course.enrolledStudents || []).map((student: any) => [student.email.toLowerCase(), student]));
  for (const student of students) {
    existing.set(student.email, {
      userId: student.userId || '',
      email: student.email,
      name: student.name || '',
      enrolledAt: new Date(),
    });
  }

  courseResult.course.enrolledStudents = Array.from(existing.values());
  await courseResult.course.save();

  return json({ success: true, course: courseResult.course });
}

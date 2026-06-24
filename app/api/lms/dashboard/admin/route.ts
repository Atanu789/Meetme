import { NextRequest } from 'next/server';
import Course from '@/models/Course';
import CourseSession from '@/models/CourseSession';
import Assignment from '@/models/Assignment';
import Submission from '@/models/Submission';
import { getLmsContext, json } from '../../_shared';

export async function GET(_: NextRequest) {
  const { context, response } = await getLmsContext();
  if (!context) return response;

  if (context.lmsRole !== 'admin') {
    return json({ error: 'Forbidden' }, 403);
  }

  const [courses, sessions, assignments, submissions] = await Promise.all([
    Course.find({}).sort({ updatedAt: -1 }).limit(100),
    CourseSession.find({}).sort({ updatedAt: -1 }).limit(100),
    Assignment.find({}).sort({ updatedAt: -1 }).limit(100),
    Submission.find({}).sort({ updatedAt: -1 }).limit(100),
  ]);

  return json({
    success: true,
    dashboard: {
      totalCourses: courses.length,
      totalSessions: sessions.length,
      totalAssignments: assignments.length,
      totalSubmissions: submissions.length,
      courses,
      sessions,
      assignments,
      submissions,
    },
  });
}

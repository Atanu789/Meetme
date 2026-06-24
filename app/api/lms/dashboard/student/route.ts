import { NextRequest } from 'next/server';
import Course from '@/models/Course';
import CourseSession from '@/models/CourseSession';
import Assignment from '@/models/Assignment';
import Submission from '@/models/Submission';
import { getLmsContext, json } from '../../_shared';

export async function GET(_: NextRequest) {
  const { context, response } = await getLmsContext();
  if (!context) return response;

  const courses = await Course.find({ 'enrolledStudents.email': context.userEmail }).sort({ updatedAt: -1 });
  const courseIds = courses.map((course) => course._id.toString());
  const now = new Date();
  const nextMonth = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

  const [upcomingClasses, assignments, sessions] = await Promise.all([
    CourseSession.find({ courseId: { $in: courseIds }, startsAt: { $gte: now, $lte: nextMonth } }).sort({ startsAt: 1 }).limit(12),
    Assignment.find({ courseId: { $in: courseIds }, status: 'published' }).sort({ dueAt: 1 }),
    CourseSession.find({ courseId: { $in: courseIds } }).sort({ updatedAt: -1 }).limit(12),
  ]);

  const submissions = await Submission.find({
    courseId: { $in: courseIds },
    studentEmail: context.userEmail,
  });

  const submittedAssignmentIds = new Set(submissions.map((submission) => submission.assignmentId.toString()));
  const pendingAssignments = assignments.filter((assignment) => !submittedAssignmentIds.has(assignment._id.toString()));

  const recentRecordings = sessions
    .flatMap((session) =>
      (session.recordings || []).map((recording: any) => ({
        ...recording,
        courseId: session.courseId,
        meetingId: session.meetingId,
        courseSessionId: session._id.toString(),
      }))
    )
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, 8);

  return json({
    success: true,
    dashboard: {
      courses,
      upcomingClasses,
      pendingAssignments,
      recentRecordings,
      submissions,
    },
  });
}

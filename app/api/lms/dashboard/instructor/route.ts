import { NextRequest } from 'next/server';
import Course from '@/models/Course';
import CourseSession from '@/models/CourseSession';
import Assignment from '@/models/Assignment';
import Submission from '@/models/Submission';
import Meeting from '@/models/Meeting';
import { getLmsContext, json } from '../../_shared';

export async function GET(_: NextRequest) {
  const { context, response } = await getLmsContext();
  if (!context) return response;

  const courseFilter = context.lmsRole === 'admin' ? {} : { instructorEmail: context.userEmail };
  const courses = await Course.find(courseFilter).sort({ updatedAt: -1 });
  const courseIds = courses.map((course) => course._id.toString());
  const now = new Date();
  const nextMonth = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

  const [upcomingClasses, assignments, sessions, submissions, aiMeetings] = await Promise.all([
    CourseSession.find({ courseId: { $in: courseIds }, startsAt: { $gte: now, $lte: nextMonth } }).sort({ startsAt: 1 }).limit(20),
    Assignment.find({ courseId: { $in: courseIds } }).sort({ createdAt: -1 }).limit(20),
    CourseSession.find({ courseId: { $in: courseIds } }).sort({ updatedAt: -1 }).limit(20),
    Submission.find({ courseId: { $in: courseIds } }).sort({ updatedAt: -1 }).limit(20),
    Meeting.find({
      hostEmail: context.userEmail,
      $or: [
        { summary: { $exists: true, $ne: '' } },
        { keyNotes: { $exists: true, $ne: [] } },
        { transcript: { $exists: true, $ne: [] } },
      ],
    })
      .sort({ updatedAt: -1 })
      .limit(8),
  ]);

  const assignmentMap = new Map(assignments.map((assignment) => [assignment._id.toString(), assignment]));
  const submissionsByAssignment = submissions.reduce<Record<string, number>>((accumulator, submission) => {
    accumulator[submission.assignmentId.toString()] = (accumulator[submission.assignmentId.toString()] || 0) + 1;
    return accumulator;
  }, {});

  const courseSummaries = courses.map((course) => ({
    ...course.toObject(),
    assignmentCount: assignments.filter((assignment) => assignment.courseId.toString() === course._id.toString()).length,
    sessionCount: sessions.filter((session) => session.courseId.toString() === course._id.toString()).length,
    studentCount: course.enrolledStudents.length,
  }));

  const recentRecordings = sessions
    .flatMap((session) =>
      (session.recordings || []).map((recording: any) => ({
        ...recording,
        courseId: session.courseId,
        meetingId: session.meetingId,
      }))
    )
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, 10);

  const pendingGrading = submissions.filter((submission) => submission.grade?.score === null || submission.grade?.score === undefined).slice(0, 10);

  return json({
    success: true,
    dashboard: {
      courses: courseSummaries,
      upcomingClasses,
      assignments,
      sessions,
      submissions,
      recentRecordings,
      pendingGrading,
      assignmentMap: Array.from(assignmentMap.values()),
      submissionsByAssignment,
      aiMeetings,
    },
  });
}

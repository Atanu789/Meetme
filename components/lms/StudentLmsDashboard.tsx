'use client';

import { useEffect, useMemo, useState } from 'react';
import { GlowCard } from '@/components/ui/glow-card';
import { GradientBorderButton } from '@/components/ui/gradient-border-button';
import { LmsShell } from './LmsShell';
import { LmsMeetingActions } from './LmsMeetingActions';

type StudentDashboardData = {
  courses: any[];
  upcomingClasses: any[];
  pendingAssignments: any[];
  recentRecordings: any[];
  submissions: any[];
};

export function StudentLmsDashboard() {
  const [dashboard, setDashboard] = useState<StudentDashboardData>({ courses: [], upcomingClasses: [], pendingAssignments: [], recentRecordings: [], submissions: [] });
  const [loading, setLoading] = useState(true);
  const [activeAssignment, setActiveAssignment] = useState<any | null>(null);
  const [submissionContent, setSubmissionContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const response = await fetch('/api/lms/dashboard/student');
        const body = await response.json().catch(() => ({}));
        if (response.ok) {
          setDashboard(body.dashboard || { courses: [], upcomingClasses: [], pendingAssignments: [], recentRecordings: [], submissions: [] });
        } else {
          setLoadError(body.error || 'Failed to load student dashboard');
        }
      } catch (error) {
        setLoadError('Failed to load student dashboard');
      }
      setLoading(false);
    };

    void load();
  }, []);

  const stats = useMemo(
    () => [
      { label: 'My courses', value: dashboard.courses.length, helper: 'Enrolled learning tracks' },
      { label: 'Upcoming classes', value: dashboard.upcomingClasses.length, helper: 'Scheduled live sessions' },
      { label: 'Pending assignments', value: dashboard.pendingAssignments.length, helper: 'Work waiting for submission' },
      { label: 'Recent recordings', value: dashboard.recentRecordings.length, helper: 'Saved course sessions' },
    ],
    [dashboard]
  );

  const learningSignals = [
    { label: 'Course progress', value: Math.min(100, dashboard.courses.length * 22 + dashboard.submissions.length * 8), tone: 'from-cyan-400 to-blue-500' },
    { label: 'Class readiness', value: Math.min(100, dashboard.upcomingClasses.length * 26 + 38), tone: 'from-emerald-400 to-teal-500' },
    { label: 'Assignment load', value: Math.min(100, dashboard.pendingAssignments.length * 24 + 18), tone: 'from-amber-400 to-orange-500' },
  ];

  const handleSubmitAssignment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeAssignment) return;

    setSubmitting(true);
    setMessage('');

    const response = await fetch(`/api/lms/assignments/${activeAssignment._id}/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: submissionContent }),
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(body.error || 'Submission failed');
      setSubmitting(false);
      return;
    }

    setMessage('Assignment submitted');
    setSubmissionContent('');
    setActiveAssignment(null);
    setSubmitting(false);

    const reload = await fetch('/api/lms/dashboard/student');
    const reloadBody = await reload.json().catch(() => ({}));
    if (reload.ok) {
    setDashboard(reloadBody.dashboard || dashboard);
    }
  };

  const handleJoinSession = async (session: any) => {
    setMessage('');
    try {
      const resp = await fetch(`/api/lms/courses/${session.courseId}/sessions/${session._id}/create-meeting`, { method: 'POST' });
      const body = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        setMessage(body.error || 'Failed to prepare meeting');
        return;
      }

      const meetingId = body.meetingId || session.meetingId;
      if (!meetingId) {
        setMessage('No meeting id available');
        return;
      }

      window.location.href = `/room/${encodeURIComponent(meetingId)}`;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('join session error', err);
      setMessage('Failed to join session');
    }
  };

  if (loading || loadError) {
    return (
      <LmsShell
        kicker="Student Dashboard"
        title="My Courses"
        description="Track your classes, submit work, and jump back into recordings without leaving the Melanam workspace."
        stats={stats}
      >
        <LmsMeetingActions roleLabel="Student" />
        <GlowCard>
          <div className="flex flex-col gap-2">
            <p className="font-display text-xl font-semibold text-slate-950">
              {loadError ? 'Could not load student dashboard' : 'Loading your learning workspace'}
            </p>
            <p className="text-sm leading-6 text-slate-600">
              {loadError || 'Courses, classes, assignments, recordings, and submissions are being prepared.'}
            </p>
            {loadError ? (
              <button onClick={() => window.location.reload()} className="mt-2 w-fit rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
                Refresh dashboard
              </button>
            ) : null}
          </div>
        </GlowCard>
      </LmsShell>
    );
  }

  return (
    <LmsShell
      kicker="Student Dashboard"
      title="My Courses"
      description="Track your classes, submit work, and jump back into recordings without leaving the Melanam workspace."
      stats={stats}
    >
      <LmsMeetingActions roleLabel="Student" />

      <GlowCard className="p-0">
        <div className="grid min-w-0 overflow-hidden lg:grid-cols-[0.85fr_1.15fr]">
          <div className="bg-gradient-to-br from-cyan-50 via-white to-emerald-50 p-6">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-700">Learning Pulse</p>
            <h3 className="mt-2 font-display text-2xl font-semibold text-slate-950">Stay ready for the next live class</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              A quick glance at courses, upcoming sessions, pending work, and recordings connected to your workspace.
            </p>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-3">
            {learningSignals.map((signal) => (
              <div key={signal.label} className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>{signal.label}</span>
                  <span>{signal.value}%</span>
                </div>
                <div className="h-28 rounded-2xl bg-slate-100 p-2">
                  <div className="flex h-full items-end rounded-xl bg-white p-1">
                    <div className={`w-full rounded-xl bg-gradient-to-t ${signal.tone}`} style={{ height: `${Math.max(12, signal.value)}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </GlowCard>

      {message ? <GlowCard><p className="text-sm text-slate-700">{message}</p></GlowCard> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <GlowCard>
          <h3 className="font-display text-xl font-semibold text-slate-950">My Courses</h3>
          <div className="mt-4 space-y-3">
            {dashboard.courses.map((course) => (
              <div key={course._id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{course.title}</p>
                    <p className="text-xs text-slate-500">{course.code}</p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-700">Active</span>
                </div>
                <p className="mt-3 text-sm text-slate-600">{course.description || 'No description provided.'}</p>
              </div>
            ))}
            {dashboard.courses.length === 0 ? <p className="text-sm text-slate-500">You are not enrolled in any courses yet.</p> : null}
          </div>
        </GlowCard>

        <GlowCard>
          <h3 className="font-display text-xl font-semibold text-slate-950">Upcoming Classes</h3>
          <div className="mt-4 space-y-3">
            {dashboard.upcomingClasses.map((session) => (
              <div key={session._id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{session.meetingTitle || session.meetingId}</p>
                    <p className="text-xs text-slate-500">{new Date(session.startsAt).toLocaleString()}</p>
                    <p className="mt-2 text-sm text-slate-600">{session.notes || 'Live class session linked to your course.'}</p>
                  </div>
                  <div className="flex items-center">
                    <button onClick={() => handleJoinSession(session)} className="rounded-full bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white">Join</button>
                  </div>
                </div>
              </div>
            ))}
            {dashboard.upcomingClasses.length === 0 ? <p className="text-sm text-slate-500">No upcoming classes yet.</p> : null}
          </div>
        </GlowCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <GlowCard>
          <h3 className="font-display text-xl font-semibold text-slate-950">Pending Assignments</h3>
          <div className="mt-4 space-y-3">
            {dashboard.pendingAssignments.map((assignment) => (
              <div key={assignment._id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{assignment.title}</p>
                    <p className="text-xs text-slate-500">Due {assignment.dueAt ? new Date(assignment.dueAt).toLocaleString() : 'any time'}</p>
                  </div>
                  <GradientBorderButton variant="create" onClick={() => setActiveAssignment(assignment)}>Submit</GradientBorderButton>
                </div>
                <p className="mt-2 text-sm text-slate-600">{assignment.description || assignment.instructions || 'No instructions provided.'}</p>
              </div>
            ))}
            {dashboard.pendingAssignments.length === 0 ? <p className="text-sm text-slate-500">All caught up. Nothing pending right now.</p> : null}
          </div>
        </GlowCard>

        <GlowCard>
          <h3 className="font-display text-xl font-semibold text-slate-950">Recent Recordings</h3>
          <div className="mt-4 space-y-3">
            {dashboard.recentRecordings.map((recording) => (
              <div key={`${recording.courseSessionId}-${recording.createdAt}`} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="text-sm font-semibold text-slate-950">{recording.title}</p>
                <p className="text-xs text-slate-500">{new Date(recording.createdAt).toLocaleString()}</p>
                {recording.url ? (
                  <a href={recording.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-semibold text-sky-600 underline">
                    Open recording
                  </a>
                ) : null}
              </div>
            ))}
            {dashboard.recentRecordings.length === 0 ? <p className="text-sm text-slate-500">Recordings linked to your courses will show up here.</p> : null}
          </div>
        </GlowCard>
      </div>

      {activeAssignment ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm">
          <GlowCard className="w-full max-w-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Submit Assignment</p>
                <h3 className="mt-2 font-display text-2xl font-semibold text-slate-950">{activeAssignment.title}</h3>
              </div>
              <button onClick={() => setActiveAssignment(null)} className="text-sm font-semibold text-slate-500">Close</button>
            </div>
            <form onSubmit={handleSubmitAssignment} className="mt-6 space-y-4">
              <textarea
                value={submissionContent}
                onChange={(event) => setSubmissionContent(event.target.value)}
                className="min-h-[180px] w-full rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-400"
                placeholder="Write your submission here"
              />
              <div className="flex gap-3">
                <button type="button" onClick={() => setActiveAssignment(null)} className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700">
                  Cancel
                </button>
                <button disabled={submitting} type="submit" className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white">
                  {submitting ? 'Submitting...' : 'Submit work'}
                </button>
              </div>
            </form>
          </GlowCard>
        </div>
      ) : null}
    </LmsShell>
  );
}

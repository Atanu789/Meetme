'use client';

import { useEffect, useMemo, useState } from 'react';
import FileShare from '@/components/FileShare';
import { GlowCard } from '@/components/ui/glow-card';
import { GradientBorderButton } from '@/components/ui/gradient-border-button';
import { LmsShell } from './LmsShell';
import { LmsMeetingActions } from './LmsMeetingActions';
import { AIMeetingNotesPanel } from './AIMeetingNotesPanel';

type InstructorDashboardData = {
  courses: any[];
  upcomingClasses: any[];
  assignments: any[];
  sessions: any[];
  submissions: any[];
  recentRecordings: any[];
  pendingGrading: any[];
  submissionsByAssignment: Record<string, number>;
  availableMeetings?: any[];
  aiMeetings?: any[];
};

const emptyCourseForm = {
  title: '',
  description: '',
  slug: '',
  code: '',
  status: 'draft',
};

const emptyAssignmentForm = {
  title: '',
  description: '',
  instructions: '',
  dueAt: '',
  pointsPossible: 100,
  status: 'draft',
};

export function InstructorLmsDashboard() {
  const [dashboard, setDashboard] = useState<InstructorDashboardData>({
    courses: [],
    upcomingClasses: [],
    assignments: [],
    sessions: [],
    submissions: [],
    recentRecordings: [],
    pendingGrading: [],
    submissionsByAssignment: {},
    availableMeetings: [],
    aiMeetings: [],
  });
  const [loading, setLoading] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [courseForm, setCourseForm] = useState(emptyCourseForm);
  const [editingCourseId, setEditingCourseId] = useState('');
  const [enrollmentValue, setEnrollmentValue] = useState('');
  const [sessionForm, setSessionForm] = useState({ meetingId: '', meetingTitle: '', startsAt: '', notes: '' });
  const [assignmentForm, setAssignmentForm] = useState(emptyAssignmentForm);
  const [gradingTarget, setGradingTarget] = useState<any | null>(null);
  const [gradeScore, setGradeScore] = useState('');
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [message, setMessage] = useState('');
  const [loadError, setLoadError] = useState('');

  const selectedCourse = dashboard.courses.find((course) => course._id === selectedCourseId) || dashboard.courses[0] || null;

  const selectedAssignments = dashboard.assignments.filter((assignment) => assignment.courseId === selectedCourse?._id || assignment.courseId?.toString?.() === selectedCourse?._id);
  const selectedSessions = dashboard.sessions.filter((session) => session.courseId === selectedCourse?._id || session.courseId?.toString?.() === selectedCourse?._id);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const [dashboardResponse, meetingsResponse] = await Promise.all([
          fetch('/api/lms/dashboard/instructor'),
          fetch('/api/lms/courses/meetings')
        ]);
        
        const dashboardBody = await dashboardResponse.json().catch(() => ({}));
        const meetingsBody = await meetingsResponse.json().catch(() => ({ meetings: [] }));
        
        console.log('Dashboard loaded:', dashboardBody);
        console.log('Meetings loaded:', meetingsBody);
        
        if (dashboardResponse.ok) {
          const dashboardData = dashboardBody.dashboard || dashboard;
          setDashboard({
            ...dashboardData,
            availableMeetings: meetingsBody.meetings || []
          });
          const firstCourse = dashboardData.courses?.[0];
          if (firstCourse && !selectedCourseId) {
            setSelectedCourseId(firstCourse._id);
          }
        } else {
          setLoadError(dashboardBody.error || 'Failed to load instructor dashboard');
        }
      } catch (err) {
        console.error('Error loading dashboard:', err);
        setLoadError('Failed to load instructor dashboard');
      }
      setLoading(false);
    };

    void load();
  }, []);

  const stats = useMemo(
    () => [
      { label: 'Courses', value: dashboard.courses.length, helper: 'Managed learning spaces' },
      { label: 'Classes', value: dashboard.upcomingClasses.length, helper: 'Scheduled live sessions' },
      { label: 'Assignments', value: dashboard.assignments.length, helper: 'Published and draft work' },
      { label: 'Needs grading', value: dashboard.pendingGrading.length, helper: 'Submissions waiting for feedback' },
    ],
    [dashboard]
  );

  const reloadDashboard = async () => {
    const response = await fetch('/api/lms/dashboard/instructor');
    const body = await response.json().catch(() => ({}));
    if (response.ok) {
      setDashboard(body.dashboard || dashboard);
    }
  };

  const handleCourseSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');

    const payload = { ...courseForm };
    const request = editingCourseId ? fetch(`/api/lms/courses/${editingCourseId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }) : fetch('/api/lms/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const response = await request;
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(body.error || 'Failed to save course');
      return;
    }

    setMessage(editingCourseId ? 'Course updated' : 'Course created');
    setCourseForm(emptyCourseForm);
    setEditingCourseId('');
    await reloadDashboard();
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Delete this course and its sessions, assignments, and submissions?')) return;
    const response = await fetch(`/api/lms/courses/${courseId}`, { method: 'DELETE' });
    if (response.ok) {
      setMessage('Course deleted');
      await reloadDashboard();
    }
  };

  const handleEnrollStudents = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedCourseId) return;

    const students = enrollmentValue
      .split(/[\n,]/)
      .map((email) => email.trim())
      .filter(Boolean)
      .map((email) => ({ email }));

    const response = await fetch(`/api/lms/courses/${selectedCourseId}/enroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ students }),
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(body.error || 'Enrollment failed');
      return;
    }

    setEnrollmentValue('');
    setMessage('Students enrolled');
    await reloadDashboard();
  };

  const handleSessionSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedCourseId) return;

    const selectedMeeting = dashboard.availableMeetings?.find(m => m._id === sessionForm.meetingId);

    // require either a selected meeting or a manual meeting title
    if (!selectedMeeting && !String(sessionForm.meetingTitle || '').trim()) {
      setMessage('Please select a meeting or enter a meeting title');
      return;
    }

    const payload: any = {
      startsAt: sessionForm.startsAt,
      notes: sessionForm.notes,
    };

    if (selectedMeeting) {
      payload.meetingId = selectedMeeting.meetingId;
      payload.meetingTitle = selectedMeeting.roomName || selectedMeeting.title;
    } else {
      // manual meeting details
      if (sessionForm.meetingTitle) payload.meetingTitle = String(sessionForm.meetingTitle).trim();
      if (sessionForm.meetingId) payload.meetingId = sessionForm.meetingId; // allow manual custom id if provided
    }

    const response = await fetch(`/api/lms/courses/${selectedCourseId}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(body.error || 'Failed to schedule class');
      return;
    }

    setSessionForm({ meetingId: '', meetingTitle: '', startsAt: '', notes: '' });
    setMessage('✅ Class scheduled!');
    await reloadDashboard();
  };

  const handleJoinSession = async (session: any) => {
    setMessage('');

    try {
      // Ensure a meeting exists (will create one for manual sessions)
      const resp = await fetch(`/api/lms/courses/${selectedCourseId}/sessions/${session._id}/create-meeting`, { method: 'POST' });
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

      // Navigate to room
      window.location.href = `/room/${encodeURIComponent(meetingId)}`;
    } catch (err) {
      console.error('join session error', err);
      setMessage('Failed to join session');
    }
  };

  const handleAssignmentSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedCourseId) return;

    const response = await fetch(`/api/lms/courses/${selectedCourseId}/assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assignmentForm),
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(body.error || 'Assignment creation failed');
      return;
    }

    setAssignmentForm(emptyAssignmentForm);
    setMessage('Assignment created');
    await reloadDashboard();
  };

  const handleStartEdit = (course: any) => {
    setSelectedCourseId(course._id);
    setEditingCourseId(course._id);
    setCourseForm({
      title: course.title || '',
      description: course.description || '',
      slug: course.slug || '',
      code: course.code || '',
      status: course.status || 'draft',
    });
  };

  const handleGradeSubmission = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!gradingTarget) return;

    const response = await fetch(`/api/lms/submissions/${gradingTarget._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score: gradeScore, feedback: gradeFeedback, status: 'returned' }),
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(body.error || 'Grading failed');
      return;
    }

    setMessage('Submission graded');
    setGradingTarget(null);
    setGradeScore('');
    setGradeFeedback('');
    await reloadDashboard();
  };

  if (loading || loadError) {
    return (
      <LmsShell
        kicker="Instructor Dashboard"
        title="Teaching Command Center"
        description="Create courses, schedule live classes, enroll students, publish assignments, and review learning activity."
        stats={stats}
      >
        <LmsMeetingActions roleLabel="Instructor" />
        <GlowCard>
          <div className="flex flex-col gap-2">
            <p className="font-display text-xl font-semibold text-slate-950">
              {loadError ? 'Could not load instructor dashboard' : 'Loading your teaching workspace'}
            </p>
            <p className="text-sm leading-6 text-slate-600">
              {loadError || 'Courses, meetings, sessions, assignments, resources, and grading queues are being prepared.'}
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
      kicker="Instructor Dashboard"
      title="Course Management"
      description="Create courses, attach live meetings, enroll students, publish assignments, and keep course resources organized by course."
      stats={stats}
    >
      <LmsMeetingActions roleLabel="Instructor" />
      <AIMeetingNotesPanel meetings={dashboard.aiMeetings || []} />

      {message ? <GlowCard><p className="text-sm text-slate-700">{message}</p></GlowCard> : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <GlowCard>
          <h3 className="font-display text-xl font-semibold text-slate-950">Create or Edit Course</h3>
          <form onSubmit={handleCourseSubmit} className="mt-4 space-y-3">
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Course title" value={courseForm.title} onChange={(event) => setCourseForm({ ...courseForm, title: event.target.value })} />
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Course slug" value={courseForm.slug} onChange={(event) => setCourseForm({ ...courseForm, slug: event.target.value })} />
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Course code" value={courseForm.code} onChange={(event) => setCourseForm({ ...courseForm, code: event.target.value })} />
            <textarea className="min-h-[110px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Description" value={courseForm.description} onChange={(event) => setCourseForm({ ...courseForm, description: event.target.value })} />
            <select className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" value={courseForm.status} onChange={(event) => setCourseForm({ ...courseForm, status: event.target.value })}>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
            <div className="flex gap-3">
              <button type="button" onClick={() => { setCourseForm(emptyCourseForm); setEditingCourseId(''); }} className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700">Reset</button>
              <button type="submit" className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white">{editingCourseId ? 'Update course' : 'Create course'}</button>
            </div>
          </form>
        </GlowCard>

        <GlowCard>
          <h3 className="font-display text-xl font-semibold text-slate-950">Course Management</h3>
          <div className="mt-4 space-y-3">
            {dashboard.courses.map((course) => (
              <div key={course._id} className={`rounded-2xl border p-4 ${selectedCourseId === course._id ? 'border-sky-300 bg-sky-50/70' : 'border-slate-200 bg-slate-50/70'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{course.title}</p>
                    <p className="text-xs text-slate-500">{course.code} • {course.studentCount || course.enrolledStudents?.length || 0} students</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold" onClick={() => setSelectedCourseId(course._id)}>View</button>
                    <button className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold" onClick={() => handleStartEdit(course)}>Edit</button>
                    <button className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600" onClick={() => handleDeleteCourse(course._id)}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
            {dashboard.courses.length === 0 ? <p className="text-sm text-slate-500">Create your first course to start organizing meetings and assignments.</p> : null}
          </div>
        </GlowCard>
      </div>

      {selectedCourse ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <GlowCard>
            <h3 className="font-display text-xl font-semibold text-slate-950">Student Management</h3>
            <form onSubmit={handleEnrollStudents} className="mt-4 space-y-3">
              <textarea className="min-h-[110px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Enter student emails separated by commas or new lines" value={enrollmentValue} onChange={(event) => setEnrollmentValue(event.target.value)} />
              <button type="submit" className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white">Enroll students</button>
            </form>
            <div className="mt-4 space-y-2">
              {(selectedCourse.enrolledStudents || []).map((student: any) => (
                <div key={student.email} className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-700">{student.email}</div>
              ))}
              {(selectedCourse.enrolledStudents || []).length === 0 ? <p className="text-sm text-slate-500">No students enrolled yet.</p> : null}
            </div>
          </GlowCard>

          <GlowCard>
            <h3 className="font-display text-xl font-semibold text-slate-950">Schedule a Class</h3>
            <form onSubmit={handleSessionSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Select Meeting (optional)</label>
                <select className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" value={sessionForm.meetingId} onChange={(event) => setSessionForm({ ...sessionForm, meetingId: event.target.value })}>
                  <option value="">-- Choose a meeting --</option>
                  {(dashboard.availableMeetings || []).map((meeting) => (
                    <option key={meeting._id} value={meeting._id}>{meeting.roomName || meeting.title || meeting._id}</option>
                  ))}
                </select>
                {(dashboard.availableMeetings || []).length === 0 && (
                  <p className="mt-1 text-xs text-amber-600">No meetings found. You can enter a meeting title below to schedule without a meeting.</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Or enter meeting title</label>
                <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Meeting title (if not selecting an existing meeting)" value={(sessionForm as any).meetingTitle} onChange={(event) => setSessionForm({ ...sessionForm, meetingTitle: event.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Class Date & Time</label>
                <input required type="datetime-local" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" value={sessionForm.startsAt} onChange={(event) => setSessionForm({ ...sessionForm, startsAt: event.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Notes (optional)</label>
                <textarea className="min-h-[80px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Add any notes about this class..." value={sessionForm.notes} onChange={(event) => setSessionForm({ ...sessionForm, notes: event.target.value })} />
              </div>
              <button type="submit" className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white">Schedule Class</button>
            </form>
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold text-slate-600 mb-2">Scheduled Classes</p>
              {selectedSessions.map((session) => (
                <div key={session._id} className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-700">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-950">{session.meetingTitle || session.meetingId}</div>
                      <div className="text-xs text-slate-500 mt-1">📅 {new Date(session.startsAt).toLocaleDateString()} • ⏰ {new Date(session.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      {session.notes && <div className="text-xs text-slate-600 mt-2 italic">📝 {session.notes}</div>}
                    </div>
                    <div className="flex items-center">
                      <button onClick={() => handleJoinSession(session)} className="rounded-full bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white">Join</button>
                    </div>
                  </div>
                </div>
              ))}
              {selectedSessions.length === 0 ? <p className="text-sm text-slate-500">No classes scheduled yet.</p> : null}
            </div>
          </GlowCard>

          <GlowCard>
            <h3 className="font-display text-xl font-semibold text-slate-950">Assignment Management</h3>
            <form onSubmit={handleAssignmentSubmit} className="mt-4 space-y-3">
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Assignment title" value={assignmentForm.title} onChange={(event) => setAssignmentForm({ ...assignmentForm, title: event.target.value })} />
              <textarea className="min-h-[110px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Description" value={assignmentForm.description} onChange={(event) => setAssignmentForm({ ...assignmentForm, description: event.target.value })} />
              <textarea className="min-h-[110px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Instructions" value={assignmentForm.instructions} onChange={(event) => setAssignmentForm({ ...assignmentForm, instructions: event.target.value })} />
              <div className="grid gap-3 sm:grid-cols-2">
                <input type="datetime-local" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" value={assignmentForm.dueAt} onChange={(event) => setAssignmentForm({ ...assignmentForm, dueAt: event.target.value })} />
                <input type="number" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" value={assignmentForm.pointsPossible} onChange={(event) => setAssignmentForm({ ...assignmentForm, pointsPossible: Number(event.target.value) })} />
              </div>
              <select className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" value={assignmentForm.status} onChange={(event) => setAssignmentForm({ ...assignmentForm, status: event.target.value })}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="closed">Closed</option>
              </select>
              <button type="submit" className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white">Create assignment</button>
            </form>
            <div className="mt-4 space-y-2">
              {selectedAssignments.map((assignment) => (
                <div key={assignment._id} className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-700">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-950">{assignment.title}</div>
                      <div className="text-xs text-slate-500">{assignment.status} • {dashboard.submissionsByAssignment[assignment._id] || 0} submissions</div>
                    </div>
                    <button className="text-xs font-semibold text-sky-600 underline" onClick={() => setGradingTarget({ ...assignment, courseId: selectedCourse._id })}>Grade</button>
                  </div>
                </div>
              ))}
              {selectedAssignments.length === 0 ? <p className="text-sm text-slate-500">No assignments yet.</p> : null}
            </div>
          </GlowCard>

          <GlowCard>
            <h3 className="font-display text-xl font-semibold text-slate-950">Course Resources</h3>
            <p className="mt-2 text-sm text-slate-600">Uploads are stored in the existing Supabase bucket under a course-scoped folder.</p>
            <div className="mt-4">
              <FileShare scopeType="course" scopeId={selectedCourse._id} title="Course Resources" className="rounded-[1.5rem] border border-slate-200 bg-white p-4" />
            </div>
          </GlowCard>
        </div>
      ) : null}

      <GlowCard>
        <h3 className="font-display text-xl font-semibold text-slate-950">Recent Recordings and Submissions</h3>
        <div className="mt-4 grid gap-6 xl:grid-cols-2">
          <div className="space-y-3">
            {dashboard.recentRecordings.map((recording) => (
              <div key={`${recording.courseSessionId}-${recording.createdAt}`} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-700">
                <div className="font-semibold text-slate-950">{recording.title}</div>
                <div className="text-xs text-slate-500">{new Date(recording.createdAt).toLocaleString()}</div>
              </div>
            ))}
            {dashboard.recentRecordings.length === 0 ? <p className="text-sm text-slate-500">Course recordings will appear here once a session stores one.</p> : null}
          </div>
          <div className="space-y-3">
            {dashboard.pendingGrading.map((submission) => (
              <div key={submission._id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-700">
                <div className="font-semibold text-slate-950">{submission.studentName || submission.studentEmail}</div>
                <div className="text-xs text-slate-500">{submission.content?.slice(0, 120) || 'No submission content preview'}</div>
                <button className="mt-3 text-xs font-semibold text-sky-600 underline" onClick={() => setGradingTarget(submission)}>Open grading</button>
              </div>
            ))}
            {dashboard.pendingGrading.length === 0 ? <p className="text-sm text-slate-500">No submissions waiting for grading.</p> : null}
          </div>
        </div>
      </GlowCard>

      {gradingTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm">
          <GlowCard className="w-full max-w-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Grade Submission</p>
                <h3 className="mt-2 font-display text-2xl font-semibold text-slate-950">{gradingTarget.title}</h3>
              </div>
              <button onClick={() => setGradingTarget(null)} className="text-sm font-semibold text-slate-500">Close</button>
            </div>
            <form onSubmit={handleGradeSubmission} className="mt-6 space-y-4">
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Score" value={gradeScore} onChange={(event) => setGradeScore(event.target.value)} />
              <textarea className="min-h-[140px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Feedback" value={gradeFeedback} onChange={(event) => setGradeFeedback(event.target.value)} />
              <div className="flex gap-3">
                <button type="button" onClick={() => setGradingTarget(null)} className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700">Cancel</button>
                <button type="submit" className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white">Save grade</button>
              </div>
            </form>
          </GlowCard>
        </div>
      ) : null}
    </LmsShell>
  );
}

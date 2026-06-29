'use client';

import { useEffect, useMemo, useState } from 'react';
import { GlowCard } from '@/components/ui/glow-card';
import { LmsShell } from './LmsShell';
import { LmsMeetingActions } from './LmsMeetingActions';

export function AdminLmsDashboard() {
  const [dashboard, setDashboard] = useState<any>({ courses: [], sessions: [], assignments: [], submissions: [] });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const response = await fetch('/api/lms/dashboard/admin');
        const body = await response.json().catch(() => ({}));
        if (response.ok) {
          setDashboard(body.dashboard || dashboard);
        } else {
          setLoadError(body.error || 'Failed to load admin dashboard');
        }
      } catch (error) {
        setLoadError('Failed to load admin dashboard');
      }
      setLoading(false);
    };

    void load();
  }, []);

  const stats = useMemo(
    () => [
      { label: 'Courses', value: dashboard.totalCourses || dashboard.courses.length },
      { label: 'Sessions', value: dashboard.totalSessions || dashboard.sessions.length },
      { label: 'Assignments', value: dashboard.totalAssignments || dashboard.assignments.length },
      { label: 'Submissions', value: dashboard.totalSubmissions || dashboard.submissions.length },
    ],
    [dashboard]
  );

  const systemSignals = [
    { label: 'Course coverage', value: Math.min(100, (dashboard.totalCourses || dashboard.courses.length) * 14 + 36), tone: 'from-cyan-400 to-blue-500' },
    { label: 'Session velocity', value: Math.min(100, (dashboard.totalSessions || dashboard.sessions.length) * 12 + 28), tone: 'from-emerald-400 to-teal-500' },
    { label: 'Assessment flow', value: Math.min(100, (dashboard.totalAssignments || dashboard.assignments.length) * 10 + 32), tone: 'from-violet-400 to-indigo-500' },
  ];

  if (loading || loadError) {
    return (
      <LmsShell
        kicker="Admin Oversight"
        title="Global LMS Health"
        description="A lightweight overview for administrators to monitor the course layer without turning this into a full LMS suite."
        stats={stats}
      >
        <LmsMeetingActions roleLabel="Admin" />
        <GlowCard>
          <div className="flex flex-col gap-2">
            <p className="font-display text-xl font-semibold text-slate-950">
              {loadError ? 'Could not load admin dashboard' : 'Loading system health'}
            </p>
            <p className="text-sm leading-6 text-slate-600">
              {loadError || 'Courses, sessions, assignments, and submissions are being prepared.'}
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
      kicker="Admin Oversight"
      title="Global LMS Health"
      description="A lightweight overview for administrators to monitor the course layer without turning this into a full LMS suite."
      stats={stats}
    >
      <LmsMeetingActions roleLabel="Admin" />

      <GlowCard className="p-0">
        <div className="grid min-w-0 overflow-hidden lg:grid-cols-[0.78fr_1.22fr]">
          <div className="bg-gradient-to-br from-slate-950 via-indigo-950 to-cyan-950 p-6 text-white">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-200">System Health</p>
            <h3 className="mt-2 font-display text-2xl font-semibold">Global learning operations</h3>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Monitor course growth, scheduled sessions, assignments, and submissions without leaving the LMS control room.
            </p>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-3">
            {systemSignals.map((signal) => (
              <div key={signal.label} className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
                <div className="flex h-28 items-end gap-2 rounded-2xl bg-slate-100 p-2">
                  {[0.55, 0.75, 1].map((scale, index) => (
                    <div key={index} className="flex flex-1 items-end rounded-full bg-white p-1">
                      <div className={`w-full rounded-full bg-gradient-to-t ${signal.tone}`} style={{ height: `${Math.max(10, signal.value * scale)}%` }} />
                    </div>
                  ))}
                </div>
                <h4 className="mt-4 font-display text-base font-semibold text-slate-950">{signal.label}</h4>
                <p className="mt-1 text-sm text-slate-500">{signal.value}% active signal</p>
              </div>
            ))}
          </div>
        </div>
      </GlowCard>

      <GlowCard>
        <h3 className="font-display text-xl font-semibold text-slate-950">All Courses</h3>
        <div className="mt-4 space-y-3">
          {dashboard.courses.map((course: any) => (
            <div key={course._id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-700">
              <div className="font-semibold text-slate-950">{course.title}</div>
              <div className="text-xs text-slate-500">{course.code} • {course.instructorEmail}</div>
            </div>
          ))}
          {dashboard.courses.length === 0 ? <p className="text-sm text-slate-500">No courses created yet.</p> : null}
        </div>
      </GlowCard>
    </LmsShell>
  );
}

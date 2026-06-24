'use client';

import { useEffect, useMemo, useState } from 'react';
import { GlowCard } from '@/components/ui/glow-card';
import { LmsShell } from './LmsShell';

export function AdminLmsDashboard() {
  const [dashboard, setDashboard] = useState<any>({ courses: [], sessions: [], assignments: [], submissions: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const response = await fetch('/api/lms/dashboard/admin');
      const body = await response.json().catch(() => ({}));
      if (response.ok) {
        setDashboard(body.dashboard || dashboard);
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

  return (
    <LmsShell
      kicker="Admin Oversight"
      title="Global LMS Health"
      description="A lightweight overview for administrators to monitor the course layer without turning this into a full LMS suite."
      stats={stats}
    >
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

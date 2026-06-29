'use client';

import { useEffect, useState } from 'react';
import { GlowCard } from '@/components/ui/glow-card';
import { LmsShell } from './LmsShell';
import { LmsMeetingActions } from './LmsMeetingActions';

export function AdminLmsDashboard() {
  const [dashboard, setDashboard] = useState<any>({ courses: [], sessions: [], assignments: [], submissions: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/lms/dashboard/admin');
        const body = await res.json().catch(() => ({}));
        if (res.ok) setDashboard(body.dashboard || {});
        else setError(body.error || 'Failed to load');
      } catch {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  
  const stats = [
    { label: 'Courses', value: dashboard.courses?.length || 0 },
    { label: 'Sessions', value: dashboard.sessions?.length || 0 },
    { label: 'Assignments', value: dashboard.assignments?.length || 0 },
    { label: 'Submissions', value: dashboard.submissions?.length || 0 },
  ];

  if (loading || error) {
    return (
      <LmsShell
        kicker="Admin Oversight"
        title="System Console"
        description="Admin operations live in the Melanam system console."
        stats={stats}
      >
        <LmsMeetingActions roleLabel="Admin" />
        <GlowCard>
          <p className="text-slate-600">{error || 'Loading dashboard...'}</p>
          {error && <button onClick={() => window.location.reload()} className="mt-3 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Retry</button>}
        </GlowCard>
      </LmsShell>
    );
  }

  return (
    <LmsShell
      kicker="Admin Oversight"
      title="System Console"
      description="Admin operations live in the Melanam system console."
      stats={stats}
    >
      <LmsMeetingActions roleLabel="Admin" />
      
      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <GlowCard key={stat.label} className="text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{stat.value}</p>
          </GlowCard>
        ))}
      </div>

      {/* All Courses */}
      <GlowCard>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-slate-950">Courses</h3>
          <span className="text-xs font-semibold text-slate-500">{dashboard.courses.length} total</span>
        </div>
        <div className="space-y-2">
          {dashboard.courses.length > 0 ? (
            dashboard.courses.map((course: any) => (
              <div key={course._id} className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-sm">
                <p className="font-semibold text-slate-950">{course.title}</p>
                <p className="text-xs text-slate-500">{course.code}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No courses yet.</p>
          )}
        </div>
      </GlowCard>

      {/* Sessions */}
      <GlowCard>
        <h3 className="mb-4 font-display text-lg font-semibold text-slate-950">Recent Sessions</h3>
        <div className="space-y-2">
          {dashboard.sessions?.length > 0 ? (
            dashboard.sessions.slice(0, 5).map((session: any) => (
              <div key={session._id} className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-sm">
                <p className="font-semibold text-slate-950">{session.title || 'Session'}</p>
                <p className="text-xs text-slate-500">{new Date(session.createdAt).toLocaleDateString()}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No sessions recorded.</p>
          )}
        </div>
      </GlowCard>
    </LmsShell>
  );
}

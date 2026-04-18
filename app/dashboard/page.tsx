'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { MeetingCard } from '../../components/MeetingCard';
import { JoinModal } from '../../components/JoinModal';
import { Loader } from '../../components/Loader';
import { useSession } from 'next-auth/react';

interface Meeting {
  _id: string;
  meetingId: string;
  title: string;
  hostEmail: string;
  createdAt: string;
  description?: string;
  isPrivate: boolean;
  recordingEnabled: boolean;
  chatEnabled: boolean;
  joinCount: number;
  lastSessionAt?: string | null;
}

interface DashboardMeetingActivity {
  _id: string;
  meetingId: string;
  userId: string;
  userName: string;
  userEmail?: string;
  type: 'created' | 'joined' | 'left' | 'chat' | 'recording-started' | 'recording-stopped';
  details?: string;
  createdAt: string;
  updatedAt: string;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [activity, setActivity] = useState<DashboardMeetingActivity[]>([]);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    isPrivate: false,
    chatEnabled: true,
    recordingEnabled: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/sign-in');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchDashboardData();
    }
  }, [status]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/meeting-history');
      if (response.ok) {
        const data = await response.json();
        setMeetings(data.meetings || []);
        setActivity(data.activity || []);
      }
    } catch (err) {
      console.error('Error fetching meetings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsCreating(true);

    try {
      if (!formData.title.trim()) {
        setError('Meeting title is required');
        setIsCreating(false);
        return;
      }

      const response = await fetch('/api/create-meeting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hostEmail: session?.user?.email,
          title: formData.title,
          description: formData.description,
          isPrivate: formData.isPrivate,
          chatEnabled: formData.chatEnabled,
          recordingEnabled: formData.recordingEnabled,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create meeting');
      }

      const data = await response.json();
      router.push(`/room/${data.meetingId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create meeting');
    } finally {
      setIsCreating(false);
    }
  };

  if (status === 'loading') {
    return <Loader />;
  }

  if (status !== 'authenticated') {
    return null;
  }

  const userEmail = session?.user?.email || 'there';

  return (
    <div className="page-shell-wide">
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="surface-strong rounded-[2rem] p-6 lg:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="section-kicker mb-2">Workspace</p>
                <h1 className="section-title font-display text-4xl font-semibold text-slate-950 lg:text-5xl">
                  Welcome back, {userEmail.split('@')[0] || 'there'}.
                </h1>
                <p className="section-copy mt-3 max-w-2xl text-lg">
                  Create a room, lock it down with JWT access, and keep chat and activity in one place.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 lg:min-w-[320px]">
                {[
                  { value: meetings.length, label: 'Meetings' },
                  { value: activity.length, label: 'Events' },
                  { value: meetings.filter((item) => item.isPrivate).length, label: 'Private' },
                ].map((item) => (
                  <div key={item.label} className="surface rounded-2xl p-4 text-center">
                    <div className="font-display text-2xl font-semibold text-slate-950">{item.value}</div>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="surface group rounded-[1.75rem] p-6 text-left hover:-translate-y-0.5"
            >
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Start</p>
              <h2 className="mt-2 font-display text-2xl font-semibold text-slate-950">Create meeting</h2>
              <p className="mt-2 text-sm text-slate-500">Set a title, choose privacy, and join immediately.</p>
            </button>
            <button
              onClick={() => setIsJoinModalOpen(true)}
              className="surface group rounded-[1.75rem] p-6 text-left hover:-translate-y-0.5"
            >
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Join</p>
              <h2 className="mt-2 font-display text-2xl font-semibold text-slate-950">Enter room code</h2>
              <p className="mt-2 text-sm text-slate-500">Open any room by pasting a meeting ID or invite link.</p>
            </button>
          </div>

          {showCreateForm && (
            <div className="surface-strong rounded-[2rem] p-6 lg:p-8 animate-fade-in-up">
              <div className="mb-6">
                <p className="section-kicker mb-2">New room</p>
                <h2 className="section-title font-display text-2xl font-semibold text-slate-950">Create meeting</h2>
              </div>
              <form onSubmit={handleCreateMeeting} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Meeting title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Team sync"
                    className="input-modern"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Agenda, notes, or meeting context"
                    className="input-modern min-h-[110px] resize-none"
                    rows={4}
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <label className="surface flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={formData.isPrivate}
                      onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-slate-950"
                    />
                    Private room
                  </label>
                  <label className="surface flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={formData.chatEnabled}
                      onChange={(e) => setFormData({ ...formData, chatEnabled: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-slate-950"
                    />
                    Save chat
                  </label>
                  <label className="surface flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={formData.recordingEnabled}
                      onChange={(e) => setFormData({ ...formData, recordingEnabled: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-slate-950"
                    />
                    Recording ready
                  </label>
                </div>

                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setFormData({ title: '', description: '', isPrivate: false, chatEnabled: true, recordingEnabled: false });
                      setError('');
                    }}
                    className="button-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" disabled={isCreating} className="button-primary">
                    {isCreating ? 'Creating...' : 'Create and join'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <section>
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="section-kicker mb-2">Rooms</p>
                <h2 className="section-title font-display text-2xl font-semibold text-slate-950">Recent meetings</h2>
              </div>
              <button onClick={fetchDashboardData} className="text-sm font-medium text-slate-500 hover:text-slate-950">
                Refresh
              </button>
            </div>
            {loading ? (
              <div className="surface rounded-[2rem] py-16 text-center">
                <Loader />
              </div>
            ) : meetings.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {meetings.map((meeting) => (
                  <MeetingCard
                    key={meeting._id}
                    meetingId={meeting.meetingId}
                    title={meeting.title}
                    hostEmail={meeting.hostEmail}
                    createdAt={meeting.createdAt}
                    isPrivate={meeting.isPrivate}
                    recordingEnabled={meeting.recordingEnabled}
                    chatEnabled={meeting.chatEnabled}
                    joinCount={meeting.joinCount}
                  />
                ))}
              </div>
            ) : (
              <div className="surface rounded-[2rem] p-10 text-center">
                <p className="font-display text-xl font-semibold text-slate-950">No meetings yet</p>
                <p className="mt-2 text-slate-500">Create your first room to see it here.</p>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <div className="surface-strong rounded-[2rem] p-6">
            <p className="section-kicker mb-2">Overview</p>
            <h2 className="section-title font-display text-2xl font-semibold text-slate-950">Workspace summary</h2>
            <div className="mt-5 space-y-3 text-sm text-slate-600">
              <div className="flex items-start gap-3">
                <div className="mt-1 h-2.5 w-2.5 rounded-full bg-cyan-500" />
                <p>Private rooms use JWT tokens when enabled.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 h-2.5 w-2.5 rounded-full bg-slate-950" />
                <p>Chat messages and room activity are stored in MongoDB.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <p>Recording controls are exposed for Jitsi-supported deployments.</p>
              </div>
            </div>
          </div>

          <div className="surface rounded-[2rem] p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="section-kicker mb-2">Activity</p>
                <h2 className="section-title font-display text-2xl font-semibold text-slate-950">Meeting history</h2>
              </div>
              <span className="pill">{activity.length} items</span>
            </div>
            {activity.length > 0 ? (
              <div className="space-y-3">
                {activity.slice(0, 6).map((item) => (
                  <div key={item._id} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-sm font-medium text-slate-950 capitalize">{item.type.replace('-', ' ')}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.userName} · {new Date(item.createdAt).toLocaleString()}</p>
                    {item.details && <p className="mt-2 text-xs text-slate-500">{item.details}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                No recent activity yet.
              </div>
            )}
          </div>
        </aside>
      </section>

      <JoinModal isOpen={isJoinModalOpen} onClose={() => setIsJoinModalOpen(false)} />
    </div>
  );
}

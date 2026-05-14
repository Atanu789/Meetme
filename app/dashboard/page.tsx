'use client';

import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { MeetingCard } from '../../components/MeetingCard';
import { CreateMeetingModal } from '../../components/CreateMeetingModal';
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
  const searchParams = useSearchParams();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [activity, setActivity] = useState<DashboardMeetingActivity[]>([]);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (searchParams.get('create') === '1') {
      setIsCreateModalOpen(true);
    }
  }, [searchParams]);

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

  const handleCreateMeeting = async ({ title, description }: { title: string; description: string }) => {
    try {
      const response = await fetch('/api/create-meeting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hostEmail: session?.user?.email,
          title,
          description,
          isPrivate: false,
          chatEnabled: true,
          recordingEnabled: false,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create meeting');
      }

      const data = await response.json();
      router.push(`/room/${data.meetingId}`);
    } catch (err: any) {
      throw new Error(err.message || 'Failed to create meeting');
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
      <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5 sm:space-y-6">
          <div className="surface-strong overflow-hidden rounded-[2rem] p-4 sm:p-6 lg:p-8 relative">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400" />
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="section-kicker mb-2">Workspace</p>
                <h1 className="section-title font-display text-3xl font-semibold text-slate-950 sm:text-4xl lg:text-5xl">
                  Welcome back, {userEmail.split('@')[0] || 'there'}.
                </h1>
                <p className="section-copy mt-3 max-w-2xl text-base sm:text-lg">
                  Create a room, lock it down with JWT access, and keep chat and activity in one place.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:min-w-[320px]">
                {[
                  { value: meetings.length, label: 'Meetings' },
                  { value: activity.length, label: 'Events' },
                  { value: meetings.filter((item) => item.isPrivate).length, label: 'Private' },
                ].map((item) => (
                  <div key={item.label} className="surface rounded-2xl p-4 text-center ring-1 ring-white/50">
                    <div className="font-display text-2xl font-semibold text-slate-950">{item.value}</div>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 sm:gap-4">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="surface group relative overflow-hidden rounded-[2rem] p-5 text-left transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_60px_rgba(6,182,212,0.18)] sm:p-6 ring-1 ring-cyan-400/25"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.12),transparent_34%)]" />
              <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-cyan-400 via-blue-500 to-indigo-500" />
              <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-cyan-400/10 blur-3xl" />
              <div className="relative flex h-full flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Start</p>
                    <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold text-cyan-700 ring-1 ring-cyan-500/15">
                      Instant
                    </span>
                  </div>
                  <h2 className="mt-3 font-display text-2xl font-semibold text-slate-950 sm:text-[2rem]">Create meeting</h2>
                </div>
                <div className="mt-8 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/12 text-cyan-700 ring-1 ring-cyan-500/15">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-950">Create room</p>
                    <p className="text-xs text-slate-500">Fast setup</p>
                  </div>
                </div>
              </div>
            </button>
            <button
              onClick={() => setIsJoinModalOpen(true)}
              className="surface group relative overflow-hidden rounded-[2rem] p-5 text-left transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_60px_rgba(251,146,60,0.18)] sm:p-6 ring-1 ring-amber-400/25"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.18),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(244,114,182,0.12),transparent_34%)]" />
              <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-amber-400 via-orange-500 to-rose-500" />
              <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-amber-400/10 blur-3xl" />
              <div className="relative flex h-full flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Join</p>
                    <span className="rounded-full bg-amber-500/10 px-3 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-500/15">
                      Invite
                    </span>
                  </div>
                  <h2 className="mt-3 font-display text-2xl font-semibold text-slate-950 sm:text-[2rem]">Enter room code</h2>
                </div>
                <div className="mt-8 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/12 text-amber-700 ring-1 ring-amber-500/15">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8m-4-4 4 4-4 4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-950">Join instantly</p>
                    <p className="text-xs text-slate-500">Paste link or code</p>
                  </div>
                </div>
              </div>
            </button>
          </div>

          <section>
            <div className="mb-4 flex items-start justify-between gap-3 sm:items-end">
              <div>
                <p className="section-kicker mb-2">Rooms</p>
                <h2 className="section-title font-display text-xl font-semibold text-slate-950 sm:text-2xl">Recent meetings</h2>
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
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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
              <div className="surface rounded-[2rem] p-6 text-center sm:p-10">
                <p className="font-display text-xl font-semibold text-slate-950">No meetings yet</p>
                <p className="mt-2 text-slate-500">Create your first room to see it here.</p>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <div className="surface rounded-[2rem] p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="section-kicker mb-2">Activity</p>
                <h2 className="section-title font-display text-xl font-semibold text-slate-950 sm:text-2xl">Meeting history</h2>
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
      <CreateMeetingModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateMeeting}
      />
    </div>
  );
}

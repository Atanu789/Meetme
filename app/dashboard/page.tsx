'use client';

import { motion } from 'motion/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { CreateMeetingModal } from '../../components/CreateMeetingModal';
import { JoinModal } from '../../components/JoinModal';
import { MeetingCard } from '../../components/MeetingCard';
import { GithubGlobe } from '../../components/ui/github-globe';
import { GlowCard } from '../../components/ui/glow-card';
import { BentoGrid } from '../../components/ui/bento-grid';
import { GradientBorderButton, GradientBorderLink } from '../../components/ui/gradient-border-button';
import { SectionHeading } from '../../components/ui/section-heading';
import { Footer } from '../../components/ui/footer';
import { Skeleton } from '../../components/ui/skeleton';

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
  type: 'created' | 'joined' | 'left' | 'chat' | 'file_shared' | 'recording-started' | 'recording-stopped';
  details?: string;
  createdAt: string;
  updatedAt: string;
}

function formatRoomTime(value?: string | null) {
  if (!value) return 'No sessions yet';

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatActivityText(item?: DashboardMeetingActivity) {
  if (!item) return null;

  const action = item.type.replace(/[-_]/g, ' ');
  const when = new Date(item.createdAt).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });

  return item.details
    ? `${action} by ${item.userName} on ${when} - ${item.details}`
    : `${action} by ${item.userName} on ${when}`;
}

function DashboardSkeleton() {
  return (
    <div className="page-shell-wide space-y-10">
      <section className="relative overflow-hidden rounded-[2.75rem] border border-white/70 bg-white/75 p-6 shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur sm:p-10">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="mt-4 h-12 w-full max-w-2xl" />
        <Skeleton className="mt-3 h-5 w-full max-w-xl" />
        <div className="mt-6 flex flex-wrap gap-4">
          <Skeleton className="h-16 w-56 rounded-full" />
          <Skeleton className="h-16 w-48 rounded-full" />
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={`dashboard-stat-${index}`} className="h-28 rounded-[1.75rem]" />
          ))}
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={`meeting-loading-${index}`} className="h-52 rounded-[1.75rem]" />
          ))}
        </div>
      </section>
    </div>
  );
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
    const htmlEl = document.documentElement;
    const hadDarkMode = htmlEl.classList.contains('dark');

    htmlEl.classList.add('dark');
    document.body.classList.add('landing-page');

    return () => {
      if (!hadDarkMode) {
        htmlEl.classList.remove('dark');
      }
      document.body.classList.remove('landing-page');
    };
  }, []);

  useEffect(() => {
    if (searchParams.get('create') === '1') {
      setIsCreateModalOpen(true);
    }

    if (searchParams.get('join') === '1') {
      setIsJoinModalOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      const currentUrl = `/dashboard${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
      router.push(`/sign-in?callbackUrl=${encodeURIComponent(currentUrl)}`);
    }
  }, [router, searchParams, status]);

  useEffect(() => {
    if (status === 'authenticated') {
      void fetchDashboardData();
    }
  }, [status]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/meeting-history');

      if (!response.ok) {
        setMeetings([]);
        setActivity([]);
        return;
      }

      const data = await response.json();
      setMeetings(data.meetings || []);
      setActivity(data.activity || []);
    } catch (error) {
      console.error('Error fetching meetings:', error);
      setMeetings([]);
      setActivity([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMeeting = async (payload: { title: string; description: string }) => {
    const response = await fetch('/api/create-meeting', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error || 'Failed to create meeting');
    }

    setIsCreateModalOpen(false);
    await fetchDashboardData();

    if (data?.meetingId) {
      router.push(`/room/${data.meetingId}`);
    }
  };

  const userName = session?.user?.email?.split('@')[0] || 'there';
  const latestMeeting = meetings[0];
  const recentMeetings = meetings.slice(0, 6);
  const meetingActivityMap = useMemo(
    () =>
      activity.reduce<Record<string, DashboardMeetingActivity>>((accumulator, item) => {
        if (!accumulator[item.meetingId]) {
          accumulator[item.meetingId] = item;
        }
        return accumulator;
      }, {}),
    [activity]
  );

  const stats = useMemo(
    () => [
      {
        label: 'Total rooms',
        value: meetings.length,
        helper: 'Your workspace archive',
      },
      {
        label: 'Latest activity',
        value: activity.length,
        helper: 'Recent updates across rooms',
      },
      {
        label: 'Last session',
        value: latestMeeting ? formatRoomTime(latestMeeting.lastSessionAt || latestMeeting.createdAt) : 'No rooms yet',
        helper: 'Most recent room touchpoint',
      },
    ],
    [activity.length, latestMeeting, meetings.length]
  );

  if (status === 'loading' || (status === 'authenticated' && loading && meetings.length === 0 && activity.length === 0)) {
    return <DashboardSkeleton />;
  }

  if (status !== 'authenticated') {
    return null;
  }

  return (
    <div className="page-shell-wide space-y-10">
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative overflow-hidden rounded-[2.75rem] border border-white/70 bg-white/75 p-6 shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur sm:p-10"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(14,165,233,0.18),transparent_45%),radial-gradient(circle_at_86%_24%,rgba(16,185,129,0.14),transparent_42%),radial-gradient(circle_at_68%_82%,rgba(251,191,36,0.16),transparent_46%)]" />
        <div className="relative z-10 space-y-12">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500"
              >
                Meeting workspace
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="font-display text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl"
              >
                Welcome back, {userName}.
                <span className="mt-3 block bg-[linear-gradient(135deg,#0f172a_0%,#0ea5e9_45%,#22c55e_100%)] bg-clip-text text-transparent">
                  Your dashboard should feel just as polished and bold as the landing page.
                </span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="max-w-2xl text-base text-slate-600"
              >
                Start a room, jump into an invite, or reopen a recent session without digging through clutter.
              </motion.p>

              <div className="flex flex-wrap items-center gap-4">
                <GradientBorderButton
                  variant="create"
                  className="hover:-translate-y-1 hover:scale-[1.01]"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  <span className="text-xl">✨</span>
                  <span className="text-base sm:text-lg">Create Meeting</span>
                </GradientBorderButton>
                <GradientBorderButton
                  variant="join"
                  className="hover:-translate-y-1 hover:scale-[1.01]"
                  onClick={() => setIsJoinModalOpen(true)}
                >
                  <span className="text-xl">🚀</span>
                  <span className="text-base sm:text-lg">Join Room</span>
                </GradientBorderButton>
                {latestMeeting ? (
                  <GradientBorderLink href={`/room/${latestMeeting.meetingId}`} variant="light">
                    Open latest room
                  </GradientBorderLink>
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {stats.map((stat) => (
                  <GlowCard key={stat.label} className="p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{stat.label}</p>
                    <p className="mt-3 font-display text-2xl font-semibold text-slate-950">{stat.value}</p>
                    <p className="mt-2 text-sm text-slate-500">{stat.helper}</p>
                  </GlowCard>
                ))}
              </div>
            </div>

            <div className="space-y-5">
              <div className="flex items-center justify-center">
                <GithubGlobe className="w-full max-w-[460px]" />
              </div>
              <GlowCard className="p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Latest room</p>
                <h2 className="mt-3 font-display text-2xl font-semibold text-slate-950">
                  {latestMeeting ? latestMeeting.title || 'Untitled room' : 'Nothing scheduled yet'}
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  {latestMeeting
                    ? `Room ID ${latestMeeting.meetingId}`
                    : 'Create your first room and it will show up here.'}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Last session: {formatRoomTime(latestMeeting?.lastSessionAt || latestMeeting?.createdAt)}
                </p>
              </GlowCard>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <SectionHeading
                kicker="Rooms"
                title="Recent meetings"
                description="Side-by-side cards with the same airy layout language as the landing page."
              />
              <GradientBorderButton variant="light" onClick={fetchDashboardData}>
                Refresh rooms
              </GradientBorderButton>
            </div>

            {loading ? (
              <BentoGrid className="md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={`meeting-loading-${index}`} className="h-52 rounded-[1.75rem]" />
                ))}
              </BentoGrid>
            ) : recentMeetings.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {recentMeetings.map((meeting) => (
                  <MeetingCard
                    key={meeting._id}
                    meetingId={meeting.meetingId}
                    title={meeting.title}
                    hostEmail={meeting.hostEmail}
                    createdAt={meeting.createdAt}
                    activityText={formatActivityText(meetingActivityMap[meeting.meetingId]) || undefined}
                  />
                ))}
              </div>
            ) : (
              <GlowCard className="p-8 text-center">
                <p className="font-display text-2xl font-semibold text-slate-950">No meetings yet</p>
                <p className="mt-3 text-sm text-slate-500">Create your first room and it will show up here.</p>
                <div className="mt-5 flex justify-center">
                  <GradientBorderButton variant="create" onClick={() => setIsCreateModalOpen(true)}>
                    <span className="text-xl">✨</span>
                    <span>Create your first meeting</span>
                  </GradientBorderButton>
                </div>
              </GlowCard>
            )}
          </div>
        </div>
      </motion.section>

      <Footer />

      <JoinModal isOpen={isJoinModalOpen} onClose={() => setIsJoinModalOpen(false)} />
      <CreateMeetingModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateMeeting}
      />
    </div>
  );
}

'use client';

import { motion } from 'motion/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { CreateMeetingModal } from '../../components/CreateMeetingModal';
import { JoinModal } from '../../components/JoinModal';
import { MeetingCard } from '../../components/MeetingCard';
import { GlowCard } from '../../components/ui/glow-card';
import { BentoCard, BentoGrid } from '../../components/ui/bento-grid';
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

function DashboardSkeleton() {
  return (
    <div className="page-shell-wide space-y-10">
      <GlowCard className="relative overflow-hidden p-8 sm:p-10">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="mt-4 h-12 w-full max-w-2xl" />
        <Skeleton className="mt-3 h-5 w-full max-w-xl" />
        <div className="mt-6 flex flex-wrap gap-3">
          <Skeleton className="h-11 w-36 rounded-full" />
          <Skeleton className="h-11 w-32 rounded-full" />
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={`dashboard-stat-${index}`} className="h-28 rounded-[1.75rem]" />
          ))}
        </div>
        <div className="mt-10 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <Skeleton className="h-6 w-40" />
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={`dashboard-action-${index}`} className="h-52 rounded-[1.75rem]" />
            ))}
          </div>
        </div>
      </GlowCard>
    </div>
  );
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

  const quickActions = useMemo(
    () => [
      {
        eyebrow: 'Create',
        title: 'Start a fresh room',
        description: 'Launch a new session with your usual defaults and jump in right away.',
        action: (
          <GradientBorderButton variant="create" onClick={() => setIsCreateModalOpen(true)}>
            Create meeting
          </GradientBorderButton>
        ),
      },
      {
        eyebrow: 'Join',
        title: 'Enter with a code',
        description: 'Paste a room ID or open an invite link without digging through menus.',
        action: (
          <GradientBorderButton variant="join" onClick={() => setIsJoinModalOpen(true)}>
            Join room
          </GradientBorderButton>
        ),
      },
      {
        eyebrow: 'Resume',
        title: latestMeeting ? latestMeeting.title || 'Untitled room' : 'No room to resume yet',
        description: latestMeeting
          ? 'Jump back into your latest room with one click.'
          : 'Your latest room will show up here once you create one.',
        action: latestMeeting ? (
          <GradientBorderLink href={`/room/${latestMeeting.meetingId}`} variant="light">
            Open latest room
          </GradientBorderLink>
        ) : (
          <GradientBorderButton variant="create" onClick={() => setIsCreateModalOpen(true)}>
            Create first room
          </GradientBorderButton>
        ),
      },
      {
        eyebrow: 'Refresh',
        title: 'Sync the workspace',
        description: 'Pull the latest meetings and updates if teammates have been moving fast.',
        action: (
          <GradientBorderButton variant="light" onClick={fetchDashboardData}>
            Refresh data
          </GradientBorderButton>
        ),
      },
    ],
    [latestMeeting]
  );

  if (status === 'loading' || (status === 'authenticated' && loading && meetings.length === 0 && activity.length === 0)) {
    return <DashboardSkeleton />;
  }

  if (status !== 'authenticated') {
    return null;
  }

  return (
    <div className="page-shell-wide space-y-10 pb-10">
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <GlowCard className="relative overflow-hidden p-8 sm:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(14,165,233,0.18),transparent_40%),radial-gradient(circle_at_86%_22%,rgba(16,185,129,0.16),transparent_40%),radial-gradient(circle_at_66%_80%,rgba(251,191,36,0.16),transparent_45%)]" />
          <div className="relative z-10 space-y-10">
            <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">
                    Aceternity-inspired workspace
                  </p>
                  <h1 className="mt-4 font-display text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl">
                    Welcome back, {userName}.
                    <span className="mt-3 block bg-[linear-gradient(135deg,#0f172a_0%,#0ea5e9_45%,#22c55e_100%)] bg-clip-text text-transparent">
                      Your meetings now live inside one focused command center.
                    </span>
                  </h1>
                  <p className="mt-4 max-w-2xl text-base text-slate-600">
                    Create, rejoin, and track rooms from one polished surface. The goal here is simple: less dashboard noise, more forward motion.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <GradientBorderButton variant="create" onClick={() => setIsCreateModalOpen(true)}>
                    Create meeting
                  </GradientBorderButton>
                  <GradientBorderButton variant="join" onClick={() => setIsJoinModalOpen(true)}>
                    Join room
                  </GradientBorderButton>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  {stats.map((stat) => (
                    <GlowCard key={stat.label} className="rounded-[1.75rem] p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{stat.label}</p>
                      <p className="mt-3 font-display text-3xl font-semibold text-slate-950">{stat.value}</p>
                      <p className="mt-2 text-sm text-slate-500">{stat.helper}</p>
                    </GlowCard>
                  ))}
                </div>
              </div>

              <div className="grid gap-4">
                <GlowCard className="rounded-[1.75rem] border border-slate-900/10 bg-slate-950/90 p-6 text-white shadow-[0_32px_90px_rgba(15,23,42,0.28)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">Latest room</p>
                  <h2 className="mt-4 font-display text-2xl font-semibold">
                    {latestMeeting ? latestMeeting.title || 'Untitled room' : 'Nothing scheduled yet'}
                  </h2>
                  <p className="mt-2 text-sm text-slate-300">
                    {latestMeeting
                      ? `Room ID ${latestMeeting.meetingId}`
                      : 'Create your first room and it will appear here with a direct jump-back shortcut.'}
                  </p>
                  <p className="mt-4 text-sm text-slate-300">
                    Last session: {formatRoomTime(latestMeeting?.lastSessionAt || latestMeeting?.createdAt)}
                  </p>
                  <div className="mt-6">
                    {latestMeeting ? (
                      <GradientBorderLink href={`/room/${latestMeeting.meetingId}`} variant="light">
                        Reopen latest room
                      </GradientBorderLink>
                    ) : (
                      <GradientBorderButton variant="create" onClick={() => setIsCreateModalOpen(true)}>
                        Create your first room
                      </GradientBorderButton>
                    )}
                  </div>
                </GlowCard>

                <GlowCard className="rounded-[1.75rem] p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Room host</p>
                  <p className="mt-4 truncate font-display text-xl font-semibold text-slate-950">
                    {latestMeeting?.hostEmail || session.user?.email || 'Unknown'}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Recent room updates will appear directly inside the meeting cards below.
                  </p>
                </GlowCard>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <div>
                <SectionHeading
                  kicker="Quick actions"
                  title="Everything you need at arm's reach"
                  description="Main actions stay close, and the rest of the dashboard stays out of the way."
                />

                <BentoGrid className="mt-6 md:grid-cols-2">
                  {quickActions.map((item) => (
                    <BentoCard
                      key={item.title}
                      eyebrow={item.eyebrow}
                      title={item.title}
                      description={item.description}
                      actions={item.action}
                    />
                  ))}
                </BentoGrid>
              </div>

              <div>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <SectionHeading
                    kicker="Rooms"
                    title="Recent meetings"
                    description="Useful room updates now live here instead of a separate activity panel."
                  />
                  <GradientBorderButton variant="light" onClick={fetchDashboardData}>
                    Refresh rooms
                  </GradientBorderButton>
                </div>

                {loading ? (
                  <BentoGrid className="mt-6 md:grid-cols-2">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <Skeleton key={`meeting-loading-${index}`} className="h-52 rounded-[1.75rem]" />
                    ))}
                  </BentoGrid>
                ) : recentMeetings.length > 0 ? (
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
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
                  <GlowCard className="mt-6 p-8 text-center">
                    <p className="font-display text-2xl font-semibold text-slate-950">No meetings yet</p>
                    <p className="mt-3 text-sm text-slate-500">
                      Create your first room and it will show up here.
                    </p>
                    <div className="mt-5 flex justify-center">
                      <GradientBorderButton variant="create" onClick={() => setIsCreateModalOpen(true)}>
                        Create your first meeting
                      </GradientBorderButton>
                    </div>
                  </GlowCard>
                )}
              </div>
            </div>
          </div>
        </GlowCard>
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

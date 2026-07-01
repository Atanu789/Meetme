'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarPlus, LogIn, Rocket, Video } from 'lucide-react';
import { CreateMeetingModal } from '@/components/CreateMeetingModal';
import { JoinModal } from '@/components/JoinModal';
import { GlowCard } from '@/components/ui/glow-card';
import { GradientBorderButton } from '@/components/ui/gradient-border-button';

export function LmsMeetingActions({ roleLabel }: { roleLabel: string }) {
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState('');

  const createMeeting = async (payload: { title: string; description: string }) => {
    const response = await fetch('/api/create-meeting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data?.error || 'Failed to create meeting');
    }

    if (data?.meetingId) {
      router.push(`/room/${encodeURIComponent(data.meetingId)}`);
    }
  };

  const handleStartMeeting = async () => {
    setError('');
    setIsStarting(true);

    try {
      await createMeeting({
        title: `${roleLabel} instant meeting`,
        description: `Started from the ${roleLabel.toLowerCase()} LMS dashboard.`,
      });
    } catch (startError: any) {
      setError(startError?.message || 'Failed to start meeting');
    } finally {
      setIsStarting(false);
    }
  };

  const actions = [
    {
      title: 'Create room',
      description: 'Set title, description, privacy, and share a polished invite.',
      icon: CalendarPlus,
      accent: 'from-cyan-500 to-blue-500',
      button: (
        <GradientBorderButton variant="create" onClick={() => setIsCreateModalOpen(true)}>
          Create Meeting
        </GradientBorderButton>
      ),
    },
    {
      title: 'Join by invite',
      description: 'Paste a meeting code and jump into an active class or team room.',
      icon: LogIn,
      accent: 'from-emerald-500 to-teal-500',
      button: (
        <GradientBorderButton variant="join" onClick={() => setIsJoinModalOpen(true)}>
          Join Meeting
        </GradientBorderButton>
      ),
    },
    {
      title: 'Instant live session',
      description: 'Launch a new meeting immediately from this role dashboard.',
      icon: Rocket,
      accent: 'from-slate-900 to-indigo-800',
      button: (
        <GradientBorderButton variant="dark" onClick={handleStartMeeting} disabled={isStarting}>
          {isStarting ? 'Starting...' : 'Start Now'}
        </GradientBorderButton>
      ),
    },
  ];

  return (
    <>
      <GlowCard className="!rounded-[2rem] !border-0 !bg-transparent !p-0 !shadow-none hover:!shadow-none">
        <div className="grid min-w-0 overflow-hidden rounded-[inherit] lg:grid-cols-[0.8fr_1.2fr]">
          <div className="relative overflow-hidden rounded-t-[inherit] bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-6 text-white sm:p-7 lg:rounded-l-[inherit] lg:rounded-r-none lg:rounded-t-none">
            <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-cyan-300/25 blur-3xl" />
            <div className="relative z-10">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-cyan-100">
                <Video className="h-5 w-5" />
              </div>
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-100">Meeting Hub</p>
              <h3 className="mt-2 font-display text-2xl font-semibold text-white">Create, join, or start</h3>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
                Role-aware meeting actions stay inside `/lms`, with no generic dashboard detour.
              </p>
              {error ? <p className="mt-4 rounded-2xl border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-100">{error}</p> : null}
            </div>
          </div>
          <div className="grid min-w-0 gap-3 p-4 sm:grid-cols-3 sm:p-5">
            {actions.map(({ title, description, icon: Icon, accent, button }) => (
              <div key={title} className="group rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-4 transition duration-200 hover:-translate-y-1 hover:bg-white hover:shadow-[0_18px_44px_rgba(15,23,42,0.1)]">
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} text-white shadow-lg`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h4 className="mt-4 font-display text-base font-semibold text-slate-950">{title}</h4>
                <p className="mt-2 min-h-[3rem] text-xs leading-5 text-slate-500">{description}</p>
                <div className="mt-4">{button}</div>
              </div>
            ))}
          </div>
        </div>
      </GlowCard>

      <JoinModal isOpen={isJoinModalOpen} onClose={() => setIsJoinModalOpen(false)} />
      <CreateMeetingModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={createMeeting}
      />
    </>
  );
}
